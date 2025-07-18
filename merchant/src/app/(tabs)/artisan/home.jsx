import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getItems, updateItem } from '../../utils/api';
import ErrorView from '../../../components/ErrorView';
import { COLORS } from '../../../constants';
import * as Notifications from 'expo-notifications';

const REQUEST_STATUSES = ['all', 'pending', 'accepted', 'cancelled'];

export default function HomeScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');
  const router = useRouter();

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const userUID = await AsyncStorage.getItem('userUID');
      // Fetch all requests for this artisan
      const res = await getItems(`servicerequests?artisan=${userUID}`);
      const newRequests = res?.data?.data?.data.filter(
        (r) => r.status !== 'completed'
      );
      setRequests(newRequests);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRequests();
  };

  const handleStatusChange = (requestId, newStatus) => {
    Alert.alert(
      'Change Request Status',
      `Are you sure you want to mark this request as "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              await updateItem('servicerequests', requestId, {
                status: newStatus,
              }).then((res) => {
                if (res.status === 200) {
                  fetchRequests();
                } else {
                  Alert.alert(res.status, res.message);
                }
              });
            } catch (err) {
              setError(err.message || 'Failed to update request status');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const filteredRequests =
    statusFilter === 'all'
      ? requests
      : requests
          .filter((request) => request.status === statusFilter)
          .sort((a, b) => b.createdAt - a.createdAt);

  const renderRequest = ({ item }) => {
    return (
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: '/details/request',
            params: { requestId: item._id },
          })
        }
        activeOpacity={0.85}
      >
        <View style={styles.requestCard}>
          <View style={styles.requestHeader}>
            <Ionicons name="receipt-outline" size={24} color="#4f8cff" />
            <Text style={styles.requestId}>Request #{item._id.slice(-16)}</Text>
            <Text
              style={[
                styles.status,
                {
                  color:
                    item.status === 'completed'
                      ? COLORS.greenish
                      : item.status === 'cancelled'
                      ? COLORS.reddish
                      : item.status === 'accepted'
                      ? COLORS.primary
                      : '#f39c12',
                },
              ]}
            >
              {item.status}
            </Text>
          </View>
          <Text style={styles.requestLable}>
            Created On:{' '}
            <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
              {new Date(item.createdAt).toLocaleString()}
            </Text>
          </Text>
          <Text style={styles.requestLable}>
            Scheduled Date:{' '}
            <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
              {new Date(item.scheduledTime).toLocaleString()}
            </Text>
          </Text>
          <Text style={styles.requestLable}>
            Customer:{' '}
            <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
              {item.customer?.name || 'N/A'}
            </Text>
          </Text>
          <Text style={styles.requestLable}>
            Customer Phone:{' '}
            <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
              +233{item.customer?.phone}
            </Text>
          </Text>
          <Text style={styles.requestLable}>
            Total:{' '}
            <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
              {item.amount
                ? `₦ ${item.amount?.toLocaleString()}`
                : 'Payment on Delivery'}
            </Text>
          </Text>
          <Text style={styles.requestLable}>
            Preference:{' '}
            <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
              {item.preference}
            </Text>
          </Text>
          <Text style={styles.requestLable}>
            Address:{' '}
            <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
              {item.address}
            </Text>
          </Text>
          {item.payment && (
            <Text style={styles.requestLable}>
              Payment:{' '}
              <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
                {item.payment}
              </Text>
            </Text>
          )}
          {item.location && (
            <Text style={styles.requestLable}>
              Location:
              <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
                {item.location.coordinates[0].toString()},{' '}
                {item.location.coordinates[1].toString()}
              </Text>
            </Text>
          )}
          <View style={styles.statusBtnRow}>
            {item.status !== 'completed' && (
              <>
                {item.status !== 'accepted' && (
                  <TouchableOpacity
                    style={styles.statusBtn}
                    onPress={() => handleStatusChange(item._id, 'accepted')}
                  >
                    <Text style={styles.statusBtnText}>Accept</Text>
                  </TouchableOpacity>
                )}
                {item.status !== 'cancelled' && (
                  <TouchableOpacity
                    style={styles.statusBtn}
                    onPress={() => handleStatusChange(item._id, 'cancelled')}
                  >
                    <Text style={styles.statusBtnText}>Cancel</Text>
                  </TouchableOpacity>
                )}
                {item.status !== 'completed' && (
                  <TouchableOpacity
                    style={styles.statusBtn}
                    onPress={() => handleStatusChange(item._id, 'completed')}
                  >
                    <Text style={styles.statusBtnText}>Completed</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  useEffect(() => {
    // Request notification permissions on mount
    const requestPermissions = async () => {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please enable notifications in your settings to receive request alerts.'
        );
      }
    };
    requestPermissions();

    // Set notification handler for foreground (in-app) notifications
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }, []);

  useEffect(() => {
    let lastRequestIds = [];
    let intervalId;

    const checkForNewRequests = async () => {
      try {
        const userUID = await AsyncStorage.getItem('userUID');
        const res = await getItems(`servicerequests?artisan=${userUID}`);
        const fetchedRequests = res?.data?.data?.data || [];
        const fetchedRequestIds = fetchedRequests.map((o) => o._id);
        // On first run, just set the ids
        if (lastRequestIds.length === 0) {
          lastRequestIds = fetchedRequestIds;
          return;
        }
        // Find new requests
        const newRequestIds = fetchedRequestIds.filter(
          (id) => !lastRequestIds.includes(id)
        );
        if (newRequestIds.length > 0) {
          // Send notification for each new request
          newRequestIds.forEach((id) => {
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'New Request',
                body: 'A new request has been placed!',
                sound: true,
              },
              trigger: null, // Immediate notification
            });
          });
          lastRequestIds = fetchedRequestIds;
          fetchRequests();
        }
      } catch (err) {
        // Optionally handle error
      }
    };

    // Start polling every 15 seconds
    intervalId = setInterval(checkForNewRequests, 15000);
    // Initial fetch
    checkForNewRequests();

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 Incoming Requests</Text>
      <View style={styles.filterRow}>
        {REQUEST_STATUSES.map((status) => (
          <TouchableOpacity
            key={status}
            style={[
              styles.filterBtn,
              statusFilter === status && styles.activeFilterBtn,
            ]}
            onPress={() => setStatusFilter(status)}
          >
            <Text
              style={[
                styles.filterBtnText,
                statusFilter === status && styles.activeFilterBtnText,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4f8cff"
          style={{ marginTop: 40 }}
        />
      ) : error ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <ErrorView msg={error} />
        </View>
      ) : filteredRequests.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <ErrorView msg={'No requests found.'} />
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item._id}
          renderItem={renderRequest}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
    paddingHorizontal: 16,
    paddingTop: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#222',
    alignSelf: 'center',
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#4f8cff',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestId: {
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
    color: '#222',
  },
  status: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  requestLable: {
    fontSize: 16,
    marginBottom: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#444',
    marginTop: 10,
    marginBottom: 4,
  },
  statusBtnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  statusBtn: {
    backgroundColor: '#4f8cff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginRight: 8,
  },
  statusBtnText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eaf2ff',
    marginHorizontal: 4,
    marginBottom: 4,
  },
  activeFilterBtn: {
    backgroundColor: '#4f8cff',
  },
  filterBtnText: {
    color: '#4f8cff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeFilterBtnText: {
    color: '#fff',
  },
});
