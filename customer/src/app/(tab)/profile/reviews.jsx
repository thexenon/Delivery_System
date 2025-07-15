import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import { getItems, updateItem, deleteItems } from '../../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../../../constants';
import ErrorView from '../../../components/ErrorView';
import { Feather } from '@expo/vector-icons';

const StarRating = ({ rating }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
    {[1, 2, 3, 4, 5].map((num) => (
      <Text
        key={num}
        style={{
          color: num <= rating ? '#f5a623' : '#ccc',
          fontSize: 18,
        }}
      >
        ★
      </Text>
    ))}
  </View>
);

export default function ReviewsScreen() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [editReview, setEditReview] = useState(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(1);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    const userUID = await AsyncStorage.getItem('userUID');
    const res = await getItems('reviews', { user: userUID });
    if (res?.data?.data.data) setReviews(res.data.data.data);
    else setReviews([]);
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchReviews();
    setRefreshing(false);
  }, []);

  const openEditModal = (review) => {
    setEditReview(review);
    setEditText(review.review);
    setEditRating(review.rating);
    setEditModal(true);
  };

  const handleEditSave = async () => {
    setLoading(true);
    await updateItem('reviews', editReview._id, {
      review: editText,
      rating: editRating,
    });
    setEditModal(false);
    setEditReview(null);
    setEditText('');
    setEditRating(1);
    fetchReviews();
    setLoading(false);
  };

  const handleDelete = async (id) => {
    setLoading(true);
    await deleteItems(`reviews/${id}`);
    fetchReviews();
    setLoading(false);
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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      {reviews.length === 0 ? (
        <ErrorView msg={'No reviews found.'} />
      ) : (
        reviews.map((review) => (
          <View key={review._id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Image
                source={
                  review.product?.images[0]
                    ? { uri: review.product.images[0] }
                    : require('../../../assets/logo.png')
                }
                style={styles.productImage}
              />
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.productName}>{review.product?.name}</Text>
                <Text style={styles.storeName}>{review.store?.name}</Text>
                <StarRating rating={review.rating} />
              </View>
            </View>
            <Text style={styles.reviewText}>{review.review}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => openEditModal(review)}
              >
                <Feather name="edit-2" size={20} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={() => handleDelete(review._id)}
              >
                <Feather name="trash-2" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
      <Modal
        visible={editModal}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Review</Text>
            <Text style={styles.modalLabel}>Review</Text>
            <TextInput
              style={styles.modalInput}
              value={editText}
              onChangeText={setEditText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholder="Type your review..."
            />
            <Text style={styles.modalLabel}>Rating</Text>
            <View style={styles.ratingRow}>
              {[1, 2, 3, 4, 5].map((num) => (
                <TouchableOpacity
                  key={num}
                  style={[
                    styles.ratingStar,
                    editRating >= num && styles.ratingStarActive,
                  ]}
                  onPress={() => setEditRating(num)}
                >
                  <Text style={styles.ratingStarText}>★</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancel}
                onPress={() => setEditModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSave}
                onPress={handleEditSave}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#f6f8fa',
    padding: 16,
    flex: 1,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  productName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  storeName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  reviewText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 8,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginTop: 8,
  },
  editBtn: {
    backgroundColor: '#6c6',
    padding: 8,
    borderRadius: 8,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  deleteBtn: {
    backgroundColor: '#c66',
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'stretch',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 15,
    color: '#444',
    marginTop: 8,
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#f6f8fa',
    borderRadius: 8,
    padding: 10,
    minHeight: 70,
    fontSize: 15,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#eee',
    textAlignVertical: 'top',
  },
  ratingRow: {
    flexDirection: 'row',
    marginBottom: 12,
    marginTop: 2,
  },
  ratingStar: {
    padding: 4,
    marginHorizontal: 2,
  },
  ratingStarActive: {
    backgroundColor: '#ffe5b4',
    borderRadius: 6,
  },
  ratingStarText: {
    fontSize: 22,
    color: '#f5a623',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  modalCancel: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#444',
    fontWeight: 'bold',
  },
  modalSave: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
