import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { submitPost, fetchItems } from '../../services/user_api';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

export default function AddOrder() {
  const [customer, setCustomer] = useState('');
  const [status, setStatus] = useState('pending');
  const [total, setTotal] = useState('');
  const [rider, setRider] = useState('');
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [locationType, setLocationType] = useState('Point');
  const [coordinates, setCoordinates] = useState(['', '']);
  const [payment, setPayment] = useState('Momo');
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [productQuantities, setProductQuantities] = useState({});
  const [productPreferences, setProductPreferences] = useState({});
  const [productSearch, setProductSearch] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [mapSearch, setMapSearch] = useState('');
  const [mapCenter, setMapCenter] = useState([7.9465, 1.0232]);
  const [productOptions, setProductOptions] = useState({}); // { [productId]: { [optionName]: value } }
  const [productVarieties, setProductVarieties] = useState({}); // { [productId]: varietyName }
  const [optionQuantities, setOptionQuantities] = useState({}); // { [productId]: { [optionName]: qty } }
  const [optionExtraTotals, setOptionExtraTotals] = useState({}); // { [productId]: totalExtra }
  const navigate = useNavigate();

  useEffect(() => {
    let sum = 0;
    products.forEach((productId) => {
      const product = allProducts.find((p) => p._id === productId);
      const qty = Number(productQuantities[productId] || 1);
      if (!product) return;
      // Base price
      let basePrice = product.priceFinal || product.price || 0;
      // Add variety price difference if selected
      let varietyDiff = 0;
      if (product.varieties && productVarieties[productId]) {
        const selectedVariety = product.varieties.find(
          (v) => v.name === productVarieties[productId]
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
        const selected = productOptions[productId]?.[opt.name];
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
              optionQuantities[productId]?.[opt.name]?.[selected] || 1;
            if (
              isObjectChoice &&
              selectedChoiceObj &&
              selectedChoiceObj.additionalCost
            ) {
              optionsExtra += Number(selectedChoiceObj.additionalCost) * optQty;
            } else if (opt.extraPrices && opt.extraPrices[selected]) {
              optionsExtra += Number(opt.extraPrices[selected]) * optQty;
            }
          }
        } else {
          // Not required: multi-qty for each option
          if (opt.options) {
            opt.options.forEach((choice) => {
              const value = isObjectChoice ? choice._id || choice.id : choice;
              const optQty =
                optionQuantities[productId]?.[opt.name]?.[value] || 0;
              if (optQty > 0) {
                if (isObjectChoice && choice.additionalCost) {
                  optionsExtra += Number(choice.additionalCost) * optQty;
                } else if (opt.extraPrices && opt.extraPrices[value]) {
                  optionsExtra += Number(opt.extraPrices[value]) * optQty;
                }
              }
            });
          }
        }
      });
      sum += productTotal + optionsExtra;
      setOptionExtraTotals((prev) => ({ ...prev, [productId]: optionsExtra }));
    });
    setCalculatedTotal(sum);
    setTotal(sum);
  }, [
    products,
    productQuantities,
    allProducts,
    productOptions,
    optionQuantities,
    productVarieties,
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Validate required fields
      for (const productId of products) {
        const product = allProducts.find((p) => p._id === productId);
        if (!product) continue;
        const options = product.options || [];
        for (const opt of options) {
          if (
            opt.required &&
            (!productOptions[productId] || !productOptions[productId][opt.name])
          ) {
            setError(
              `Please select an option for "${opt.name}" in product "${product.name}"`
            );
            setLoading(false);
            return;
          }
        }
      }

      const data = {
        user: customer,
        rider,
        products,
        totalAmount: total,
        location: {
          type: locationType,
          coordinates: coordinates.map(Number),
        },
        status,
        payment,
      };
      // Submit order first
      await submitPost(data, 'orders').then(async (res) => {
        if (
          res.status === 201 &&
          res.data &&
          res.data.data.data &&
          res.data.data.data._id
        ) {
          const orderId = res.data.data.data._id;
          // For each product, create an order item
          for (const productId of products) {
            const product = allProducts.find((p) => p._id === productId);
            if (!product) continue;
            const storeId = product.store?._id || product.store;
            const quantity = productQuantities[productId] || 1;
            // If you have user preference per product, get it here. Otherwise, set to empty string.
            const preference = productPreferences?.[productId] || '';
            // Get selected variety and options
            const variety = productVarieties[productId] || '';
            const options = productOptions[productId] || {};
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
            // Prepare optionsWithQty for saving
            let optionsWithQty = {};
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
                    optionQuantities[productId]?.[opt.name]?.[selected] || 1;
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
                  let selectedArr = Array.isArray(selected) ? selected : [];
                  opt.options.forEach((choice) => {
                    const value = isObjectChoice
                      ? choice._id || choice.id
                      : choice;
                    const optQty =
                      optionQuantities[productId]?.[opt.name]?.[value] || 0;
                    if (optQty > 0) {
                      if (isObjectChoice && choice.additionalCost) {
                        optionsExtra += Number(choice.additionalCost) * optQty;
                      } else if (opt.extraPrices && opt.extraPrices[value]) {
                        optionsExtra += Number(opt.extraPrices[value]) * optQty;
                      }
                      // Save option with quantity if selected
                      if (!optionsWithQty[opt.name])
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
              product: productId,
              store: storeId,
              user: customer,
              rider,
              quantity,
              status,
              amount,
              preference,
              variety,
              orderoptions: optionsArray,
            };
            await submitPost(orderItem, 'orderitems');
          }
          alert('Order added successfully!');
          navigate('/order');
        } else {
          throw new Error(res.data.message || 'Failed to add order');
        }
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to add order. Please check all fields.'
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, productRes] = await Promise.all([
          fetchItems('users'),
          fetchItems('products'),
        ]);
        setCustomers(userRes.data.data.data || []);
        setUsers(
          (userRes.data.data.data || []).filter((u) => u.role === 'rider')
        );
        setAllProducts(productRes.data.data.data || []);
      } catch (err) {
        setError('Failed to fetch dropdown data');
      }
    };
    fetchData();
  }, []);

  // When a product is selected, auto-populate its store
  useEffect(() => {
    if (products.length === 1 && allProducts.length > 0) {
      const selectedProduct = allProducts.find((p) => p._id === products[0]);
      if (selectedProduct && selectedProduct.store) {
        // setStore(selectedProduct.store._id || selectedProduct.store); // REMOVE store logic
      }
    }
  }, [products, allProducts]);

  // Filter products by search
  const filteredProducts = allProducts.filter((p) =>
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  // Map logic: center on coordinates if set, else use default
  useEffect(() => {
    if (coordinates[0] && coordinates[1]) {
      setMapCenter([Number(coordinates[1]), Number(coordinates[0])]);
    }
  }, [coordinates]);

  function LocationMarker() {
    // Dummy marker logic for react-leaflet, replace with your actual implementation if needed
    return null;
  }

  // Add this function to handle map search
  async function handleMapSearch() {
    if (!mapSearch) return;
    try {
      // Use Nominatim API for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          mapSearch
        )}`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lon, lat } = data[0];
        setCoordinates([lon, lat]);
        setMapCenter([parseFloat(lat), parseFloat(lon)]);
      } else {
        alert('Location not found. Please try a different search.');
      }
    } catch (err) {
      alert('Failed to search for location.');
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <form
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Add New Order</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Customer</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={customer}
            onChange={(e) => setCustomer(e.target.value)}
            required
          >
            <option value="">Select Customer</option>
            {customers.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        {/* REMOVE Store select field */}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Status</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
          >
            <option value="pending">Pending</option>
            <option value="delivered">Delivered</option>
            <option value="in-transit">In-transit</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Rider</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={rider}
            onChange={(e) => setRider(e.target.value)}
          >
            <option value="">Select Rider (optional)</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Search Products</label>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            placeholder="Search products..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
          />
          <label className="block mb-1 font-semibold">Products</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value=""
            onChange={(e) => {
              const selectedId = e.target.value;
              if (selectedId && !products.includes(selectedId)) {
                setProducts((prev) => [...prev, selectedId]);
              }
            }}
          >
            <option value="">Select Product to Add</option>
            {filteredProducts
              .filter((p) => !products.includes(p._id))
              .map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
          </select>
        </div>
        {products.map((productId) => {
          const product = allProducts.find((p) => p._id === productId);
          if (!product) return null;
          // Extract varieties and options
          const varieties = product.varieties || [];
          const options = product.productoptions || [];
          return (
            <div
              key={productId}
              className="mb-4 border rounded p-3 bg-gray-50 flex flex-col gap-2"
            >
              <div className="flex items-center gap-4">
                <div className="font-semibold flex-1">{product.name}</div>
                <div>
                  <label className="mr-2 font-semibold">Quantity:</label>
                  <input
                    type="number"
                    min="1"
                    className="border border-gray-300 rounded px-2 py-1 w-20"
                    value={productQuantities[productId] || 1}
                    onChange={(e) => {
                      const qty = Math.max(1, Number(e.target.value));
                      setProductQuantities((prev) => ({
                        ...prev,
                        [productId]: qty,
                      }));
                    }}
                  />
                </div>
                <div className="ml-4">
                  <label className="mr-2 font-semibold">Preference:</label>
                  <input
                    type="text"
                    className="border border-gray-300 rounded px-2 py-1 w-32"
                    placeholder="e.g. No onions"
                    value={productPreferences?.[productId] || ''}
                    onChange={(e) => {
                      setProductPreferences((prev) => ({
                        ...prev,
                        [productId]: e.target.value,
                      }));
                    }}
                  />
                </div>
                <div className="ml-4 font-semibold text-blue-700">
                  ₦
                  {(
                    product.priceFinal * (productQuantities[productId] || 1)
                  ).toLocaleString()}
                </div>
                <button
                  type="button"
                  className="ml-4 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => {
                    setProducts((prev) =>
                      prev.filter((id) => id !== productId)
                    );
                    setProductQuantities((prev) => {
                      const updated = { ...prev };
                      delete updated[productId];
                      return updated;
                    });
                    setProductPreferences((prev) => {
                      const updated = { ...prev };
                      delete updated[productId];
                      return updated;
                    });
                    setProductOptions((prev) => {
                      const updated = { ...prev };
                      delete updated[productId];
                      return updated;
                    });
                    setProductVarieties((prev) => {
                      const updated = { ...prev };
                      delete updated[productId];
                      return updated;
                    });
                  }}
                >
                  Remove
                </button>
              </div>
              {/* Varieties */}
              {varieties.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <label className="font-semibold">Variety:</label>
                  <select
                    className="border border-gray-300 rounded px-2 py-1"
                    value={productVarieties[productId] || ''}
                    onChange={(e) => {
                      setProductVarieties((prev) => ({
                        ...prev,
                        [productId]: e.target.value,
                      }));
                    }}
                  >
                    <option value="">Select variety</option>
                    {varieties.map((v) => (
                      <option key={v.name} value={v.name}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {/* Product Options */}
              {options.length > 0 &&
                options.map((opt) => {
                  const isObjectChoice =
                    opt.options &&
                    typeof opt.options[0] === 'object' &&
                    opt.options[0] !== null;
                  const selectedValue =
                    productOptions[productId]?.[opt.name] || '';
                  // For required: single select, for not required: list with qty
                  if (opt.required) {
                    // Single select dropdown
                    let selectedChoiceObj = null;
                    if (isObjectChoice && selectedValue) {
                      selectedChoiceObj = opt.options.find(
                        (c) => c._id === selectedValue || c.id === selectedValue
                      );
                    }
                    return (
                      <div
                        key={opt.name}
                        className="flex items-center gap-2 mt-2"
                      >
                        <label className="font-semibold">{opt.name} ***:</label>
                        <select
                          className="border border-gray-300 rounded px-2 py-1"
                          value={selectedValue}
                          onChange={(e) => {
                            setProductOptions((prev) => ({
                              ...prev,
                              [productId]: {
                                ...(prev[productId] || {}),
                                [opt.name]: e.target.value,
                              },
                            }));
                          }}
                          required
                        >
                          <option value="">Select option</option>
                          {opt.options &&
                            opt.options.map((choice) => {
                              if (isObjectChoice) {
                                return (
                                  <option
                                    key={choice._id || choice.id}
                                    value={choice._id || choice.id}
                                  >
                                    {choice.name}
                                    {choice.additionalCost
                                      ? ` (+₦${Number(
                                          choice.additionalCost
                                        ).toLocaleString()})`
                                      : ''}
                                  </option>
                                );
                              } else {
                                return (
                                  <option key={choice} value={choice}>
                                    {choice}
                                  </option>
                                );
                              }
                            })}
                        </select>
                        {/* Show quantity and extra price for selected */}
                        {selectedValue && (
                          <>
                            <label className="ml-2">Qty:</label>
                            <input
                              type="number"
                              min="1"
                              className="border border-gray-300 rounded px-2 py-1 w-16 ml-1"
                              value={
                                optionQuantities[productId]?.[opt.name]?.[
                                  selectedValue
                                ] || 1
                              }
                              onChange={(e) => {
                                const qty = Math.max(1, Number(e.target.value));
                                setOptionQuantities((prev) => ({
                                  ...prev,
                                  [productId]: {
                                    ...(prev[productId] || {}),
                                    [opt.name]: {
                                      ...((prev[productId] || {})[opt.name] ||
                                        {}),
                                      [selectedValue]: qty,
                                    },
                                  },
                                }));
                              }}
                            />
                            {/* Show extra price if defined for this option/choice */}
                            {(() => {
                              let extra = 0;
                              if (
                                isObjectChoice &&
                                selectedChoiceObj &&
                                selectedChoiceObj.additionalCost
                              ) {
                                extra =
                                  Number(selectedChoiceObj.additionalCost) *
                                  (optionQuantities[productId]?.[opt.name]?.[
                                    selectedValue
                                  ] || 1);
                              } else if (
                                opt.extraPrices &&
                                opt.extraPrices[selectedValue]
                              ) {
                                extra =
                                  Number(opt.extraPrices[selectedValue]) *
                                  (optionQuantities[productId]?.[opt.name]?.[
                                    selectedValue
                                  ] || 1);
                              }
                              return (
                                extra > 0 && (
                                  <span className="ml-2 text-green-700 font-semibold">
                                    +₦{extra.toLocaleString()}
                                  </span>
                                )
                              );
                            })()}
                          </>
                        )}
                      </div>
                    );
                  } else {
                    // Not required: list all choices with qty input
                    return (
                      <div key={opt.name} className="flex flex-col gap-1 mt-2">
                        <label className="font-semibold">{opt.name}:</label>
                        {opt.options &&
                          opt.options.map((choice) => {
                            const value = isObjectChoice
                              ? choice._id || choice.id
                              : choice;
                            const label = isObjectChoice ? choice.name : choice;
                            const extraCost = isObjectChoice
                              ? choice.additionalCost
                              : opt.extraPrices && opt.extraPrices[value];
                            return (
                              <div
                                key={value}
                                className="flex items-center gap-2 ml-4"
                              >
                                <span>{label}</span>
                                <label className="ml-2">Qty:</label>
                                <input
                                  type="number"
                                  min="0"
                                  className="border border-gray-300 rounded px-2 py-1 w-16 ml-1"
                                  value={
                                    optionQuantities[productId]?.[opt.name]?.[
                                      value
                                    ] || 0
                                  }
                                  onChange={(e) => {
                                    const qty = Math.max(
                                      0,
                                      Number(e.target.value)
                                    );
                                    setOptionQuantities((prev) => ({
                                      ...prev,
                                      [productId]: {
                                        ...(prev[productId] || {}),
                                        [opt.name]: {
                                          ...((prev[productId] || {})[
                                            opt.name
                                          ] || {}),
                                          [value]: qty,
                                        },
                                      },
                                    }));
                                    // If qty > 0, add to productOptions; if 0, remove
                                    setProductOptions((prev) => {
                                      const updated = { ...prev };
                                      if (!updated[productId])
                                        updated[productId] = {};
                                      if (!updated[productId][opt.name])
                                        updated[productId][opt.name] = [];
                                      if (qty > 0) {
                                        if (
                                          !updated[productId][
                                            opt.name
                                          ].includes(value)
                                        ) {
                                          updated[productId][opt.name] = [
                                            ...updated[productId][opt.name],
                                            value,
                                          ];
                                        }
                                      } else {
                                        updated[productId][opt.name] = updated[
                                          productId
                                        ][opt.name].filter((v) => v !== value);
                                      }
                                      // Clean up empty arrays
                                      if (
                                        updated[productId][opt.name].length ===
                                        0
                                      )
                                        delete updated[productId][opt.name];
                                      return updated;
                                    });
                                  }}
                                />
                                {extraCost &&
                                  optionQuantities[productId]?.[opt.name]?.[
                                    value
                                  ] > 0 && (
                                    <span className="ml-2 text-green-700 font-semibold">
                                      +₦
                                      {(
                                        Number(extraCost) *
                                        (optionQuantities[productId]?.[
                                          opt.name
                                        ]?.[value] || 0)
                                      ).toLocaleString()}
                                    </span>
                                  )}
                              </div>
                            );
                          })}
                      </div>
                    );
                  }
                })}
            </div>
          );
        })}
        <div className="mb-6">
          <label className="block mb-1 font-semibold">Total</label>
          <input
            type="number"
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-100 font-bold"
            value={calculatedTotal}
            readOnly
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Location</label>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search for a location..."
            value={mapSearch}
            onChange={(e) => setMapSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'NumpadEnter') {
                e.preventDefault();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === 'Enter' || e.key === 'NumpadEnter') {
                handleMapSearch();
              }
            }}
          />
          <button
            type="button"
            className="mb-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            onClick={handleMapSearch}
          >
            Search
          </button>
          <div style={{ width: '100%', height: 300 }}>
            <MapContainer
              center={mapCenter}
              zoom={15}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom={true}
              whenCreated={(map) => {
                // If coordinates are set, fly to them
                if (coordinates[0] && coordinates[1]) {
                  map.flyTo(
                    [Number(coordinates[1]), Number(coordinates[0])],
                    15
                  );
                }
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <LocationMarker />
            </MapContainer>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Longitude: {coordinates[0]}, Latitude: {coordinates[1]}
          </div>
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
            onClick={() => navigate('/order')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold shadow"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Add Order'}
          </button>
        </div>
      </form>
    </div>
  );
}
