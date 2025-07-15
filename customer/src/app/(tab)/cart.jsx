import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useCart } from '../../utils/CartContext';
import { getItemById, submitPost } from '../../utils/api';
import { COLORS, FONT, SIZES, SHADOWS, images } from '../../constants';
import LocationPickerModal from '../../components/LocationPickerModal';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function CartScreen() {
  const { cart, addOrUpdateCartItem, removeFromCart, clearCart } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productPreferences, setProductPreferences] = useState({});
  const [productVarieties, setProductVarieties] = useState({});
  const [productOptions, setProductOptions] = useState({});
  const [productQuantities, setProductQuantities] = useState({});
  const [optionQuantities, setOptionQuantities] = useState({});
  const [error, setError] = useState(null);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true);
      const prods = await Promise.all(
        cart.map(async (item) => {
          const res = await getItemById('products', item.product);
          if (res.status === 200) {
            return { ...res.data.data.data, ...item };
          }
          return null;
        })
      );
      setProducts(prods.filter(Boolean));
      setLoading(false);
    }
    if (cart.length > 0) fetchProducts();
    else setProducts([]);
  }, [cart]);

  // Calculate total
  useEffect(() => {
    let sum = 0;
    products.forEach((product) => {
      const qty = Number(
        productQuantities[product._id] || product.quantity || 1
      );
      let basePrice = product.priceFinal || product.price || 0;
      let varietyDiff = 0;
      if (product.varieties && productVarieties[product._id]) {
        const selectedVariety = product.varieties.find(
          (v) => v.name === productVarieties[product._id]
        );
        if (selectedVariety && selectedVariety.priceDifference) {
          varietyDiff = Number(selectedVariety.priceDifference);
        }
      }
      let productTotal = (basePrice + varietyDiff) * qty;
      // Add options prices
      const opts = product.productoptions || product.options || [];
      let optionsExtra = 0;
      opts.forEach((opt) => {
        const isObjectChoice =
          opt.options &&
          typeof opt.options[0] === 'object' &&
          opt.options[0] !== null;
        const selected = productOptions[product._id]?.[opt.name];
        // Required: single select
        if (opt.required) {
          if (selected) {
            let selectedChoiceObj = null;
            if (isObjectChoice) {
              selectedChoiceObj = opt.options.find(
                (c) => c._id === selected || c.id === selected
              );
            }
            const optQty =
              optionQuantities[product._id]?.[opt.name]?.[selected] || 1;
            if (
              isObjectChoice &&
              selectedChoiceObj &&
              selectedChoiceObj.additionalCost
            ) {
              optionsExtra += Number(selectedChoiceObj.additionalCost) * optQty;
            }
          }
        } else {
          // Not required: multi-qty for each option
          if (opt.options) {
            opt.options.forEach((choice) => {
              const value = isObjectChoice ? choice._id || choice.id : choice;
              const extraCost = isObjectChoice
                ? choice.additionalCost
                : opt.extraPrices && opt.extraPrices[value];
              const qty =
                optionQuantities[product._id]?.[opt.name]?.[value] || 0;
              if (extraCost && qty > 0) {
                optionsExtra += Number(extraCost) * qty;
              }
            });
          }
        }
      });
      sum += productTotal + optionsExtra;
    });
    setCalculatedTotal(sum);
  }, [
    products,
    productQuantities,
    productOptions,
    optionQuantities,
    productVarieties,
  ]);

  const handleUpdate = (id, changes) => {
    const item = cart.find((c) => c.product === id);
    if (!item) return;
    addOrUpdateCartItem({ ...item, ...changes });
  };

  // Modified checkout: show location modal first
  const handleCheckoutPress = () => {
    setLocationModalVisible(true);
  };

  // After location is selected, proceed to place order
  const handleLocationSelect = async (location) => {
    try {
      // setSelectedLocation(location);
      setLocationModalVisible(false);
      setSubmitting(false);
      // setError(null);
      const userUID = await AsyncStorage.getItem('userUID');

      // Validate required options
      for (const product of products) {
        const opts = product.productoptions || product.options || [];
        for (const opt of opts) {
          if (
            opt.required &&
            (!productOptions[product._id] ||
              !productOptions[product._id][opt.name])
          ) {
            setError(
              `Please select an option for "${opt.name}" in product "${product.name}"`
            );
            setSubmitting(false);
            return;
          }
        }
      }
      // Compose order data (add more fields as needed)
      const orderData = {
        products: products.map((p) => p._id),
        totalAmount: calculatedTotal,
        user: userUID,
        status: 'pending',
        location: {
          type: 'Point',
          coordinates: [location.longitude, location.latitude],
        },
        address: location.address,
      };
      // 1. Submit order
      await submitPost(orderData, 'orders').then(async (res) => {
        if (
          res.status === 201 &&
          res.data &&
          res.data.data &&
          res.data.data.data &&
          res.data.data.data._id
        ) {
          const orderId = res.data.data.data._id;
          // 2. For each product, create an order item
          for (const product of products) {
            const storeId = product.store?._id || product.store;
            const quantity = Number(
              productQuantities[product._id] || product.quantity || 1
            );
            const preference = productPreferences[product._id] || '';
            const variety = productVarieties[product._id] || '';
            const options = productOptions[product._id] || {};
            // Calculate amount: base + variety + options
            let basePrice = product.priceFinal || product.price || 0;
            let varietyDiff = 0;
            if (product.varieties && variety) {
              const selectedVariety = product.varieties.find(
                (v) => v.name === variety
              );
              if (selectedVariety && selectedVariety.priceDifference) {
                varietyDiff = Number(selectedVariety.priceDifference);
              }
            }
            let optionsExtra = 0;
            const opts = product.productoptions || product.options || [];
            let optionsArray = [];
            opts.forEach((opt) => {
              const isObjectChoice =
                opt.options &&
                typeof opt.options[0] === 'object' &&
                opt.options[0] !== null;
              const selected = options[opt.name];
              if (opt.required) {
                if (selected) {
                  let selectedChoiceObj = null;
                  if (isObjectChoice) {
                    selectedChoiceObj = opt.options.find(
                      (c) => c._id === selected || c.id === selected
                    );
                  }
                  const optQty =
                    optionQuantities[product._id]?.[opt.name]?.[selected] || 1;
                  if (
                    isObjectChoice &&
                    selectedChoiceObj &&
                    selectedChoiceObj.additionalCost
                  ) {
                    optionsExtra +=
                      Number(selectedChoiceObj.additionalCost) * optQty;
                  } else if (opt.extraPrices && opt.extraPrices[selected]) {
                    optionsExtra += Number(opt.extraPrices[selected]) * optQty;
                  }
                  optionsArray.push({
                    name: opt.name,
                    options: [
                      {
                        optionname: selectedChoiceObj?.name || selected,
                        quantity: optQty,
                      },
                    ],
                  });
                }
              } else {
                // Not required: multi-qty for each option
                if (opt.options) {
                  opt.options.forEach((choice) => {
                    const value = isObjectChoice
                      ? choice._id || choice.id
                      : choice;
                    const optQty =
                      optionQuantities[product._id]?.[opt.name]?.[value] || 0;
                    if (optQty > 0) {
                      if (isObjectChoice && choice.additionalCost) {
                        optionsExtra += Number(choice.additionalCost) * optQty;
                      } else if (opt.extraPrices && opt.extraPrices[value]) {
                        optionsExtra += Number(opt.extraPrices[value]) * optQty;
                      }
                      optionsArray.push({
                        name: opt.name,
                        options: [
                          {
                            optionname: choice.name || value,
                            quantity: optQty,
                          },
                        ],
                      });
                    }
                  });
                }
              }
            });
            const amount = (basePrice + varietyDiff) * quantity + optionsExtra;
            const orderItem = {
              order: orderId,
              product: product._id,
              store: storeId,
              user: userUID,
              quantity,
              amount,
              preference,
              variety,
              status: 'pending',
              orderoptions: optionsArray,
              location: {
                type: 'Point',
                coordinates: [location.longitude, location.latitude],
              },
              address: location.address,
            };
            await submitPost(orderItem, 'orderitems');
          }
          Alert.alert('Order placed!');
          clearCart();
        } else {
          Alert.alert('Order failed', res.message || 'Try again');
        }
      });
    } catch (e) {
      Alert.alert('Order failed', e.message || 'Try again');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (products.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Your Cart</Text>
        <Text style={styles.subtitle}>Items you add will appear here.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Your Cart</Text>
        <ScrollView style={styles.scrollContainer}>
          {error && (
            <Text style={{ color: COLORS.reddish, marginBottom: 8 }}>
              {error}
            </Text>
          )}
          {products.map((item) => (
            <View key={item._id} style={styles.card}>
              <Image
                source={{ uri: item.images?.[0] || images.logo }}
                style={styles.image}
              />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.productName}>{item.name}</Text>
                <Text style={styles.storeName}>{item.store?.name}</Text>
                <Text style={styles.price}>
                  ${item.priceFinal} x{' '}
                  {productQuantities[item._id] || item.quantity || 1}
                </Text>
                {/* Preference */}
                <TextInput
                  style={styles.input}
                  placeholder="Preference (e.g. No onions)"
                  placeholderTextColor={COLORS.gray}
                  multiline
                  numberOfLines={5}
                  value={productPreferences[item._id] || ''}
                  onChangeText={(text) =>
                    setProductPreferences((prev) => ({
                      ...prev,
                      [item._id]: text,
                    }))
                  }
                />
                {/* Varieties */}
                {item.varieties && item.varieties.length > 0 && (
                  <View style={{ marginTop: 6 }}>
                    <Text style={styles.varietyLabel}>Variety:</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {item.varieties.map((v) => (
                        <TouchableOpacity
                          key={v.name}
                          style={[
                            styles.varietyBtn,
                            productVarieties[item._id] === v.name &&
                              styles.varietyBtnActive,
                          ]}
                          onPress={() =>
                            setProductVarieties((prev) => ({
                              ...prev,
                              [item._id]: v.name,
                            }))
                          }
                        >
                          <Text style={styles.varietyText}>{v.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
                {/* Options */}
                {item.productoptions &&
                  item.productoptions.length > 0 &&
                  item.productoptions.map((opt) => {
                    const isObjectChoice =
                      opt.options &&
                      typeof opt.options[0] === 'object' &&
                      opt.options[0] !== null;
                    const selectedValue =
                      productOptions[item._id]?.[opt.name] || '';
                    if (opt.required) {
                      let selectedChoiceObj = null;
                      if (isObjectChoice && selectedValue) {
                        selectedChoiceObj = opt.options.find(
                          (c) =>
                            c._id === selectedValue || c.id === selectedValue
                        );
                      }
                      return (
                        <View key={opt.name} style={{ marginTop: 6 }}>
                          <Text style={styles.optionLabel}>{opt.name} *</Text>
                          <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                          >
                            {opt.options.map((choice) => {
                              const value = isObjectChoice
                                ? choice._id || choice.id
                                : choice;
                              const label = isObjectChoice
                                ? choice.name
                                : choice;
                              return (
                                <TouchableOpacity
                                  key={value}
                                  style={[
                                    styles.optionBtn,
                                    selectedValue === value &&
                                      styles.optionBtnActive,
                                  ]}
                                  onPress={() =>
                                    setProductOptions((prev) => ({
                                      ...prev,
                                      [item._id]: {
                                        ...(prev[item._id] || {}),
                                        [opt.name]: value,
                                      },
                                    }))
                                  }
                                >
                                  <Text style={styles.optionText}>{label}</Text>
                                </TouchableOpacity>
                              );
                            })}
                          </ScrollView>
                        </View>
                      );
                    } else {
                      // Not required: show all choices with qty input
                      return (
                        <View key={opt.name} style={{ marginTop: 6 }}>
                          <Text style={styles.optionLabel}>{opt.name}</Text>
                          {opt.options.map((choice) => {
                            const value = isObjectChoice
                              ? choice._id || choice.id
                              : choice;
                            const label = isObjectChoice ? choice.name : choice;
                            return (
                              <View
                                key={value}
                                style={{
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                  marginBottom: 2,
                                }}
                              >
                                <Text style={styles.optionText}>{label}</Text>
                                <TextInput
                                  style={styles.qtyInput}
                                  keyboardType="numeric"
                                  value={String(
                                    optionQuantities[item._id]?.[opt.name]?.[
                                      value
                                    ] || 0
                                  )}
                                  onChangeText={(text) => {
                                    const qty = Math.max(0, Number(text));
                                    setOptionQuantities((prev) => ({
                                      ...prev,
                                      [item._id]: {
                                        ...(prev[item._id] || {}),
                                        [opt.name]: {
                                          ...((prev[item._id] || {})[
                                            opt.name
                                          ] || {}),
                                          [value]: qty,
                                        },
                                      },
                                    }));
                                  }}
                                />
                              </View>
                            );
                          })}
                        </View>
                      );
                    }
                  })}
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() =>
                      setProductQuantities((prev) => ({
                        ...prev,
                        [item._id]: Math.max(
                          1,
                          (prev[item._id] || item.quantity || 1) - 1
                        ),
                      }))
                    }
                  >
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyNum}>
                    {productQuantities[item._id] || item.quantity || 1}
                  </Text>
                  <TouchableOpacity
                    style={styles.qtyBtn}
                    onPress={() =>
                      setProductQuantities((prev) => ({
                        ...prev,
                        [item._id]: (prev[item._id] || item.quantity || 1) + 1,
                      }))
                    }
                  >
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => removeFromCart(item._id)}
                  >
                    <Text style={styles.removeBtnText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>${calculatedTotal.toFixed(2)}</Text>
          </View>
          <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
            <Text style={styles.clearBtnText}>Clear Cart</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.checkoutBtn}
            onPress={handleCheckoutPress}
            disabled={submitting}
          >
            <Text style={styles.checkoutBtnText}>
              {submitting ? 'Placing Order...' : 'Checkout'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
        <LocationPickerModal
          visible={locationModalVisible}
          onClose={() => setLocationModalVisible(false)}
          onSelect={handleLocationSelect}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 6,
    backgroundColor: COLORS.primary,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: COLORS.lightWhite,
    padding: 16,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightWhite,
  },
  title: {
    marginTop: 20,
    fontSize: SIZES.xxLarge,
    fontFamily: FONT.bold,
    color: COLORS.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: SIZES.medium,
    color: COLORS.gray,
    marginBottom: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
    ...SHADOWS.small,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: COLORS.gray2,
  },
  productName: {
    fontSize: SIZES.large,
    fontFamily: FONT.bold,
    color: COLORS.secondary,
  },
  storeName: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginTop: 2,
  },
  price: {
    fontSize: SIZES.medium,
    color: COLORS.primary,
    marginTop: 2,
    fontWeight: 'bold',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  optionText: {
    backgroundColor: COLORS.gray2,
    color: COLORS.secondary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    fontSize: SIZES.small,
  },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  qtyBtn: {
    backgroundColor: COLORS.gray2,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  qtyBtnText: {
    fontSize: SIZES.large,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  qtyNum: {
    fontSize: SIZES.large,
    color: COLORS.secondary,
    marginHorizontal: 6,
  },
  removeBtn: {
    marginLeft: 12,
    backgroundColor: COLORS.reddish,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 2,
  },
  removeBtnText: {
    color: COLORS.white,
    fontSize: SIZES.small,
    fontWeight: 'bold',
  },
  clearBtn: {
    backgroundColor: COLORS.reddish,
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  clearBtnText: {
    color: COLORS.white,
    fontSize: SIZES.large,
    fontFamily: FONT.bold,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.gray2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 4,
    marginBottom: 4,
    fontSize: SIZES.medium,
    color: COLORS.secondary,
  },
  varietyLabel: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginBottom: 2,
  },
  varietyBtn: {
    backgroundColor: COLORS.gray2,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  varietyBtnActive: {
    backgroundColor: COLORS.primary,
  },
  varietyText: {
    color: COLORS.secondary,
    fontFamily: FONT.medium,
  },
  optionLabel: {
    fontSize: SIZES.small,
    color: COLORS.gray,
    marginBottom: 2,
  },
  optionBtn: {
    backgroundColor: COLORS.gray2,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  optionBtnActive: {
    backgroundColor: COLORS.tertiary,
  },
  optionText: {
    color: COLORS.secondary,
    fontFamily: FONT.medium,
    marginRight: 4,
  },
  qtyInput: {
    borderWidth: 1,
    borderColor: COLORS.gray2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    width: 40,
    marginLeft: 4,
    fontSize: SIZES.medium,
    color: COLORS.secondary,
    textAlign: 'center',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  totalLabel: {
    fontSize: SIZES.large,
    color: COLORS.secondary,
    fontFamily: FONT.bold,
    marginRight: 8,
  },
  totalValue: {
    fontSize: SIZES.xLarge,
    color: COLORS.primary,
    fontFamily: FONT.bold,
  },
  checkoutBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 24,
  },
  checkoutBtnText: {
    color: COLORS.white,
    fontSize: SIZES.large,
    fontFamily: FONT.bold,
  },
});
