import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { getItems } from '../utils/api';
import MapView, { Marker } from 'react-native-maps';

export default function StoreDetailsScreen() {
  const { storeId } = useLocalSearchParams();
  const [section, setSection] = useState('about');
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapRegion, setMapRegion] = useState(null);
  const [mapZoom, setMapZoom] = useState(0.001);

  useEffect(() => {
    const fetchStore = async () => {
      setLoading(true);
      try {
        const res = await getItems(`stores/${storeId}`);
        setStore(res?.data?.data?.data || null);

        // Fetch products for this store
        const prodRes = await getItems('products', { store: storeId });
        setProducts(prodRes?.data?.products || []);

        // Fetch reviews for this store
        const revRes = await getItems('reviews', { store: storeId });
        setReviews(revRes?.data?.reviews || []);
      } catch (err) {
        setStore(null);
      }
      setLoading(false);
    };
    fetchStore();
  }, [storeId]);

  useEffect(() => {
    if (store && store.location?.coordinates) {
      setMapRegion({
        longitude: store.location.coordinates[0],
        latitude: store.location.coordinates[1],
        latitudeDelta: mapZoom,
        longitudeDelta: mapZoom,
      });
    }
    // eslint-disable-next-line
  }, [store, mapZoom]);

  const handleZoomIn = () => {
    setMapZoom((prev) => Math.max(prev / 2, 0.0001));
  };

  const handleZoomOut = () => {
    setMapZoom((prev) => Math.min(prev * 2, 1));
  };

  const renderSection = () => {
    if (loading) {
      return (
        <View style={{ marginTop: 40 }}>
          <ActivityIndicator size="large" color="#4f8cff" />
        </View>
      );
    }
    if (!store) {
      return (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <Ionicons name="alert-circle-outline" size={40} color="#e74c3c" />
          <Text style={{ color: '#e74c3c', marginTop: 10 }}>
            Store not found.
          </Text>
        </View>
      );
    }
    if (section === 'about') {
      const coords = store.location?.coordinates;
      return (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View style={styles.aboutCard}>
            <Image
              source={
                store.image
                  ? { uri: store.image }
                  : require('../../assets/logo.png')
              }
              style={styles.storeImage}
            />
            <Text style={styles.storeName}>{store.name}</Text>
            <View style={styles.detailRow}>
              <Ionicons name="call-outline" size={22} color="#4f8cff" />
              <Text style={styles.detailLabel}>Phone:</Text>
              <Text style={styles.detailValue}>{store.phone}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="location-outline" size={22} color="#4f8cff" />
              <Text style={styles.detailLabel}>Address:</Text>
              <Text style={styles.detailValue}>{store.address}</Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons name="star" size={22} color="#f1c40f" />
              <Text style={styles.detailLabel}>Rating:</Text>
              <Text style={styles.detailValue}>
                {store.ratingsAverage} ({store.ratingsQunatity || 0})
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={22}
                color="#27ae60"
              />
              <Text style={styles.detailLabel}>Verified:</Text>
              <Text style={styles.detailValue}>
                {store.isVerified ? 'Yes' : 'No'}
              </Text>
            </View>
            <View style={styles.detailRow}>
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color="#4f8cff"
              />
              <Text style={styles.detailLabel}>Active:</Text>
              <Text style={styles.detailValue}>
                {store.active ? 'Yes' : 'No'}
              </Text>
            </View>
            <Text style={[styles.sectionHeader, { marginTop: 18 }]}>
              Working Hours
            </Text>
            {store.workingHours &&
              store.workingHours.map((wh, idx) => (
                <View key={idx} style={styles.workingHourRow}>
                  <Text style={styles.workingHourDay}>{wh.day}</Text>
                  <Text style={styles.workingHourTime}>
                    {wh.open} - {wh.close}
                  </Text>
                </View>
              ))}
            <Text style={[styles.sectionHeader, { marginTop: 18 }]}>
              Location
            </Text>
            {coords && coords.length === 2 ? (
              <View>
                <MapView
                  style={styles.map}
                  region={mapRegion}
                  scrollEnabled={false}
                  zoomEnabled={false}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={{
                      longitude: coords[0],
                      latitude: coords[1],
                    }}
                    title={store.name}
                    description={store.address}
                  />
                </MapView>
                <View style={styles.mapZoomRow}>
                  <TouchableOpacity
                    style={styles.zoomBtn}
                    onPress={handleZoomIn}
                  >
                    <Ionicons name="add" size={22} color="#4f8cff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.zoomBtn}
                    onPress={handleZoomOut}
                  >
                    <Ionicons name="remove" size={22} color="#4f8cff" />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <Text style={styles.detailValue}>No location set</Text>
            )}
          </View>
        </ScrollView>
      );
    }
    if (section === 'products') {
      return (
        <FlatList
          data={products}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons name="cube-outline" size={40} color="#aaa" />
              <Text style={{ color: '#aaa', marginTop: 10 }}>
                No products found.
              </Text>
            </View>
          }
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
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
                  ₦{item.price?.toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        />
      );
    }
    if (section === 'reviews') {
      return (
        <FlatList
          data={reviews}
          keyExtractor={(item) => item._id}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 40 }}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={40}
                color="#aaa"
              />
              <Text style={{ color: '#aaa', marginTop: 10 }}>
                No reviews found.
              </Text>
            </View>
          }
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={styles.reviewCard}>
              <Text style={styles.reviewUser}>
                {item.user?.name || 'Anonymous'}
              </Text>
              <Text style={styles.reviewRating}>
                <Ionicons name="star" size={14} color="#f1c40f" /> {item.rating}
              </Text>
              <Text style={styles.reviewText}>{item.review}</Text>
              <Text style={styles.reviewDate}>
                {new Date(item.createdAt).toLocaleString()}
              </Text>
            </View>
          )}
        />
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tabBtn, section === 'about' && styles.tabBtnActive]}
          onPress={() => setSection('about')}
        >
          <Text
            style={[
              styles.tabBtnText,
              section === 'about' && styles.tabBtnTextActive,
            ]}
          >
            About
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, section === 'products' && styles.tabBtnActive]}
          onPress={() => setSection('products')}
        >
          <Text
            style={[
              styles.tabBtnText,
              section === 'products' && styles.tabBtnTextActive,
            ]}
          >
            Products
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, section === 'reviews' && styles.tabBtnActive]}
          onPress={() => setSection('reviews')}
        >
          <Text
            style={[
              styles.tabBtnText,
              section === 'reviews' && styles.tabBtnTextActive,
            ]}
          >
            Reviews
          </Text>
        </TouchableOpacity>
      </View>
      {renderSection()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  tabRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 20,
  },
  tabBtnActive: {
    backgroundColor: '#4f8cff22',
  },
  tabBtnText: {
    color: '#4f8cff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  tabBtnTextActive: {
    color: '#222',
  },
  aboutCard: {
    backgroundColor: '#fff',
    borderRadius: 18,
    alignItems: 'center',
    padding: 28,
    marginBottom: 16,
    shadowColor: '#4f8cff',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  storeImage: {
    width: '90%',
    height: 300,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: '#4f8cff',
    backgroundColor: '#eaeaea',
    marginBottom: 18,
  },
  storeName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16,
    textAlign: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    width: '100%',
    justifyContent: 'flex-start',
  },
  detailLabel: {
    fontSize: 18,
    color: '#222',
    fontWeight: 'bold',
    marginLeft: 10,
    marginRight: 6,
    minWidth: 80,
  },
  detailValue: {
    fontSize: 18,
    color: '#444',
    flexShrink: 1,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4f8cff',
    alignSelf: 'flex-start',
    marginBottom: 8,
    marginTop: 8,
  },
  workingHourRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  workingHourDay: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    width: 100,
  },
  workingHourTime: {
    fontSize: 16,
    color: '#4f8cff',
    fontWeight: 'bold',
  },
  map: {
    width: Dimensions.get('window').width - 32,
    height: 300,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 10,
  },
  mapZoomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginBottom: 8,
  },
  zoomBtn: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    marginHorizontal: 8,
    borderWidth: 1,
    borderColor: '#4f8cff',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
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
  reviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#4f8cff',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewUser: {
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
    fontSize: 15,
  },
  reviewRating: {
    color: '#f1c40f',
    fontWeight: 'bold',
    marginBottom: 2,
    fontSize: 14,
  },
  reviewText: {
    color: '#444',
    fontSize: 15,
    marginBottom: 4,
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
    textAlign: 'right',
  },
});
