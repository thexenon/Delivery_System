import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { getItems } from '../../../utils/api';
import { COLORS, FONT, SIZES, SHADOWS } from '../../../constants';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function ServiceRequestsScreen() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    const userId = await AsyncStorage.getItem('userUID');
    const res = await getItems('servicerequests', { customer: userId });
    if (res.status !== 200) {
      setError(res.message || 'Failed to fetch service requests');
      setLoading(false);
      return;
    }
    setRequests(res.data.data.data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  function getStatusColor(status) {
    switch ((status || '').toLowerCase()) {
      case 'pending':
        return COLORS.primary;
      case 'completed':
        return '#22c55e';
      case 'cancelled':
        return '#ef4444';
      case 'in progress':
        return '#f59e42';
      default:
        return COLORS.primary;
    }
  }

  const renderRequest = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => {
        setSelectedRequest(item);
        setDetailsModalVisible(true);
      }}
      activeOpacity={0.85}
    >
      <View style={styles.cardHeader}>
        <MaterialIcons name="assignment" size={28} color={COLORS.primary} />
        <Text style={styles.title}>
          {item.service.name || 'Service Request'}
        </Text>
        <Text style={styles.statusBadge}>{item.status || 'Pending'}</Text>
      </View>
      <Text style={styles.desc}>{item.description}</Text>
      <View style={styles.infoRow}>
        <MaterialIcons name="location-on" size={18} color={COLORS.primary} />
        <Text style={styles.infoText}>{item.address || 'No address'}</Text>
      </View>
      <View style={styles.infoRow}>
        <MaterialIcons name="calendar-today" size={18} color={COLORS.primary} />
        <Text style={styles.infoText}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* <Text style={styles.pageTitle}>My Service Requests</Text> */}
      <FlatList
        data={requests}
        keyExtractor={(item) => item._id}
        renderItem={renderRequest}
        ListEmptyComponent={
          <Text style={styles.error}>No service requests found.</Text>
        }
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      <Modal
        visible={detailsModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDetailsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Service Request Details</Text>
              {selectedRequest && (
                <>
                  <View style={styles.modalRow}>
                    <MaterialIcons
                      name="assignment"
                      size={24}
                      color={COLORS.primary}
                    />
                    <Text style={styles.modalLabel}>Title:</Text>
                    <Text style={styles.modalValue}>
                      {selectedRequest.service.name || 'Service Request'}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <MaterialIcons
                      name="info"
                      size={24}
                      color={COLORS.primary}
                    />
                    <Text style={styles.modalLabel}>Status:</Text>
                    <Text
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor: getStatusColor(
                            selectedRequest.status
                          ),
                          marginLeft: 8,
                        },
                      ]}
                    >
                      {selectedRequest.status || 'Pending'}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <MaterialIcons
                      name="location-on"
                      size={24}
                      color={COLORS.primary}
                    />
                    <Text style={styles.modalLabel}>Address:</Text>
                    <Text style={styles.modalValue}>
                      {selectedRequest.address || 'No address'}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <MaterialIcons
                      name="calendar-today"
                      size={24}
                      color={COLORS.primary}
                    />
                    <Text style={styles.modalLabel}>Created:</Text>
                    <Text style={styles.modalValue}>
                      {selectedRequest.createdAt
                        ? new Date(selectedRequest.createdAt).toLocaleString()
                        : '-'}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <MaterialIcons
                      name="description"
                      size={24}
                      color={COLORS.primary}
                    />
                    <Text style={styles.modalLabel}>Preference:</Text>
                  </View>
                  <Text style={styles.modalDesc}>
                    {selectedRequest.preference}
                  </Text>
                  {selectedRequest &&
                    selectedRequest.status?.toLowerCase() !== 'completed' && (
                      <>
                        {/* Artisan Details */}
                        {selectedRequest.artisan && (
                          <View
                            style={[styles.detailCard, { marginBottom: 12 }]}
                          >
                            <Text style={styles.detailTitle}>
                              Artisan Details
                            </Text>
                            <View style={styles.modalRow}>
                              <MaterialIcons
                                name="person"
                                size={22}
                                color={COLORS.primary}
                              />
                              <Text style={styles.modalLabel}>Name:</Text>
                              <Text style={styles.modalValue}>
                                {selectedRequest.artisan.name || '-'}
                              </Text>
                            </View>
                            <View style={styles.modalRow}>
                              <MaterialIcons
                                name="phone"
                                size={22}
                                color={COLORS.primary}
                              />
                              <Text style={styles.modalLabel}>Phone:</Text>
                              <Text style={styles.modalValue}>
                                +233{selectedRequest.artisan.phone || '-'}
                              </Text>
                            </View>
                            <View style={styles.modalRow}>
                              <MaterialIcons
                                name="email"
                                size={22}
                                color={COLORS.primary}
                              />
                              <Text style={styles.modalLabel}>Email:</Text>
                              <Text style={styles.modalValue}>
                                {selectedRequest.artisan.email || '-'}
                              </Text>
                            </View>
                          </View>
                        )}
                        {/* Artisan Shop Details */}
                        {selectedRequest.artisanShop && (
                          <View
                            style={[styles.detailCard, { marginBottom: 12 }]}
                          >
                            <Text style={styles.detailTitle}>
                              Artisan Shop Details
                            </Text>
                            <View style={styles.modalRow}>
                              <MaterialIcons
                                name="store"
                                size={22}
                                color={COLORS.primary}
                              />
                              <Text style={styles.modalLabel}>Name:</Text>
                              <Text style={styles.modalValue}>
                                {selectedRequest.artisanShop.name || '-'}
                              </Text>
                            </View>
                            <View style={styles.modalRow}>
                              <MaterialIcons
                                name="location-on"
                                size={22}
                                color={COLORS.primary}
                              />
                              <Text style={styles.modalLabel}>Address:</Text>
                              <Text style={styles.modalValue}>
                                {selectedRequest.artisanShop.address || '-'}
                              </Text>
                            </View>
                            <View style={styles.modalRow}>
                              <MaterialIcons
                                name="phone"
                                size={22}
                                color={COLORS.primary}
                              />
                              <Text style={styles.modalLabel}>Phone:</Text>
                              <Text style={styles.modalValue}>
                                +233{selectedRequest.artisanShop.phone || '-'}
                              </Text>
                            </View>
                            <View style={styles.modalRow}>
                              <MaterialIcons
                                name="email"
                                size={22}
                                color={COLORS.primary}
                              />
                              <Text style={styles.modalLabel}>Email:</Text>
                              <Text style={styles.modalValue}>
                                {selectedRequest.artisanShop.email || '-'}
                              </Text>
                            </View>
                          </View>
                        )}
                      </>
                    )}
                  {selectedRequest.scheduledTime && (
                    <View style={styles.modalRow}>
                      <MaterialIcons
                        name="schedule"
                        size={24}
                        color={COLORS.primary}
                      />
                      <Text style={styles.modalLabel}>Scheduled Time:</Text>
                      <Text style={styles.modalValue}>
                        {selectedRequest.scheduledTime
                          ? new Date(
                              selectedRequest.scheduledTime
                            ).toLocaleString()
                          : '-'}
                      </Text>
                    </View>
                  )}
                  {selectedRequest.location && (
                    <View style={styles.modalRow}>
                      <MaterialIcons
                        name="map"
                        size={24}
                        color={COLORS.primary}
                      />
                      <Text style={styles.modalLabel}>Location:</Text>
                      <Text
                        style={styles.modalValue}
                      >{`Lat: ${selectedRequest.location.coordinates[1]}, Lng: ${selectedRequest.location.coordinates[0]}`}</Text>
                    </View>
                  )}
                </>
              )}
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setDetailsModalVisible(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightWhite,
    paddingTop: 20,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightWhite,
  },
  pageTitle: {
    fontSize: SIZES.xLarge,
    fontFamily: FONT.bold,
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: SIZES.large,
    fontFamily: FONT.bold,
    color: COLORS.secondary,
    marginLeft: 8,
    flex: 1,
  },
  statusBadge: {
    backgroundColor: COLORS.primary,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: SIZES.small,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  desc: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  infoText: {
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    marginLeft: 4,
  },
  error: {
    color: 'red',
    fontSize: SIZES.medium,
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 18,
    padding: 22,
    width: '92%',
    maxHeight: '90%',
    elevation: 6,
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontSize: SIZES.xLarge,
    fontFamily: FONT.bold,
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalLabel: {
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalValue: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
    marginLeft: 8,
  },
  modalDesc: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
    marginBottom: 12,
    marginLeft: 32,
  },
  closeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 12,
    marginTop: 18,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
  detailCard: {
    backgroundColor: COLORS.lightWhite,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    ...SHADOWS.small,
  },
  detailTitle: {
    fontSize: SIZES.large,
    fontFamily: FONT.bold,
    color: COLORS.primary,
    marginBottom: 8,
  },
});
