import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { signUp } from '../../utils/api';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [image, setImage] = useState(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [dob, setDob] = useState('');
  const [tempDob, setTempDob] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const router = useRouter();

  const handlePickImage = async () => {
    Alert.alert(
      'Profile Image',
      'Choose an option',
      [
        {
          text: 'Take Photo',
          onPress: async () => {
            const cameraResult = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (
              !cameraResult.canceled &&
              cameraResult.assets &&
              cameraResult.assets.length > 0
            ) {
              setImage(cameraResult.assets[0].uri);
            }
          },
        },
        {
          text: 'Choose from Library',
          onPress: async () => {
            const libraryResult = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.5,
            });
            if (
              !libraryResult.canceled &&
              libraryResult.assets &&
              libraryResult.assets.length > 0
            ) {
              setImage(libraryResult.assets[0].uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // Cloudinary upload helper
  const uploadImageToCloudinary = async (uri) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: `upload_${name}_${email}.jpg`,
    });
    formData.append('filename_override', `upload_${name}_${email}.jpg`);
    formData.append('upload_preset', 'Server Images');
    formData.append('folder', `Elroy/Users Images/${email}`);

    try {
      const res = await fetch(
        'https://api.cloudinary.com/v1_1/du0sqginv/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await res.json();
      if (data.secure_url) {
        return data.secure_url;
      } else {
        throw new Error('Cloudinary upload failed');
      }
    } catch (error) {
      console.log('====================================');
      console.log(error);
      console.log('====================================');
      throw new Error('Image upload failed');
    }
  };

  // Get current location on mount
  React.useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await Location.getCurrentPositionAsync({});
        setLocation({
          type: 'Point',
          coordinates: [loc.coords.longitude, loc.coords.latitude],
          address: '', // Will be set from address input
        });
      }
    })();
  }, []);

  const calculateAge = (dateString) => {
    const today = new Date();
    const birthDate = new Date(dateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleSignUp = async () => {
    if (
      !name ||
      !email ||
      !password ||
      !confirmPassword ||
      !phone ||
      !address ||
      !location // location is now required
    ) {
      Alert.alert('Error', 'Please fill all fields and allow location access');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (!dob) {
      Alert.alert('Error', 'Please select your date of birth');
      return;
    }
    setLoading(true);
    try {
      let imageUrl = '';
      if (image) {
        imageUrl = await uploadImageToCloudinary(image);
      }
      // Set address in location object as well
      const userLocation = {
        ...location,
        address: address,
      };
      const age = calculateAge(dob);
      const userData = {
        name,
        email,
        password,
        passwordConfirm: confirmPassword,
        phone,
        address,
        ...(imageUrl ? { image: imageUrl } : {}),
        location: userLocation,
        birthday: new Date(dob),
        age,
      };
      signUp(userData)
        .then(async (result) => {
          if (result.status == 201) {
            await AsyncStorage.setItem('jwt', result?.data.token);
            await AsyncStorage.setItem('userUID', result?.data.data.user.id);
            await AsyncStorage.setItem(
              'userAge',
              result?.data.data.user.age.toString()
            );
            await AsyncStorage.setItem(
              'userBirthday',
              result?.data.data.user.birthday.toString()
            );
            await AsyncStorage.setItem('userRole', result?.data.data.user.role);
            Alert.alert(
              'Welcome',
              `${result?.data.data.user.name}. Thank you for joining us!`
            );
            router.replace('/(tab)/home'); // <-- updated route
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
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.imagePicker} onPress={handlePickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.imagePreview} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={36} color="#aaa" />
              <Text style={{ color: '#aaa', marginTop: 4 }}>Select Image</Text>
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>
          Sign up to get started with your Customer account, start placing
          orders and have items delivered at your doorstep.
        </Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#aaa"
            value={name}
            onChangeText={setName}
          />
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
            placeholder="Phone Number"
            placeholderTextColor="#aaa"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
          />
          <TextInput
            style={styles.input}
            placeholder="Address"
            placeholderTextColor="#aaa"
            value={address}
            onChangeText={setAddress}
          />
          <TouchableOpacity
            style={[
              styles.input,
              {
                justifyContent: 'center',
                height: 48,
                marginBottom: 16,
                backgroundColor: '#e6f0ff', // light blue background
                borderColor: '#4f8cff', // blue border
                borderWidth: 2,
              },
            ]}
            onPress={() => {
              setTempDob(dob || '');
              setShowDatePicker(true);
            }}
          >
            <Text
              style={{
                color: dob ? '#222' : '#4f8cff',
                fontSize: 16,
                fontWeight: dob ? 'bold' : 'normal',
              }}
            >
              {dob
                ? `Date of Birth: ${new Date(dob).toLocaleDateString()}`
                : 'Select Date of Birth'}
            </Text>
          </TouchableOpacity>
          {showDatePicker && (
            <View
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
                elevation: 8,
                marginVertical: 10,
              }}
            >
              <DateTimePicker
                value={
                  tempDob
                    ? new Date(tempDob)
                    : dob
                    ? new Date(dob)
                    : new Date(2000, 0, 1)
                }
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                maximumDate={new Date()}
                textColor="#222"
                style={{
                  width: 320,
                  height: 200,
                  backgroundColor: '#e6f0ff',
                  borderRadius: 8,
                }}
                onChange={(event, selectedDate) => {
                  if (selectedDate)
                    setTempDob(selectedDate.toISOString().split('T')[0]);
                }}
              />
              <View style={{ flexDirection: 'row', marginTop: 16, gap: 16 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#4f8cff',
                    paddingVertical: 10,
                    paddingHorizontal: 24,
                    borderRadius: 8,
                    marginRight: 8,
                  }}
                  onPress={() => {
                    setDob(tempDob);
                    setShowDatePicker(false);
                  }}
                >
                  <Text
                    style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}
                  >
                    Set
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{
                    backgroundColor: '#eee',
                    paddingVertical: 10,
                    paddingHorizontal: 24,
                    borderRadius: 8,
                  }}
                  onPress={() => {
                    setTempDob(dob || '');
                    setShowDatePicker(false);
                  }}
                >
                  <Text
                    style={{ color: '#333', fontWeight: 'bold', fontSize: 16 }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setPasswordVisible((v) => !v)}
            >
              <Ionicons
                name={passwordVisible ? 'eye' : 'eye-off'}
                size={22}
                color="#888"
              />
            </TouchableOpacity>
          </View>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Confirm Password"
              placeholderTextColor="#aaa"
              secureTextEntry={!confirmPasswordVisible}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setConfirmPasswordVisible((v) => !v)}
            >
              <Ionicons
                name={confirmPasswordVisible ? 'eye' : 'eye-off'}
                size={22}
                color="#888"
              />
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSignUp}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.dismissTo('/signin')}>
          <Text style={styles.linkText}>
            Already have an account?{' '}
            <Text style={{ color: '#4f8cff' }}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>{' '}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f6f8fa',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  imagePicker: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#4f8cff',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#eaeaea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
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
    textAlign: 'center',
    paddingHorizontal: 10,
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 8,
    zIndex: 1,
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
    fontSize: 22,
    marginTop: 8,
    marginBottom: 30,
  },
});
