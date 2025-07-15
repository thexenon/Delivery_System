import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  Dimensions,
  TouchableOpacity,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { getItemById, submitPost } from '../../../../utils/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import LocationPickerModal from '../../../../components/LocationPickerModal';
import { COLORS, images, SHADOWS } from '../../../../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
const { width } = Dimensions.get('window');

const TABS = ['About', 'Shop', 'Comments'];

export default function ServiceDetailsScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { id } = useLocalSearchParams();
  const [service, setService] = useState(null);
  const [shop, setShop] = useState(null);
  const [owner, setOwner] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);

  // Add these states to your component
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingScheduleTime, setBookingScheduleTime] = useState('');
  const [bookingAddress, setBookingAddress] = useState('');
  const [bookingLocation, setBookingLocation] = useState(null);
  const [bookingPreference, setBookingPreference] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [bookingDate, setBookingDate] = useState(null);

  // Location picker handler
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);
  const handleBookingLocationSelect = (location) => {
    setBookingLocation(location);
    setBookingAddress(location.address || '');
    setLocationPickerVisible(false);
  };

  const handleDateChange = (event, selectedDate) => {
    setDatePickerVisible(false);
    if (selectedDate) {
      setBookingDate(selectedDate);
      // Format: YYYY-MM-DD HH:mm
      const formatted = `${selectedDate.getFullYear()}-${(
        selectedDate.getMonth() + 1
      )
        .toString()
        .padStart(2, '0')}-${selectedDate
        .getDate()
        .toString()
        .padStart(2, '0')} ${selectedDate
        .getHours()
        .toString()
        .padStart(2, '0')}:${selectedDate
        .getMinutes()
        .toString()
        .padStart(2, '0')}`;
      setBookingScheduleTime(formatted);
    }
  };
  const handleClearDate = () => {
    setBookingDate(null);
    setBookingScheduleTime('');
  };

  // Submit handler
  const handleBookingSubmit = async () => {
    setBookingSubmitting(true);
    setBookingError('');
    try {
      if (!bookingScheduleTime || !bookingAddress || !bookingLocation) {
        setBookingError('Please fill all required fields.');
        setBookingSubmitting(false);
        return;
      }
      const userUID = await AsyncStorage.getItem('userUID');
      const bookingData = {
        service: id,
        artisan: owner._id,
        artisanShop: shop._id,
        customer: userUID,
        scheduledTime: bookingScheduleTime,
        address: bookingAddress,
        location: {
          type: 'Point',
          coordinates: [bookingLocation.longitude, bookingLocation.latitude],
        },
        preference: bookingPreference,
        status: 'pending',
      };
      const res = await submitPost(bookingData, 'servicerequests');
      if (res.status === 201) {
        Alert.alert('Request submitted!');
        setBookingModalVisible(false);
        setBookingScheduleTime('');
        setBookingAddress('');
        setBookingLocation(null);
        setBookingPreference('');
      } else {
        setBookingError(res.message || 'Failed to submit request');
      }
    } catch (e) {
      setBookingError(e.message || 'Failed to submit request');
    }
    setBookingSubmitting(false);
  };

  async function loadDetails() {
    setLoading(true);
    const serviceRes = await getItemById('services', id);
    const serviceData = serviceRes?.data?.data?.data;
    setService(serviceData);
    setShop(serviceData.artisanShop);
    setOwner(serviceData.artisan);
    setReviews(serviceData.reviews || []);

    setLoading(false);
  }

  useEffect(() => {
    loadDetails();
  }, [id]);

  const handleTabPress = (idx) => setActiveTab(idx);

  const handleSwipe = (direction) => {
    if (!service?.images?.length) return;
    let newIndex = imageIndex + direction;
    if (newIndex < 0) newIndex = service.images.length - 1;
    if (newIndex >= service.images.length) newIndex = 0;
    setImageIndex(newIndex);
  };

  const handleSubmitReview = async () => {
    if (!reviewText.trim() || reviewRating < 1 || reviewRating > 5) return;
    const user = await AsyncStorage.getItem('userUID');
    setSubmitting(true);
    const reviewData = {
      service: id,
      review: reviewText,
      rating: reviewRating,
      user: user,
      artisanShop: service.artisanShop?._id,
    };
    await submitPost(reviewData, 'artisanreviews').then((res) => {
      if (res.status === 201) {
        setReviewText('');
        setReviewRating(0);
        setSubmitting(false);
        Alert.alert('Success', 'Review submitted successfully');
        loadDetails();
      } else {
        Alert.alert('Error', res.message || 'Failed to submit review');
        setSubmitting(false);
      }
    });
  };

  if (loading || !service) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <ScrollView style={styles.container}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => {
            if (navigation.canGoBack()) navigation.goBack();
            else router.back();
          }}
        >
          <MaterialIcons name="arrow-back" size={28} color={COLORS.primary} />
        </TouchableOpacity>
        {/* Swipeable Images */}
        <View style={styles.imageSwipeContainer}>
          <TouchableOpacity
            style={styles.swipeBtn}
            onPress={() => handleSwipe(-1)}
          >
            <MaterialIcons
              name="chevron-left"
              size={32}
              color={COLORS.primary}
            />
          </TouchableOpacity>
          <View style={styles.imageWrapper}>
            <Image
              source={{
                uri: service.images?.[imageIndex] || images.logo,
              }}
              style={styles.serviceImage}
            />
            <View style={styles.imageIndicatorContainer}>
              {service.images?.map((_, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.imageIndicator,
                    imageIndex === idx && styles.imageIndicatorActive,
                  ]}
                />
              ))}
            </View>
          </View>
          <TouchableOpacity
            style={styles.swipeBtn}
            onPress={() => handleSwipe(1)}
          >
            <MaterialIcons
              name="chevron-right"
              size={32}
              color={COLORS.primary}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.tabBar}>
          {TABS.map((tab, idx) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, activeTab === idx && styles.tabBtnActive]}
              onPress={() => handleTabPress(idx)}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === idx && styles.tabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={styles.tabContent}>
          {activeTab === 0 && (
            <ScrollView style={styles.aboutTab}>
              <View style={styles.detailCard}>
                <Text style={styles.serviceName}>{service.name}</Text>
                <Text style={styles.serviceDesc}>{service.summary}</Text>
                <View style={styles.priceRow}>
                  <Text style={styles.servicePrice}>
                    ₦{service.priceFinal?.toLocaleString()}
                  </Text>
                  <Text style={styles.statusBadge}>
                    {service.artisanShop.available
                      ? 'Available'
                      : 'Not Available'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="schedule"
                    size={18}
                    color={COLORS.primary}
                  />
                  <Text style={styles.serviceInfo}>
                    {' '}
                    Duration of Service: {service.duration} hours
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  {' '}
                  <Text style={styles.serviceDesc}>{service.description}</Text>
                </View>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: 10,
                    padding: 14,
                    alignItems: 'center',
                    margin: 16,
                  }}
                  onPress={() => setBookingModalVisible(true)}
                >
                  <Text
                    style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}
                  >
                    Book Service
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
          {activeTab === 1 && (
            <ScrollView style={styles.shopTab}>
              <Text style={styles.shopHeader}>Shop Details</Text>
              <View style={styles.detailCard}>
                {shop ? (
                  <>
                    <Text style={styles.shopName}>{shop.name}</Text>
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="location-on"
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.shopInfo}> {shop.address}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="phone"
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.shopInfo}> +233{shop.phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="email"
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.shopInfo}> {shop.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="verified-user"
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.shopInfo}>
                        {' '}
                        Verified: {shop.isVerified ? 'Yes' : 'No'}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="work"
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.shopInfo}>
                        {' '}
                        Experience: {shop.experienceYears || '-'} years
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.shopInfo}>No shop info available.</Text>
                )}
              </View>
              <Text style={styles.shopHeader}>Owner Details</Text>
              <View style={styles.detailCard}>
                {owner ? (
                  <>
                    <Text style={styles.shopName}>{owner.name}</Text>
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="location-on"
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.shopInfo}> {owner.address}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="phone"
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.shopInfo}> +233{owner.phone}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="email"
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.shopInfo}> {owner.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <MaterialIcons
                        name="verified-user"
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.shopInfo}>
                        {' '}
                        Verified: {owner.isVerified ? 'Yes' : 'No'}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text style={styles.shopInfo}>
                    No shop owner info available.
                  </Text>
                )}
              </View>
            </ScrollView>
          )}
          {activeTab === 2 && (
            <View style={styles.commentsTab}>
              <FlatList
                data={reviews}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => (
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <MaterialIcons
                        name="person"
                        size={18}
                        color={COLORS.primary}
                      />
                      <Text style={styles.reviewUser}>
                        {item.user?.name || 'Anonymous'}
                      </Text>
                      <View style={{ flexDirection: 'row', marginLeft: 8 }}>
                        {[...Array(5)].map((_, i) => (
                          <MaterialIcons
                            key={i}
                            name={
                              i < (item.rating || 0) ? 'star' : 'star-border'
                            }
                            size={16}
                            color={COLORS.primary}
                          />
                        ))}
                      </View>
                    </View>
                    <Text style={styles.reviewText}>{item.review}</Text>
                    <Text style={styles.reviewDate}>
                      {new Date(item.createdAt).toLocaleString()}
                    </Text>
                  </View>
                )}
                ListEmptyComponent={
                  <Text style={styles.noReviews}>No reviews yet.</Text>
                }
              />
              <View style={styles.reviewContainer}>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginVertical: 8,
                  }}
                >
                  {[...Array(5)].map((_, i) => (
                    <TouchableOpacity
                      key={i}
                      onPress={() => setReviewRating(i + 1)}
                      disabled={submitting}
                    >
                      <MaterialIcons
                        name={i < reviewRating ? 'star' : 'star-border'}
                        size={24}
                        color={COLORS.primary}
                        style={{ marginHorizontal: 2 }}
                      />
                    </TouchableOpacity>
                  ))}
                  <Text style={{ marginLeft: 8, color: '#888' }}>
                    {reviewRating ? `${reviewRating}/5` : 'Select rating'}
                  </Text>
                </View>
                <View style={styles.reviewInputContainer}>
                  <TextInput
                    style={styles.reviewInput}
                    placeholder="Write a review..."
                    placeholderTextColor={'#888'}
                    value={reviewText}
                    onChangeText={setReviewText}
                    multiline
                    numberOfLines={10}
                    editable={!submitting}
                  />
                  {submitting ? (
                    <ActivityIndicator size={'small'} color={'#fff'} />
                  ) : (
                    <TouchableOpacity
                      style={styles.submitReviewBtn}
                      onPress={handleSubmitReview}
                      disabled={submitting}
                    >
                      <MaterialIcons name="send" size={22} color="#fff" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            </View>
          )}
        </View>
        <Modal
          visible={bookingModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setBookingModalVisible(false)}
        >
          <KeyboardAvoidingView
            style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
          >
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                padding: 24,
                width: '90%',
              }}
            >
              <Text
                style={{
                  fontSize: 22,
                  fontWeight: 'bold',
                  color: COLORS.primary,
                  marginBottom: 12,
                  textAlign: 'center',
                }}
              >
                Book Service Request
              </Text>
              {bookingError ? (
                <Text style={{ color: COLORS.reddish, marginBottom: 8 }}>
                  {bookingError}
                </Text>
              ) : null}
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 12,
                }}
                onPress={() => setDatePickerVisible(true)}
              >
                <Text style={{ color: '#312651' }}>
                  {bookingScheduleTime
                    ? `Scheduled: ${bookingScheduleTime}`
                    : 'Select Schedule Time'}
                </Text>
              </TouchableOpacity>
              {datePickerVisible && (
                <DateTimePicker
                  value={bookingDate || new Date()}
                  mode="datetime"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.gray2,
                    borderRadius: 8,
                    padding: 8,
                    marginRight: 8,
                    flex: 1,
                  }}
                  onPress={handleClearDate}
                >
                  <Text
                    style={{ color: COLORS.secondary, textAlign: 'center' }}
                  >
                    Clear
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: 8,
                    padding: 8,
                    flex: 1,
                  }}
                  onPress={() => setDatePickerVisible(true)}
                >
                  <Text style={{ color: '#fff', textAlign: 'center' }}>
                    Set
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 12,
                }}
                placeholder="Address"
                value={bookingAddress}
                onChangeText={setBookingAddress}
                editable={false}
              />
              <TouchableOpacity
                style={{
                  backgroundColor: COLORS.primary,
                  borderRadius: 8,
                  padding: 12,
                  marginBottom: 12,
                  alignItems: 'center',
                }}
                onPress={() => setLocationPickerVisible(true)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold' }}>
                  Pick Location on Map
                </Text>
              </TouchableOpacity>
              <LocationPickerModal
                visible={locationPickerVisible}
                onClose={() => setLocationPickerVisible(false)}
                onSelect={handleBookingLocationSelect}
              />
              {bookingLocation && (
                <Text style={{ color: COLORS.primary, marginBottom: 8 }}>
                  Location: {bookingLocation.latitude?.toFixed(6)},{' '}
                  {bookingLocation.longitude?.toFixed(6)}
                </Text>
              )}
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: COLORS.primary,
                  borderRadius: 8,
                  padding: 10,
                  marginBottom: 12,
                }}
                placeholder="Preference (optional)"
                value={bookingPreference}
                onChangeText={setBookingPreference}
              />
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  marginTop: 12,
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.gray2,
                    borderRadius: 8,
                    padding: 12,
                    flex: 1,
                    marginRight: 8,
                  }}
                  onPress={() => setBookingModalVisible(false)}
                  disabled={bookingSubmitting}
                >
                  <Text
                    style={{
                      color: COLORS.secondary,
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: COLORS.primary,
                    borderRadius: 8,
                    padding: 12,
                    flex: 1,
                  }}
                  onPress={handleBookingSubmit}
                  disabled={bookingSubmitting}
                >
                  <Text
                    style={{
                      color: '#fff',
                      fontWeight: 'bold',
                      textAlign: 'center',
                    }}
                  >
                    {bookingSubmitting ? 'Submitting...' : 'Submit Request'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  imageSwipeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 8,
  },
  swipeBtn: {
    padding: 8,
    backgroundColor: '#eaeaea',
    borderRadius: 16,
    marginHorizontal: 4,
  },
  swipeText: {
    fontSize: 22,
    color: '#007bff',
    fontWeight: 'bold',
  },
  serviceImage: {
    width: width * 0.7,
    height: 200,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: '#007bff',
  },
  tabText: {
    fontSize: 16,
    color: '#312651',
    fontWeight: 'bold',
  },
  tabTextActive: {
    color: '#fff',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  aboutTab: {
    flex: 1,
  },
  serviceName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#312651',
    marginBottom: 8,
  },
  serviceDesc: {
    fontSize: 15,
    color: '#666',
    marginBottom: 8,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 8,
  },
  serviceInfo: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  shopTab: {
    flex: 1,
  },
  shopName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#312651',
    marginBottom: 8,
  },
  shopHeader: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    color: '#312651',
    marginBottom: 8,
  },
  shopInfo: {
    fontSize: 15,
    color: '#666',
    marginBottom: 6,
  },
  commentsTab: {
    flex: 1,
    marginBottom: 8,
  },
  reviewCard: {
    backgroundColor: '#f6f8fa',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  reviewUser: {
    fontWeight: 'bold',
    color: '#007bff',
    marginBottom: 2,
  },
  reviewText: {
    fontSize: 15,
    color: '#312651',
    marginBottom: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: '#888',
  },
  noReviews: {
    textAlign: 'center',
    color: '#888',
    marginVertical: 16,
  },
  reviewContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    elevation: 1,
  },
  reviewInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    fontSize: 25,
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
    elevation: 1,
  },
  reviewInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007bff',
    borderRadius: 8,
    padding: 10,
    backgroundColor: '#f6f8fa',
    marginRight: 8,
  },
  submitReviewBtn: {
    backgroundColor: '#007bff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  submitReviewText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  imageWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 2,
  },
  imageIndicatorActive: {
    backgroundColor: COLORS.primary,
  },
  detailCard: {
    backgroundColor: '#f6f8fa',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statusBadge: {
    backgroundColor: '#007bff',
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
});
