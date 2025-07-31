import React, { useState, useEffect } from 'react';
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
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { submitPost, getItemById, updateItem } from '../utils/api';
import { COLORS } from '../../constants';

export default function AddShopScreen() {
  const { shopId } = useLocalSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [image, setImage] = useState(null);
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [profession, setProfession] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [socialLinks, setSocialLinks] = useState([{ platform: '', link: '' }]);
  const router = useRouter();

  const handleSocialLinkChange = (idx, field, value) => {
    setSocialLinks((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };
  const handleAddSocialLink = () => {
    setSocialLinks((prev) => [...prev, { platform: '', link: '' }]);
  };
  const handleRemoveSocialLink = (idx) => {
    setSocialLinks((prev) => prev.filter((_, i) => i !== idx));
  };

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
    const artisan = await AsyncStorage.getItem('userUID');
    const formData = new FormData();
    formData.append('file', {
      uri,
      type: 'image/jpeg',
      name: `upload_${name}_${artisan}.jpg`,
    });
    formData.append('filename_override', `upload_${name}_${artisan}.jpg`);
    formData.append('upload_preset', 'Server Images');
    formData.append('folder', `Elroy/Shop Images/${name}`);

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

  const handleSubmit = async () => {
    if (
      !name ||
      !image ||
      !phone ||
      !address ||
      !location ||
      !bio ||
      !experienceYears ||
      !profession
    ) {
      Alert.alert('Error', 'Please fill all required fields and set location');
      return;
    }
    setLoading(true);
    try {
      let imageUrl = image;
      if (image && !image.startsWith('http')) {
        imageUrl = await uploadImageToCloudinary(image);
      }
      const artisan = await AsyncStorage.getItem('userUID');
      const shopData = {
        name,
        artisan,
        image: imageUrl,
        phone,
        email,
        address,
        location,
        bio,
        experienceYears,
        profession,
        socialLinks,
      };
      let result;
      if (shopId) {
        result = await updateItem('artisanshops', shopId, shopData);
      } else {
        result = await submitPost(shopData, 'artisanshops');
      }
      if (result.status === 201 || result.status === 'success') {
        Alert.alert(
          'Success',
          shopId ? 'Shop updated successfully' : 'Shop added successfully'
        );
        router.back();
      } else {
        Alert.alert('Error', result.message || 'Failed to save shop');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (shopId) {
      setInitialLoading(true);
      (async () => {
        const res = await getItemById('artisanshops', shopId);
        const shop = res?.data?.data?.data;
        if (shop) {
          setName(shop.name || '');
          setEmail(shop.email || '');
          setImage(shop.image || null);
          setPhone(shop.phone.toString() || '');
          setAddress(shop.address || '');
          setBio(shop.bio || '');
          setExperienceYears(shop.experienceYears.toString() || '');
          setProfession(shop.profession || '');
          setLocation(shop.location || null);
          setSocialLinks(
            store.socialLinks && store.socialLinks.length > 0
              ? store.socialLinks
              : [{ platform: '', link: '' }]
          );
        }
        setInitialLoading(false);
      })();
    }
  }, [shopId]);

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
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Stack.Screen
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
            headerTitle: 'Add New Artisan Shop',
          }}
        />
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
          placeholder="Shop Name"
          placeholderTextColor="#aaa"
          value={name}
          onChangeText={setName}
        />
        <TextInput
          style={styles.input}
          placeholder="Shop Email"
          placeholderTextColor="#aaa"
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
          placeholder="Experience Years"
          placeholderTextColor="#aaa"
          keyboardType="phone-pad"
          value={experienceYears}
          onChangeText={setExperienceYears}
        />
        <TextInput
          style={styles.input}
          placeholder="Bio"
          placeholderTextColor="#aaa"
          value={bio}
          onChangeText={setBio}
        />
        <TextInput
          style={styles.input}
          placeholder="Profession"
          placeholderTextColor="#aaa"
          value={profession}
          onChangeText={setProfession}
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
            {location ? 'Location has been Set' : 'Set Shop Location'}
          </Text>
        </TouchableOpacity>
        {shopId && (
          <TouchableOpacity
            style={styles.locationResetBtn}
            onPress={handleLocation}
          >
            <Ionicons name="location-outline" size={18} color="#4f8cff" />
            <Text style={styles.locationResetBtnText}>Reset Shop Location</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.sectionTitle}>Social Links</Text>
        {socialLinks.map((item, idx) => (
          <View
            key={idx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 8,
            }}
          >
            <TextInput
              style={[styles.input, { flex: 1, marginRight: 4 }]}
              placeholder="Platform(Instagram)"
              placeholderTextColor={'#aaa'}
              value={item.platform}
              onChangeText={(v) => handleSocialLinkChange(idx, 'platform', v)}
            />
            <TextInput
              style={[styles.input, { flex: 2, marginRight: 4 }]}
              placeholder="Link(Starting with https://)"
              placeholderTextColor={'#aaa'}
              value={item.link}
              onChangeText={(v) => handleSocialLinkChange(idx, 'link', v)}
            />
            <TouchableOpacity onPress={() => handleRemoveSocialLink(idx)}>
              <Text style={{ color: '#f00', fontWeight: 'bold', fontSize: 22 }}>
                ×
              </Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity
          onPress={handleAddSocialLink}
          style={[
            styles.button,
            { backgroundColor: COLORS.greenish, marginTop: 0, marginBottom: 8 },
          ]}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>
            + Add Social Link
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>
              {shopId ? 'Update Shop' : 'Add Shop'}
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
  locationResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenish,
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
  locationResetBtnText: {
    color: '#fff',
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
