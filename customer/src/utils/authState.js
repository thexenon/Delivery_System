import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

const router = useRouter();

export const isUserLoggedIn = async () => {
  const token = await AsyncStorage.getItem('jwt');
  if (!token) {
    router.replace('/signin');
  } else {
    router.replace('/home');
  }
};

export const handleLogout = async () => {
  // await AsyncStorage.removeItem('jwt');
  // await AsyncStorage.removeItem('userRole');
  // await AsyncStorage.removeItem('userUID');
  // await AsyncStorage.removeItem('userAge');
  // await AsyncStorage.removeItem('userBirthday')
  await AsyncStorage.clear().then(() => {
    router.replace('/signin');
  });
};
