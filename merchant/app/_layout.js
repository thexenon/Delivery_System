import { Stack, Tabs, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const router = useRouter();

  const isUserLoggedIn = async () => {
    const token = await AsyncStorage.getItem('jwt');
    if (!token) {
      router.replace('/(auth)/signin');
    } else {
      router.replace('(tabs)/home');
    }
  };

  useEffect(() => {
    isUserLoggedIn();
  }, []);

  return (
    <Stack>
      <Stack.Screen name="(auth)/signin" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}
