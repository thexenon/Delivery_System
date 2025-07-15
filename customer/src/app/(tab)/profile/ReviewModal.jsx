import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { COLORS } from '../../../constants';

export default function ReviewModal({
  visible,
  onClose,
  onSubmit,
  productName,
  submitting,
}) {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(1);

  useEffect(() => {
    if (!visible) {
      setReview('');
      setRating(1);
    }
  }, [visible]);

  const handleSave = () => {
    if (review.trim() && rating && !submitting) {
      onSubmit({ review, rating });
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <Text style={styles.title}>Review: {productName}</Text>
          <Text style={styles.label}>Your Review</Text>
          <TextInput
            style={styles.input}
            value={review}
            onChangeText={setReview}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder="Type your review..."
            editable={!submitting}
          />
          <Text style={styles.label}>Rating</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((num) => (
              <TouchableOpacity
                key={num}
                style={[styles.star, rating >= num && styles.starActive]}
                onPress={() => !submitting && setRating(num)}
                disabled={submitting}
              >
                <Text style={styles.starText}>★</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.saveBtn}
              onPress={handleSave}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    alignItems: 'stretch',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  label: {
    fontSize: 15,
    color: '#444',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
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
  star: {
    padding: 4,
    marginHorizontal: 2,
  },
  starActive: {
    backgroundColor: '#ffe5b4',
    borderRadius: 6,
  },
  starText: {
    fontSize: 22,
    color: '#f5a623',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelBtn: {
    backgroundColor: '#eee',
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelText: {
    color: '#444',
    fontWeight: 'bold',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
