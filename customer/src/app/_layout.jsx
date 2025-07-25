import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { CartProvider } from '../utils/CartContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';

SplashScreen.preventAutoHideAsync();

const RootLayout = () => {
  const [fontsLoaded, error] = useFonts({
    DMBold: require('../assets/fonts/DMSans-Bold.ttf'),
    DMMedium: require('../assets/fonts/DMSans-Medium.ttf'),
    DMRegular: require('../assets/fonts/DMSans-Regular.ttf'),
  });

  useEffect(() => {
    if (error) throw error;

    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, error]);

  if (!fontsLoaded) {
    return null;
  }

  if (!fontsLoaded && !error) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <CartProvider>
        <StatusBar backgroundColor="#4f8cff" style="auto" />

        <Stack>
          <Stack.Screen
            name="(tab)"
            options={{ headerShown: false, animation: 'fade_from_bottom' }}
          />
          <Stack.Screen
            name="(auth)"
            options={{ headerShown: false, animation: 'fade_from_bottom' }}
          />
          <Stack.Screen
            name="index"
            options={{ headerShown: false, animation: 'fade_from_bottom' }}
          />
        </Stack>
      </CartProvider>
    </SafeAreaProvider>
  );
};

export default RootLayout;
