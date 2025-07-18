import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signIn } from '../utils/api';
import { isUserLoggedIn } from '../utils/auth';
import { useRouter } from 'expo-router';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }
    setLoading(true);
    try {
      const userData = { email, password };
      signIn(userData)
        .then(async (result) => {
          if (result.status == 200 || result.status == 201) {
            console.log('====================================');
            console.log(result.status);
            console.log(result.data.data.user);
            console.log('====================================');
            await AsyncStorage.setItem('jwt', result?.data.token);
            await AsyncStorage.setItem('userUID', result?.data.data.user.id);
            await AsyncStorage.setItem('userRole', result?.data.data.user.role);
            Alert.alert(
              'Welcome',
              `${result?.data.data.user.name}. You are now signed in!`
            );
            await isUserLoggedIn();
          } else if (result.status == 'fail') {
            Alert.alert(`${result.status.toUpperCase()}`, `${result.message}`);
            setLoading(false);
          } else {
            Alert.alert('Somethin went wrong. Please try again later');
            setLoading(false);
          }
        })
        .catch((err) => {
          Alert.alert('Error', err.message);
          setLoading(false);
        });
    } catch (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back 👋</Text>
      <Text style={styles.subtitle}>Sign in to your merchant account</Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#aaa"
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#aaa"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={handleSignIn}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Sign In</Text>
        )}
      </TouchableOpacity>
      {/* <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
        <Text style={styles.linkText}>
          Don't have an account?{' '}
          <Text style={{ color: '#4f8cff' }}>Sign Up</Text>
        </Text>
      </TouchableOpacity> */}
      <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={[styles.linkText, { color: '#4f8cff', marginTop: 8 }]}>
          Forgot Password?
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    width: '100%',
    height: 48,
    backgroundColor: '#4f8cff',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4f8cff',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: '#666',
    fontSize: 15,
    marginTop: 8,
  },
});
