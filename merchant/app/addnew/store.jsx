import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { submitPost, getItemById, updateItem } from '../utils/api';

export default function AddStoreScreen() {
  const { storeId } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [image, setImage] = useState(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [workingHours, setWorkingHours] = useState([
    { day: 'Monday', open: '', close: '' },
    { day: 'Tuesday', open: '', close: '' },
    { day: 'Wednesday', open: '', close: '' },
    { day: 'Thursday', open: '', close: '' },
    { day: 'Friday', open: '', close: '' },
    { day: 'Saturday', open: '', close: '' },
    { day: 'Sunday', open: '', close: '' },
  ]);
  const router = useRouter();

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImage(result.assets[0].uri);
    }
  };

  const uploadImageToCloudinary = async (uri) => {
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: `upload_${name}.jpg`,
    });
    formData.append('upload_preset', 'Server Images');
    formData.append('folder', 'Cassiel/Store Images');

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
      throw new Error('Image upload failed');
    }
  };

  const handleLocation = async () => {
    try {
      let { status } = await (
        await import('expo-location')
      ).requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let loc = await (
          await import('expo-location')
        ).getCurrentPositionAsync({});
        setLocation({
          type: 'Point',
          coordinates: [loc.coords.longitude, loc.coords.latitude],
          address: address,
        });
        Alert.alert('Location set', 'Location coordinates have been set.');
      } else {
        Alert.alert('Permission denied', 'Location permission is required.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to get location');
    }
  };

  const handleWorkingHourChange = (idx, field, value) => {
    setWorkingHours((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async () => {
    if (!name || !image || !phone || !address || !location) {
      Alert.alert('Error', 'Please fill all required fields and set location');
      return;
    }
    setLoading(true);
    try {
      let imageUrl = image;
      if (image && !image.startsWith('http')) {
        imageUrl = await uploadImageToCloudinary(image);
      }
      const merchant = await AsyncStorage.getItem('userUID');
      const storeData = {
        name,
        merchant,
        image: imageUrl,
        phone,
        address,
        location,
        workingHours,
      };
      let result;
      if (storeId) {
        result = await updateItem('stores', storeId, storeData);
      } else {
        result = await submitPost(storeData, 'stores');
      }
      if (result.status === 201 || result.status === 'success') {
        Alert.alert(
          'Success',
          storeId ? 'Store updated successfully' : 'Store added successfully'
        );
        router.back();
      } else {
        Alert.alert('Error', result.message || 'Failed to save store');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  React.useEffect(() => {
    if (storeId) {
      setInitialLoading(true);
      (async () => {
        const res = await getItemById('stores', storeId);
        const store = res?.data?.data;
        if (store) {
          setName(store.name || '');
          setImage(store.image || null);
          setPhone(store.phone || '');
          setAddress(store.address || '');
          setLocation(store.location || null);
          setWorkingHours(
            store.workingHours || [
              { day: 'Monday', open: '', close: '' },
              { day: 'Tuesday', open: '', close: '' },
              { day: 'Wednesday', open: '', close: '' },
              { day: 'Thursday', open: '', close: '' },
              { day: 'Friday', open: '', close: '' },
              { day: 'Saturday', open: '', close: '' },
              { day: 'Sunday', open: '', close: '' },
            ]
          );
        }
        setInitialLoading(false);
      })();
    }
  }, [storeId]);

  if (initialLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f8cff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Add New Store</Text>
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
        <TextInput
          style={styles.input}
          placeholder="Store Name"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
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
        <TouchableOpacity style={styles.locationBtn} onPress={handleLocation}>
          <Ionicons name="location-outline" size={18} color="#4f8cff" />
          <Text style={styles.locationBtnText}>
            {location ? 'Location Set' : 'Set Location'}
          </Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>Working Hours</Text>
        {workingHours.map((wh, idx) => (
          <View key={wh.day} style={styles.workingHourRow}>
            <Text style={styles.workingHourDay}>{wh.day}</Text>
            <TextInput
              style={styles.workingHourInput}
              placeholder="Open (e.g. 08:00)"
              placeholderTextColor="#aaa"
              value={wh.open}
              onChangeText={(val) => handleWorkingHourChange(idx, 'open', val)}
            />
            <TextInput
              style={styles.workingHourInput}
              placeholder="Close (e.g. 18:00)"
              placeholderTextColor="#aaa"
              value={wh.close}
              onChangeText={(val) => handleWorkingHourChange(idx, 'close', val)}
            />
          </View>
        ))}
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {storeId ? 'Update Store' : 'Add Store'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#f6f8fa',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
    alignSelf: 'center',
  },
  imagePicker: {
    alignSelf: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4f8cff',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 12,
    backgroundColor: '#eaeaea',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
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
  locationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eaf2ff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 18,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  locationBtnText: {
    color: '#4f8cff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
    marginTop: 8,
    alignSelf: 'flex-start',
  },
  workingHourRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    width: '100%',
  },
  workingHourDay: {
    width: 80,
    fontWeight: 'bold',
    color: '#444',
  },
  workingHourInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    marginLeft: 6,
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
    marginTop: 16,
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
});
