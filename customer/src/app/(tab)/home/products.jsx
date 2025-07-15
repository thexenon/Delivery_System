import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  RefreshControl,
  ScrollView,
} from 'react-native';
import * as Location from 'expo-location';
import { getItems } from '../../../utils/api';
import { COLORS, FONT, SIZES, SHADOWS, images } from '../../../constants';
import ErrorView from '../../../components/ErrorView';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { useCart } from '../../../utils/CartContext';

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [priceSort, setPriceSort] = useState('');
  const [subcategories, setSubcategories] = useState([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationSort, setLocationSort] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const scrollRef = useRef();
  const router = useRouter();
  const { cart, addOrUpdateCartItem } = useCart();

  // Get user location for location filter
  const useLoc = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      let loc = await Location.getCurrentPositionAsync({});
      setUserLocation(loc.coords);
    }
  };
  async function fetchData() {
    setLoading(true);
    try {
      const res = await getItems('products');
      setProducts(res.data.data.data);
      // Fetch subcategories from products
      const subs = Array.from(
        new Set(res.data.data.data.map((p) => p.subcategory).filter(Boolean))
      );
      setSubcategories(subs);
      setError('');
    } catch (error) {
      setError(error.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => {
      await useLoc();
      await fetchData();
    })();
  }, []);
  useEffect(() => {
    let filtered = [...products];
    // Search filter
    if (search) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.store?.name || '').toLowerCase().includes(search.toLowerCase())
      );
    }
    // Subcategory filter
    if (selectedSubcategory) {
      filtered = filtered.filter((p) => p.subcategory === selectedSubcategory);
    }
    // Price sort
    if (priceSort) {
      filtered.sort((a, b) =>
        priceSort === 'asc'
          ? (a.priceFinal || a.price) - (b.priceFinal || b.price)
          : (b.priceFinal || b.price) - (a.priceFinal || a.price)
      );
    }
    // Location sort
    if (locationSort && userLocation) {
      filtered.sort((a, b) => {
        const getDist = (prod) => {
          if (
            !prod.store ||
            !prod.store.location ||
            !prod.store.location.coordinates
          )
            return Infinity;
          const [lon, lat] = prod.store.location.coordinates;
          const toRad = (v) => (v * Math.PI) / 180;
          const R = 6371; // km
          const dLat = toRad(lat - userLocation.latitude);
          const dLon = toRad(lon - userLocation.longitude);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(userLocation.latitude)) *
              Math.cos(toRad(lat)) *
              Math.sin(dLon / 2) *
              Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };
        return getDist(a) - getDist(b);
      });
    }
    setFilteredProducts(filtered);
  }, [
    products,
    search,
    priceSort,
    selectedSubcategory,
    locationSort,
    userLocation,
  ]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Show/hide scroll-to-top button
  const handleScroll = (event) => {
    if (event.nativeEvent.contentOffset.y > 200) {
      setShowScrollTop(true);
    } else {
      setShowScrollTop(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  if (error) {
    return <ErrorView msg={error} />;
  }

  // Modern product card
  const renderProduct = ({ item }) => {
    const isInCart = cart.some((c) => c.product === item._id);
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/home/product-details/${item._id}`)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: item.images?.[0] || images.logo }}
          style={styles.productImage}
        />
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productStore}>{item.store?.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.productPrice}>
            ₦{item.priceFinal?.toLocaleString() || item.price?.toLocaleString()}
          </Text>
          {item.priceDiscountPercent && (
            <Text style={styles.priceDP}>{item.priceDiscountPercent}% Off</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.addBtn, isInCart && { opacity: 0.5 }]}
          disabled={isInCart}
          onPress={() =>
            addOrUpdateCartItem({ product: item._id, quantity: 1 })
          }
        >
          <Text style={styles.addBtnText}>
            {isInCart ? 'In Cart' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        ref={scrollRef}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Hero/banner */}
        <View style={styles.heroBanner}>
          <Text style={styles.heroTitle}>All Products</Text>
          <Text style={styles.heroSubtitle}>
            Browse and shop from all available products
          </Text>
          <View style={styles.searchBarRow}>
            <MaterialIcons
              name="search"
              size={22}
              color={COLORS.gray}
              style={{ marginRight: 6 }}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search products or stores..."
              placeholderTextColor={COLORS.gray}
              value={search}
              onChangeText={setSearch}
            />
          </View>
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                priceSort === 'asc' && styles.filterBtnActive,
              ]}
              onPress={() => setPriceSort(priceSort === 'asc' ? '' : 'asc')}
            >
              <Text style={styles.filterBtnText}>Price ↑</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterBtn,
                priceSort === 'desc' && styles.filterBtnActive,
              ]}
              onPress={() => setPriceSort(priceSort === 'desc' ? '' : 'desc')}
            >
              <Text style={styles.filterBtnText}>Price ↓</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, locationSort && styles.filterBtnActive]}
              onPress={() => setLocationSort((prev) => !prev)}
            >
              <Text style={styles.filterBtnText}>Location</Text>
            </TouchableOpacity>
          </View>
          {/* Subcategory chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.subcatChipsRow}
          >
            <TouchableOpacity
              style={[
                styles.subcatChip,
                !selectedSubcategory && styles.subcatChipActive,
              ]}
              onPress={() => setSelectedSubcategory('')}
            >
              <Text
                style={[
                  styles.subcatChipText,
                  !selectedSubcategory && styles.subcatChipTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {subcategories.map((sub) => (
              <TouchableOpacity
                key={sub}
                style={[
                  styles.subcatChip,
                  selectedSubcategory === sub && styles.subcatChipActive,
                ]}
                onPress={() => setSelectedSubcategory(sub)}
              >
                <Text
                  style={[
                    styles.subcatChipText,
                    selectedSubcategory === sub && styles.subcatChipTextActive,
                  ]}
                >
                  {sub}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        {/* Product grid */}
        <View style={styles.productsGridWrap}>
          {filteredProducts.length === 0 ? (
            <ErrorView msg={'No products found.'} />
          ) : (
            <View style={styles.productsGrid}>
              {filteredProducts.map((item) => renderProduct({ item }))}
            </View>
          )}
        </View>
      </ScrollView>
      {/* Floating cart button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/cart')}>
        <MaterialIcons name="shopping-cart" size={28} color={COLORS.white} />
      </TouchableOpacity>
      {/* Floating scroll-to-top button */}
      {showScrollTop && (
        <TouchableOpacity
          style={styles.fabLeft}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
        >
          <MaterialIcons name="arrow-upward" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightWhite,
    padding: 8,
    marginTop: Platform.OS === 'android' ? 24 : 15,
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
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
    ...SHADOWS.small,
  },
  filterRow: {
    flexDirection: 'row',
    marginTop: 10,
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBtn: {
    backgroundColor: COLORS.gray2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  filterBtnText: {
    color: COLORS.secondary,
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
  },
  subcatChipsRow: {
    flexDirection: 'row',
    marginBottom: 10,
    marginLeft: 2,
  },
  subcatChip: {
    backgroundColor: COLORS.gray2,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  subcatChipActive: {
    backgroundColor: COLORS.tertiary,
  },
  subcatChipText: {
    color: COLORS.secondary,
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
  },
  subcatChipTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    width: '48%',
    ...SHADOWS.small,
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    backgroundColor: COLORS.gray2,
    marginBottom: 6,
  },
  productName: {
    fontSize: SIZES.medium,
    fontFamily: FONT.bold,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  productStore: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    textAlign: 'center',
  },
  priceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  productPrice: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
    fontFamily: FONT.bold,
    marginRight: 6,
  },
  priceDP: {
    fontSize: SIZES.small,
    color: COLORS.tertiary,
    fontWeight: 'bold',
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  addBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
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
  productsGridWrap: { flex: 1 },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  fabLeft: {
    position: 'absolute',
    bottom: 30,
    left: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
    zIndex: 10,
  },
});
