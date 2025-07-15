import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="reviews"
        options={{
          title: 'Your Reviews',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#f6f8fa' },
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="favorites"
        options={{
          title: 'Your Favorites',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#f6f8fa' },
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="orders"
        options={{
          title: 'Your Orders',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#f6f8fa' },
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          title: 'Account Settings',
          headerTitleAlign: 'center',
          headerStyle: { backgroundColor: '#f6f8fa' },
          headerBackButtonDisplayMode: 'minimal',
        }}
      />
    </Stack>
  );
}
