import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { getItems, deleteItems } from '../../utils/api';
import ErrorView from '../../../components/ErrorView';

export default function ServicesScreen() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await AsyncStorage.getItem('jwt');
      const userUID = await AsyncStorage.getItem('userUID');
      if (!token || !userUID) throw new Error('User not authenticated');
      // Fetch services for this merchant
      const res = await getItems('services', { artisan: userUID });
      const servicesData = res?.data?.data?.data;
      setServices(servicesData);
    } catch (err) {
      setError(err.message || 'Failed to fetch services');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchServices();
  };

  const handleEdit = (id) => {
    router.push({ pathname: '/addnew/service', params: { serviceId: id } });
  };
  const handleView = (id) => {
    router.push({ pathname: '/details/service', params: { serviceId: id } });
  };
  const handleDelete = async (id) => {
    Alert.alert(
      'Delete Service',
      'Are you sure you want to delete this service?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await deleteItems(`services/${id}`);
              if (res.status === 204 || res.status === 'success') {
                Alert.alert('Success', 'Service deleted');
                fetchShops();
              } else {
                Alert.alert('Error', res.message || 'Failed to delete service');
              }
            } catch (err) {
              Alert.alert('Error', err.message || 'Failed to delete service');
            }
          },
        },
      ]
    );
    setLoading(false);
  };

  const renderService = ({ item }) => (
    <View style={styles.serviceCard}>
      <Image
        source={
          item.images && item.images.length > 0
            ? { uri: item.images[0] }
            : require('../../../assets/logo.png')
        }
        style={styles.serviceImage}
      />
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.serviceName}>{item.name}</Text>
        <Text style={styles.serviceDesc} numberOfLines={2}>
          {item.description}
        </Text>
        <Text style={styles.servicePrice}>
          GHS {item.price?.toLocaleString()}
        </Text>
        <View
          style={{
            flexDirection: 'row',
            marginTop: 8,
            gap: 8,
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#eaf2ff',
              borderRadius: 6,
              padding: 6,
              alignItems: 'center',
            }}
            onPress={() => handleView(item._id)}
          >
            <Ionicons name="eye-outline" size={18} color="#4f8cff" />
            <Text style={{ color: '#4f8cff', fontSize: 12 }}>View</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#eaf2ff',
              borderRadius: 6,
              padding: 6,
              alignItems: 'center',
            }}
            onPress={() => handleEdit(item._id)}
          >
            <Ionicons name="create-outline" size={18} color="#4f8cff" />
            <Text style={{ color: '#4f8cff', fontSize: 12 }}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: '#ffeaea',
              borderRadius: 6,
              padding: 6,
              alignItems: 'center',
            }}
            onPress={() => handleDelete(item._id)}
          >
            <Ionicons name="trash-outline" size={18} color="#e74c3c" />
            <Text style={{ color: '#e74c3c', fontSize: 12 }}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>📦 Services</Text>
      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/addnew/service')}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Add Service</Text>
        </TouchableOpacity>
      </View>
      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4f8cff"
          style={{ marginTop: 40 }}
        />
      ) : error ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <ErrorView msg={error} />
        </View>
      ) : services.length === 0 ? (
        <View style={{ alignItems: 'center', marginTop: 40 }}>
          <ErrorView msg={'No services found.'} />
        </View>
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item._id}
          renderItem={renderService}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
    paddingHorizontal: 16,
    paddingTop: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 18,
    color: '#222',
    alignSelf: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 18,
    gap: 12,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f8cff',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8,
    marginHorizontal: 6,
  },
  addBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  serviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#4f8cff',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  serviceImage: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#eaeaea',
  },
  serviceName: {
    fontWeight: 'bold',
    fontSize: 17,
    color: '#222',
    marginBottom: 2,
  },
  serviceDesc: {
    color: '#888',
    fontSize: 13,
    marginBottom: 2,
  },
  servicePrice: {
    color: '#4f8cff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
