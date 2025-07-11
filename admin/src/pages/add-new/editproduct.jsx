import React, { useEffect, useState } from 'react';
import { fetchItem, fetchItems, submitUpdate } from '../../services/user_api';
import { useNavigate, useLocation } from 'react-router-dom';

export default function EditProduct() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('id');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]); // array of File objects or URLs
  const [imagePreviews, setImagePreviews] = useState([]); // for preview only
  const [subcategory, setSubcategory] = useState('');
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [stores, setStores] = useState([]);
  const [isVerified, setIsVerified] = useState(false);
  const [store, setStore] = useState('');
  const [summary, setSummary] = useState('');
  const [duration, setDuration] = useState('');
  const [maxOrder, setMaxOrder] = useState('');
  const [priceDiscount, setPriceDiscount] = useState('');
  const [varieties, setVarieties] = useState([
    { name: '', priceDifference: '' },
  ]);
  const [productOptions, setProductOptions] = useState([
    { name: '', required: false, options: [{ name: '', additionalCost: '' }] },
  ]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch categories and stores
    fetchItems('categories').then((res) =>
      setCategories(res.data.data.data || [])
    );
    fetchItems('stores').then((res) => setStores(res.data.data.data || []));
    // Fetch product details
    const getProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchItem('products', id);
        const product = res.data.data.data;
        setName(product.name || '');
        setPrice(product.price || '');
        setCategory(product.category?._id || product.category || '');
        setSubcategory(product.subcategory || '');
        setStock(product.stock || '');
        setStore(
          product.store?._id || product.store?.id || product.store || ''
        );
        setDescription(product.description || '');
        setSummary(product.summary || '');
        setDuration(product.duration ? String(product.duration) : '');
        setMaxOrder(product.maxOrder ? String(product.maxOrder) : '');
        setPriceDiscount(
          product.priceDiscount ? String(product.priceDiscount) : ''
        );
        setVarieties(product.varieties || [{ name: '', priceDifference: '' }]);
        setProductOptions(
          product.productoptions || [
            {
              name: '',
              required: false,
              options: [{ name: '', additionalCost: '' }],
            },
          ]
        );
        setIsVerified(product.isVerified || false);
        setImages(product.images || []);
        setImagePreviews(
          (product.images || []).map((img) =>
            typeof img === 'string' ? img : URL.createObjectURL(img)
          )
        );
      } catch (err) {
        setError('Failed to load product');
      }
      setLoading(false);
    };
    getProduct();
  }, [id]);

  useEffect(() => {
    // Update subcategories when category changes
    const selectedCat = categories.find((cat) => cat._id === category);
    setSubcategory('');
    if (selectedCat && Array.isArray(selectedCat.subcategory)) {
      setSubcategories(selectedCat.subcategory);
    } else {
      setSubcategories([]);
    }
  }, [category, categories]);

  const handleImageChange = async (e) => {
    const files = Array.from(e.target.files).slice(0, 10 - images.length);
    if (!files.length) return;
    setSaving(true);
    setError(null);
    try {
      // Upload new images immediately
      const uploadPromises = files.map(async (file, idx) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'Server Images');
        const ext = file.name ? file.name.split('.').pop() : 'jpg';
        formData.append(
          'public_id',
          `${subcategory}_${category}_${store}_${idx + 1}_${ext}`
        );
        formData.append('folder', `Elroy/Product Images/${store}`);
        const res = await fetch(
          'https://api.cloudinary.com/v1_1/du0sqginv/image/upload',
          {
            method: 'POST',
            body: formData,
          }
        );
        const data = await res.json();
        return data.secure_url;
      });
      const urls = await Promise.all(uploadPromises);
      const newImages = [...images, ...urls].slice(0, 10);
      setImages(newImages);
      setImagePreviews(
        newImages.map((img) =>
          typeof img === 'string' ? img : URL.createObjectURL(img)
        )
      );
    } catch (err) {
      setError('Image upload failed');
    }
    setSaving(false);
  };

  // Remove upload on submit: only use upload on image change
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const data = {
        name,
        price,
        description,
        images,
        category,
        subcategory,
        stock,
        summary,
        duration,
        maxOrder,
        priceDiscount,
        isVerified,
        varieties: varieties.map((v) => ({
          name: v.name,
          priceDifference: parseFloat(v.priceDifference) || 0,
        })),
        productoptions: productOptions.map((po) => ({
          name: po.name,
          required: !!po.required,
          options: po.options.map((opt) => ({
            name: opt.name,
            additionalCost: parseFloat(opt.additionalCost) || 0,
          })),
        })),
      };
      await submitUpdate(data, `products/${id}`).then((res) => {
        if (res.status !== 200) {
          throw new Error(res.message || 'Failed to update product');
        } else {
          alert('Product updated successfully');
          navigate('/product');
        }
      });
    } catch (err) {
      setError('Failed to update product');
    }
    setSaving(false);
  };

  const addVariety = () =>
    setVarieties([...varieties, { name: '', priceDifference: '' }]);
  const updateVariety = (idx, key, value) => {
    const updated = [...varieties];
    updated[idx][key] = value;
    setVarieties(updated);
  };
  const removeVariety = (idx) =>
    setVarieties(varieties.filter((_, i) => i !== idx));

  const addProductOption = () =>
    setProductOptions([
      ...productOptions,
      {
        name: '',
        required: false,
        options: [{ name: '', additionalCost: '' }],
      },
    ]);
  const updateProductOption = (idx, key, value) => {
    const updated = [...productOptions];
    updated[idx][key] = value;
    setProductOptions(updated);
  };
  const addOptionToProductOption = (idx) => {
    const updated = [...productOptions];
    updated[idx].options.push({ name: '', additionalCost: '' });
    setProductOptions(updated);
  };
  const updateOptionInProductOption = (pIdx, oIdx, key, value) => {
    const updated = [...productOptions];
    updated[pIdx].options[oIdx][key] = value;
    setProductOptions(updated);
  };
  const removeOptionFromProductOption = (pIdx, oIdx) => {
    const updated = [...productOptions];
    updated[pIdx].options.splice(oIdx, 1);
    setProductOptions(updated);
  };
  const removeProductOption = (idx) =>
    setProductOptions(productOptions.filter((_, i) => i !== idx));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form
        className="bg-white p-8 rounded-lg shadow max-w-md w-full"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Product</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Product Name</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Summary</label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Description</label>
          <textarea
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Images (up to 10)</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {imagePreviews.map((img, idx) => (
              <div key={idx} className="relative w-24 h-24">
                <img
                  src={img}
                  alt={`Product ${idx + 1}`}
                  className="w-24 h-24 object-cover rounded"
                />
                <button
                  type="button"
                  className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-1 text-red-500"
                  onClick={() => {
                    // Remove image at idx from both images and previews
                    const newImages = images.filter((_, i) => i !== idx);
                    setImages(newImages);
                    setImagePreviews(
                      newImages.map((file) =>
                        typeof file === 'string'
                          ? file
                          : URL.createObjectURL(file)
                      )
                    );
                  }}
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Price</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Discount Price</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={priceDiscount}
            onChange={(e) => setPriceDiscount(e.target.value)}
            placeholder="Optional"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Category</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Subcategory</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            required={subcategories.length > 0}
            disabled={subcategories.length === 0}
          >
            <option value="">
              {subcategories.length === 0
                ? 'No subcategories'
                : 'Select Subcategory'}
            </option>
            {subcategories.map((sub, idx) => (
              <option key={idx} value={sub}>
                {sub}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Store</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            required
          >
            <option value="">Select Store</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Stock</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
          />
        </div>
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <label className="block text-gray-700 mb-2">Duration (min)</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 mb-2">Max Order</label>
            <input
              type="number"
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={maxOrder}
              onChange={(e) => setMaxOrder(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="flex items-center gap-2 mb-4">
            {isVerified ? 'Verified' : 'Not Verified'}
            <input
              name="isVerified"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
              type="checkbox"
            />
          </label>
        </div>
        {/* Varieties Section */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Varieties</label>
          {varieties.map((v, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                className="flex-1 border border-gray-300 rounded px-3 py-2"
                placeholder="Variety Name"
                value={v.name}
                onChange={(e) => updateVariety(idx, 'name', e.target.value)}
              />
              <input
                type="number"
                className="w-32 border border-gray-300 rounded px-3 py-2"
                placeholder="Price Diff."
                value={v.priceDifference}
                onChange={(e) =>
                  updateVariety(idx, 'priceDifference', e.target.value)
                }
              />
              <button
                type="button"
                className="text-red-500"
                onClick={() => removeVariety(idx)}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="text-blue-600" onClick={addVariety}>
            + Add Variety
          </button>
        </div>
        {/* Product Options Section */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Product Options</label>
          {productOptions.map((po, pIdx) => (
            <div key={pIdx} className="border p-2 rounded mb-2">
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2 mb-2"
                placeholder="Option Group Name"
                value={po.name}
                onChange={(e) =>
                  updateProductOption(pIdx, 'name', e.target.value)
                }
              />
              <label className="flex items-center gap-2 mb-2">
                <input
                  type="checkbox"
                  checked={po.required}
                  onChange={(e) =>
                    updateProductOption(pIdx, 'required', e.target.checked)
                  }
                />
                Required
              </label>
              {po.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex gap-2 mb-2">
                  <input
                    type="text"
                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                    placeholder="Option Name"
                    value={opt.name}
                    onChange={(e) =>
                      updateOptionInProductOption(
                        pIdx,
                        oIdx,
                        'name',
                        e.target.value
                      )
                    }
                  />
                  <input
                    type="number"
                    className="w-32 border border-gray-300 rounded px-3 py-2"
                    placeholder="Additional Cost"
                    value={opt.additionalCost}
                    onChange={(e) =>
                      updateOptionInProductOption(
                        pIdx,
                        oIdx,
                        'additionalCost',
                        e.target.value
                      )
                    }
                  />
                  <button
                    type="button"
                    className="text-red-500"
                    onClick={() => removeOptionFromProductOption(pIdx, oIdx)}
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="text-blue-600 mr-2"
                onClick={() => addOptionToProductOption(pIdx)}
              >
                + Add Option
              </button>
              <button
                type="button"
                className="text-red-500"
                onClick={() => removeProductOption(pIdx)}
              >
                Remove Option Group
              </button>
            </div>
          ))}
          <button
            type="button"
            className="text-blue-600"
            onClick={addProductOption}
          >
            + Add Product Option Group
          </button>
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
