import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getItemById } from '../utils/api';
import ErrorView from '../../components/ErrorView';

export default function ProductDetailsScreen() {
  const { productId } = useLocalSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageIndex, setImageIndex] = useState(0);
  const router = useRouter();
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const res = await getItemById('products', productId);
        setProduct(res?.data?.data?.data);
      } catch (err) {
        setError(err.message || 'Failed to load product details');
      }
      setLoading(false);
    })();
  }, [productId]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4f8cff" />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.centered}>
        <ErrorView msg={error} />
      </View>
    );
  }
  if (!product) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
        <Ionicons name="arrow-back" size={24} color="#4f8cff" />
        <Text style={styles.backBtnText}>Back</Text>
      </TouchableOpacity>
      <Text style={styles.title}>Product Details</Text>
      {product.images && product.images.length > 0 && (
        <View style={styles.sliderContainer}>
          <Image
            source={{ uri: product.images[imageIndex] }}
            style={[styles.productImage, { width: screenWidth - 48 }]}
          />
          <View style={styles.sliderBtnRow}>
            <TouchableOpacity
              style={[
                styles.sliderBtn,
                imageIndex === 0 && styles.sliderBtnDisabled,
              ]}
              onPress={() => setImageIndex((prev) => Math.max(prev - 1, 0))}
              disabled={imageIndex === 0}
            >
              <Ionicons
                name="chevron-back"
                size={28}
                color={imageIndex === 0 ? '#ccc' : '#4f8cff'}
              />
            </TouchableOpacity>
            <Text style={styles.sliderIndicator}>
              {imageIndex + 1} / {product.images.length}
            </Text>
            <TouchableOpacity
              style={[
                styles.sliderBtn,
                imageIndex === product.images.length - 1 &&
                  styles.sliderBtnDisabled,
              ]}
              onPress={() =>
                setImageIndex((prev) =>
                  Math.min(prev + 1, product.images.length - 1)
                )
              }
              disabled={imageIndex === product.images.length - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={28}
                color={
                  imageIndex === product.images.length - 1 ? '#ccc' : '#4f8cff'
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
      <View style={styles.detailsCard}>
        <Text style={styles.label}>Name:</Text>
        <Text style={styles.value}>{product.name}</Text>
        <Text style={styles.label}>Description:</Text>
        <Text style={styles.value}>{product.description}</Text>
        <Text style={styles.label}>Summary:</Text>
        <Text style={styles.value}>{product.summary}</Text>
        <Text style={styles.label}>Price:</Text>
        <Text style={styles.value}>GHS {product.price?.toLocaleString()}</Text>
        {product.priceDiscount && (
          <>
            <Text style={styles.label}>Discount Price:</Text>
            <Text style={styles.value}>
              GHS {product.priceDiscount?.toLocaleString()}
            </Text>
          </>
        )}
        <Text style={styles.label}>Stock:</Text>
        <Text style={styles.value}>{product.stock}</Text>
        <Text style={styles.label}>Category:</Text>
        <Text style={styles.value}>
          {product.category?.name || product.category}
        </Text>
        <Text style={styles.label}>Subcategory:</Text>
        <Text style={styles.value}>
          {product.subcategory || product.subCategory}
        </Text>
        <Text style={styles.label}>Duration (packing time):</Text>
        <Text style={styles.value}>{product.duration} min</Text>
        <Text style={styles.label}>Max Order:</Text>
        <Text style={styles.value}>{product.maxOrder}</Text>
        {product.varieties && product.varieties.length > 0 && (
          <>
            <Text style={styles.label}>Varieties:</Text>
            {product.varieties.map((v, idx) => (
              <Text key={idx} style={styles.value}>
                - {v.name} (Diff: GHS {v.priceDifference})
              </Text>
            ))}
          </>
        )}
        {product.productoptions && product.productoptions.length > 0 && (
          <>
            <Text style={styles.label}>Product Options:</Text>
            {product.productoptions.map((po, idx) => (
              <View key={idx} style={{ marginBottom: 4 }}>
                <Text style={styles.value}>
                  - {po.name} {po.required ? '(Required)' : ''}
                </Text>
                {po.options &&
                  po.options.map((opt, oidx) => (
                    <Text key={oidx} style={[styles.value, { marginLeft: 12 }]}>
                      • {opt.name} (+GHS {opt.additionalCost})
                    </Text>
                  ))}
              </View>
            ))}
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#f6f8fa',
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f8fa',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
    alignSelf: 'center',
  },
  label: {
    fontWeight: 'bold',
    color: '#444',
    marginTop: 12,
  },
  value: {
    color: '#222',
    fontSize: 16,
    marginBottom: 4,
  },
  sliderContainer: {
    alignItems: 'center',
    marginBottom: 18,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#4f8cff',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  sliderBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 12,
  },
  sliderBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#eaf2ff',
  },
  sliderBtnDisabled: {
    backgroundColor: '#f0f0f0',
  },
  sliderIndicator: {
    fontWeight: 'bold',
    color: '#4f8cff',
    fontSize: 16,
    marginHorizontal: 8,
  },
  productImage: {
    height: 220,
    borderRadius: 12,
    alignSelf: 'center',
    marginBottom: 0,
    resizeMode: 'cover',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#4f8cff',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    color: '#4f8cff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 16,
  },
});
