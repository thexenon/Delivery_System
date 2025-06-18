import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getItemById } from '../utils/api';
import ErrorView from '../../components/ErrorView';

export default function OrderDetailsScreen() {
  const { orderId } = useLocalSearchParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!orderId) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getItemById('orders', orderId);
        setOrder(res?.data?.data);
      } catch (err) {
        setError(err.message || 'Failed to load order details');
      }
      setLoading(false);
    })();
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f8cff" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <ErrorView msg={error} />
      </View>
    );
  }
  if (!order) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#4f8cff" />
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Order Details</Text>
      <Text style={styles.label}>Order ID:</Text>
      <Text style={styles.value}>{order._id}</Text>
      <Text style={styles.label}>Status:</Text>
      <Text style={styles.value}>{order.status}</Text>
      <Text style={styles.label}>Total Amount:</Text>
      <Text style={styles.value}>₦{order.totalAmount?.toLocaleString()}</Text>
      <Text style={styles.label}>Created At:</Text>
      <Text style={styles.value}>
        {new Date(order.createdAt).toLocaleString()}
      </Text>
      {order.products && Array.isArray(order.products) && (
        <>
          <Text style={styles.label}>Products:</Text>
          {order.products.map((prod, idx) => (
            <View key={prod._id || idx} style={styles.productRow}>
              <Text style={styles.productName}>
                {prod.name || prod.product?.name || 'Product'}
              </Text>
              <Text style={styles.productQty}>
                Qty: {prod.quantity || prod.qty || 1}
              </Text>
              {prod.price && (
                <Text style={styles.productPrice}>
                  ₦{prod.price?.toLocaleString()}
                </Text>
              )}
            </View>
          ))}
        </>
      )}
      {order.user && (
        <>
          <Text style={styles.label}>Customer:</Text>
          <Text style={styles.value}>
            {order.user.name} ({order.user.phone})
          </Text>
        </>
      )}
      {order.location && (
        <>
          <Text style={styles.label}>Delivery Address:</Text>
          <Text style={styles.value}>
            {order.location.address || JSON.stringify(order.location)}
          </Text>
        </>
      )}
      {/* Add more order details as needed */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f6f8fa',
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f8fa',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
    alignSelf: 'center',
  },
  label: {
    fontWeight: 'bold',
    color: '#444',
    marginTop: 12,
  },
  value: {
    color: '#222',
    fontSize: 16,
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
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: '#4f8cff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
});
