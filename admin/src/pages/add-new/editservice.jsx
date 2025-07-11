import React, { useEffect, useState } from 'react';
import { fetchItems, fetchItem, submitUpdate } from '../../services/user_api';
import { useNavigate, useLocation } from 'react-router-dom';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function EditService() {
  const [form, setForm] = useState({
    name: '',
    artisan: '',
    artisanShop: '',
    price: '',
    summary: '',
    description: '',
    images: [],
    duration: '',
    isVerified: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [artisans, setArtisans] = useState([]);
  const [shops, setShops] = useState([]);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  const query = useQuery();
  const id = query.get('id');

  useEffect(() => {
    fetchItems('users?role=artisan')
      .then((res) => {
        if (res.status === 200) {
          setArtisans(res.data.data.data);
        }
      })
      .catch(() => setArtisans([]));
  }, []);

  useEffect(() => {
    if (form.artisan) {
      fetchItems(`artisanShops?artisan=${form.artisan}`)
        .then((res) => {
          if (res.status === 200) {
            setShops(res.data.data.data);
          }
        })
        .catch(() => setShops([]));
    } else {
      setShops([]);
      setForm((f) => ({ ...f, artisanShop: '' }));
    }
  }, [form.artisan]);

  useEffect(() => {
    if (id) {
      fetchItem('services', id)
        .then((res) => {
          const data = res.data.data.data;
          console.log('====================================');
          console.log('Loaded service data:', data);
          console.log('====================================');
          setForm({
            ...data,
            price: data.price || '',
            duration: data.duration || '',
            images: data.images || [],
            artisan: data.artisan._id || '',
            artisanShop: data.artisanShop._id || '',
          });
          setSelectedFiles([]);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load service');
          setLoading(false);
        });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    setSelectedFiles(files);
    setForm((f) => ({
      ...f,
      images: [
        ...f.images.filter(
          (img) => typeof img === 'string' && img.startsWith('http')
        ),
        ...files.map((file) => URL.createObjectURL(file)),
      ],
    }));
  };

  const handleRemoveImage = (idx) => {
    setForm((f) => {
      let newImages = [...f.images];
      newImages.splice(idx, 1);
      // If removed image is a preview (not DB), also remove from selectedFiles
      if (
        selectedFiles.length > 0 &&
        idx >= f.images.length - selectedFiles.length
      ) {
        setSelectedFiles((files) =>
          files.filter(
            (_, i) => i !== idx - (f.images.length - selectedFiles.length)
          )
        );
      }
      return { ...f, images: newImages };
    });
  };

  const uploadImagesToCloudinary = async (files) => {
    const urls = [];
    let idx = 0;
    for (let file of files) {
      idx++;
      const formData = new FormData();
      formData.append('file', file);
      formData.append(
        'public_id',
        `service_${form.name}_${form.artisan}_${idx}`
      );
      formData.append('upload_preset', 'Server Images');
      formData.append('folder', `Elroy/Services Images/${form.artisanShop}`);
      const res = await fetch(
        'https://api.cloudinary.com/v1_1/du0sqginv/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await res.json();
      urls.push(data.secure_url);
    }
    return urls;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let imageUrls = form.images;
      if (selectedFiles.length > 0) {
        imageUrls = await uploadImagesToCloudinary(selectedFiles);
      }
      await submitUpdate(
        {
          ...form,
          images: imageUrls,
          price: Number(form.price),
          duration: Number(form.duration),
        },
        `services/${id}`
      );
      navigate('/service');
    } catch (err) {
      setError('Failed to update service');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-10 text-lg text-gray-500">Loading...</div>
    );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form
        className="bg-white p-8 rounded-lg shadow max-w-xl w-full"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800 text-center">
          Edit Service
        </h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            minLength={8}
            maxLength={50}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Artisan</label>
          <select
            name="artisan"
            value={form.artisan}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Artisan</option>
            {artisans.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name} ({a.email})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Artisan Shop</label>
          <select
            name="artisanShop"
            value={form.artisanShop}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select Shop</option>
            {shops.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Price</label>
          <input
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Summary</label>
          <input
            name="summary"
            value={form.summary}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Images</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />
          {form.images && form.images.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {form.images.map((img, idx) => (
                <div key={idx} className="relative w-24 h-24">
                  <img
                    src={
                      typeof img === 'string' && img.startsWith('http')
                        ? img
                        : img
                    }
                    alt={`Service ${idx + 1}`}
                    className="w-24 h-24 object-cover rounded"
                  />
                  <button
                    type="button"
                    className="absolute top-0 right-0 bg-white bg-opacity-80 rounded-full p-1 text-red-500"
                    onClick={() => handleRemoveImage(idx)}
                    title="Remove"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Duration (min)</label>
          <input
            name="duration"
            type="number"
            value={form.duration}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <label className="flex items-center gap-2 mb-4">
          Verified
          <input
            name="isVerified"
            type="checkbox"
            checked={form.isVerified}
            onChange={handleChange}
          />
        </label>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow mt-4"
        >
          {saving ? 'Saving...' : 'Update Service'}
        </button>
      </form>
    </div>
  );
}
