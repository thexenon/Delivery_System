import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { getItemById } from '../utils/api';
import ErrorView from '../../components/ErrorView';
import { COLORS, SHADOWS } from '../../constants';

export default function RequestDetailsScreen() {
  const { requestId } = useLocalSearchParams();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    if (!requestId) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getItemById('servicerequests', requestId);
        setRequest(res?.data?.data?.data);
      } catch (err) {
        setError(err.message || 'Failed to load request details');
      }
      setLoading(false);
    })();
  }, [requestId]);

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
  if (!request) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Service Request Details</Text>
      <Text style={styles.label}>Request ID:</Text>
      <Text style={styles.value}>{request._id}</Text>
      <Text style={styles.label}>Status:</Text>
      <Text
        style={[
          styles.value,
          { color: getStatusColor(request.status), fontWeight: 'bold' },
        ]}
      >
        {request.status}
      </Text>
      <Text style={styles.label}>Created At:</Text>
      <Text style={styles.value}>
        {new Date(request.createdAt).toLocaleString()}
      </Text>
      {request.scheduledTime && (
        <>
          <Text style={styles.label}>Scheduled Time:</Text>
          <Text style={styles.value}>
            {new Date(request.scheduledTime).toLocaleString()}
          </Text>
        </>
      )}
      {request.preference && (
        <>
          <Text style={styles.label}>Preference:</Text>
          <Text style={styles.value}>{request.preference}</Text>
        </>
      )}
      <Text style={styles.sectionTitle}>Customer</Text>
      {request.customer ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Name:</Text>
          <Text style={styles.cardValue}>{request.customer.name}</Text>
          <Text style={styles.cardLabel}>Phone:</Text>
          <Text style={styles.cardValue}>+233{request.customer.phone}</Text>
          <Text style={styles.cardLabel}>Address:</Text>
          <Text style={styles.cardValue}>{request.customer.address}</Text>
        </View>
      ) : (
        <Text style={styles.value}>No customer info</Text>
      )}
      <Text style={styles.sectionTitle}>Service</Text>
      {request.service ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Name:</Text>
          <Text style={styles.cardValue}>{request.service.name}</Text>
          <Text style={styles.cardLabel}>Price:</Text>
          <Text style={styles.cardValue}>
            ₦{request.service.priceFinal?.toLocaleString()}
          </Text>
          <Text style={styles.cardLabel}>Summary:</Text>
          <Text style={styles.cardValue}>{request.service.summary}</Text>
        </View>
      ) : (
        <Text style={styles.value}>No service info</Text>
      )}
      <Text style={styles.sectionTitle}>Artisan</Text>
      {request?.artisan ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Name:</Text>
          <Text style={styles.cardValue}>{request.artisan.name}</Text>
          <Text style={styles.cardLabel}>Phone:</Text>
          <Text style={styles.cardValue}>+233{request.artisan.phone}</Text>
          <Text style={styles.cardLabel}>Address:</Text>
          <Text style={styles.cardValue}>{request.artisan.address}</Text>
        </View>
      ) : (
        <Text style={styles.value}>No artisan info</Text>
      )}
      <Text style={styles.sectionTitle}>Artisan Shop</Text>
      {request?.artisanShop ? (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Name:</Text>
          <Text style={styles.cardValue}>{request.artisanShop.name}</Text>
          <Text style={styles.cardLabel}>Address:</Text>
          <Text style={styles.cardValue}>{request.artisanShop.address}</Text>
          <Text style={styles.cardLabel}>Phone:</Text>
          <Text style={styles.cardValue}>{request.artisanShop.phone}</Text>
        </View>
      ) : (
        <Text style={styles.value}>No shop info</Text>
      )}
      <Text style={styles.sectionTitle}>Location</Text>
      <Text style={styles.value}>{request.address || 'No address'}</Text>
      {request.location && (
        <>
          <Text style={styles.value}>
            {`Lat: ${request.location.coordinates[1]}, Lng: ${request.location.coordinates[0]}`}
          </Text>
          <View
            style={{
              height: 220,
              borderRadius: 14,
              overflow: 'hidden',
              marginVertical: 10,
            }}
          >
            <MapView
              style={{ flex: 1 }}
              initialRegion={{
                latitude: request.location.coordinates[1],
                longitude: request.location.coordinates[0],
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
            >
              <Marker
                coordinate={{
                  latitude: request.location.coordinates[1],
                  longitude: request.location.coordinates[0],
                }}
                title={request.address || 'Request Location'}
              />
            </MapView>
          </View>
          <TouchableOpacity
            style={styles.directionsBtn}
            onPress={() => {
              const lat = request.location.coordinates[1];
              const lng = request.location.coordinates[0];
              const url = Platform.select({
                ios: `maps://app?daddr=${lat},${lng}`,
                android: `geo:0,0?q=${lat},${lng}`,
                default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`,
              });
              Linking.openURL(url);
            }}
          >
            <MaterialIcons name="directions" size={22} color="#fff" />
            <Text style={styles.directionsBtnText}>Get Directions</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

function getStatusColor(status) {
  switch ((status || '').toLowerCase()) {
    case 'pending':
      return COLORS.primary;
    case 'completed':
      return COLORS.greenish;
    case 'cancelled':
      return COLORS.reddish;
    case 'in progress':
      return COLORS.tertiary;
    default:
      return COLORS.primary;
  }
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: COLORS.lightWhite,
    flexGrow: 1,
    marginTop: 24,
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
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  directionsBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 16,
  },
});
