import React, { useEffect, useState } from 'react';
import {
  View,
  ActivityIndicator,
  StyleSheet,
  Alert,
  Image,
  Text,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { isUserLoggedIn } from '../utils/authState';

const APP_LOGO = require('../assets/logo.png');

const onboardingData = [
  {
    title: 'Welcome to Delivery System',
    description:
      'Easily order and manage your products, and orders from one place.',
    image: require('../assets/onboarding1.png'),
  },
  {
    title: 'Fast Order Processing',
    description: 'Get notified instantly and process orders with just a tap.',
    image: require('../assets/onboarding2.png'),
  },
  {
    title: 'Service Tracking',
    description: 'Get a skilled professional to assist you with any problem.',
    image: require('../assets/onboarding3.png'),
  },
  {
    title: 'Track & Deliver',
    description: 'Track order status and delivery in real-time.',
    image: require('../assets/onboarding3.png'),
  },
];

export default function Index() {
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showOnboarding, setShowOnboarding] = useState(true);

  useEffect(() => {
    (async () => {
      // Camera permission
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync();
      // Media library permission
      const { status: mediaStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      // Location permission
      const { status: locationStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (
        cameraStatus !== 'granted' ||
        mediaStatus !== 'granted' ||
        locationStatus !== 'granted'
      ) {
        Alert.alert(
          'Permissions Required',
          'Camera, storage, and location permissions are required for full functionality.'
        );
      }

      const seen = await AsyncStorage.getItem('onboarding_seen').then(
        (value) => {
          return Boolean(value);
        }
      );
      // Check if onboarding has been seen
      setShowOnboarding(!seen);
    })();

    // return () => isUserLoggedIn(); // Check if user is logged in after splash
    isUserLoggedIn(); // Check if user is logged in after splash
  }, []);

  // Check internet connectivity and alert if offline
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (!state.isConnected) {
        Alert.alert(
          'No Internet Connection',
          'Please check your internet connection to use the app.'
        );
      }
    });
    return () => unsubscribe();
  }, []);

  if (showOnboarding) {
    const { width } = Dimensions.get('window');
    const onboarding = onboardingData[onboardingStep];

    return (
      <View style={styles.onboardingContainer}>
        <Image
          source={onboarding.image}
          style={[
            styles.onboardingImage,
            { width: width * 0.7, height: width * 0.7 },
          ]}
          resizeMode="contain"
        />
        <Text style={styles.onboardingTitle}>{onboarding.title}</Text>
        <Text style={styles.onboardingDesc}>{onboarding.description}</Text>
        <View style={styles.dotsContainer}>
          {onboardingData.map((_, idx) => (
            <View
              key={idx}
              style={[styles.dot, onboardingStep === idx && styles.activeDot]}
            />
          ))}
        </View>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              { backgroundColor: '#aaa', marginRight: 12 },
            ]}
            onPress={async () => {
              setShowOnboarding(false);
              await AsyncStorage.setItem('onboarding_seen', 'true');
              isUserLoggedIn();
            }}
          >
            <Text style={styles.nextButtonText}>Skip</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={async () => {
              if (onboardingStep < onboardingData.length - 1) {
                setOnboardingStep(onboardingStep + 1);
              } else {
                setShowOnboarding(false);
                await AsyncStorage.setItem('onboarding_seen', 'true');
                isUserLoggedIn();
              }
            }}
          >
            <Text style={styles.nextButtonText}>
              {onboardingStep < onboardingData.length - 1
                ? 'Next'
                : 'Get Started'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.splashContainer}>
      <Image source={APP_LOGO} style={styles.logo} />
      <Text style={styles.splashText}>Elroy Delivery</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#4f8cff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: '#fff',
  },
  splashText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  onboardingContainer: {
    flex: 1,
    backgroundColor: '#f6f8fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  onboardingImage: {
    marginBottom: 32,
  },
  onboardingTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
    textAlign: 'center',
  },
  onboardingDesc: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ccc',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#4f8cff',
  },
  nextButton: {
    backgroundColor: '#4f8cff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
