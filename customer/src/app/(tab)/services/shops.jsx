import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { getItems } from '../../../utils/api';
import { COLORS, FONT, SIZES, SHADOWS, images } from '../../../constants';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

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

export default function ShopsScreen() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [filtered, setFiltered] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [sort, setSort] = useState('top');
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const res = await getItems('artisanshops');
    if (res.status !== 200) {
      setError(res.message || 'Failed to fetch shops');
      setLoading(false);
      return;
    }
    setShops(res.data.data.data);
    setFiltered(res.data.data.data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Filter and sort
  useEffect(() => {
    let data = [...shops];
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          (s.address && s.address.toLowerCase().includes(q))
      );
    }
    if (sort === 'top') {
      data.sort((a, b) => (b.ratingsAverage || 0) - (a.ratingsAverage || 0));
    } else if (sort === 'az') {
      data.sort((a, b) => a.name.localeCompare(b.name));
    }
    setFiltered(data);
  }, [search, shops, sort]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  // Top shops carousel
  const topShops = [...shops]
    .filter((s) => s.top === 'yes')
    .sort((a, b) => (b.ratingsAverage || 0) - (a.ratingsAverage || 0))
    .slice(0, 8);

  // Shop card
  const renderShop = ({ item }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.navigate(`/services/shop-details/${item._id}`)}
        activeOpacity={0.85}
      >
        <Image
          source={{ uri: item.image || images.logo }}
          style={styles.image}
        />
        <View style={{ flex: 1 }}>
          <Text style={styles.shopName}>{item.name}</Text>
          <StarRating rating={item.ratingsAverage || 0} />
          <Text style={styles.address}>{item.address}</Text>
          <Text style={styles.address}>Phone: {item.phone}</Text>
          <TouchableOpacity
            style={styles.mapBtn}
            onPress={() => {
              if (item.location?.coordinates) {
                const [lon, lat] = item.location.coordinates;
                const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
                router.push(url);
              }
            }}
          >
            <MaterialIcons name="map" size={18} color={COLORS.primary} />
            <Text style={styles.mapBtnText}>View on Map</Text>
          </TouchableOpacity>
        </View>
        {item.isVerified && (
          <MaterialIcons
            name="verified"
            size={22}
            color={COLORS.primary}
            style={{ marginLeft: 4, position: 'absolute', top: 8, right: 8 }}
          />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Hero/banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroTitle}>Browse Artisan Shops</Text>
        <Text style={styles.heroSubtitle}>
          Find the best artisan shops near you
        </Text>
        <Text style={styles.heroSubtitle}>
          Call/Text us on +233593354286 if you want to list your shop.
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
            placeholder="Search shops..."
            placeholderTextColor={COLORS.gray}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
        </View>
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterBtn, sort === 'top' && styles.filterBtnActive]}
            onPress={() => setSort('top')}
          >
            <Text style={styles.filterBtnText}>Top Rated</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterBtn, sort === 'az' && styles.filterBtnActive]}
            onPress={() => setSort('az')}
          >
            <Text style={styles.filterBtnText}>A-Z</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Top Shops Carousel */}
      <View style={styles.topShopsSection}>
        <Text style={styles.sectionTitle}>Top Artisan Shops</Text>
        <FlatList
          data={topShops}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.topShopCard}
              onPress={() => router.push(`/shops/shop-details/${item._id}`)}
            >
              <Image
                source={{ uri: item.image || images.logo }}
                style={styles.topShopLogo}
              />
              <Text style={styles.topShopName}>{item.name}</Text>
              <StarRating rating={item.ratingsAverage || 0} />
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 4 }}
        />
      </View>
      {/* Shop grid/list */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        renderItem={renderShop}
        ListEmptyComponent={<Text style={styles.error}>No shops found.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightWhite,
    paddingTop: 0,
    paddingHorizontal: 8,
    paddingBottom: 10,
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
    marginBottom: 10,
    marginTop: 20,
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
  searchInput: {
    flex: 1,
    fontSize: SIZES.medium,
    color: COLORS.secondary,
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
  topShopsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: SIZES.xLarge,
    fontFamily: FONT.bold,
    color: COLORS.primary,
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  topShopCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    marginRight: 12,
    alignItems: 'center',
    width: 110,
    ...SHADOWS.small,
  },
  topShopLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 6,
    backgroundColor: COLORS.gray2,
  },
  topShopName: {
    fontSize: SIZES.small,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 15,
    ...SHADOWS.small,
    position: 'relative',
  },
  image: {
    width: 120,
    height: 100,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: COLORS.gray2,
  },
  shopName: {
    fontSize: SIZES.large,
    fontFamily: FONT.medium,
    color: COLORS.secondary,
  },
  address: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
    marginTop: 2,
  },
  mapBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  mapBtnText: {
    color: COLORS.primary,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    fontSize: SIZES.medium,
    textAlign: 'center',
  },
});
