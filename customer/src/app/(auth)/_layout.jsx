import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const AuthLayout = () => {
  return (
    <>
      <Stack>
        <Stack.Screen
          name="signin"
          options={{
            headerShown: false,
            animation: 'fade_from_bottom',
          }}
        />
        <Stack.Screen
          name="signup"
          options={{
            headerShown: false,
            animation: 'fade_from_bottom',
          }}
        />
        <Stack.Screen
          name="forgot-password"
          options={{
            headerShown: false,
            animation: 'fade_from_bottom',
          }}
        />
      </Stack>

      <StatusBar backgroundColor="#161622" style="auto" />
    </>
  );
};

export default AuthLayout;
