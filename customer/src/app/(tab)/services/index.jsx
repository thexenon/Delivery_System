import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  RefreshControl,
  r,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { getItems } from '../../../utils/api';
import { images, COLORS, SIZES, SHADOWS, FONT } from '../../../constants';
import ErrorView from '../../../components/ErrorView';

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

export default function ServicesScreen() {
  const [services, setServices] = useState([]);
  const [shops, setShops] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [userArea, setUserArea] = useState('');
  const router = useRouter();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const serviceRes = await getItems('services');
      const shopRes = await getItems('artisanshops?top=yes');
      setServices(serviceRes?.data?.data?.data || []);
      setShops(shopRes?.data?.data?.data || []);
      setLoading(false);
    } catch (e) {
      setError(e.message || 'Failed to load data');
    }
    setLoading(false);
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation(null);
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      let geo = await Location.reverseGeocodeAsync(location.coords);
      if (geo && geo[0]) {
        setUserArea(geo[0].city || geo[0].region || geo[0].country || '');
      }
      setUserLocation(location.coords);
    })();
  }, []);

  // Calculate distance between two coordinates
  function getDistance(lat1, lon1, lat2, lon2) {
    function toRad(Value) {
      return (Value * Math.PI) / 180;
    }
    const R = 6371; // km
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

  function formatDistance(distance) {
    if (distance === null || distance === undefined) return '';
    if (distance < 1) {
      return `${Math.round(distance * 1000)} m away`;
    }
    return `${distance.toFixed(1)} km away`;
  }

  const topShops = [...shops]
    .sort((a, b) => (b.ratingsAverage || 0) - (a.ratingsAverage || 0))
    .slice(0, 10);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData().then(() => setRefreshing(false));
  }, [loadData]);

  // Filter and sort services
  const filteredServices = services
    .filter(
      (s) =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.artisanShop &&
          s.artisanShop.name.toLowerCase().includes(search.toLowerCase()))
    )
    .map((s) => {
      let distance = null;
      if (
        userLocation &&
        s.artisanShop &&
        s.artisanShop.location &&
        s.artisanShop.location.coordinates
      ) {
        const [lng, lat] = s.artisanShop.location.coordinates;
        distance = getDistance(
          userLocation.latitude,
          userLocation.longitude,
          lat,
          lng
        );
      }
      return { ...s, distance };
    })
    .sort((a, b) => {
      if (a.distance === null) return 1;
      if (b.distance === null) return -1;
      return a.distance - b.distance;
    });

  // Skeleton loader
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
          <Text style={styles.heroSubtitle}>Find Services Near You</Text>{' '}
          <Text style={styles.heroSubtitle}>
            Call/Text us on +233593354286 if you want to list your services.
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
        <View style={styles.searchBarRow}>
          <MaterialIcons
            name="search"
            size={22}
            color={COLORS.gray}
            style={{ marginRight: 6 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search services..."
            placeholderTextColor="#888"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        {filteredServices.length === 0 ? (
          <ErrorView msg={'No services found.'} />
        ) : (
          <View>
            <View style={styles.topStoresSection}>
              <Text style={styles.sectionTitle}>Top Shops</Text>
              <FlatList
                data={topShops}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.storeCard}
                    onPress={() =>
                      router.push(`/services/shop-details/${item._id}`)
                    }
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
            <FlatList
              data={filteredServices}
              keyExtractor={(item) => item._id}
              renderItem={({ item: service }) => (
                <TouchableOpacity
                  style={styles.serviceCard}
                  onPress={() => {
                    router.push(`/services/service-details/${service._id}`);
                  }}
                >
                  <Image
                    source={
                      service?.images[0]
                        ? { uri: service.images[0] }
                        : require('../../../assets/logo.png')
                    }
                    style={styles.serviceImage}
                  />
                  <View style={styles.serviceDetails}>
                    <Text style={styles.serviceName}>{service.name}</Text>
                    <Text style={styles.shopAddress}>
                      {service.artisanShop?.address || 'No Address available'}
                    </Text>
                    <Text style={styles.serviceDescription}>
                      {service.summary || 'No Summary available'}
                    </Text>
                    <View style={styles.priceContainer}>
                      <Text style={styles.servicePrice}>
                        ₦{service.priceFinal?.toLocaleString()}
                      </Text>
                      {service.distance !== null && (
                        <Text style={styles.distance}>
                          {formatDistance(service.distance)}
                        </Text>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              numColumns={2}
              columnWrapperStyle={styles.row}
            />
          </View>
        )}
      </ScrollView>
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
  sectionTitle: {
    fontSize: SIZES.xLarge,
    fontFamily: FONT.bold,
    color: COLORS.primary,
    marginBottom: 8,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  // title: {
  //   fontSize: 28,
  //   fontWeight: 'bold',
  //   color: '#312651',
  //   marginBottom: 16,
  //   textAlign: 'center',
  // },
  // searchInput: {
  //   borderWidth: 1,
  //   borderColor: '#007bff',
  //   borderRadius: 8,
  //   padding: 12,
  //   backgroundColor: '#fff',
  //   marginBottom: 16,
  // },
  loader: {
    marginTop: 32,
  },
  noResults: {
    textAlign: 'center',
    color: '#666',
    marginTop: 32,
  },
  serviceCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  serviceImage: {
    width: '100%',
    height: 140,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    objectFit: 'cover',
  },
  serviceDetails: {
    padding: 16,
  },
  serviceName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#312651',
    marginBottom: 4,
  },
  shopAddress: {
    fontSize: 13,
    color: '#007bff',
    marginBottom: 8,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007bff',
  },
  distance: {
    fontSize: 15,
    color: '#888',
    marginLeft: 8,
  },
  detailsButton: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginLeft: 8,
    marginTop: 20,
  },
  detailsButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  row: {
    justifyContent: 'space-between',
  },
});
