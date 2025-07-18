import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getItemById } from '../utils/api';
import ErrorView from '../../components/ErrorView';
import { COLORS, SHADOWS } from '../../constants';

const { width } = Dimensions.get('window');

export default function ServiceDetailsScreen() {
  const { serviceId } = useLocalSearchParams();
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const router = useRouter();

  useEffect(() => {
    if (!serviceId) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getItemById('services', serviceId);
        setService(res?.data?.data?.data);
      } catch (err) {
        setError(err.message || 'Failed to load service details');
      }
      setLoading(false);
    })();
  }, [serviceId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <ErrorView msg={error} />
      </View>
    );
  }
  if (!service) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Service Details</Text>
      {/* Image Carousel */}
      {service.images && service.images.length > 0 && (
        <View style={styles.carouselContainer}>
          <FlatList
            data={service.images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(
                e.nativeEvent.contentOffset.x / (width * 0.8)
              );
              setImageIndex(idx);
            }}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item }}
                style={styles.serviceImage}
                resizeMode="cover"
              />
            )}
            keyExtractor={(_, idx) => idx.toString()}
            style={{ marginBottom: 8 }}
          />
          <View style={styles.imageIndicatorContainer}>
            {service.images.map((_, idx) => (
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
      )}
      <Text style={styles.label}>Name:</Text>
      <Text style={styles.value}>{service.name}</Text>
      <Text style={styles.label}>Price:</Text>
      <Text style={styles.value}>₦{service.priceFinal?.toLocaleString()}</Text>
      <Text style={styles.label}>Summary:</Text>
      <Text style={styles.value}>{service.summary}</Text>
      <Text style={styles.label}>Description:</Text>
      <Text style={styles.value}>{service.description}</Text>
      <Text style={styles.label}>Duration:</Text>
      <Text style={styles.value}>{service.duration} hours</Text>
      <Text style={styles.label}>Artisan Available:</Text>
      <Text
        style={[
          styles.value,
          {
            color: service.artisanShop?.available
              ? COLORS.greenish
              : COLORS.reddish,
            fontWeight: 'bold',
          },
        ]}
      >
        {service.artisanShop?.available ? 'Available' : 'Not Available'}
      </Text>
      {/* Artisan Card */}
      <Text style={styles.sectionTitle}>Artisan</Text>
      {service.artisan ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Name:</Text>
          <Text style={styles.cardValue}>{service.artisan.name}</Text>
          <Text style={styles.cardLabel}>Phone:</Text>
          <Text style={styles.cardValue}>+233{service.artisan.phone}</Text>
          <Text style={styles.cardLabel}>Email:</Text>
          <Text style={styles.cardValue}>{service.artisan.email}</Text>
        </View>
      ) : (
        <Text style={styles.value}>No artisan info</Text>
      )}
      {/* Shop Card */}
      <Text style={styles.sectionTitle}>Artisan Shop</Text>
      {service.artisanShop ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Name:</Text>
          <Text style={styles.cardValue}>{service.artisanShop.name}</Text>
          <Text style={styles.cardLabel}>Address:</Text>
          <Text style={styles.cardValue}>{service.artisanShop.address}</Text>
          <Text style={styles.cardLabel}>Phone:</Text>
          <Text style={styles.cardValue}>+233{service.artisanShop.phone}</Text>
          <Text style={styles.cardLabel}>Email:</Text>
          <Text style={styles.cardValue}>{service.artisanShop.email}</Text>
        </View>
      ) : (
        <Text style={styles.value}>No shop info</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    marginTop: 24,
    backgroundColor: COLORS.lightWhite,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightWhite,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 18,
    alignSelf: 'center',
  },
  label: {
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 12,
  },
  value: {
    color: COLORS.secondary,
    fontSize: 16,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 18,
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  cardLabel: {
    fontWeight: 'bold',
    color: COLORS.tertiary,
    marginTop: 4,
  },
  cardValue: {
    color: COLORS.secondary,
    fontSize: 15,
    marginBottom: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
  carouselContainer: {
    marginBottom: 12,
    alignItems: 'center',
  },
  serviceImage: {
    width: width * 0.8,
    height: 200,
    borderRadius: 16,
    marginRight: 10,
  },
  imageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 6,
  },
  imageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.gray2,
    marginHorizontal: 2,
  },
  imageIndicatorActive: {
    backgroundColor: COLORS.primary,
  },
});
