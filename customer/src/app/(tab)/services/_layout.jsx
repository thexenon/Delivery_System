import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Drawer } from 'expo-router/drawer';
import {
  Ionicons,
  MaterialIcons,
  FontAwesome,
  AntDesign,
} from '@expo/vector-icons';
import { COLORS } from '../../../constants/theme';

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer
        backBehavior="order"
        initialRouteName="index"
        screenOptions={{
          // headerShown: false,
          drawerActiveTintColor: COLORS.primary,
          drawerInactiveTintColor: '#666',
          drawerStyle: {
            backgroundColor: '#f6f8fa',
            width: 240,
            marginTop: 30,
            paddingVertical: 20,
            borderTopLeftRadius: 18,
            shadowColor: COLORS.gray2,
            shadowOpacity: 0.1,
            shadowOffset: { width: 0, height: -2 },
            shadowRadius: 8,
          },
          drawerLabelStyle: {
            fontSize: 16,
            fontWeight: 'bold',
            marginBottom: 8,
            alignContent: 'center',
            alignItems: 'center',
            alignSelf: 'center',
          },
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'All Services',
            title: 'All Services',
            drawerIcon: ({ color, size }) => (
              <Ionicons name="hammer-outline" size={size + 2} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="service-details/[id]"
          options={{
            drawerLabel: 'Service Details',
            headerShown: false,
            drawerItemStyle: { display: 'none' },
            title: 'Service Details',
          }}
        />
        <Drawer.Screen
          name="shops"
          options={{
            drawerLabel: 'Artisan Shops',
            title: 'Artisan Shops',
            drawerIcon: ({ color, size }) => (
              <Ionicons
                name="construct-outline"
                size={size + 2}
                color={color}
              />
            ),
          }}
        />
        <Drawer.Screen
          name="shop-details/[id]"
          options={{
            drawerLabel: 'Shop Details',
            headerShown: false,
            drawerItemStyle: { display: 'none' },
            title: 'Shop Details',
          }}
        />
        <Drawer.Screen
          name="artisan"
          options={{
            drawerLabel: 'Service Reviews',
            title: 'My Service Reviews',
            drawerIcon: ({ color, size }) => (
              <FontAwesome name="commenting-o" size={size + 2} color={color} />
            ),
          }}
        />
        <Drawer.Screen
          name="request"
          options={{
            drawerLabel: 'My Requests',
            title: 'My Service Requests',
            drawerIcon: ({ color, size }) => (
              <Ionicons
                name="calendar-number-outline"
                size={size + 2}
                color={color}
              />
            ),
          }}
        />
      </Drawer>
    </GestureHandlerRootView>
  );
}
