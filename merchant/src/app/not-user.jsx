import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, Text, TouchableOpacity } from 'react-native';
import { Link } from 'expo-router';
import { handleLogout } from './utils/auth';
import { COLORS } from '../constants';

const APP_LOGO = require('../assets/logo.png');

export default function NotUser() {
  return (
    <View style={styles.splashContainer}>
      <View style={styles.onboardingContainer}>
        <View style={styles.onboardingImage}>
          <Image style={styles.logo} source={APP_LOGO} />
        </View>
        <Text style={styles.onboardingTitle}>
          You are not a merchant or Artisan. Kindly download the Customer App
          using the button below.
        </Text>
        <Link asChild href={''}>
          <TouchableOpacity style={styles.nextButton}>
            <Text style={styles.nextButtonText}>Download Customer</Text>
          </TouchableOpacity>
        </Link>
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => await handleLogout()}
        >
          <Text style={styles.nextButtonText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#4f8cff',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    alignSelf: 'center',
  },
  logo: {
    width: 160,
    height: 160,
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: '#fff',
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
  nextButton: {
    backgroundColor: '#4f8cff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 15,
  },
  logoutButton: {
    backgroundColor: COLORS.reddish,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    marginVertical: 15,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
});
