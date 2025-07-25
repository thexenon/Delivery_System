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
import { getItems, updateItem } from '../../utils/api';
import { COLORS } from '../../../constants';
import ErrorView from '../../../components/ErrorView';
import * as Notifications from 'expo-notifications';

const ORDER_STATUSES = [
  'all',
  'pending',
  'accepted',
  'in-transit',
  'cancelled',
];

export default function HomeScreen() {
  const [orders, setOrders] = useState([]);
  const [storeId, setStoreId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('pending');

  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const userUID = await AsyncStorage.getItem('userUID');
      // Fetch stores for this merchant
      const storesRes = await getItems('stores', { merchant: userUID });
      const userStore = storesRes?.data?.data?.data?.[0]._id;
      setStoreId(userStore);
      await fetchOrders();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const orderRes = await getItems('orderitems', { store: storeId });
      const newOrders = orderRes?.data?.data?.data.filter(
        (o) => o.status !== 'delivered'
      );
      setOrders(newOrders || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const handleStatusChange = (orderId, newStatus) => {
    Alert.alert(
      'Change Order Status',
      `Are you sure you want to mark this order as "${newStatus}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes',
          style: 'default',
          onPress: async () => {
            try {
              setLoading(true);
              await updateItem('orderitems', orderId, { status: newStatus });
              fetchOrders();
            } catch (err) {
              setError(err.message || 'Failed to update order status');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const filteredOrders =
    statusFilter === 'all'
      ? orders
      : orders
          .filter((order) => order.status === statusFilter)
          .sort((a, b) => b.createdAt - a.createdAt);

  const renderOrder = ({ item }) => {
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Ionicons name="receipt-outline" size={24} color="#4f8cff" />
          <Text style={styles.orderId}>Order #{item._id.slice(-16)}</Text>
          <Text
            style={[
              styles.status,
              {
                color:
                  item.status === 'delivered'
                    ? COLORS.greenish
                    : item.status === 'cancelled'
                    ? COLORS.reddish
                    : item.status === 'accepted'
                    ? COLORS.primary
                    : item.status === 'in-transit'
                    ? COLORS.secondary
                    : '#f39c12',
              },
            ]}
          >
            {item.status}
          </Text>
        </View>
        <Text style={styles.orderLabel}>
          Ordered At:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </Text>
        <Text style={styles.orderLabel}>
          Customer:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            {item.user?.name || 'N/A'}
          </Text>
        </Text>
        <Text style={styles.orderLabel}>
          Customer Phone:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            +233{item.user?.phone}
          </Text>
        </Text>
        <Text style={styles.orderLabel}>
          Total:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            ₦{item.amount?.toLocaleString()}
          </Text>
        </Text>
        <Text style={styles.orderLabel}>
          Preference:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            {item.preference || 'N/A'}
          </Text>
        </Text>
        <Text style={styles.orderLabel}>
          Variety:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            {item.variety || 'N/A'}
          </Text>
        </Text>

        <Text style={styles.orderLabel}>
          Address:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            {item.address}
          </Text>
        </Text>
        {item.payment && (
          <Text style={styles.orderLabel}>
            Payment:{' '}
            <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
              {item.payment}
            </Text>
          </Text>
        )}
        {item.location && (
          <Text style={styles.orderLabel}>
            Location:
            <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
              {item.location.coordinates[0].toString()},{' '}
              {item.location.coordinates[1].toString()}
            </Text>
          </Text>
        )}
        <Text style={styles.sectionTitle}>Product Ordered:</Text>
        {item.product && (
          <View key={item._id || idx} style={styles.productRow}>
            <Text style={styles.productName}>
              {item.product?.name || 'Product'}
            </Text>
            <Text style={styles.productQty}>
              Qty: {item.quantity || item.qty || 1}
            </Text>
            {item.product.price && (
              <Text style={styles.productPrice}>
                ₦
                {item.product.priceDiscount?.toLocaleString() ||
                  item.product.price?.toLocaleString()}
              </Text>
            )}
            {item.orderoptions && item.orderoptions.length > 0 && (
              <Text style={styles.productOptions}>
                Options:{' '}
                {item.orderoptions
                  .map(
                    (opt) => `${opt.name}${opt.value ? ` (${opt.value})` : ''}`
                  )
                  .join(', ')}
              </Text>
            )}
          </View>
        )}
        <View style={styles.statusBtnRow}>
          {item.status !== 'accepted' && (
            <TouchableOpacity
              style={styles.statusBtn}
              onPress={() => handleStatusChange(item._id, 'accepted')}
            >
              <Text style={styles.statusBtnText}>Accept</Text>
            </TouchableOpacity>
          )}
          {item.status !== 'in-transit' && (
            <TouchableOpacity
              style={styles.statusBtn}
              onPress={() => handleStatusChange(item._id, 'in-transit')}
            >
              <Text style={styles.statusBtnText}>In-Transit</Text>
            </TouchableOpacity>
          )}
          {item.status !== 'delivered' && (
            <TouchableOpacity
              style={styles.statusBtn}
              onPress={() => handleStatusChange(item._id, 'delivered')}
            >
              <Text style={styles.statusBtnText}>Delivered</Text>
            </TouchableOpacity>
          )}
          {item.status !== 'cancelled' && (
            <TouchableOpacity
              style={styles.statusBtn}
              onPress={() => handleStatusChange(item._id, 'cancelled')}
            >
              <Text style={styles.statusBtnText}>Cancelled</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
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
          'Please enable notifications in your settings to receive order alerts.'
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
    let lastOrderIds = [];
    let intervalId;

    const checkForNewOrders = async () => {
      try {
        const res = await getItems('orderitems', { store: storeId });
        const fetchedOrders = res?.data?.data?.data || [];
        const fetchedOrderIds = fetchedOrders.map((o) => o._id);
        // On first run, just set the ids
        if (lastOrderIds.length === 0) {
          lastOrderIds = fetchedOrderIds;
          return;
        }
        // Find new orders
        const newOrderIds = fetchedOrderIds.filter(
          (id) => !lastOrderIds.includes(id)
        );
        if (newOrderIds.length > 0) {
          // Send notification for each new order
          newOrderIds.forEach((id) => {
            Notifications.scheduleNotificationAsync({
              content: {
                title: 'New Order',
                body: 'A new order has been placed!',
                sound: true,
              },
              trigger: null, // Immediate notification
            });
          });
          lastOrderIds = fetchedOrderIds;
          fetchOrders();
        }
      } catch (err) {
        // Optionally handle error
      }
    };

    // Start polling every 15 seconds
    intervalId = setInterval(checkForNewOrders, 15000);
    // Initial fetch
    checkForNewOrders();

    return () => {
      clearInterval(intervalId);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🛒 Incoming Orders</Text>
      <View style={styles.filterRow}>
        {ORDER_STATUSES.map((status) => (
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
      ) : filteredOrders.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <ErrorView msg={'No orders found.'} />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item._id}
          renderItem={renderOrder}
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
  orderCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#4f8cff',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderId: {
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
    color: '#222',
  },
  status: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  orderDate: {
    color: '#888',
    fontSize: 13,
    marginBottom: 4,
  },
  orderLabel: {
    fontSize: 16,
    marginBottom: 2,
  },
  orderCustomer: {
    color: '#666',
    fontSize: 14,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#444',
    marginTop: 10,
    marginBottom: 4,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  productName: {
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  productQty: {
    color: '#666',
    marginLeft: 8,
  },
  productPrice: {
    color: '#4f8cff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  statusBtnRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 10,
    alignSelf: 'center',
  },
  statusBtn: {
    backgroundColor: '#4f8cff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 5,
    marginRight: 4,
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
  orderPayment: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  orderAddress: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  productOptions: {
    color: '#666',
    fontSize: 12,
    marginLeft: 8,
  },
});
