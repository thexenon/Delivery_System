import { Stack } from 'expo-router';

export default function StoreLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="store-details/[id]"
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
