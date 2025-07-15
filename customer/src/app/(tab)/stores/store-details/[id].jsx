import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
  Linking,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { getItemById } from '../../../../utils/api';
import { COLORS, FONT, SIZES, SHADOWS, images } from '../../../../constants';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import ErrorView from '../../../../components/ErrorView';
import { useNavigation } from '@react-navigation/native';

function StarRating({ rating, total }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    stars.push(
      <Text
        key={i}
        style={{
          color: i <= rating ? COLORS.tertiary : COLORS.gray,
          fontSize: 20,
        }}
      >
        ★
      </Text>
    );
  }
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 6,
      }}
    >
      {stars}
      <Text
        style={{
          color: COLORS.gray,
          marginLeft: 4,
          fontSize: SIZES.small,
        }}
      >
        ({total})
      </Text>
    </View>
  );
}

const TABS = ['About', 'Products', 'Reviews'];

export default function StoreDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('About');

  const fetchData = async () => {
    setLoading(true);
    const storeRes = await getItemById('stores', id);
    setStore(storeRes.data.data.data);
    setProducts(storeRes.data.data.data.products);
    setReviews(storeRes.data.data.data.reviews);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  if (!store) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Store not found</Text>
      </View>
    );
  }

  // Calculate average rating
  const avgRating =
    reviews.length > 0
      ? (
          reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
        ).toFixed(1)
      : 0;

  // Parse working days/hours (support array of objects)
  const workingHoursArr = Array.isArray(store.workingHours)
    ? store.workingHours
    : [];

  return (
    <View style={styles.container}>
      {/* Custom Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else router.back();
        }}
      >
        <MaterialIcons name="arrow-back" size={28} color={COLORS.primary} />
      </TouchableOpacity>
      {/* Hero/banner */}
      <View style={styles.heroBanner}>
        <Image
          source={{ uri: store.image || images.logo }}
          style={styles.heroImage}
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.heroTitle}>{store.name}</Text>
          {store.isVerified && (
            <MaterialIcons
              name="verified"
              size={24}
              color={COLORS.primary}
              style={{ marginLeft: 6 }}
            />
          )}
          <View
            style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}
          >
            <StarRating rating={Math.round(avgRating)} total={reviews.length} />
            <Text
              style={{
                color: COLORS.white,
                marginLeft: 8,
                fontSize: SIZES.medium,
              }}
            >
              {avgRating} avg
            </Text>
          </View>
        </View>
      </View>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Tab content */}
      <View style={styles.tabContent}>
        {activeTab === 'About' && (
          <ScrollView
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          >
            {/* Store info card: address, phone, email, map, working hours, socials, contact/directions */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <MaterialIcons
                  name="location-on"
                  size={22}
                  color={COLORS.primary}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>{store.address}</Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons
                  name="phone"
                  size={22}
                  color={COLORS.primary}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>
                  {`+233 (0) ${store.phone}` || 'N/A'}
                </Text>
              </View>
              <View style={styles.infoRow}>
                <MaterialIcons
                  name="email"
                  size={22}
                  color={COLORS.primary}
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText}>{store.email || 'N/A'}</Text>
              </View>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => Linking.openURL(`tel:+233${store.phone}`)}
                >
                  <MaterialIcons name="call" size={20} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>Call</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => Linking.openURL(`mailto:${store.email}`)}
                >
                  <MaterialIcons name="email" size={20} color={COLORS.white} />
                  <Text style={styles.actionBtnText}>Email</Text>
                </TouchableOpacity>
                {store.location?.coordinates && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() =>
                      Linking.openURL(
                        `https://www.google.com/maps/search/?api=1&query=${store.location.coordinates[1]},${store.location.coordinates[0]}`
                      )
                    }
                  >
                    <MaterialIcons name="map" size={20} color={COLORS.white} />
                    <Text style={styles.actionBtnText}>Directions</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
            {/* Store location map */}
            {store.location && store.location.coordinates && (
              <MapView
                style={styles.map}
                initialRegion={{
                  latitude: parseFloat(store.location.coordinates[1]),
                  longitude: parseFloat(store.location.coordinates[0]),
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
              >
                <Marker
                  coordinate={{
                    latitude: parseFloat(store.location.coordinates[1]),
                    longitude: parseFloat(store.location.coordinates[0]),
                  }}
                  title={store.name}
                  description={store.address}
                />
              </MapView>
            )}
            {/* Working days/hours */}
            <View style={styles.workingHoursBox}>
              <Text style={styles.sectionTitle}>Working Days & Hours</Text>
              {workingHoursArr.length === 0 && (
                <Text style={styles.infoText}>Not available</Text>
              )}
              {workingHoursArr.map((wh) => (
                <View key={wh._id || wh.id || wh.day} style={styles.workingRow}>
                  <Text style={styles.workingDay}>{wh.day}:</Text>
                  <Text style={styles.workingTime}>
                    {wh.open} - {wh.close}
                  </Text>
                </View>
              ))}
            </View>
            {/* Social links at the bottom */}
            {store.socials &&
              Array.isArray(store.socials) &&
              store.socials.length > 0 && (
                <View style={styles.socialLinksBox}>
                  <Text style={styles.sectionTitle}>Social Links</Text>
                  <View style={styles.socialLinksRow}>
                    {store.socials.map((link, idx) => {
                      let icon = 'web';
                      let color = '#555';
                      if (link.platform) {
                        if (link.platform.toLowerCase().includes('facebook')) {
                          icon = 'facebook';
                          color = '#1877f3';
                        } else if (
                          link.platform.toLowerCase().includes('twitter') ||
                          link.platform.toLowerCase().includes('x')
                        ) {
                          icon = 'twitter';
                          color = '#1da1f2';
                        } else if (
                          link.platform.toLowerCase().includes('instagram')
                        ) {
                          icon = 'instagram';
                          color = '#e1306c';
                        } else if (
                          link.platform.toLowerCase().includes('whatsapp')
                        ) {
                          icon = 'whatsapp';
                          color = '#25d366';
                        } else if (
                          link.platform.toLowerCase().includes('tiktok')
                        ) {
                          icon = 'tiktok';
                          color = '#000';
                        } else if (
                          link.platform.toLowerCase().includes('youtube')
                        ) {
                          icon = 'youtube';
                          color = '#ff0000';
                        } else if (
                          link.platform.toLowerCase().includes('linkedin')
                        ) {
                          icon = 'linkedin';
                          color = '#0077b5';
                        }
                      }
                      return (
                        <TouchableOpacity
                          key={idx}
                          style={styles.socialIconBtn}
                          onPress={() => Linking.openURL(link.link)}
                        >
                          <MaterialCommunityIcons
                            name={icon}
                            size={32}
                            color={color}
                          />
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
          </ScrollView>
        )}
        {activeTab === 'Products' && (
          <FlatList
            data={products}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => router.push(`/home/product-details/${item._id}`)}
                activeOpacity={0.85}
              >
                <Image
                  source={{ uri: item.images?.[0] || images.logo }}
                  style={styles.productImage}
                />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.productName}>{item.name}</Text>
                  <Text style={styles.productPrice}>
                    ₦
                    {item.priceFinal?.toLocaleString() ||
                      item.price?.toLocaleString()}
                  </Text>
                  <Text style={styles.productDesc} numberOfLines={2}>
                    {item.summary}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <ErrorView msg="No products found for this store." />
            }
            contentContainerStyle={{ paddingBottom: 40, paddingHorizontal: 8 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
        {activeTab === 'Reviews' && (
          <FlatList
            data={reviews}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialIcons
                    name="person"
                    size={22}
                    color={COLORS.primary}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={styles.reviewUser}>
                    {item.user?.name || 'Anonymous'}
                  </Text>
                  <StarRating rating={item.rating || 0} total={1} />
                </View>
                <Text style={styles.reviewText}>
                  {item.review || 'No review text.'}
                </Text>
                {item.createdAt && (
                  <Text style={styles.reviewDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}
            ListEmptyComponent={
              <ErrorView msg="No reviews yet for this store." />
            }
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </View>
      {/* Floating cart button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/cart')}>
        <MaterialIcons name="shopping-cart" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightWhite },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightWhite,
  },
  title: {
    fontSize: SIZES.xLarge,
    fontFamily: FONT.bold,
    color: COLORS.primary,
    marginBottom: 2,
    textAlign: 'center',
  },
  verifiedBadge: {
    color: COLORS.primary,
    fontSize: 22,
    marginLeft: 8,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: SIZES.large,
    fontFamily: FONT.bold,
    color: COLORS.secondary,
    marginBottom: 8,
    marginTop: 12,
  },
  infoText: {
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    marginBottom: 4,
    flexShrink: 1,
    flex: 1,
    flexWrap: 'wrap',
  },
  map: {
    width: '95%',
    height: 300,
    borderRadius: 12,
    alignSelf: 'center',
    marginVertical: 10,
  },
  workingHoursBox: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    margin: 12,
    ...SHADOWS.small,
  },
  workingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  workingDay: {
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    fontFamily: FONT.medium,
  },
  workingTime: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
    fontFamily: FONT.bold,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: COLORS.gray2,
  },
  productName: {
    fontSize: SIZES.medium,
    fontFamily: FONT.bold,
    color: COLORS.secondary,
  },
  productPrice: {
    fontSize: SIZES.small,
    color: COLORS.primary,
    fontFamily: FONT.bold,
  },
  productDesc: { fontSize: SIZES.small, color: COLORS.gray },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  reviewUser: {
    fontSize: SIZES.medium,
    fontFamily: FONT.bold,
    color: COLORS.secondary,
    marginRight: 8,
  },
  reviewText: { fontSize: SIZES.medium, color: COLORS.gray },
  reviewDate: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginTop: 4,
  },
  tabContent: {
    flex: 1,
    backgroundColor: COLORS.lightWhite,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    marginLeft: 2,
    flexWrap: 'wrap',
    flex: 1,
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  aboutCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    margin: 12,
    marginBottom: 0,
    ...SHADOWS.small,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    margin: 12,
    marginBottom: 0,
    ...SHADOWS.small,
  },
  socialLinksBox: {
    marginTop: 18,
    marginBottom: 8,
    alignItems: 'center',
  },
  socialLinksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 12,
  },
  socialIconBtn: {
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    padding: 6,
    ...SHADOWS.small,
  },
  heroBanner: {
    width: '100%',
    height: 220,
    position: 'relative',
    marginBottom: 0,
    backgroundColor: COLORS.gray2,
    justifyContent: 'flex-end',
  },
  heroImage: {
    width: '100%',
    height: 220,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 1,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 220,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    zIndex: 2,
  },
  heroContent: {
    position: 'absolute',
    bottom: 18,
    left: 18,
    zIndex: 3,
  },
  heroTitle: {
    fontSize: SIZES.xxLarge,
    fontFamily: FONT.bold,
    color: COLORS.white,
    marginBottom: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray2,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabBtnActive: {
    borderBottomWidth: 3,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
    fontFamily: FONT.medium,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontFamily: FONT.bold,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 10,
    marginTop: 4,
  },
  actionBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    marginLeft: 4,
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
  backBtn: {
    position: 'absolute',
    top: 36,
    left: 16,
    zIndex: 20,
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 4,
    ...SHADOWS.small,
  },
});
