import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { COLORS, FONT, SIZES } from '../constants';

export default function LocationPickerModal({ visible, onClose, onSelect }) {
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [region, setRegion] = useState({
    latitude: 6.6745,
    longitude: -1.5716,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });
  const [selectedLocation, setSelectedLocation] = useState(null);

  const handleSearch = async () => {
    if (!search) return;
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          search
        )}`
      );
      const data = await res.json();
      setSearchResults(data);
    } catch (e) {
      setSearchResults([]);
    }
    setLoading(false);
  };

  const getStreetName = async (lat, lon) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`
      );
      const data = await res.json();
      return (
        data.address?.road ||
        data.address?.suburb ||
        data.address?.neighbourhood ||
        data.address?.village ||
        data.address?.county ||
        data.address?.town ||
        data.address?.city ||
        data.display_name ||
        ''
      );
    } catch {
      return '';
    }
  };

  const handleSelectResult = async (item) => {
    setRegion({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    const street = await getStreetName(item.lat, item.lon);
    setSelectedLocation({
      latitude: parseFloat(item.lat),
      longitude: parseFloat(item.lon),
      address: street,
    });
    setSearchResults([]);
    setSearch(item.display_name);
  };

  const handleMapPress = async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    const street = await getStreetName(latitude, longitude);
    setSelectedLocation({ latitude, longitude, address: street });
    setRegion({ ...region, latitude, longitude });
  };

  const handleConfirm = () => {
    if (selectedLocation) {
      // Always pass address as 'address' field
      onSelect({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: selectedLocation.address || search || '',
      });
      onClose();
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Select Delivery Location</Text>
          <TextInput
            style={styles.input}
            placeholder="Search for a location..."
            placeholderTextColor={'#000'}
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Text style={styles.searchBtnText}>Search</Text>
          </TouchableOpacity>
          {loading && <ActivityIndicator color={COLORS.primary} />}
          {searchResults.length > 0 && (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.place_id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.resultItem}
                  onPress={() => handleSelectResult(item)}
                >
                  <Text style={styles.resultText}>{item.display_name}</Text>
                </TouchableOpacity>
              )}
              style={{ maxHeight: 120 }}
            />
          )}
          <MapView style={styles.map} region={region} onPress={handleMapPress}>
            {selectedLocation && (
              <Marker
                coordinate={{
                  latitude: selectedLocation.latitude,
                  longitude: selectedLocation.longitude,
                }}
                title="Selected Location"
                description={selectedLocation.address}
              />
            )}
          </MapView>
          {selectedLocation && (
            <View style={{ marginBottom: 8, alignItems: 'center' }}>
              <Text style={{ color: COLORS.primary, fontFamily: FONT.bold }}>
                Coordinates: {selectedLocation.latitude.toFixed(6)},{' '}
                {selectedLocation.longitude.toFixed(6)}
              </Text>
              <Text
                style={{
                  color: COLORS.secondary,
                  fontSize: SIZES.medium,
                  textAlign: 'center',
                }}
              >
                {selectedLocation.address
                  ? selectedLocation.address
                  : 'No address (tap search result for address)'}
              </Text>
            </View>
          )}
          <View style={styles.btnRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.confirmBtn, !selectedLocation && { opacity: 0.5 }]}
              onPress={handleConfirm}
              disabled={!selectedLocation}
            >
              <Text style={styles.confirmBtnText}>Confirm Location</Text>
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    width: '92%',
    maxHeight: '95%',
    alignItems: 'stretch',
  },
  title: {
    fontSize: SIZES.large,
    fontFamily: FONT.bold,
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray2,
    borderRadius: 8,
    padding: 8,
    marginBottom: 6,
    fontSize: SIZES.medium,
    color: COLORS.secondary,
  },
  searchBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginBottom: 6,
  },
  searchBtnText: {
    color: COLORS.white,
    fontFamily: FONT.bold,
    fontSize: SIZES.medium,
  },
  resultItem: {
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray2,
    backgroundColor: COLORS.lightWhite,
  },
  resultText: {
    color: COLORS.secondary,
    fontSize: SIZES.medium,
  },
  map: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginVertical: 8,
  },
  btnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  cancelBtn: {
    backgroundColor: COLORS.gray2,
    borderRadius: 8,
    padding: 10,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: COLORS.secondary,
    fontFamily: FONT.bold,
  },
  confirmBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    padding: 10,
    flex: 1,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: COLORS.white,
    fontFamily: FONT.bold,
  },
});
