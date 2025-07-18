import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getItems, updateItem } from '../../utils/api';
import { COLORS } from '../../../constants';
import ErrorView from '../../../components/ErrorView';

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
  const router = useRouter();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const userUID = await AsyncStorage.getItem('userUID');
      // Fetch stores for this merchant
      const storesRes = await getItems('stores', { merchant: userUID });
      const userStore = storesRes?.data?.data?.data?.[0]._id;
      const orderRes = await getItems('orderitems', { store: userStore });
      const newOrders = orderRes?.data?.data?.data;
      setOrders(newOrders || []);
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

  const renderOrder = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: '/details/order',
          params: { orderId: item._id },
        })
      }
      activeOpacity={0.85}
    >
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
        <Text style={styles.orderLable}>
          Ordered At:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            {new Date(item.createdAt).toLocaleString()}
          </Text>
        </Text>
        <Text style={styles.orderLable}>
          Customer:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            {item.user?.name || 'N/A'}
          </Text>
        </Text>
        <Text style={styles.orderLable}>
          Customer Phone:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            +233{item.user?.phone}
          </Text>
        </Text>
        <Text style={styles.orderLable}>
          Total:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            ₦{item.amount?.toLocaleString()}
          </Text>
        </Text>
        <Text style={styles.orderLable}>
          Preference:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            {item.preference || 'N/A'}
          </Text>
        </Text>
        <Text style={styles.orderLable}>
          Variety:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            {item.variety || 'N/A'}
          </Text>
        </Text>

        <Text style={styles.orderLable}>
          Address:{' '}
          <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
            {item.address}
          </Text>
        </Text>
        {item.payment && (
          <Text style={styles.orderLable}>
            Payment:{' '}
            <Text style={{ color: '#4f8cff', fontWeight: 'bold' }}>
              {item.payment}
            </Text>
          </Text>
        )}
        {item.location && (
          <Text style={styles.orderLable}>
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
        {item.status !== 'delivered' && (
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
        )}
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
    marginTop: 25,
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
  orderLable: {
    fontSize: 16,
    marginBottom: 2,
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
  productOptions: {
    color: '#666',
    fontSize: 12,
    marginLeft: 8,
  },
});
