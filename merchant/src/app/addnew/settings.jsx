import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Stack } from 'expo-router';
import { getItems, submitUserUpdate } from '../utils/api';
import { COLORS } from '../../constants';
import { Feather } from '@expo/vector-icons';

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/du0sqginv/image/upload';
const CLOUDINARY_UPLOAD_PRESET = 'Server Images';

export default function SettingsScreen() {
  const [userImage, setUserImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    image: '',
  });
  const [infoSubmitting, setInfoSubmitting] = useState(false);
  const [pwSubmitting, setPwSubmitting] = useState(false);
  const [pwFields, setPwFields] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    const res = await getItems('users/me');
    if (res?.data?.data?.data) {
      setInfo({
        name: res.data.data.data.name || '',
        email: res.data.data.data.email || '',
        phone: res.data.data.data.phone ? String(res.data.data.data.phone) : '',
        address: res.data.data.data.address || '',
        image: res.data.data.data.image || '',
      });
    }
    setLoading(false);
  };

  const handleInfoSubmit = async () => {
    setInfoSubmitting(true);
    const userData = {
      name: info.name,
      email: info.email,
      phone: info.phone,
      address: info.address,
      image: userImage,
    };
    await submitUserUpdate(userData, 'users/updateMe');
    setInfoSubmitting(false);
    Alert.alert('Success', 'User info updated!');
    fetchUser();
  };

  const handlePasswordSubmit = async () => {
    if (pwFields.newPassword !== pwFields.confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match.');
      return;
    }
    setPwSubmitting(true);
    await submitUserUpdate(
      {
        passwordCurrent: pwFields.currentPassword,
        password: pwFields.newPassword,
        passwordConfirm: pwFields.confirmPassword,
      },
      'users/updateMyPassword'
    );
    setPwSubmitting(false);
    setPwFields({ currentPassword: '', newPassword: '', confirmPassword: '' });
    Alert.alert('Success', 'Password updated!');
  };

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const localUri = result.assets[0].uri;
      const formData = new FormData();
      formData.append('file', {
        uri: localUri,
        type: 'image/jpeg',
        name: `upload_${info.name}_${info.email}.jpg`,
      });
      formData.append(
        'filename_override',
        `upload_${info.name}_${info.email}.jpg`
      );
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
      formData.append('folder', `Elroy/Users Images/${info.email}`);
      try {
        const response = await fetch(CLOUDINARY_URL, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        const data = await response.json();
        if (data.secure_url) {
          setUserImage(data.secure_url);
          setInfo((prev) => ({ ...prev, image: data.secure_url }));
        } else {
          Alert.alert('Upload failed', 'Could not upload image.');
        }
      } catch (e) {
        Alert.alert('Upload failed', 'Could not upload image.');
      }
    }
  };

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: '#f6f8fa',
        }}
      >
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.section}
      contentContainerStyle={{ paddingBottom: 32 }}
    >
      <Stack.Screen
        options={{
          headerShown: true,
          headerBackButtonDisplayMode: 'minimal',
          headerTitle: 'User Settings',
        }}
      />
      <Text style={styles.sectionTitle}>Edit User Info</Text>
      <View style={styles.imageRow}>
        <Image
          source={
            info.image ? { uri: info.image } : require('../../assets/logo.png')
          }
          style={styles.profileImage}
        />
        <TouchableOpacity style={styles.imageBtn} onPress={handlePickImage}>
          <Feather name="camera" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.inputLarge}
        placeholder="Full Name"
        placeholderTextColor={'#888'}
        value={info.name}
        onChangeText={(text) => setInfo((prev) => ({ ...prev, name: text }))}
      />
      <TextInput
        style={styles.inputLarge}
        placeholder="Email Address"
        placeholderTextColor={'#888'}
        value={info.email}
        onChangeText={(text) => setInfo((prev) => ({ ...prev, email: text }))}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.inputLarge}
        placeholder="Phone Number"
        placeholderTextColor={'#888'}
        value={info.phone}
        onChangeText={(text) => setInfo((prev) => ({ ...prev, phone: text }))}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.inputLarge}
        placeholder="Home Address"
        placeholderTextColor={'#888'}
        value={info.address}
        onChangeText={(text) => setInfo((prev) => ({ ...prev, address: text }))}
      />
      <TouchableOpacity
        style={styles.saveBtn}
        onPress={handleInfoSubmit}
        disabled={infoSubmitting}
      >
        {infoSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Save Info</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Change Password</Text>
      <View style={styles.passwordRow}>
        <TextInput
          style={styles.inputLarge}
          placeholder="Current Password"
          placeholderTextColor={'#888'}
          value={pwFields.currentPassword}
          onChangeText={(text) =>
            setPwFields((prev) => ({ ...prev, currentPassword: text }))
          }
          secureTextEntry={!showCurrentPw}
        />
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => setShowCurrentPw((v) => !v)}
        >
          <Feather
            name={showCurrentPw ? 'eye' : 'eye-off'}
            size={22}
            color="#888"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.passwordRow}>
        <TextInput
          style={styles.inputLarge}
          placeholder="New Password"
          placeholderTextColor={'#888'}
          value={pwFields.newPassword}
          onChangeText={(text) =>
            setPwFields((prev) => ({ ...prev, newPassword: text }))
          }
          secureTextEntry={!showNewPw}
        />
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => setShowNewPw((v) => !v)}
        >
          <Feather
            name={showNewPw ? 'eye' : 'eye-off'}
            size={22}
            color="#888"
          />
        </TouchableOpacity>
      </View>
      <View style={styles.passwordRow}>
        <TextInput
          style={styles.inputLarge}
          placeholder="Confirm New Password"
          placeholderTextColor={'#888'}
          value={pwFields.confirmPassword}
          onChangeText={(text) =>
            setPwFields((prev) => ({ ...prev, confirmPassword: text }))
          }
          secureTextEntry={!showConfirmPw}
        />
        <TouchableOpacity
          style={styles.eyeBtn}
          onPress={() => setShowConfirmPw((v) => !v)}
        >
          <Feather
            name={showConfirmPw ? 'eye' : 'eye-off'}
            size={22}
            color="#888"
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.saveBtn, { marginBottom: 32 }]}
        onPress={handlePasswordSubmit}
        disabled={
          pwSubmitting ||
          !pwFields.currentPassword ||
          !pwFields.newPassword ||
          !pwFields.confirmPassword ||
          pwFields.newPassword !== pwFields.confirmPassword
        }
      >
        {pwSubmitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveBtnText}>Change Password</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { backgroundColor: '#f6f8fa', padding: 16, flex: 1 },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 14,
    color: COLORS.primary,
    marginTop: 30,
    justifyContent: 'center',
    textAlign: 'center',
  },
  inputLarge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#eee',
    fontSize: 18,
    width: '100%',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 18,
  },
  saveBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 18 },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    justifyContent: 'center',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 40,
    backgroundColor: '#eee',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  imageBtn: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  eyeBtn: { marginLeft: -40, padding: 8, zIndex: 2 },
});
