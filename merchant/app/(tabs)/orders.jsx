import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getItems } from '../utils/api';
import ErrorView from '../../components/ErrorView';

const ORDER_STATUSES = [
  'all',
  'pending',
  'in-transit',
  'delivered',
  'accepted',
  'cancelled',
  'picked-up',
];

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('delivered');

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const userUID = await AsyncStorage.getItem('userUID');
      if (!userUID) throw new Error('User not authenticated');
      const res = await getItems('orders', { merchant: userUID });
      setOrders(res?.data?.data?.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const filteredOrders =
    statusFilter === 'all'
      ? orders
      : orders.filter((order) => order.status === statusFilter);

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '../details/order',
          params: { orderId: item._id },
        })
      }
      activeOpacity={0.85}
    >
      <View style={styles.orderCard}>
        <View style={{ flex: 1 }}>
          <Text style={styles.orderId}>Order ID: {item._id}</Text>
          <Text style={styles.orderStatus}>
            <Ionicons name="information-circle-outline" size={14} /> Status:{' '}
            {item.status}
          </Text>
          <Text style={styles.orderAmount}>
            ₦{item.totalAmount?.toLocaleString()}
          </Text>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#aaa" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Orders</Text>
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
    marginBottom: 12,
    alignSelf: 'center',
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
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#4f8cff',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  orderId: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#222',
    marginBottom: 2,
  },
  orderStatus: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  orderAmount: {
    color: '#4f8cff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  orderDate: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
  },
});
