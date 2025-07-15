import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { COLORS } from '../../constants/theme';
import { isUserLoggedIn } from '../../utils/authState';
import { useCart } from '../../utils/CartContext';
import { View, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function TabLayout() {
  useEffect(() => {
    isUserLoggedIn();
  });

  const { cart } = useCart();

  return (
    <SafeAreaProvider>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: COLORS.primary,
          tabBarInactiveTintColor: COLORS.secondary,
          tabBarStyle: {
            backgroundColor: COLORS.white,
            borderTopLeftRadius: 18,
            borderTopRightRadius: 18,
            height: 70,
            paddingBottom: 10,
            paddingTop: 8,
            shadowColor: COLORS.gray2,
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: -2 },
            shadowRadius: 8,
          },
          headerShown: false,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '600',
            marginBottom: 4,
          },
        }}
        backBehavior="order"
      >
        <Tabs.Screen
          name="home"
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" size={size + 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="stores"
          options={{
            tabBarLabel: 'Stores',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="store" size={size + 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="categories"
          options={{
            tabBarLabel: 'Category',
            tabBarIcon: ({ color, size }) => (
              <FontAwesome5 name="boxes" size={size + 2} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="services"
          options={{
            tabBarLabel: 'Services',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons
                name="miscellaneous-services"
                size={size + 2}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="cart"
          options={{
            tabBarLabel: 'Cart',
            tabBarIcon: ({ color, size }) => (
              <View>
                <MaterialIcons
                  name="shopping-cart"
                  size={size + 2}
                  color={color}
                />
                {cart.length > 0 && (
                  <View
                    style={{
                      position: 'absolute',
                      right: -6,
                      top: -4,
                      backgroundColor: 'red',
                      borderRadius: 8,
                      minWidth: 16,
                      height: 16,
                      justifyContent: 'center',
                      alignItems: 'center',
                      paddingHorizontal: 3,
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontSize: 10,
                        fontWeight: 'bold',
                      }}
                    >
                      {cart.length}
                    </Text>
                  </View>
                )}
              </View>
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-circle" size={size + 2} color={color} />
            ),
          }}
        />
      </Tabs>
    </SafeAreaProvider>
  );
}
