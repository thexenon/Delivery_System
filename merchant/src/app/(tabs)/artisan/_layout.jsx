import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'home') iconName = 'home-outline';
          else if (route.name === 'requests') iconName = 'hammer-outline';
          else if (route.name === 'services') iconName = 'settings-outline';
          else if (route.name === 'shops') iconName = 'construct-outline';
          else if (route.name === 'profile') iconName = 'person-outline';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4f8cff',
        tabBarInactiveTintColor: '#888',
        headerShown: false,
      })}
      backBehavior="order"
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="requests" options={{ title: 'Requests' }} />
      <Tabs.Screen name="services" options={{ title: 'Services' }} />
      <Tabs.Screen name="shops" options={{ title: 'Shops' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
