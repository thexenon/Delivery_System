import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { getItems, deleteItems } from '../../utils/api';
import ErrorView from '../../../components/ErrorView';

export default function ShopsScreen() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchShops = async () => {
    setLoading(true);
    setError(null);
    try {
      const userUID = await AsyncStorage.getItem('userUID');
      if (!userUID) throw new Error('User not authenticated');
      const res = await getItems('artisanshops', { artisan: userUID });
      setShops(res?.data?.data.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch shops');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchShops();
  };

  const handleEdit = (shopId) => {
    router.push({
      pathname: '/addnew/shop',
      params: { shopId: shopId },
    });
  };

  const handleDelete = async (shopId) => {
    Alert.alert('Delete Shop', 'Are you sure you want to delete this shop?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const res = await deleteItems(`artisanshops/${shopId}`);
            if (res.status === 204 || res.status === 'success') {
              Alert.alert('Success', 'Shop deleted');
              fetchShops();
            } else {
              Alert.alert('Error', res.message || 'Failed to delete shop');
            }
          } catch (err) {
            Alert.alert('Error', err.message || 'Failed to delete shop');
          }
        },
      },
    ]);
  };

  const renderShop = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push(`/details/shop?shopId=${item._id}`)}
      style={{ flex: 1 }}
    >
      <View style={styles.shopCard}>
        <Image
          source={
            item.image
              ? { uri: item.image }
              : require('../../../assets/logo.png')
          }
          style={styles.shopImage}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.shopName}>{item.name}</Text>
          <Text style={styles.shopAddress}>
            <Ionicons name="location-outline" size={14} /> {item.address}
          </Text>
          <Text style={styles.shopPhone}>
            <Ionicons name="call-outline" size={14} /> +233{item.phone}
          </Text>

          <Text style={styles.detailText}>
            <Text style={{ fontWeight: 'bold' }}>Verified:</Text>{' '}
            {item.isVerified ? 'Yes' : 'No'}
          </Text>
          <Text style={styles.detailText}>
            <Text style={{ fontWeight: 'bold' }}>Rating:</Text>{' '}
            {item.ratingsAverage} ({item.ratingsQuantity || 0})
          </Text>
          <Text style={styles.detailText}>
            <Text style={{ fontWeight: 'bold' }}>Available:</Text>{' '}
            <Text style={styles.shopStatus}>
              {item.available ? (
                <Text style={{ color: '#27ae60' }}>Available</Text>
              ) : (
                <Text style={{ color: '#e74c3c' }}>Not Available</Text>
              )}
            </Text>
          </Text>

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => handleEdit(item._id)}
            >
              <Ionicons name="create-outline" size={18} color="#4f8cff" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item._id)}
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={22} color="#aaa" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🏬 My Shops</Text>
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
      ) : shops.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <ErrorView msg={'No shops found.'} />
        </View>
      ) : (
        <FlatList
          data={shops}
          keyExtractor={(item) => item._id}
          renderItem={renderShop}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
      {shops.length === 0 && (
        <View style={styles.addBtnWrapper}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/addnew/shop')}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Add Shop</Text>
          </TouchableOpacity>
        </View>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#222',
    alignSelf: 'center',
  },
  shopCard: {
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
  shopImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#eaeaea',
  },
  shopName: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#222',
    marginBottom: 2,
  },
  shopAddress: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  shopPhone: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  shopStatus: {
    fontSize: 13,
    marginTop: 2,
  },
  addBtnWrapper: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f8cff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginBottom: 0,
    marginTop: 0,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  detailText: {
    color: '#666',
    fontSize: 13,
    marginBottom: 2,
  },
  workingHour: {
    color: '#888',
    fontSize: 12,
    marginLeft: 8,
    marginBottom: 1,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#4f8cff',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: '#f6f8fa',
  },
  editBtnText: {
    color: '#4f8cff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
});
