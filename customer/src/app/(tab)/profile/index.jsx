import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../../constants';
import { getItems, deleteAccount } from '../../../utils/api';
import { handleLogout } from '../../../utils/authState';

const PROFILE_SCREENS = [
  { label: 'Orders', route: 'orders' },
  { label: 'Ratings & Reviews', route: 'reviews' },
  { label: 'Favorites', route: 'favorites' },
  { label: 'Settings', route: 'settings' },
];

export default function ProfileScreen() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    setLoading(true);
    const res = await getItems('users/me');
    if (res?.data?.data.data) {
      setUser(res.data.data.data);
    }
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchUser();
    setRefreshing(false);
  }, []);

  const handleLogoutPress = async () => {
    await handleLogout();
  };

  const handleDeleteAccountPress = async () => {
    Alert.alert('Deleting Your Account', 'Your account is being deleted...');
    await deleteAccount();
    await handleLogout();
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[COLORS.primary]}
        />
      }
    >
      <Text style={styles.sectionTitle}>Your Profile</Text>
      <View style={styles.userCardColumn}>
        <Image
          source={
            user?.image
              ? { uri: user.image }
              : require('../../../assets/logo.png')
          }
          style={styles.userImageLarge}
        />
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>Email: {user?.email}</Text>
        <Text style={styles.userEmail}>
          Account Type: {user?.role.toString().toUpperCase()}
        </Text>
        <Text style={styles.userMeta}>Age: {user?.age}</Text>
        <Text style={styles.userMeta}>Phone: +233-(0){user?.phone}</Text>
        <Text style={styles.userMeta}>Address: {user?.address}</Text>
        <View style={styles.verifiedRow}>
          <Text style={styles.userMeta}>Verified: </Text>
          {user?.isVerified ? (
            <Text style={styles.verifiedIcon}>Verified✔️</Text>
          ) : (
            <Text style={styles.notVerifiedIcon}>No Verified❌</Text>
          )}
        </View>
      </View>
      {/* Navigation Buttons */}
      <View style={styles.buttonList}>
        {PROFILE_SCREENS.map((screen) => (
          <TouchableOpacity
            key={screen.route}
            style={styles.navBtn}
            onPress={() => router.push(`/profile/${screen.route}`)}
          >
            <Text style={styles.navBtnText}>{screen.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Logout & Delete Account Buttons at Bottom */}
      <View style={styles.bottomBtns}>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            Alert.alert(
              'Logout',
              'Are you sure you want to logout?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Logout',
                  onPress: handleLogoutPress,
                  style: 'destructive',
                },
              ],
              { cancelable: false }
            );
          }}
        >
          <Text style={styles.logoutBtnText}>Logout</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteAccountBtn}
          onPress={() => {
            Alert.alert(
              'Delete Account',
              'Are you sure you want to delete your account? This action cannot be undone.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  onPress: handleDeleteAccountPress,
                  style: 'destructive',
                },
              ],
              { cancelable: false }
            );
          }}
        >
          <Text style={styles.deleteAccountBtnText}>Delete Account</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f6f8fa',
    paddingTop: 40,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 18,
    textAlign: 'center',
  },
  userCardColumn: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userImageLarge: {
    width: 140,
    height: 140,
    borderRadius: 40,
    marginBottom: 12,
    backgroundColor: '#eee',
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 17,
    color: '#666',
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 16,
    color: '#888',
    marginBottom: 2,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  verifiedIcon: {
    color: 'green',
    fontSize: 18,
    marginLeft: 4,
  },
  notVerifiedIcon: {
    color: 'red',
    fontSize: 18,
    marginLeft: 4,
  },
  buttonList: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  navBtn: {
    backgroundColor: COLORS.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
  },
  navBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  bottomBtns: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
    marginTop: 24,
  },
  logoutBtn: {
    backgroundColor: COLORS.tertiary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '45%',
  },
  logoutBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  deleteAccountBtn: {
    backgroundColor: COLORS.reddish,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    width: '45%',
  },
  deleteAccountBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
