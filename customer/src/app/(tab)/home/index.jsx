import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { getItems } from '../../../utils/api';
import { COLORS, FONT, SIZES, SHADOWS, images } from '../../../constants';
import ErrorView from '../../../components/ErrorView';
import { useRouter } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

function StarRating({ rating }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <MaterialIcons
        key={i}
        name="star"
        size={16}
        color={i <= Math.round(rating) ? COLORS.tertiary : COLORS.gray2}
      />
    );
  }
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>{stars}</View>
  );
}

export default function HomeScreen() {
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [userArea, setUserArea] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const router = useRouter();

  // Helper: Haversine distance in km
  function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    if (
      lat1 === undefined ||
      lon1 === undefined ||
      lat2 === undefined ||
      lon2 === undefined
    )
      return Infinity;
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes, storeRes, orderItemRes] = await Promise.all([
        getItems('products'),
        getItems('categories'),
        getItems('stores?top=yes'),
        getItems('orderitems'),
      ]);
      const productsRaw = prodRes.status === 200 ? prodRes.data.data.data : [];
      const storesRaw = storeRes.status === 200 ? storeRes.data.data.data : [];
      const orderItemsRaw =
        orderItemRes.status === 200 ? orderItemRes.data.data.data : [];
      // Compute order count per product
      const orderCountMap = {};
      orderItemsRaw.forEach((oi) => {
        const pid = oi.product?._id || oi.product;
        if (pid) orderCountMap[pid] = (orderCountMap[pid] || 0) + 1;
      });
      // Compute distance for each product
      let userCoords = userLocation
        ? { lat: userLocation.latitude, lon: userLocation.longitude }
        : null;
      const productsWithExtras = productsRaw.map((p) => {
        let distance = Infinity;
        if (userCoords && p.store?.location?.coordinates) {
          const [lon, lat] = p.store.location.coordinates;
          distance = getDistanceFromLatLonInKm(
            userCoords.lat,
            userCoords.lon,
            lat,
            lon
          );
        }
        return {
          ...p,
          distance,
          orders: orderCountMap[p._id] || 0,
        };
      });
      setAllProducts(productsWithExtras);
      setProducts(productsWithExtras);
      setCategories(catRes.status === 200 ? catRes.data.data.data : []);
      setStores(storesRaw);
    } catch (e) {
      setError('Failed to fetch data');
    }
    setLoading(false);
  }, [userLocation]);

  // Fetch user location on mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        setUserLocation(location.coords);
        // Reverse geocode for area/city
        let geo = await Location.reverseGeocodeAsync(location.coords);
        if (geo && geo[0]) {
          setUserArea(geo[0].city || geo[0].region || geo[0].country || '');
        }
      }
    })();
  }, []);

  // Fetch data when userLocation changes
  useEffect(() => {
    fetchData();
  }, [userLocation]);

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData().then(() => setRefreshing(false));
  }, [fetchData]);

  // Search and category filter
  useEffect(() => {
    let filtered = [...allProducts];
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.store?.name || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category.id === selectedCategory);
    }
    setProducts(filtered);
  }, [search, selectedCategory, allProducts]);

  // Helper: get 10 products sorted by key
  function getSectionProducts(key, asc = true) {
    let sorted = [...products];
    sorted.sort((a, b) => (asc ? a[key] - b[key] : b[key] - a[key]));
    return sorted.slice(0, 10);
  }

  // Section data
  const sections = [
    {
      title: 'Nearest to You',
      data: getSectionProducts('distance', true),
    },
    {
      title: 'Lowest Price',
      data: getSectionProducts('price', true),
    },
    {
      title: 'Most Ordered',
      data: getSectionProducts('orders', false),
    },
  ];

  // Top stores (by rating or orders)
  const topStores = [...stores]
    .sort((a, b) => (b.ratingsAverage || 0) - (a.ratingsAverage || 0))
    .slice(0, 10);

  // Load recently viewed from storage on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('recentlyViewed');
        if (stored) setRecentlyViewed(JSON.parse(stored));
      } catch (e) {}
    })();
  }, []);

  // Save recently viewed to storage whenever it changes
  useEffect(() => {
    AsyncStorage.setItem('recentlyViewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed]);

  // Skeleton loader
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ color: COLORS.gray, marginTop: 12 }}>
          Loading products...
        </Text>
      </View>
    );
  }
  if (error) {
    return <ErrorView msg={error} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      {/* Hero/banner */}
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.heroBanner}>
          <Text style={styles.heroTitle}>Welcome to Elroy!</Text>
          <Text style={styles.heroSubtitle}>
            Find the best products near you and get them delivered fast.
          </Text>
          <Text style={styles.heroSubtitle}>
            Call/Text us on +233593354286 if you want to list your products.
          </Text>
          {userArea ? (
            <Text style={styles.heroLocation}>
              <MaterialIcons
                name="location-on"
                size={25}
                color={COLORS.black}
              />{' '}
              {userArea}
            </Text>
          ) : null}
        </View>
        {/* Search bar */}
        <View style={styles.searchBarRow}>
          <MaterialIcons
            name="search"
            size={22}
            color={COLORS.gray}
            style={{ marginRight: 6 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for products or stores..."
            placeholderTextColor={COLORS.black}
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {/* Category chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryChipsRow}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              !selectedCategory && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory('')}
          >
            <Text
              style={[
                styles.categoryChipText,
                !selectedCategory && styles.categoryChipTextActive,
              ]}
            >
              All
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat._id}
              style={[
                styles.categoryChip,
                selectedCategory === cat._id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(cat._id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === cat._id && styles.categoryChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Top Stores */}
        <View style={styles.topStoresSection}>
          <Text style={styles.sectionTitle}>Top Stores</Text>
          <FlatList
            data={topStores}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.storeCard}
                onPress={() => router.push(`/stores/store-details/${item._id}`)}
              >
                <Image
                  source={{ uri: item.image || images.logo }}
                  style={styles.storeLogo}
                />
                <Text style={styles.storeName}>{item.name}</Text>
                <StarRating rating={item.ratingsAverage || 0} />
                {item.isVerified && (
                  <MaterialIcons
                    name="verified"
                    size={18}
                    color={COLORS.primary}
                    style={{ marginTop: 2 }}
                  />
                )}
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        </View>
        {/* Product carousels */}
        {sections.map((section, idx) => (
          <View key={section.title} style={{ marginBottom: 32 }}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <FlatList
              data={section.data}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  key={item._id}
                  onPress={() => {
                    setRecentlyViewed((prev) =>
                      [item, ...prev.filter((p) => p._id !== item._id)].slice(
                        0,
                        10
                      )
                    );
                    router.push(`/home/product-details/${item._id}`);
                  }}
                >
                  <Image
                    source={{ uri: item.images[0] || images.logo }}
                    style={styles.image}
                  />
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        marginTop: 2,
                      }}
                    >
                      <Text style={styles.productName}>{item.name}</Text>
                      {item.isVerified && (
                        <MaterialIcons
                          name="verified"
                          size={16}
                          color={COLORS.primary}
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                    <Text style={styles.storeName}>{item.store?.name}</Text>
                    <View
                      style={{
                        flex: 1,
                        flexDirection: 'row',
                        alignItems: 'center',
                      }}
                    >
                      <Text style={styles.priceDiscount}>${item.price} </Text>
                      <Text style={styles.price}>${item.priceFinal} </Text>
                      {item.priceDiscountPercent && (
                        <Text style={styles.priceDP}>
                          {item.priceDiscountPercent}%Off
                        </Text>
                      )}
                    </View>
                    <Text style={styles.distance}>
                      {section.title === 'Nearest to You'
                        ? item.distance !== undefined &&
                          item.distance !== Infinity
                          ? `${item.distance.toFixed(2)} km away`
                          : 'Distance unknown'
                        : section.title === 'Lowest Price'
                        ? `$${item.priceFinal}`
                        : `${item.orders} orders`}
                    </Text>
                  </View>
                  {item.isNew && <Text style={styles.badgeNew}>New</Text>}
                  {item.orders > 50 && (
                    <Text style={styles.badgePopular}>Popular</Text>
                  )}
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 8 }}
            />
          </View>
        ))}
        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <View style={{ marginBottom: 32 }}>
            <Text style={styles.sectionTitle}>Recently Viewed</Text>
            <FlatList
              data={recentlyViewed}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  key={item._id}
                  onPress={() =>
                    router.push(`/home/product-details/${item._id}`)
                  }
                >
                  <Image
                    source={{ uri: item.images[0] || images.logo }}
                    style={styles.image}
                  />
                  <Text style={styles.productName}>{item.name}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 8 }}
            />
          </View>
        )}
        {/* View all products */}
        <View>
          <TouchableOpacity onPress={() => router.navigate('/home/products')}>
            <Text style={styles.viewAllTitle}>View All Products</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* Floating action button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.navigate('/cart')}
      >
        <MaterialIcons name="shopping-cart" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: COLORS.lightWhite,
    paddingTop: 24,
    paddingHorizontal: 8,
    paddingBottom: 80,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightWhite,
  },
  heroBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  heroTitle: {
    fontSize: SIZES.xxLarge,
    fontFamily: FONT.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: SIZES.large,
    color: COLORS.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  heroLocation: {
    fontSize: SIZES.xLarge,
    color: COLORS.greenish,
    fontStyle: 'italic',
    fontWeight: 'bold',
    marginTop: 4,
    marginTop: 2,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.medium,
    color: COLORS.secondary,
  },
  categoryChipsRow: {
    flexDirection: 'row',
    marginBottom: 14,
    marginLeft: 2,
  },
  categoryChip: {
    backgroundColor: COLORS.gray2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    color: COLORS.secondary,
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
  },
  categoryChipTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  topStoresSection: {
    marginBottom: 24,
  },
  storeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
    alignItems: 'center',
    width: 110,
    ...SHADOWS.small,
  },
  storeLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 6,
    backgroundColor: COLORS.gray2,
  },
  storeName: {
    fontSize: SIZES.small,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  card: {
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    width: 180,
    marginRight: 12,
    ...SHADOWS.small,
    position: 'relative',
  },
  image: {
    width: 120,
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: COLORS.gray2,
  },
  productName: {
    fontSize: SIZES.large,
    fontFamily: FONT.medium,
    color: COLORS.secondary,
  },
  price: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: 'bold',
  },
  priceDP: {
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    marginTop: 2,
    fontWeight: 'bold',
  },
  priceDiscount: {
    fontSize: SIZES.medium,
    color: COLORS.tertiary,
    marginTop: 2,
    textDecorationLine: 'line-through',
    fontWeight: 'bold',
  },
  badgeNew: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: COLORS.tertiary,
    color: COLORS.white,
    fontSize: SIZES.small,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  badgePopular: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.primary,
    color: COLORS.white,
    fontSize: SIZES.small,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
  addToCartBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 8,
    ...SHADOWS.small,
  },
  distance: {
    fontSize: SIZES.medium,
    color: COLORS.greenish,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: SIZES.xLarge,
    fontFamily: FONT.bold,
    color: COLORS.primary,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  viewAllTitle: {
    fontSize: SIZES.xLarge,
    fontFamily: FONT.bold,
    color: COLORS.greenish,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    bottom: 70,
    right: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
    zIndex: 10,
  },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray2,
    paddingVertical: 8,
    justifyContent: 'space-around',
    alignItems: 'center',
    zIndex: 20,
  },
  navBtn: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    marginTop: 2,
  },
});
