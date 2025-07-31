import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useRouter, Stack } from 'expo-router';
import { getItems, submitPost, getItemById, updateItem } from '../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams } from 'expo-router';
import { COLORS, FONT, SIZES, SHADOWS } from '../../constants';

export default function AddServiceScreen() {
  const { serviceId } = useLocalSearchParams();
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({
    name: '',
    artisan: '',
    artisanShop: '',
    price: '',
    summary: '',
    description: '',
    images: [],
    duration: '',
    isVerified: false,
  });
  // const [artisans, setArtisans] = useState([]);
  // const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // const [uploading, setUploading] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const res = await getItems('users', { role: 'artisan' });
      setArtisans(res?.data?.data?.data || []);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const userId = await AsyncStorage.getItem('userUID');

      // Fetch user's shop
      let shopId = '';
      const shopRes = await getItems('artisanshops', { artisan: userId });
      if (shopRes?.data?.data?.data?.length) {
        shopId = shopRes.data.data.data[0]._id;
      }
      // If editing, load service details
      if (serviceId) {
        setIsEdit(true);
        const res = await getItemById('services', serviceId);
        const data = res?.data?.data.data;
        setForm({
          ...data,
          artisan: userId,
          artisanShop: shopId,
          price: data.price?.toString() || '',
          duration: data.duration?.toString() || '',
          images: data.images || [],
        });
        setSelectedImages(data.images || []);
      } else {
        setForm((f) => ({ ...f, artisan: userId, artisanShop: shopId }));
      }
    })();
  }, [serviceId]);

  // Cloudinary upload helper
  const uploadImagesToCloudinary = async (uris) => {
    const urls = [];

    for (let i = 0; i < uris.length; i++) {
      const uri = uris[i];
      const formData = new FormData();
      // // Use product name and index for image name
      // const cleanName = form.name.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: `${form.name}_${form.artisan}_${form.artisanShop}_${i + 1}.jpg`,
      });
      formData.append(
        'filename_override',
        `${form.name}_${form.artisan}_${form.artisanShop}_${i + 1}.jpg`
      );
      formData.append('upload_preset', 'Server Images');
      formData.append('folder', `Elroy/Service Images/${form.artisanShop}`);

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
          console.log('====================================');
          console.log(`Uploaded Image: ${data.secure_url}`);
          console.log('====================================');
          urls.push(data.secure_url);
        } else {
          throw new Error('Cloudinary upload failed');
        }
      } catch (error) {
        throw new Error('Image upload failed');
      }
    }
    setForm((f) => ({ ...f, images: urls }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      if (
        !form.name ||
        !form.artisan ||
        !form.artisanShop ||
        !form.price ||
        !form.summary ||
        !form.duration
      ) {
        setError('Please fill all required fields and add at least one image.');
        setLoading(false);
        return;
      }

      const serviceData = {
        ...form,
        price: Number(form.price),
        duration: Number(form.duration),
      };
      console.log('====================================');
      console.log(serviceData);
      console.log('====================================');
      let res;
      if (isEdit) {
        res = await updateItem('services', serviceId, serviceData);
      } else {
        res = await submitPost(serviceData, 'services');
      }
      if (res.status === 201 || res.status === 200) {
        router.back();
      } else {
        setError(res.message || 'Failed to save service');
      }
    } catch (e) {
      setError(e.message || 'Failed to save service');
    }
    setLoading(false);
  };

  const handlePickImages = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      aspect: [1, 1],
      quality: 0.5,
      selectionLimit: 5,
    });
    if (!result.canceled) {
      const uris = result.assets.map((a) => a.uri);
      setSelectedImages(uris);
      await uploadImagesToCloudinary(uris);
    }
  };

  const handleRemoveImage = (idx) => {
    setSelectedImages((imgs) => imgs.filter((_, i) => i !== idx));
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            headerBackButtonDisplayMode: 'minimal',
            headerTitle: 'Add New Service',
          }}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.label}>Images</Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 8,
            marginBottom: 8,
          }}
        >
          {selectedImages.map((img, idx) => (
            <View key={idx} style={styles.imagePreview}>
              <Image source={{ uri: img }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => handleRemoveImage(idx)}
              >
                <Text style={{ color: COLORS.reddish, fontWeight: 'bold' }}>
                  ×
                </Text>
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity style={styles.addImgBtn} onPress={handlePickImages}>
            <Text
              style={{
                color: COLORS.primary,
                fontWeight: 'bold',
                fontSize: 28,
              }}
            >
              +
            </Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={form.name}
          onChangeText={(v) => handleChange('name', v)}
          placeholder="Service Name"
          placeholderTextColor={'#000'}
        />
        <Text style={styles.label}>Price</Text>
        <TextInput
          style={styles.input}
          value={form.price}
          onChangeText={(v) => handleChange('price', v)}
          placeholder="Price"
          placeholderTextColor={'#000'}
          keyboardType="numeric"
        />
        <Text style={styles.label}>Summary</Text>
        <TextInput
          style={styles.input}
          value={form.summary}
          onChangeText={(v) => handleChange('summary', v)}
          placeholder="Summary"
          placeholderTextColor={'#000'}
        />
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, { minHeight: 60 }]}
          value={form.description}
          onChangeText={(v) => handleChange('description', v)}
          placeholder="Description"
          placeholderTextColor={'#000'}
          multiline
        />
        <Text style={styles.label}>Duration (hours)</Text>
        <TextInput
          style={styles.input}
          value={form.duration}
          onChangeText={(v) => handleChange('duration', v)}
          placeholder="Duration"
          placeholderTextColor={'#000'}
          keyboardType="numeric"
        />
        <TouchableOpacity
          style={styles.submitBtn}
          onPress={handleSubmit}
          disabled={loading}
        >
          <Text style={styles.submitBtnText}>
            {loading ? 'Adding...' : 'Add Service'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: COLORS.lightWhite,
    flexGrow: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: COLORS.secondary,
    marginBottom: 18,
    alignSelf: 'center',
  },
  label: {
    fontWeight: 'bold',
    color: COLORS.primary,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray2,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    backgroundColor: COLORS.white,
    marginBottom: 4,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: COLORS.gray2,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    marginBottom: 4,
  },
  error: {
    color: COLORS.reddish,
    textAlign: 'center',
    marginBottom: 8,
  },
  imagePreview: {
    width: 90,
    height: 90,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  image: {
    width: 90,
    height: 90,
    borderRadius: 8,
  },
  removeBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 4,
    paddingVertical: 0,
    zIndex: 2,
  },
  addImgBtn: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    marginTop: 18,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
});
