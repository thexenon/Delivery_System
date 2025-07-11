import React, { useState, useEffect } from 'react';
import { submitPost, fetchItems } from '../../services/user_api';
import { useNavigate } from 'react-router-dom';

export default function AddService() {
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
  const [imageUrls, setImageUrl] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [artisans, setArtisans] = useState([]);
  const [shops, setShops] = useState([]);
  const [fetchingShops, setFetchingShops] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems('users?role=artisan')
      .then((res) => {
        if (res.status == 200) {
          setArtisans(res.data.data.data);
        } else {
          setError('Failed to load artisans');
        }
      })
      .catch(() => setArtisans([]));
  }, []);

  useEffect(() => {
    if (form.artisan) {
      setFetchingShops(true);
      fetchItems(`artisanShops?artisan=${form.artisan}`)
        .then((res) => {
          if (res.status == 200) {
            setShops(res.data.data.data);
          } else {
            setError('Failed to load artisans');
          }
        })
        .catch(() => setShops([]))
        .finally(() => setFetchingShops(false));
    } else {
      setShops([]);
      setForm((f) => ({ ...f, artisanShop: '' }));
    }
  }, [form.artisan]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files).slice(0, 10);
    setSelectedFiles(files);
    setForm((f) => ({
      ...f,
      images: files.map((file) => URL.createObjectURL(file)),
    }));
  };

  const handleRemoveImage = (idx) => {
    setSelectedFiles((files) => files.filter((_, i) => i !== idx));
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, i) => i !== idx),
    }));
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
      formData.append(
        'filename_override',
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
      console.log('====================================');
      console.log('Response:', data);
      console.log('Uploaded image:', data.secure_url);
      console.log('====================================');
      urls.push(data.secure_url);
    }
    return urls;
  };

  const handleUploadImages = async () => {
    setUploading(true);
    try {
      const urls = await uploadImagesToCloudinary(selectedFiles);
      console.log('====================================');
      console.log('Handled Uploads', urls);
      console.log('====================================');
      setImageUrl(urls);
      setForm((f) => ({ ...f, images: urls }));
      setError('');
    } catch (err) {
      setError('Failed to upload images');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (selectedFiles.length > 0) {
        await handleUploadImages();
      }
      const serviceData = {
        ...form,
        images: imageUrls,
        price: Number(form.price),
        duration: Number(form.duration),
      };
      console.log('====================================');
      console.log('Images:', imageUrls);
      console.log('Submitting service data:', serviceData);
      console.log('====================================');
      await submitPost(serviceData, 'services').then((res) => {
        console.log('====================================');
        console.log('Post Results:', res);
        console.log('====================================');
        if (res.status === 201) {
          alert('Service created successfully');
          navigate('/service');
          setLoading(false);
        } else {
          setError(res.message || 'Failed to create service');
          setLoading(false);
        }
      });
    } catch (err) {
      setError('Failed to create service');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        maxWidth: 600,
        margin: '40px auto',
        padding: 32,
        background: '#f9f9f9',
        borderRadius: 12,
        boxShadow: '0 2px 12px #0001',
      }}
    >
      <h2 style={{ textAlign: 'center', marginBottom: 24, color: '#2d3748' }}>
        Add New Service
      </h2>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
      >
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
                    src={img}
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
        <label style={{ fontWeight: 500 }}>
          Name of Service
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            minLength={8}
            maxLength={50}
            style={inputStyle}
          />
        </label>
        <label style={{ fontWeight: 500 }}>
          Artisan
          <select
            name="artisan"
            value={form.artisan}
            onChange={handleChange}
            required
            style={inputStyle}
          >
            <option value="">Select Artisan</option>
            {artisans.map((a) => (
              <option key={a._id} value={a._id}>
                {a.name || a.email || a._id}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontWeight: 500 }}>
          Artisan Shop
          <select
            name="artisanShop"
            value={form.artisanShop}
            onChange={handleChange}
            required
            style={inputStyle}
            disabled={!form.artisan || fetchingShops}
          >
            <option value="">
              {fetchingShops ? 'Loading...' : 'Select Shop'}
            </option>
            {shops.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name || s._id}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontWeight: 500 }}>
          Price of Service
          <input
            name="price"
            type="number"
            value={form.price}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </label>
        <label style={{ fontWeight: 500 }}>
          Summary of Service Description
          <input
            name="summary"
            value={form.summary}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </label>
        <label style={{ fontWeight: 500 }}>
          Description of Service
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            style={{ ...inputStyle, minHeight: 60 }}
          />
        </label>
        <label style={{ fontWeight: 500 }}>
          Duration in hours
          <input
            name="duration"
            type="number"
            value={form.duration}
            onChange={handleChange}
            required
            style={inputStyle}
          />
        </label>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <label style={{ fontWeight: 500 }}>
            {form.isVerified ? 'Verified' : 'Not Verified'}
            <input
              name="isVerified"
              type="checkbox"
              checked={form.isVerified}
              onChange={handleChange}
              style={{ marginLeft: 8 }}
            />
          </label>
        </div>
        {error && (
          <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>
        )}
        <button
          type="submit"
          // disabled={loading}
          style={submitBtnStyle}
        >
          {loading ? 'Adding Service...' : 'Add Service'}
        </button>
      </form>
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 6,
  border: '1px solid #ccc',
  fontSize: 16,
  marginTop: 4,
  marginBottom: 4,
};
const addBtnStyle = {
  padding: '6px 12px',
  borderRadius: 6,
  background: '#edf2f7',
  border: '1px solid #ccc',
  cursor: 'pointer',
};
const submitBtnStyle = {
  padding: '10px 0',
  borderRadius: 8,
  background: '#3182ce',
  color: '#fff',
  fontWeight: 600,
  fontSize: 18,
  border: 'none',
  marginTop: 12,
  cursor: 'pointer',
};
