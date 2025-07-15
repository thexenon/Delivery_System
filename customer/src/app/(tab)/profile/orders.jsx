import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Image,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { getItems, submitPost } from '../../../utils/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS, SIZES } from '../../../constants';
import ErrorView from '../../../components/ErrorView';
import ReviewModal from './ReviewModal';

export default function OrdersScreen() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reviewModal, setReviewModal] = useState({
    visible: false,
    product: null,
    order: null,
  });
  const [submitting, setSubmitting] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetchOrders();
    fetchUserReviews();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const userUID = await AsyncStorage.getItem('userUID');
    const res = await getItems('orderItems', { user: userUID });
    console.log('====================================');
    console.log('Fetched orders:', res?.data?.data?.data);
    console.log('====================================');
    if (res?.data?.data?.data) {
      const sorted = [...res.data.data.data].sort((a, b) =>
        a.status.localeCompare(b.status)
      );
      setOrders(sorted);
    } else {
      setOrders([]);
    }
    setLoading(false);
  };

  const fetchUserReviews = async () => {
    const userUID = await AsyncStorage.getItem('userUID');
    const res = await getItems('reviews', { user: userUID });
    if (res?.data?.data?.data) setUserReviews(res.data.data.data);
    else setUserReviews([]);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, []);

  const handleOpenReview = (order) => {
    setReviewModal({ visible: true, product: order.product, order });
  };

  const handleSubmitReview = async ({ review, rating }) => {
    setSubmitting(true);
    const userUID = await AsyncStorage.getItem('userUID');
    try {
      const data = {
        review,
        rating,
        product: reviewModal.product?._id,
        store: reviewModal?.order?.store || reviewModal?.order?.store?._id,
        user: userUID,
      };

      console.log('====================================');
      console.log(data);
      console.log('====================================');
      await submitPost(data, 'reviews').then(async (res) => {
        console.log('====================================');
        console.log('Failed to submit review:', res);
        console.log('====================================');
        if (res.status === 201 || res.status === 200) {
          await fetchUserReviews();
        } else {
          setReviewModal({ visible: false, product: null, order: null });
          Alert.alert('Failed', res.message || 'Failed to submit review');
        }
      });
    } finally {
      setSubmitting(false);
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
    <View style={styles.container}>
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
        {orders.length === 0 ? (
          <ErrorView msg={'No orders found.'} />
        ) : (
          orders.map((order) => {
            const alreadyReviewed = userReviews.some(
              (r) =>
                r.product === order.product?._id ||
                r.product?._id === order.product?._id
            );
            return (
              <View key={order._id} style={styles.card}>
                <View style={styles.cardHeader}>
                  {order.product?.images && (
                    <Image
                      source={
                        order.product?.images[0]
                          ? { uri: order.product.images[0] }
                          : require('../../../assets/logo.png')
                      }
                      style={styles.productImage}
                    />
                  )}
                  <View style={{ flex: 1, marginLeft: 16 }}>
                    <Text style={styles.productName}>
                      {order.product?.name}
                    </Text>
                    <Text style={styles.storeName}>{order.store?.name}</Text>
                    <Text
                      style={[
                        styles.status,
                        styles[`status_${order.status}`] ||
                          styles.status_default,
                      ]}
                    >
                      {order.status}
                    </Text>
                  </View>
                </View>
                <View style={styles.cardDetails}>
                  <Text style={styles.detailText}>
                    Order ID: <Text style={styles.bold}>{order.order}</Text>
                  </Text>
                </View>
                <View style={styles.cardDetails}>
                  <Text style={styles.detailText}>
                    Variety:{' '}
                    <Text style={styles.bold}>
                      {order.variety ? order.variety : '-'}
                    </Text>
                  </Text>
                </View>
                <View style={styles.cardDetails}>
                  <Text style={styles.detailText}>
                    Preference:{' '}
                    <Text style={styles.bold}>
                      {order.preference ? order.preference : '-'}
                    </Text>
                  </Text>
                </View>
                <View style={styles.cardDetails}>
                  <Text style={styles.detailText}>
                    Amount: <Text style={styles.bold}>₦{order.amount}</Text>
                  </Text>
                  <Text style={styles.detailText}>
                    Quantity: <Text style={styles.bold}>{order.quantity}</Text>
                  </Text>
                </View>
                <View style={styles.cardDetails}>
                  <Text style={styles.detailText}>
                    Date of Order:{' '}
                    <Text style={styles.bold}>
                      {new Date(order.createdAt).toLocaleString()}
                    </Text>
                  </Text>
                </View>
                {order.status === 'delivered' && !alreadyReviewed && (
                  <TouchableOpacity
                    style={styles.reviewBtn}
                    onPress={() => handleOpenReview(order)}
                    disabled={submitting}
                  >
                    <Text style={styles.reviewBtnText}>Submit Review</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={() => {
                    setSelectedOrder(order);
                    setModalVisible(true);
                  }}
                  style={styles.orderDetailsBtn}
                >
                  <Text style={styles.orderDetailsBtnText}>View Details</Text>
                </TouchableOpacity>
              </View>
            );
          })
        )}
        <ReviewModal
          visible={reviewModal.visible}
          onClose={() =>
            !submitting &&
            setReviewModal({ visible: false, product: null, order: null })
          }
          onSubmit={handleSubmitReview}
          productName={reviewModal.product?.name}
          submitting={submitting}
        />
        {submitting && (
          <View style={styles.submittingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      </ScrollView>
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Order Details</Text>
          <ScrollView>
            {selectedOrder && (
              <>
                <Text style={styles.modalLabel}>Order ID:</Text>
                <Text style={styles.modalValue}>{selectedOrder._id}</Text>
                <Text style={styles.modalLabel}>Date:</Text>
                <Text style={styles.modalValue}>
                  {new Date(selectedOrder.createdAt).toLocaleString()}
                </Text>
                <Text style={styles.modalLabel}>Status:</Text>
                <Text style={styles.modalValue}>{selectedOrder.status}</Text>
                <Text style={styles.modalLabel}>Total:</Text>
                <Text style={styles.modalValue}>
                  ₦{selectedOrder.amount?.toLocaleString()}
                </Text>
                {/* Products details */}
                {selectedOrder.product && (
                  <>
                    <Text style={styles.modalLabel}>Product Details:</Text>
                    <View style={styles.productDetailCard}>
                      <Text style={styles.modalValue}>
                        - {selectedOrder.product.name}
                      </Text>
                      {selectedOrder.store && (
                        <Text style={styles.modalSubValue}>
                          Store: {selectedOrder.store.name}
                        </Text>
                      )}
                      {selectedOrder.quantity && (
                        <Text style={styles.modalSubValue}>
                          Quantity: {selectedOrder.quantity}
                        </Text>
                      )}
                      {selectedOrder.preference && (
                        <Text style={styles.modalSubValue}>
                          Preference: {selectedOrder.preference}
                        </Text>
                      )}
                      {selectedOrder.variety && (
                        <Text style={styles.modalSubValue}>
                          Variety: {selectedOrder.variety}
                        </Text>
                      )}
                      {selectedOrder.options &&
                        Object.keys(selectedOrder.options).length > 0 && (
                          <Text style={styles.modalSubValue}>
                            Options:{' '}
                            {Object.entries(selectedOrder.product.options)
                              .map(
                                ([k, v]) =>
                                  `${k}: ${Array.isArray(v) ? v.join(', ') : v}`
                              )
                              .join('; ')}
                          </Text>
                        )}
                      {selectedOrder.orderoptions &&
                        Array.isArray(selectedOrder.orderoptions) &&
                        selectedOrder.orderoptions.length > 0 && (
                          <Text style={styles.modalSubValue}>
                            Options:{' '}
                            {selectedOrder.orderoptions
                              .map(
                                (opt) =>
                                  `${opt.name}: ${opt.options
                                    .map(
                                      (o) => `${o.optionname} (${o.quantity})`
                                    )
                                    .join(', ')}`
                              )
                              .join('; ')}
                          </Text>
                        )}
                    </View>
                  </>
                )}
                {selectedOrder.address && (
                  <>
                    <Text style={styles.modalLabel}>Address:</Text>
                    <Text style={styles.modalValue}>
                      {selectedOrder.address}
                    </Text>
                  </>
                )}
                {/* Rider details if not delivered */}
                {selectedOrder.status !== 'delivered' &&
                  selectedOrder.rider && (
                    <View style={styles.riderCard}>
                      <Text style={styles.modalLabel}>Rider Details:</Text>
                      {selectedOrder.rider.image && (
                        <Image
                          source={{ uri: selectedOrder.rider.image }}
                          style={styles.riderImage}
                        />
                      )}
                      <Text style={styles.modalSubValue}>
                        Name: {selectedOrder.rider.name}
                      </Text>
                      <Text style={styles.modalSubValue}>
                        Phone: +233{selectedOrder.rider.phone}
                      </Text>
                    </View>
                  )}
              </>
            )}
          </ScrollView>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setModalVisible(false)}
          >
            <Text style={styles.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
  },
  section: {
    backgroundColor: '#f6f8fa',
    padding: 16,
    flex: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    marginTop: 32,
    fontSize: 16,
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
    marginBottom: 10,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
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
  status: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
    textTransform: 'capitalize',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  status_pending: { backgroundColor: '#ffe5b4', color: '#b26a00' },
  status_accepted: { backgroundColor: '#d4f7dc', color: '#1b7f32' },
  status_delivered: { backgroundColor: '#d4eaff', color: '#005fa3' },
  status_cancelled: { backgroundColor: '#ffd6d6', color: '#a30000' },
  status_default: { backgroundColor: '#eee', color: '#888' },
  cardDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  detailText: {
    fontSize: 15,
    color: '#444',
  },
  bold: {
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  reviewBtn: {
    backgroundColor: COLORS.primary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  reviewBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submittingOverlay: {
    position: 'absolute',
    left: 0,
    top: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  orderDetailsBtn: {
    backgroundColor: COLORS.secondary,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  orderDetailsBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  modalTitle: {
    fontSize: SIZES.xLarge,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
    marginTop: 10,
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  modalValue: {
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    marginBottom: 4,
  },
  closeBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  closeBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  productDetailCard: {
    backgroundColor: COLORS.lightWhite,
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  modalSubValue: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
    marginLeft: 8,
    marginBottom: 2,
  },
  riderCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  riderImage: {
    width: 90,
    height: 90,
    borderRadius: 30,
    marginBottom: 8,
    backgroundColor: COLORS.gray2,
  },
});
