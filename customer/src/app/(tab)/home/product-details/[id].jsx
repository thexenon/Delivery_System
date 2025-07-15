import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  Image,
  Linking,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getItemById, getItems } from '../../../../utils/api';
import { COLORS, FONT, SIZES, SHADOWS, images } from '../../../../constants';
import { useCart } from '../../../../utils/CartContext';
import ErrorView from '../../../../components/ErrorView';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

export default function ProductDetails() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedVariety, setSelectedVariety] = useState(null);
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [adding, setAdding] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [showDescription, setShowDescription] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { addToCart, addOrUpdateCartItem, cart } = useCart();

  if (!id) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  } else {
    useEffect(() => {
      const loadProd = async () => {
        setLoading(true);
        const res = await getItemById('products', id);
        if (res.status !== 200) {
          setError(res.message || 'Failed to fetch product');
          setLoading(false);
          return;
        }
        // Get all product details from backend
        setDetails(res.data.data.data);
        setReviews(res.data.data.data.reviews || []);
        setSelectedVariety(res.data.data.data.varieties?.[0]?._id || null);
        setSelectedOptions([]);
        setLoading(false);
      };
      loadProd();
    }, [id]);
  }

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProd();
    setRefreshing(false);
  };

  // Check if all required options are selected
  const requiredOptions = details?.options?.filter((opt) => opt.required) || [];
  const allRequiredSelected = requiredOptions.every((opt) =>
    selectedOptions.includes(opt._id)
  );

  // Check if this product/variety/options is already in cart
  const isInCart = cart.some(
    (item) =>
      item.product === id &&
      item.variety === selectedVariety &&
      JSON.stringify(item.options) === JSON.stringify(selectedOptions)
  );

  const handleAddToCart = async () => {
    if (!selectedVariety) {
      Alert.alert('Select a variety');
      return;
    }
    if (!allRequiredSelected) {
      Alert.alert('Please select all required options');
      return;
    }
    setAdding(true);
    addOrUpdateCartItem({
      product: id,
      variety: selectedVariety,
      options: selectedOptions,
    });
    setAdding(false);
    Alert.alert('Added to cart!');
    router.navigate('/cart');
  };

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
        <ErrorView msg={error} />
      </View>
    );
  }
  if (!details) return null;

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.lightWhite }}>
      {/* Floating Back Button */}
      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => {
          if (navigation.canGoBack()) navigation.goBack();
          else router.back();
        }}
      >
        <MaterialIcons name="arrow-back" size={28} color={COLORS.primary} />
      </TouchableOpacity>
      {/* Floating Cart Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.navigate('/cart')}
      >
        <MaterialIcons name="shopping-cart" size={28} color={COLORS.white} />
      </TouchableOpacity>
      <ScrollView
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Image swiper */}
        <View style={styles.swiperContainer}>
          <FlatList
            data={details.images || [images.logo]}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setImageIndex(idx);
            }}
            renderItem={({ item }) => (
              <Image source={{ uri: item }} style={styles.image} />
            )}
            keyExtractor={(_, idx) => idx.toString()}
          />
          <View style={styles.dotsRow}>
            {(details.images || [images.logo]).map((_, idx) => (
              <View
                key={idx}
                style={[styles.dot, imageIndex === idx && styles.activeDot]}
              />
            ))}
          </View>
        </View>
        {/* Modern product card */}
        <View style={styles.cardModern}>
          <Text style={styles.name}>{details.name}</Text>
          <TouchableOpacity
            onPress={() =>
              router.push(`/stores/store-details/${details.store?._id}`)
            }
          >
            <Text style={styles.storeLink}>{details.store?.name}</Text>
          </TouchableOpacity>
          <View style={styles.priceRow}>
            <Text style={styles.priceFinal}>${details.priceFinal}</Text>
            <Text style={styles.priceDiscount}>${details.price}</Text>
            <Text style={styles.priceDP}>
              {details.priceDiscountPercent}% Off
            </Text>
          </View>
          <Text style={styles.detailLabel}>Summary</Text>
          <Text style={styles.detailValue}>{details.summary}</Text>
          {details.description && !showDescription && (
            <TouchableOpacity onPress={() => setShowDescription(true)}>
              <Text style={styles.viewMore}>View more</Text>
            </TouchableOpacity>
          )}
          {showDescription && (
            <View>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{details.description}</Text>
              <TouchableOpacity onPress={() => setShowDescription(false)}>
                <Text style={styles.viewMore}>View less</Text>
              </TouchableOpacity>
            </View>
          )}
          {/* Quick actions */}
          <View style={{ flexDirection: 'row', marginTop: 8 }}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                router.push(`/stores/store-details/${details.store?._id}`)
              }
            >
              <MaterialIcons name="store" size={20} color={COLORS.white} />
              <Text style={styles.actionBtnText}>View Store</Text>
            </TouchableOpacity>
            {details.store?.phone && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(`tel:${details.store.phone}`)}
              >
                <MaterialIcons name="call" size={20} color={COLORS.white} />
                <Text style={styles.actionBtnText}>Call Store</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {/* Varieties */}
        <Text style={styles.sectionTitle}>Varieties</Text>
        <View style={styles.varietiesRow}>
          {details.varieties?.map((v) => (
            <TouchableOpacity
              key={v._id}
              style={[
                styles.varietyBtn,
                selectedVariety === v._id && styles.varietyBtnActive,
              ]}
              onPress={() => setSelectedVariety(v._id)}
            >
              <Text style={styles.varietyText}>{v.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {/* Options */}
        {details.options?.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Options</Text>
            <View style={styles.optionsRow}>
              {details.options.map((opt) => (
                <TouchableOpacity
                  key={opt._id}
                  style={[
                    styles.optionBtn,
                    selectedOptions.includes(opt._id) && styles.optionBtnActive,
                    opt.required &&
                      !selectedOptions.includes(opt._id) &&
                      styles.requiredOption,
                  ]}
                  onPress={() =>
                    setSelectedOptions(
                      selectedOptions.includes(opt._id)
                        ? selectedOptions.filter((id) => id !== opt._id)
                        : [...selectedOptions, opt._id]
                    )
                  }
                >
                  <Text style={styles.optionText}>
                    {opt.name}
                    {opt.required ? ' *' : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
        {/* Add to cart */}
        <TouchableOpacity
          style={[
            styles.addBtn,
            (!allRequiredSelected || adding || isInCart) && { opacity: 0.5 },
          ]}
          onPress={handleAddToCart}
          disabled={adding || !allRequiredSelected || isInCart}
        >
          <Text style={styles.addBtnText}>
            {isInCart ? 'Already in cart' : adding ? 'Adding...' : 'Add to Cart'}
          </Text>
        </TouchableOpacity>
        {/* Reviews */}
        <Text style={styles.sectionTitle}>Reviews</Text>
        {reviews.length === 0 ? (
          <Text style={styles.noReviews}>No reviews yet.</Text>
        ) : (
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
                    {item.user?.name || 'User'}
                  </Text>
                  <Text style={styles.reviewRating}>
                    {'★'.repeat(item.rating)}
                    {'☆'.repeat(5 - item.rating)}
                  </Text>
                </View>
                <Text style={styles.reviewText}>{item.review}</Text>
                {item.createdAt && (
                  <Text style={styles.reviewDate}>
                    {new Date(item.createdAt).toLocaleDateString()}
                  </Text>
                )}
              </View>
            )}
            scrollEnabled={false}
            contentContainerStyle={{ paddingBottom: 40 }}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.lightWhite, padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  swiperContainer: { width: '100%', height: 240, marginBottom: 8 },
  image: {
    width: width,
    height: 220,
    borderRadius: 12,
    backgroundColor: COLORS.gray2,
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray2,
    margin: 2,
  },
  activeDot: { backgroundColor: COLORS.primary },
  name: {
    fontSize: SIZES.xLarge,
    fontFamily: FONT.bold,
    color: COLORS.primary,
    marginBottom: 4,
  },
  store: { fontSize: SIZES.medium, color: COLORS.gray, marginBottom: 8 },
  sectionTitle: {
    fontSize: SIZES.large,
    fontFamily: FONT.bold,
    color: COLORS.secondary,
    marginTop: 18,
    marginBottom: 8,
  },
  detailText: {
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 10,
  },
  priceFinal: {
    fontSize: SIZES.xLarge,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginRight: 8,
  },
  priceDiscount: {
    fontSize: SIZES.medium,
    color: COLORS.tertiary,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  priceDP: { fontSize: SIZES.medium, color: COLORS.secondary },
  varietiesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  varietyBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray2,
    marginRight: 8,
    marginBottom: 8,
  },
  varietyBtnActive: { backgroundColor: COLORS.primary },
  varietyText: { color: COLORS.secondary, fontFamily: FONT.medium },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  optionBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: COLORS.gray2,
    marginRight: 8,
    marginBottom: 8,
  },
  optionBtnActive: { backgroundColor: COLORS.tertiary },
  requiredOption: { borderWidth: 1, borderColor: COLORS.reddish },
  optionText: { color: COLORS.secondary, fontFamily: FONT.medium },
  addBtn: {
    backgroundColor: COLORS.primary,
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 18,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: SIZES.large,
    fontFamily: FONT.bold,
  },
  noReviews: { color: COLORS.gray, fontStyle: 'italic', marginBottom: 16 },
  reviewCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  reviewUser: { fontWeight: 'bold', color: COLORS.primary },
  reviewRating: { color: COLORS.tertiary, marginBottom: 4 },
  reviewText: { color: COLORS.secondary },
  reviewDate: {
    color: COLORS.gray,
    fontSize: SIZES.small,
    marginTop: 2,
    fontStyle: 'italic',
  },
  cardModern: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    ...SHADOWS.small,
    shadowColor: COLORS.gray2,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  detailGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 12,
  },
  detailCol: {
    flex: 1,
  },
  detailLabel: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    fontFamily: FONT.medium,
    marginTop: 4,
  },
  detailValue: {
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    fontFamily: FONT.bold,
    marginBottom: 2,
  },
  viewMore: {
    color: COLORS.primary,
    fontSize: SIZES.medium,
    fontFamily: FONT.medium,
    marginTop: 4,
    marginBottom: 8,
    textDecorationLine: 'underline',
    alignSelf: 'flex-start',
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
  storeLink: {
    color: COLORS.primary,
    fontSize: SIZES.medium,
    fontFamily: FONT.bold,
    marginBottom: 8,
    textDecorationLine: 'underline',
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
});
