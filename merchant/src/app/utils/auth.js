import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const router = useRouter();

export const isUserLoggedIn = async () => {
  const token = await AsyncStorage.getItem('jwt');
  const role = await AsyncStorage.getItem('userRole');
  console.log('====================================');
  console.log(`Role: ${role} and Token: ${token}`);
  console.log('====================================');
  if (token) {
    console.log('====================================');
    console.log('Logged In');
    console.log('====================================');
    if (role === 'merchant') {
      console.log('====================================');
      console.log('Logged In as Merchant', role);
      console.log('====================================');
      router.replace('/merchant/home');
    } else if (role === 'artisan') {
      console.log('====================================');
      console.log('Logged In as Artisan', role);
      console.log('====================================');
      router.replace('/artisan/home');
    } else {
      console.log('====================================');
      console.log(`Logged In as Normal User or Rider: ${role}`);
      console.log('====================================');
      router.replace('/not-user');
    }
  } else {
    console.log('====================================');
    console.log('Not Logged In');
    console.log('====================================');
    router.replace('/signin');
  }
};

export const handleLogout = async () => {
  await AsyncStorage.clear().then(() => {
    router.replace('/signin');
  });
};
