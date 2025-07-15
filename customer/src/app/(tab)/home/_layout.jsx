import { Stack } from 'expo-router';

export default function HomeLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="products" options={{ headerShown: false }} />
      <Stack.Screen
        name="product-details/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
