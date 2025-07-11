import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchItem, submitUpdate, fetchItems } from '../../services/user_api';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const markerIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
  shadowSize: [41, 41],
});

function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lng, e.latlng.lat]);
    },
  });
  return position ? (
    <Marker position={[position[1], position[0]]} icon={markerIcon} />
  ) : null;
}

function CenterMapOnMarker({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) {
      map.setView([parseFloat(lat), parseFloat(lng)], map.getZoom(), {
        animate: true,
      });
    }
  }, [lat, lng]);
  return null;
}

export default function EditShop() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    profession: '',
    bio: '',
    image: '',
    phone: '',
    experienceYears: '',
    address: '',
    location: { type: 'Point', coordinates: [0, 0] },
    available: true,
    isVerified: false,
    socials: [{ platform: '', link: '' }],
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('id');
  const mapRef = useRef();

  useEffect(() => {
    if (id) {
      fetchItem('artisanshops', id)
        .then((data) => {
          const shop = data.data.data.data;
          setForm({
            ...shop,
            experienceYears: shop.experienceYears || '',
            phone: shop.phone || '',
            location: shop.location || { type: 'Point', coordinates: [0, 0] },
            socials:
              shop.socials && shop.socials.length
                ? shop.socials
                : [{ platform: '', link: '' }],
          });
          setLat(shop.location?.coordinates[1]?.toString() || '');
          setLng(shop.location?.coordinates[0]?.toString() || '');
          setImagePreview(shop.image || '');
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to load shop');
          setLoading(false);
        });
    }
  }, [id]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSocialChange = (idx, field, value) => {
    setForm((f) => {
      const socials = [...f.socials];
      socials[idx][field] = value;
      return { ...f, socials };
    });
  };

  const addSocialField = () =>
    setForm((f) => ({
      ...f,
      socials: [...f.socials, { platform: '', link: '' }],
    }));

  const removeSocialField = (idx) => {
    setForm((f) => {
      const socials = f.socials.filter((_, i) => i !== idx);
      return {
        ...f,
        socials: socials.length ? socials : [{ platform: '', link: '' }],
      };
    });
  };

  // Map location selection
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!search) return;
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        search
      )}`
    );
    const data = await res.json();
    setSearchResults(data);
  };

  const handleResultClick = (result) => {
    setLng(result.lon);
    setLat(result.lat);
    setSearchResults([]);
  };

  useEffect(() => {
    if (mapRef.current && lat && lng) {
      mapRef.current.flyTo([parseFloat(lat), parseFloat(lng)], 15, {
        animate: true,
      });
    }
    setForm((f) => ({
      ...f,
      location: {
        type: 'Point',
        coordinates: [parseFloat(lng) || 0, parseFloat(lat) || 0],
      },
    }));
  }, [lat, lng]);

  // Image upload and preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'Server Images');
    formData.append('folder', `Elroy/Shop Images/${form.name}`);
    formData.append('public_id', form.name);
    const res = await fetch(
      'https://api.cloudinary.com/v1_1/du0sqginv/image/upload',
      {
        method: 'POST',
        body: formData,
      }
    );
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      let imageUrl = form.image;
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }
      // Filter socials to remove empty entries
      const socialsFiltered = (form.socials || []).filter(
        (s) => (s.platform && s.platform.trim()) || (s.link && s.link.trim())
      );
      await submitUpdate(
        {
          ...form,
          image: imageUrl,
          socials: socialsFiltered.length ? socialsFiltered : undefined,
          experienceYears: Number(form.experienceYears),
          phone: Number(form.phone),
        },
        `artisanshops/${id}`
      );
      navigate('/shop');
    } catch (err) {
      setError('Failed to update shop');
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
          Edit Artisan Shop
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
            maxLength={70}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Email</label>
          <input
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            type="email"
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Profession</label>
          <input
            name="profession"
            value={form.profession}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Shop"
              className="mt-2 w-24 h-24 object-cover rounded"
            />
          )}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Phone</label>
          <input
            name="phone"
            type="number"
            value={form.phone}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Experience Years</label>
          <input
            name="experienceYears"
            type="number"
            value={form.experienceYears}
            onChange={handleChange}
            required
            min={0}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Address</label>
          <input
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Shop Location</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="border border-gray-300 rounded px-3 py-2 flex-1"
              placeholder="Search for a place..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e);
                }
              }}
            />
            <button
              type="button"
              className="bg-blue-500 text-white px-4 py-2 rounded"
              onClick={handleSearch}
            >
              Search
            </button>
          </div>
          {searchResults.length > 0 && (
            <ul className="bg-white border rounded shadow max-h-40 overflow-y-auto mb-2">
              {searchResults.map((result) => (
                <li
                  key={result.place_id}
                  className="p-2 hover:bg-blue-100 cursor-pointer"
                  onClick={() => handleResultClick(result)}
                >
                  {result.display_name}
                </li>
              ))}
            </ul>
          )}
          <div className="h-[24rem] w-full rounded overflow-hidden">
            <MapContainer
              center={lat && lng ? [parseFloat(lat), parseFloat(lng)] : [0, 0]}
              zoom={lat && lng ? 15 : 2}
              style={{ height: '100%', width: '100%' }}
              whenCreated={(mapInstance) => {
                mapRef.current = mapInstance;
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              <LocationMarker
                position={
                  lng && lat ? [parseFloat(lng), parseFloat(lat)] : null
                }
                setPosition={([newLng, newLat]) => {
                  setLng(newLng.toString());
                  setLat(newLat.toString());
                }}
              />
              <CenterMapOnMarker lat={lat} lng={lng} />
            </MapContainer>
          </div>
          {lat && lng && (
            <div className="text-xs text-gray-500 mt-1">
              Selected: {lat}, {lng}
            </div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            Click on the map or search for a place to set the shop location.
          </div>
          <label className="flex items-center gap-2 mb-4">
            Available
            <input
              name="available"
              type="checkbox"
              checked={form.available}
              onChange={handleChange}
            />
          </label>
          <label className="flex items-center gap-2 mb-4">
            Verified
            <input
              name="isVerified"
              type="checkbox"
              checked={form.isVerified}
              onChange={handleChange}
            />
          </label>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Socials:</label>
          {form.socials.map((s, idx) => (
            <div key={idx} className="flex gap-2 mb-2 items-center">
              <input
                placeholder="Platform"
                value={s.platform}
                onChange={(e) =>
                  handleSocialChange(idx, 'platform', e.target.value)
                }
                className="border border-gray-300 rounded px-3 py-2 w-32"
              />
              <input
                placeholder="URL"
                value={s.link}
                onChange={(e) =>
                  handleSocialChange(idx, 'link', e.target.value)
                }
                className="border border-gray-300 rounded px-3 py-2 flex-1"
              />
              {form.socials.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeSocialField(idx)}
                  className="px-2 py-1 bg-red-200 text-red-700 rounded"
                  title="Remove Social"
                >
                  Remove
                </button>
              )}
              {idx === form.socials.length - 1 && (
                <button
                  type="button"
                  onClick={addSocialField}
                  className="px-2 py-1 bg-gray-200 rounded"
                >
                  Add
                </button>
              )}
            </div>
          ))}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow mt-4"
        >
          {saving ? 'Saving...' : 'Update Shop'}
        </button>
      </form>
    </div>
  );
}
// Tailwind input style
const inputStyle =
  'w-full px-3 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400';
