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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { submitPost, getItems, getItemById, updateItem } from '../utils/api';
import { Picker } from '@react-native-picker/picker';

export default function AddProductScreen() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [brand, setBrand] = useState('');
  const [images, setImages] = useState([]); // multiple images
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSubCategory, setSelectedSubCategory] = useState('');
  const [duration, setDuration] = useState('');
  const [maxOrder, setMaxOrder] = useState('');
  const [priceDiscount, setPriceDiscount] = useState('');
  const [summary, setSummary] = useState('');
  const [varieties, setVarieties] = useState([]); // [{name, priceDifference}]
  const [productOptions, setProductOptions] = useState([]); // [{name, options: [{name, additionalCost}], required}]
  const [productId, setProductId] = useState(null);
  const [initialLoading, setInitialLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Load categories from backend
    const fetchCategories = async () => {
      try {
        const res = await getItems('categories');
        setCategories(res?.data?.data || []);
        console.log('====================================');
        console.log('Categories', res);
        console.log('====================================');
      } catch (err) {
        // Optionally handle error
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    // Load subcategories when category changes
    const fetchSubCategories = async () => {
      if (!selectedCategory) {
        setSubCategories([]);
        setSelectedSubCategory('');
        return;
      }
      try {
        const res = await getItems('subcategories', {
          category: selectedCategory,
        });
        setSubCategories(res?.data?.subcategories || []);
        console.log('====================================');
        console.log('Sub Categories', subCategories);
        console.log('====================================');
        setSelectedSubCategory('');
      } catch (err) {
        setSubCategories([]);
        setSelectedSubCategory('');
      }
    };
    fetchSubCategories();
  }, [selectedCategory]);

  useEffect(() => {
    // Check for productId in router params for edit mode
    if (router && router.params && router.params.productId) {
      setProductId(router.params.productId);
      setInitialLoading(true);
      (async () => {
        const res = await getItemById('products', router.params.productId);
        const prod = res?.data?.data;
        if (prod) {
          setName(prod.name || '');
          setDescription(prod.description || '');
          setSummary(prod.summary || '');
          setPrice(prod.price ? prod.price.toString() : '');
          setPriceDiscount(
            prod.priceDiscount ? prod.priceDiscount.toString() : ''
          );
          setSelectedCategory(prod.category?._id || prod.category || '');
          setSelectedSubCategory(prod.subcategory || prod.subCategory || '');
          setStock(prod.stock ? prod.stock.toString() : '');
          setBrand(prod.brand || '');
          setImages(prod.images || []);
          setDuration(prod.duration ? prod.duration.toString() : '');
          setMaxOrder(prod.maxOrder ? prod.maxOrder.toString() : '');
          setVarieties(prod.varieties || []);
          setProductOptions(prod.productoptions || []);
        }
        setInitialLoading(false);
      })();
    }
  }, [router]);

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      selectionLimit: 5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages([...images, ...result.assets.map((a) => a.uri)]);
    }
  };

  // Cloudinary upload helper
  const uploadImagesToCloudinary = async (uris) => {
    const urls = [];
    for (let uri of uris) {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: `upload_${name}.jpg`,
      });
      formData.append('upload_preset', 'Server Images');
      formData.append('folder', 'Cassiel/Products');

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
          urls.push(data.secure_url);
        } else {
          throw new Error('Cloudinary upload failed');
        }
      } catch (error) {
        throw new Error('Image upload failed');
      }
    }
    return urls;
  };

  const handleRemoveImage = (idx) => {
    setImages(images.filter((_, i) => i !== idx));
  };

  // Handlers for dynamic fields
  const addVariety = () =>
    setVarieties([...varieties, { name: '', priceDifference: '' }]);
  const updateVariety = (idx, key, value) => {
    const updated = [...varieties];
    updated[idx][key] = value;
    setVarieties(updated);
  };
  const removeVariety = (idx) =>
    setVarieties(varieties.filter((_, i) => i !== idx));

  const addProductOption = () =>
    setProductOptions([
      ...productOptions,
      {
        name: '',
        options: [{ name: '', additionalCost: '' }],
        required: false,
      },
    ]);
  const updateProductOption = (idx, key, value) => {
    const updated = [...productOptions];
    updated[idx][key] = value;
    setProductOptions(updated);
  };
  const addOptionToProductOption = (idx) => {
    const updated = [...productOptions];
    updated[idx].options.push({ name: '', additionalCost: '' });
    setProductOptions(updated);
  };
  const updateOptionInProductOption = (pIdx, oIdx, key, value) => {
    const updated = [...productOptions];
    updated[pIdx].options[oIdx][key] = value;
    setProductOptions(updated);
  };
  const removeOptionFromProductOption = (pIdx, oIdx) => {
    const updated = [...productOptions];
    updated[pIdx].options.splice(oIdx, 1);
    setProductOptions(updated);
  };
  const removeProductOption = (idx) =>
    setProductOptions(productOptions.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    if (
      !name ||
      !description ||
      !price ||
      !selectedCategory ||
      !stock ||
      !duration ||
      !maxOrder ||
      !summary
    ) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    setLoading(true);
    try {
      let imageUrls = [];
      if (images.length > 0 && typeof images[0] !== 'string') {
        imageUrls = await uploadImagesToCloudinary(images);
      } else {
        imageUrls = images;
      }
      const merchant = await AsyncStorage.getItem('userUID');
      const productData = {
        name,
        description,
        summary,
        price: parseFloat(price),
        priceDiscount: priceDiscount ? parseFloat(priceDiscount) : undefined,
        category: selectedCategory,
        subCategory: selectedSubCategory,
        stock: parseInt(stock),
        duration: parseInt(duration),
        maxOrder: parseInt(maxOrder),
        brand,
        images: imageUrls,
        merchant,
        varieties: varieties.map((v) => ({
          name: v.name,
          priceDifference: parseFloat(v.priceDifference) || 0,
        })),
        productoptions: productOptions.map((po) => ({
          name: po.name,
          required: !!po.required,
          options: po.options.map((opt) => ({
            name: opt.name,
            additionalCost: parseFloat(opt.additionalCost) || 0,
          })),
        })),
      };
      let result;
      if (productId) {
        result = await updateItem('products', productId, productData);
      } else {
        result = await submitPost(productData, 'products');
      }
      if (result.status === 201 || result.status === 'success') {
        Alert.alert(
          'Success',
          productId
            ? 'Product updated successfully'
            : 'Product added successfully'
        );
        router.back();
      } else {
        Alert.alert('Error', result.message || 'Failed to save product');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  };

  if (initialLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#4f8cff" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Add New Product</Text>
      <TouchableOpacity style={styles.imagePicker} onPress={handlePickImages}>
        <Ionicons name="images" size={32} color="#4f8cff" />
        <Text style={{ color: '#4f8cff', marginTop: 4 }}>Select Images</Text>
      </TouchableOpacity>
      <View style={styles.imagesPreviewRow}>
        {images.map((img, idx) => (
          <View key={idx} style={styles.imageWrapper}>
            <Image source={{ uri: img }} style={styles.imagePreview} />
            <TouchableOpacity
              style={styles.removeImageBtn}
              onPress={() => handleRemoveImage(idx)}
            >
              <Ionicons name="close-circle" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="Product Name"
        placeholderTextColor="#aaa"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, { height: 80 }]}
        placeholder="Description"
        placeholderTextColor="#aaa"
        value={description}
        onChangeText={setDescription}
        multiline
      />
      <TextInput
        style={styles.input}
        placeholder="Price"
        placeholderTextColor="#aaa"
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
      />
      {/* Category Picker */}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedCategory}
          onValueChange={(itemValue) => {
            setSelectedCategory(itemValue);
            setSelectedSubCategory('');
          }}
          style={styles.picker}
          mode="dropdown"
        >
          <Picker.Item label="Select Category" value="" />
          {categories.map((cat) => (
            <Picker.Item
              key={cat._id}
              label={cat.name}
              value={cat._id.toString()}
            />
          ))}
        </Picker>
      </View>
      {/* SubCategory Picker */}
      {subCategories.length > 0 && (
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedSubCategory}
            onValueChange={(itemValue) => setSelectedSubCategory(itemValue)}
            style={styles.picker}
            mode="dropdown"
          >
            <Picker.Item label="Select Subcategory" value="" />
            {subCategories.map((sub) => (
              <Picker.Item
                key={sub._id}
                label={sub.name}
                value={sub._id.toString()}
              />
            ))}
          </Picker>
        </View>
      )}
      <TextInput
        style={styles.input}
        placeholder="Stock"
        placeholderTextColor="#aaa"
        value={stock}
        onChangeText={setStock}
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Brand (optional)"
        placeholderTextColor="#aaa"
        value={brand}
        onChangeText={setBrand}
      />
      <TextInput
        style={styles.input}
        placeholder="Summary"
        placeholderTextColor="#aaa"
        value={summary}
        onChangeText={setSummary}
      />
      <TextInput
        style={styles.input}
        placeholder="Duration (packing time in minutes)"
        placeholderTextColor="#aaa"
        value={duration}
        onChangeText={setDuration}
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Max Order"
        placeholderTextColor="#aaa"
        value={maxOrder}
        onChangeText={setMaxOrder}
        keyboardType="number-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Discount Price (optional)"
        placeholderTextColor="#aaa"
        value={priceDiscount}
        onChangeText={setPriceDiscount}
        keyboardType="decimal-pad"
      />
      {/* Varieties Section */}
      <View style={{ width: '100%', marginBottom: 16 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>Varieties</Text>
        {varieties.map((v, idx) => (
          <View
            key={idx}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: 4,
            }}
          >
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="Variety Name"
              value={v.name}
              onChangeText={(val) => updateVariety(idx, 'name', val)}
            />
            <TextInput
              style={[
                styles.input,
                { flex: 1, marginBottom: 0, marginLeft: 4 },
              ]}
              placeholder="Price Difference"
              value={v.priceDifference}
              onChangeText={(val) => updateVariety(idx, 'priceDifference', val)}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity
              onPress={() => removeVariety(idx)}
              style={{ marginLeft: 4 }}
            >
              <Ionicons name="close-circle" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={addVariety} style={{ marginTop: 4 }}>
          <Text style={{ color: '#4f8cff' }}>+ Add Variety</Text>
        </TouchableOpacity>
      </View>
      {/* Product Options Section */}
      <View style={{ width: '100%', marginBottom: 16 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 4 }}>
          Product Options
        </Text>
        {productOptions.map((po, pIdx) => (
          <View
            key={pIdx}
            style={{
              borderWidth: 1,
              borderColor: '#e0e0e0',
              borderRadius: 8,
              padding: 8,
              marginBottom: 8,
            }}
          >
            <TextInput
              style={[styles.input, { marginBottom: 4 }]}
              placeholder="Option Group Name"
              value={po.name}
              onChangeText={(val) => updateProductOption(pIdx, 'name', val)}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                marginBottom: 4,
              }}
            >
              <Text style={{ marginRight: 8 }}>Required?</Text>
              <TouchableOpacity
                onPress={() =>
                  updateProductOption(pIdx, 'required', !po.required)
                }
              >
                <Ionicons
                  name={po.required ? 'checkbox' : 'square-outline'}
                  size={20}
                  color="#4f8cff"
                />
              </TouchableOpacity>
            </View>
            {po.options.map((opt, oIdx) => (
              <View
                key={oIdx}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: 4,
                }}
              >
                <TextInput
                  style={[styles.input, { flex: 1, marginBottom: 0 }]}
                  placeholder="Option Name"
                  value={opt.name}
                  onChangeText={(val) =>
                    updateOptionInProductOption(pIdx, oIdx, 'name', val)
                  }
                />
                <TextInput
                  style={[
                    styles.input,
                    { flex: 1, marginBottom: 0, marginLeft: 4 },
                  ]}
                  placeholder="Additional Cost"
                  value={opt.additionalCost}
                  onChangeText={(val) =>
                    updateOptionInProductOption(
                      pIdx,
                      oIdx,
                      'additionalCost',
                      val
                    )
                  }
                  keyboardType="decimal-pad"
                />
                <TouchableOpacity
                  onPress={() => removeOptionFromProductOption(pIdx, oIdx)}
                  style={{ marginLeft: 4 }}
                >
                  <Ionicons name="close-circle" size={20} color="#e74c3c" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              onPress={() => addOptionToProductOption(pIdx)}
              style={{ marginTop: 4 }}
            >
              <Text style={{ color: '#4f8cff' }}>+ Add Option</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => removeProductOption(pIdx)}
              style={{ marginTop: 4 }}
            >
              <Text style={{ color: '#e74c3c' }}>Remove Option Group</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity onPress={addProductOption} style={{ marginTop: 4 }}>
          <Text style={{ color: '#4f8cff' }}>+ Add Product Option Group</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Add Product</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
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
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  imagesPreviewRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 8,
    width: '100%',
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 8,
    marginBottom: 8,
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4f8cff',
    resizeMode: 'cover',
  },
  removeImageBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#fff',
    borderRadius: 10,
    zIndex: 2,
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
    marginTop: 8,
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
  pickerContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    width: '100%',
    height: 48,
  },
});
