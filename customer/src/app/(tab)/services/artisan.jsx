import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getItems, updateItem, deleteItems } from '../../../utils/api';
import { COLORS, FONT, SIZES, SHADOWS } from '../../../constants';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

export default function ArtisanReviewsScreen() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editReview, setEditReview] = useState(null);
  const [editText, setEditText] = useState('');
  const [editRating, setEditRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    setError(null);
    const userId = await AsyncStorage.getItem('userUID');
    const res = await getItems('artisanreviews', { user: userId });
    if (res.status !== 200) {
      setError(res.message || 'Failed to fetch reviews');
      setLoading(false);
      return;
    }
    setReviews(res.data.data.data);
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchReviews();
    setRefreshing(false);
  };

  const handleEdit = (review) => {
    setEditReview(review);
    setEditText(review.review);
    setEditRating(review.rating);
    setEditModalVisible(true);
  };

  const handleEditSubmit = async () => {
    if (!editText.trim() || editRating < 1 || editRating > 5) return;
    setSubmitting(true);
    await updateItem('artisanreviews', editReview._id, {
      review: editText,
      rating: editRating,
    });
    setSubmitting(false);
    setEditModalVisible(false);
    fetchReviews();
  };

  const handleDelete = (reviewId) => {
    Alert.alert(
      'Delete Review',
      'Are you sure you want to delete this review?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteItems(`artisanreviews/${reviewId}`);
            fetchReviews();
          },
        },
      ]
    );
  };

  const renderReview = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="person" size={28} color={COLORS.primary} />
        <Text style={styles.title}>
          {item.artisanShop?.name || 'Artisan Shop'}
        </Text>
        <Text style={styles.rating}>{item.rating}/5</Text>
      </View>
      <Text style={styles.desc}>Service: {item.service?.name}</Text>
      <Text style={styles.desc}>{item.review}</Text>
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleEdit(item)}
        >
          <MaterialIcons name="edit" size={20} color={COLORS.primary} />
          <Text style={styles.actionText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleDelete(item._id)}
        >
          <MaterialIcons name="delete" size={20} color={COLORS.red} />
          <Text style={[styles.actionText, { color: COLORS.red }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={reviews}
        keyExtractor={(item) => item._id}
        renderItem={renderReview}
        ListEmptyComponent={<Text style={styles.error}>No reviews found.</Text>}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Review</Text>
            <TextInput
              style={styles.input}
              value={editText}
              onChangeText={setEditText}
              placeholder="Edit your review..."
              multiline
            />
            <View style={styles.ratingRow}>
              {[...Array(5)].map((_, i) => (
                <TouchableOpacity key={i} onPress={() => setEditRating(i + 1)}>
                  <MaterialIcons
                    name={i < editRating ? 'star' : 'star-border'}
                    size={28}
                    color={COLORS.primary}
                  />
                </TouchableOpacity>
              ))}
              <Text style={{ marginLeft: 8 }}>{editRating}/5</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalBtn}
                onPress={handleEditSubmit}
                disabled={submitting}
              >
                <Text style={styles.modalBtnText}>
                  {submitting ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: COLORS.gray2 }]}
                onPress={() => setEditModalVisible(false)}
                disabled={submitting}
              >
                <Text
                  style={[styles.modalBtnText, { color: COLORS.secondary }]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightWhite,
    paddingTop: 20,
    paddingHorizontal: 12,
    paddingBottom: 10,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: SIZES.large,
    fontFamily: FONT.bold,
    color: COLORS.secondary,
    marginLeft: 8,
    flex: 1,
  },
  rating: {
    backgroundColor: COLORS.primary,
    color: '#fff',
    fontWeight: 'bold',
    fontSize: SIZES.small,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 8,
  },
  desc: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 18,
  },
  actionText: {
    marginLeft: 4,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  error: {
    color: 'red',
    fontSize: SIZES.medium,
    textAlign: 'center',
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    ...SHADOWS.medium,
  },
  modalTitle: {
    fontSize: SIZES.large,
    fontFamily: FONT.bold,
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    padding: 10,
    backgroundColor: COLORS.lightWhite,
    marginBottom: 12,
    fontSize: SIZES.medium,
    color: COLORS.secondary,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
    marginHorizontal: 8,
  },
  modalBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: SIZES.medium,
    textAlign: 'center',
  },
});
