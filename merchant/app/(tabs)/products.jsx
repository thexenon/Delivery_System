import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getItems, deleteItems } from '../utils/api';
import ErrorView from '../../components/ErrorView';

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('jwt');
      const userUID = await AsyncStorage.getItem('userUID');
      if (!token || !userUID) throw new Error('User not authenticated');
      // Fetch products for this merchant
      const res = await getItems('products', { merchant: userUID });
      const productsData = res?.data?.data?.data;
      setProducts(productsData);
    } catch (err) {
      setError(err.message || 'Failed to fetch products');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const handleEdit = (id) => {
    router.push({ pathname: '../addnew/product', params: { productUID: id } });
  };
  const handleView = (id) => {
    router.push({ pathname: '../details/product', params: { productId: id } });
  };
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      const res = await deleteItems(`products/${id}`);
      if (res.status === 204 || res.status === 'success') {
        setProducts((prev) => prev.filter((p) => p._id !== id));
      } else {
        alert(res.message || 'Failed to delete product');
      }
    } catch (err) {
      alert(err.message || 'Failed to delete product');
    }
    setLoading(false);
  };

  const renderProduct = ({ item }) => (
    <View style={styles.productCard}>
      <Image
        source={
          item.images && item.images.length > 0
            ? { uri: item.images[0] }
            : require('../../assets/logo.png')
        }
        style={styles.productImage}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.productPrice}>
          GHS {item.price?.toLocaleString()}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            marginTop: 8,
            gap: 8,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#eaf2ff',
              borderRadius: 6,
              padding: 6,
              alignItems: 'center',
            }}
            onPress={() => handleView(item._id)}
          >
            <Ionicons name="eye-outline" size={18} color="#4f8cff" />
            <Text style={{ color: '#4f8cff', fontSize: 12 }}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#eaf2ff',
              borderRadius: 6,
              padding: 6,
              alignItems: 'center',
            }}
            onPress={() => handleEdit(item._id)}
          >
            <Ionicons name="create-outline" size={18} color="#4f8cff" />
            <Text style={{ color: '#4f8cff', fontSize: 12 }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#ffeaea',
              borderRadius: 6,
              padding: 6,
              alignItems: 'center',
            }}
            onPress={() => handleDelete(item._id)}
          >
            <Ionicons name="trash-outline" size={18} color="#e74c3c" />
            <Text style={{ color: '#e74c3c', fontSize: 12 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Products</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('../addnew/product')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Product</Text>
        </TouchableOpacity>
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
      ) : products.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <ErrorView msg={'No products found.'} />
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          renderItem={renderProduct}
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f8cff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  productCard: {
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
  productImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#eaeaea',
  },
  productName: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#222',
    marginBottom: 2,
  },
  productDesc: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  productPrice: {
    color: '#4f8cff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
