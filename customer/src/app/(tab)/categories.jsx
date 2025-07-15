import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  TextInput,
  RefreshControl,
  Animated,
} from 'react-native';
import { getItems } from '../../utils/api';
import { COLORS, FONT, SIZES, SHADOWS, images } from '../../constants';
import ErrorView from '../../components/ErrorView';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';

export default function CategoryScreen() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showAll, setShowAll] = useState({});
  const [selectedSub, setSelectedSub] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catRes, prodRes] = await Promise.all([
        getItems('categories'),
        getItems('products'),
      ]);
      if (catRes.status !== 200 && prodRes.status !== 200) {
        setError('Failed to load categories or products');
        setLoading(false);
        return;
      }
      setCategories(catRes.data.data.data);
      setProducts(prodRes.data.data.data);
      setSelected(catRes.data.data.data[0]?._id || null);
    } catch (e) {
      setError('Failed to load categories or products');
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.center}>
        <ErrorView msg={error} />
      </View>
    );
  }

  // Filtered categories by search, sorted alphabetically
  const filteredCategories = categories
    .filter((cat) => cat.name?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Category grid (modern look)
  const renderCategory = ({ item }) => {
    const count = products.filter((p) => {
      const catId = p.category?._id || p.category;
      return catId === item._id;
    }).length;
    return (
      <TouchableOpacity
        style={[
          styles.catCard,
          selected === item._id && styles.catCardSelected,
        ]}
        onPress={() => setSelected(item._id)}
        activeOpacity={0.8}
      >
        <Text style={styles.catName}>{item.name}</Text>
        <Text style={styles.catCount}>{count} products</Text>
      </TouchableOpacity>
    );
  };

  // Subcategories for selected category, sorted alphabetically
  const selectedCategory = categories.find((c) => c._id === selected);
  const subcategories = Array.isArray(selectedCategory?.subcategory)
    ? [...selectedCategory.subcategory].sort((a, b) => a.localeCompare(b))
    : [];

  // Subcategory chips
  const subChips = (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.subChipsRow}
    >
      <TouchableOpacity
        style={[styles.subChip, !selectedSub && styles.subChipActive]}
        onPress={() => setSelectedSub('')}
      >
        <Text
          style={[styles.subChipText, !selectedSub && styles.subChipTextActive]}
        >
          All
        </Text>
      </TouchableOpacity>
      {subcategories.map((sub) => (
        <TouchableOpacity
          key={sub}
          style={[styles.subChip, selectedSub === sub && styles.subChipActive]}
          onPress={() => setSelectedSub(sub)}
        >
          <Text
            style={[
              styles.subChipText,
              selectedSub === sub && styles.subChipTextActive,
            ]}
          >
            {sub}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Filtered products for selected category/subcategory
  let filteredProducts = products.filter((p) => {
    const catId = p.category?._id || p.category;
    return catId === selected;
  });
  if (selectedSub) {
    filteredProducts = filteredProducts.filter(
      (p) => p.subcategory === selectedSub
    );
  }

  // Limit products shown unless 'View All' is toggled
  const showCount = showAll[selected] ? filteredProducts.length : 6;
  const productsToShow = filteredProducts.slice(0, showCount);

  // Product card
  const renderProduct = ({ item }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/home/product-details/${item._id}`)}
      activeOpacity={0.85}
    >
      <Image
        source={{ uri: item.images[0] || images.logo }}
        style={styles.productImage}
      />
      <Text style={styles.productName}>{item.name}</Text>
      <Text style={styles.productStore}>{item.store?.name}</Text>
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}
      >
        <Text style={styles.priceDiscount}>${item.price} </Text>
        <Text style={styles.price}>${item.priceFinal} </Text>
        {item.priceDiscountPercent && (
          <Text style={styles.priceDP}>{item.priceDiscountPercent}%Off</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Hero/banner */}
      <View style={styles.heroBanner}>
        <Text style={styles.heroTitle}>Browse Categories</Text>
        <Text style={styles.heroSubtitle}>
          Find products by category and subcategory
        </Text>
        <View style={styles.searchBarRow}>
          <MaterialIcons
            name="search"
            size={22}
            color={COLORS.gray}
            style={{ marginRight: 6 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            placeholderTextColor={COLORS.gray}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>
      {/* Category grid */}
      <FlatList
        data={filteredCategories}
        keyExtractor={(item) => item._id}
        renderItem={renderCategory}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.catGrid}
        style={{ marginBottom: 8 }}
      />
      {/* Subcategory chips */}
      {subcategories.length > 0 && subChips}
      {/* Product grid */}
      <FlatList
        data={productsToShow}
        keyExtractor={(item) => item._id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={renderProduct}
        ListEmptyComponent={<ErrorView msg={'No products found.'} />}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
      {/* View All toggle */}
      {filteredProducts.length > 6 && (
        <TouchableOpacity
          style={styles.viewAllBtn}
          onPress={() =>
            setShowAll((prev) => ({ ...prev, [selected]: !prev[selected] }))
          }
        >
          <Text style={styles.viewAllText}>
            {showAll[selected] ? 'Show Less' : 'View All'}
          </Text>
        </TouchableOpacity>
      )}
      {/* Floating cart button */}
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/cart')}>
        <MaterialIcons name="shopping-cart" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightWhite,
    paddingTop: 0,
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightWhite,
  },
  heroBanner: {
    backgroundColor: COLORS.primary,
    borderRadius: 18,
    padding: 18,
    marginTop: 18,
    marginBottom: 18,
    alignItems: 'center',
    ...SHADOWS.small,
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    alignItems: 'center',
    ...SHADOWS.small,
  },
  heroTitle: {
    fontSize: SIZES.xxLarge,
    fontFamily: FONT.bold,
    color: COLORS.white,
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: SIZES.large,
    color: COLORS.white,
    marginBottom: 4,
    textAlign: 'center',
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 8,
    ...SHADOWS.small,
  },
  searchInput: {
    flex: 1,
    fontSize: SIZES.medium,
    color: COLORS.secondary,
  },
  catGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  catCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 12,
    padding: 12,
    width: 110,
    marginTop: 8,
    marginBottom: 8,
    ...SHADOWS.small,
  },
  catCardSelected: {
    backgroundColor: COLORS.primary,
  },
  catName: {
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    textAlign: 'center',
    marginBottom: 2,
    fontFamily: FONT.bold,
  },
  catCount: {
    fontSize: SIZES.xSmall,
    color: COLORS.black,
    marginBottom: 2,
  },
  subChipsRow: {
    flexDirection: 'row',
    marginBottom: 10,
    marginLeft: 2,
  },
  subChip: {
    backgroundColor: COLORS.gray2,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginRight: 8,
    paddingBottom: 10,
  },
  subChipActive: {
    backgroundColor: COLORS.primary,
  },
  subChipText: {
    color: COLORS.secondary,
    fontFamily: FONT.medium,
    fontSize: SIZES.medium,
    paddingVertical: 10,
  },
  subChipTextActive: {
    color: COLORS.white,
    fontWeight: 'bold',
  },
  productCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    width: '48%',
    ...SHADOWS.small,
  },
  productImage: {
    width: '100%',
    height: 100,
    borderRadius: 10,
    backgroundColor: COLORS.gray2,
    marginBottom: 6,
  },
  productName: {
    fontSize: SIZES.medium,
    fontFamily: FONT.bold,
    color: COLORS.secondary,
  },
  productStore: { fontSize: SIZES.small, color: COLORS.gray },
  price: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
    fontFamily: FONT.bold,
    marginTop: 2,
  },
  priceDP: {
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    marginTop: 2,
    fontWeight: 'bold',
  },
  priceDiscount: {
    fontSize: SIZES.medium,
    color: COLORS.tertiary,
    marginTop: 2,
    textDecorationLine: 'line-through',
    fontWeight: 'bold',
  },
  viewAllBtn: {
    alignSelf: 'center',
    marginVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
    ...SHADOWS.small,
  },
  viewAllText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: SIZES.medium,
  },
  fab: {
    position: 'absolute',
    bottom: 70,
    right: 24,
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.medium,
    zIndex: 10,
  },
});
