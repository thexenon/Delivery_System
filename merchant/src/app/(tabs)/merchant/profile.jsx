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
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getItems } from '../../utils/api';
import ErrorView from '../../../components/ErrorView';
import { handleLogout } from '../../utils/auth';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

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
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawals, setWithdrawals] = useState([]);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const router = useRouter();

  const fetchUserAndStats = async () => {
    setLoading(true);
    try {
      const userUID = await AsyncStorage.getItem('userUID');
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
      // Fetch all order items for this merchant
      const ordersRes = await getItems('orderitems');
      console.log('====================================');
      // console.log(ordersRes?.data?.data?.data[0]);
      console.log(storeIds);
      console.log('====================================');
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
        // Each order item has only one product
        const prod = order.product;
        if (!prod) return;
        const storeId = order.store?._id || order.store;
        if (!storeIds.includes(storeId)) return;
        const createdAt = new Date(order.createdAt);
        const quantity = order.quantity || order.qty || 1;
        const price = prod.priceDiscount || prod.price || 0;
        const orderAmount = price * quantity;
        totalSales += quantity;
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
        const key = prod.name || prod.product?.name || 'Product';
        productMap[key] = (productMap[key] || 0) + quantity;
        // Sales by store
        const storeKey =
          userStores.find((s) => s._id === storeId)?.name || 'Store';
        storeMap[storeKey] = (storeMap[storeKey] || 0) + orderAmount;
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

  // Load withdrawals from AsyncStorage
  useEffect(() => {
    (async () => {
      const log = await AsyncStorage.getItem('withdrawalLog');
      if (log) {
        const parsed = JSON.parse(log);
        setWithdrawals(parsed);
        setTotalWithdrawn(parsed.reduce((sum, w) => sum + w.amount, 0));
      }
    })();
  }, []);

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
          handleLogout();
        },
      },
    ]);
  };

  const handleEdit = () => {
    router.push('/addnew/settings');
  };

  const handleExportCSV = async () => {
    let csv = 'Date,Order ID,Status,Product,Quantity,Price,Total,Store\n';
    orders.forEach((order) => {
      const prod = order.product;
      if (!prod) return;
      const storeId = order.store?._id || order.store;
      if (!stores.some((s) => s._id === storeId)) return;
      const storeName = stores.find((s) => s._id === storeId)?.name || '';
      csv += `${new Date(order.createdAt).toLocaleDateString()},${order._id},${
        order.status
      },${prod.name || prod.product?.name || ''},${
        order.quantity || order.qty || 1
      },${order.price || prod.price || ''},${
        (order.price || prod.price || 0) * (order.quantity || order.qty || 1)
      },${storeName}\n`;
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
      [
        'Date',
        'Order ID',
        'Status',
        'Product',
        'Quantity',
        'Price',
        'Total',
        'Store',
      ],
    ];
    orders.forEach((order) => {
      const prod = order.product;
      if (!prod) return;
      const storeId = order.store?._id || order.store;
      if (!stores.some((s) => s._id === storeId)) return;
      const storeName = stores.find((s) => s._id === storeId)?.name || '';
      rows.push([
        new Date(order.createdAt).toLocaleDateString(),
        order._id,
        order.status,
        prod.name || prod.product?.name || '',
        order.quantity || order.qty || 1,
        order.price || prod.price || '',
        (order.price || prod.price || 0) * (order.quantity || order.qty || 1),
        storeName,
      ]);
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

  const handleWithdraw = () => {
    setWithdrawModalVisible(true);
  };

  const handleWithdrawSubmit = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }
    if (amount > stats.totalAmount) {
      Alert.alert(
        'Amount Exceeded',
        'You cannot withdraw more than your total sales.'
      );
      return;
    }
    setWithdrawing(true);
    setTimeout(async () => {
      setStats((prev) => ({ ...prev, totalAmount: prev.totalAmount - amount }));
      // Save withdrawal log
      const withdrawal = {
        amount,
        date: new Date().toISOString(),
        id: Date.now(),
      };
      const newLog = [withdrawal, ...withdrawals];
      setWithdrawals(newLog);
      setTotalWithdrawn(newLog.reduce((sum, w) => sum + w.amount, 0));
      await AsyncStorage.setItem('withdrawalLog', JSON.stringify(newLog));
      setWithdrawModalVisible(false);
      setWithdrawAmount('');
      setWithdrawing(false);
      Alert.alert(
        'Withdrawal Successful',
        `₦${amount.toLocaleString()} withdrawn successfully!`
      );
    }, 1000);
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
        <View style={styles.statsRow}>
          <View style={styles.statsBox}>
            <Text style={styles.statsLabel}>Total Withdrawn</Text>
            <Text style={styles.statsValue}>
              ₦{totalWithdrawn.toLocaleString()}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.exportBtn,
            {
              backgroundColor: '#4f8cff',
              borderColor: '#4f8cff',
              marginTop: 10,
            },
          ]}
          onPress={handleWithdraw}
        >
          <Ionicons name="cash-outline" size={18} color="#fff" />
          <Text style={[styles.exportText, { color: '#fff' }]}>
            Withdraw Sales
          </Text>
        </TouchableOpacity>
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
        <Text style={styles.name}>{user.name}</Text>{' '}
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
      <Modal
        visible={withdrawModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setWithdrawModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.3)',
          }}
        >
          <View
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 28,
              width: 320,
              alignItems: 'center',
            }}
          >
            <Text
              style={{
                fontWeight: 'bold',
                fontSize: 18,
                marginBottom: 12,
              }}
            >
              Withdraw Sales
            </Text>
            <Text
              style={{
                color: '#888',
                marginBottom: 8,
              }}
            >
              Available: ₦{stats.totalAmount.toLocaleString()}
            </Text>
            <TextInput
              style={{
                borderWidth: 1,
                borderColor: '#4f8cff',
                borderRadius: 8,
                padding: 10,
                width: '100%',
                marginBottom: 16,
                fontSize: 16,
              }}
              placeholder="Enter amount to withdraw"
              keyboardType="numeric"
              value={withdrawAmount}
              onChangeText={setWithdrawAmount}
              editable={!withdrawing}
            />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#4f8cff',
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 24,
                }}
                onPress={handleWithdrawSubmit}
                disabled={withdrawing}
              >
                <Text
                  style={{
                    color: '#fff',
                    fontWeight: 'bold',
                    fontSize: 16,
                  }}
                >
                  {withdrawing ? 'Processing...' : 'Withdraw'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  backgroundColor: '#eee',
                  borderRadius: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 24,
                }}
                onPress={() => setWithdrawModalVisible(false)}
                disabled={withdrawing}
              >
                <Text
                  style={{
                    color: '#4f8cff',
                    fontWeight: 'bold',
                    fontSize: 16,
                  }}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {/* Withdrawal Log */}
      {withdrawals.length > 0 && (
        <View
          style={{
            backgroundColor: '#fff',
            borderRadius: 16,
            padding: 20,
            marginBottom: 32,
            marginTop: 20,
            shadowColor: '#4f8cff',
          }}
        >
          <Text
            style={{
              fontWeight: 'bold',
              fontSize: 16,
              marginBottom: 10,
            }}
          >
            Withdrawal Log
          </Text>
          {withdrawals.map((w) => (
            <View
              key={w.id}
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                marginBottom: 6,
              }}
            >
              <Text style={{ color: '#4f8cff', fontSize: 16 }}>
                ₦{w.amount.toLocaleString()}
              </Text>
              <Text style={{ color: '#888' }}>
                {new Date(w.date).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      )}
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
