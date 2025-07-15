import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { getItems, updateItem } from '../../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../../constants';
import ErrorView from '../../../components/ErrorView';

export default function FavoritesScreen() {
  const [favorites, setFavorites] = useState({ stores: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    const userUID = await AsyncStorage.getItem('userUID');
    setUserId(userUID);
    const res = await getItems('favorites', { user: userUID });
    if (res?.data?.data?.data && res.data.data.data.length > 0) {
      setFavorites({
        stores: res.data.data.data[0].stores || [],
        products: res.data.data.data[0].products || [],
      });
    } else {
      setFavorites({ stores: [], products: [] });
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFavorites();
    setRefreshing(false);
  }, []);

  const handleRemove = async (type, id) => {
    setLoading(true);
    const updated = { ...favorites };
    updated[type] = updated[type].filter((item) => item !== id);
    await updateItem('favorites', userId, updated);
    fetchFavorites();
    setLoading(false);
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f6f8fa',
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.section}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      <Text style={styles.sectionTitle}>Favorite Products</Text>
      {favorites.products.length === 0 ? (
        <ErrorView msg={'No favorite products.'} />
      ) : (
        favorites.products.map((prodId) => (
          <View key={prodId} style={styles.card}>
            <Text>Product ID: {prodId}</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleRemove('products', prodId)}
            >
              <Text style={styles.deleteBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
      <Text style={styles.sectionTitle}>Favorite Stores</Text>
      {favorites.stores.length === 0 ? (
        <ErrorView msg={'No favorite stores.'} />
      ) : (
        favorites.stores.map((storeId) => (
          <View key={storeId} style={styles.card}>
            <Text>Store ID: {storeId}</Text>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleRemove('stores', storeId)}
            >
              <Text style={styles.deleteBtnText}>Remove</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: '#f6f8fa', padding: 16, flex: 1 },
  sectionTitle: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 10,
    justifyContent: 'center',
    textAlign: 'center',
    color: COLORS.primary,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
  },
  deleteBtn: {
    backgroundColor: '#c66',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  deleteBtnText: { color: '#fff', fontWeight: 'bold' },
});
