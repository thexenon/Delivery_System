import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getItems } from '../../utils/api';
import ErrorView from '../../../components/ErrorView';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { handleLogout } from '../../utils/auth';

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [stores, setStores] = useState([]);
  const [stats, setStats] = useState({
    totalSales: 0,
    totalAmount: 0,
    daily: 0,
    weekly: 0,
    monthly: 0,
  });
  const [dailySalesData, setDailySalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [salesByStore, setSalesByStore] = useState([]);
  const [avgOrderValue, setAvgOrderValue] = useState(0);
  const router = useRouter();

  const fetchUserAndStats = async () => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('jwt');
      const userUID = await AsyncStorage.getItem('userUID');
      if (!token || !userUID) throw new Error('User not authenticated');
      // Fetch user info
      const result = await getItems(`users/me`);
      if (result.status == 200) {
        const userData = result?.data.data.data;
        setUser(userData || null);
      } else {
        setUser(null);
      }
      // Fetch stores for this merchant
      const storesRes = await getItems('stores', { merchant: userUID });
      const userStores = storesRes?.data?.data?.data || [];
      setStores(userStores);
      const storeIds = userStores.map((s) => s._id);
      // Fetch all orders for this merchant
      const ordersRes = await getItems('orderItems', { merchant: userUID });
      const allOrders = ordersRes?.data?.data?.data || [];
      setOrders(allOrders);
      // Calculate stats
      const now = new Date();
      let totalSales = 0,
        totalAmount = 0,
        daily = 0,
        weekly = 0,
        monthly = 0;
      let orderCount = 0;
      const dailyMap = {};
      const productMap = {};
      const storeMap = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dailyMap[d.toDateString()] = 0;
      }
      allOrders.forEach((order) => {
        if (order.status !== 'delivered') return;
        orderCount++;
        const myProducts = (order.products || []).filter(
          (prod) =>
            prod.store && storeIds.includes(prod.store._id || prod.store)
        );
        if (!myProducts.length) return;
        const createdAt = new Date(order.createdAt);
        const orderAmount = myProducts.reduce(
          (sum, prod) =>
            sum + (prod.price || 0) * (prod.quantity || prod.qty || 1),
          0
        );
        totalSales += myProducts.reduce(
          (sum, prod) => sum + (prod.quantity || prod.qty || 1),
          0
        );
        totalAmount += orderAmount;
        const isToday = createdAt.toDateString() === now.toDateString();
        const isThisWeek = (() => {
          const startOfWeek = new Date(now);
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);
          return createdAt >= startOfWeek;
        })();
        const isThisMonth =
          createdAt.getMonth() === now.getMonth() &&
          createdAt.getFullYear() === now.getFullYear();
        if (isToday) daily += orderAmount;
        if (isThisWeek) weekly += orderAmount;
        if (isThisMonth) monthly += orderAmount;
        // Daily sales for chart
        const dayKey = createdAt.toDateString();
        if (dailyMap[dayKey] !== undefined) dailyMap[dayKey] += orderAmount;
        // Top products
        myProducts.forEach((prod) => {
          const key = prod.name || prod.product?.name || 'Product';
          productMap[key] =
            (productMap[key] || 0) + (prod.quantity || prod.qty || 1);
        });
        // Sales by store
        myProducts.forEach((prod) => {
          const storeKey =
            stores.find((s) => s._id === (prod.store._id || prod.store))
              ?.name || 'Store';
          storeMap[storeKey] =
            (storeMap[storeKey] || 0) +
            (prod.price || 0) * (prod.quantity || prod.qty || 1);
        });
      });
      setStats({ totalSales, totalAmount, daily, weekly, monthly });
      setDailySalesData(Object.values(dailyMap));
      setTopProducts(
        Object.entries(productMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
      );
      setSalesByStore(Object.entries(storeMap).sort((a, b) => b[1] - a[1]));
      setAvgOrderValue(orderCount ? Math.round(totalAmount / orderCount) : 0);
    } catch (err) {
      setUser(null);
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchUserAndStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserAndStats();
  };

  const handleLogoutBtn = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          // await AsyncStorage.removeItem('jwt');
          // await AsyncStorage.removeItem('userUID');
          // await AsyncStorage.removeItem('user');
          // router.replace('/(auth)/signin');
          await handleLogout();
        },
      },
    ]);
  };

  const handleEdit = () => {
    router.push('/addnew/settings');
  };

  const handleExportCSV = async () => {
    let csv = 'Date,Order ID,Product,Quantity,Price,Total,Store\n';
    orders.forEach((order) => {
      if (order.status !== 'delivered') return;
      (order.products || []).forEach((prod) => {
        if (!stores.some((s) => s._id === (prod.store._id || prod.store)))
          return;
        const storeName =
          stores.find((s) => s._id === (prod.store._id || prod.store))?.name ||
          '';
        csv += `${new Date(order.createdAt).toLocaleDateString()},${
          order._id
        },${prod.name || prod.product?.name || ''},${
          prod.quantity || prod.qty || 1
        },${prod.price || ''},${
          (prod.price || 0) * (prod.quantity || prod.qty || 1)
        },${storeName}\n`;
      });
    });
    const fileUri = FileSystem.cacheDirectory + 'sales_export.csv';
    await FileSystem.writeAsStringAsync(fileUri, csv, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Sales Data',
    });
  };

  const handleExportExcel = async () => {
    let rows = [
      ['Date', 'Order ID', 'Product', 'Quantity', 'Price', 'Total', 'Store'],
    ];
    orders.forEach((order) => {
      if (order.status !== 'delivered') return;
      (order.products || []).forEach((prod) => {
        if (!stores.some((s) => s._id === (prod.store._id || prod.store)))
          return;
        const storeName =
          stores.find((s) => s._id === (prod.store._id || prod.store))?.name ||
          '';
        rows.push([
          new Date(order.createdAt).toLocaleDateString(),
          order._id,
          prod.name || prod.product?.name || '',
          prod.quantity || prod.qty || 1,
          prod.price || '',
          (prod.price || 0) * (prod.quantity || prod.qty || 1),
          storeName,
        ]);
      });
    });
    const ws = XLSX.utils.aoa_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sales');
    const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });
    const uri = FileSystem.cacheDirectory + 'sales_export.xlsx';
    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });
    await Sharing.shareAsync(uri, {
      mimeType:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export Sales Data (Excel)',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4f8cff" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <ErrorView msg="Please try again later or contact support." />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: '#f6f8fa' }}
      contentContainerStyle={{ padding: 24, paddingBottom: 60 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Sales Statistics</Text>
        <View style={styles.statsRow}>
          <View style={styles.statsBox}>
            <Text style={styles.statsLabel}>Total Sales</Text>
            <Text style={styles.statsValue}>{stats.totalSales}</Text>
          </View>
          <View style={styles.statsBox}>
            <Text style={styles.statsLabel}>Total Amount</Text>
            <Text style={styles.statsValue}>
              ₦{stats.totalAmount.toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statsBox}>
            <Text style={styles.statsLabel}>Today</Text>
            <Text style={styles.statsValue}>
              ₦{stats.daily.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statsBox}>
            <Text style={styles.statsLabel}>This Week</Text>
            <Text style={styles.statsValue}>
              ₦{stats.weekly.toLocaleString()}
            </Text>
          </View>
          <View style={styles.statsBox}>
            <Text style={styles.statsLabel}>This Month</Text>
            <Text style={styles.statsValue}>
              ₦{stats.monthly.toLocaleString()}
            </Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statsBox}>
            <Text style={styles.statsLabel}>Avg. Order Value</Text>
            <Text style={styles.statsValue}>
              ₦{avgOrderValue.toLocaleString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExportCSV}>
          <Ionicons name="download-outline" size={18} color="#4f8cff" />
          <Text style={styles.exportText}>Export Sales (CSV)</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExportExcel}>
          <Ionicons name="download-outline" size={18} color="#4f8cff" />
          <Text style={styles.exportText}>Export Sales (Excel)</Text>
        </TouchableOpacity>
        <Text style={styles.statsSubtitle}>Top Selling Products</Text>
        {topProducts.length === 0 ? (
          <Text style={styles.statsLabel}>No sales yet.</Text>
        ) : (
          topProducts.map(([name, qty], idx) => (
            <Text key={idx} style={styles.statsLabel}>
              {name}: {qty}
            </Text>
          ))
        )}
        <Text style={styles.statsSubtitle}>Sales by Store</Text>
        {salesByStore.length === 0 ? (
          <Text style={styles.statsLabel}>No sales yet.</Text>
        ) : (
          salesByStore.map(([store, amt], idx) => (
            <Text key={idx} style={styles.statsLabel}>
              {store}: ₦{amt.toLocaleString()}
            </Text>
          ))
        )}
      </View>
      <View style={styles.profileCard}>
        <Image
          source={
            user.image
              ? { uri: user.image }
              : require('../../../assets/logo.png')
          }
          style={styles.avatar}
        />
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.email}>
          <Ionicons name="person" size={16} />{' '}
          {user.role.toString().toUpperCase()}
        </Text>
        <Text style={styles.email}>
          <Ionicons name="mail-outline" size={16} /> {user.email}
        </Text>
        <Text style={styles.info}>
          <Ionicons name="call-outline" size={16} /> +233{user.phone}
        </Text>
        <Text style={styles.info}>
          <Ionicons name="location-outline" size={16} /> {user.address}
        </Text>
        <TouchableOpacity style={styles.editBtn} onPress={handleEdit}>
          <Ionicons name="create-outline" size={18} color="#4f8cff" />
          <Text style={styles.editText}>Edit Profile</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutBtn}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  profileCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    padding: 28,
    width: '100%',
    shadowColor: '#4f8cff',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 32,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#4f8cff',
    backgroundColor: '#eaeaea',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  email: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  info: {
    fontSize: 15,
    color: '#888',
    marginBottom: 4,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4f8cff',
    backgroundColor: '#f6f8fa',
  },
  editText: {
    color: '#4f8cff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 32,
    shadowColor: '#4f8cff',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    alignSelf: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  statsBox: {
    flex: 1,
    backgroundColor: '#f6f8fa',
    borderRadius: 10,
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 4,
  },
  statsLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 4,
  },
  statsValue: {
    color: '#4f8cff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4f8cff',
    backgroundColor: '#f6f8fa',
  },
  exportText: {
    color: '#4f8cff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
  statsSubtitle: {
    fontWeight: 'bold',
    color: '#222',
    marginTop: 18,
    marginBottom: 6,
    fontSize: 15,
  },
});
