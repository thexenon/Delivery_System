import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { submitUpdate, fetchItems, fetchItem } from '../../services/user_api';
import {
  MapContainer,
  TileLayer,
  Marker,
  useMapEvents,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix marker icon issue in react-leaflet
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

export default function EditStore() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('id');
  const [name, setName] = useState('');
  const [merchant, setMerchant] = useState('');
  const [merchants, setMerchants] = useState([]);
  const [image, setImage] = useState(null);
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [lng, setLng] = useState('');
  const [lat, setLat] = useState('');
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [ratingsAverage, setRatingsAverage] = useState(4.0);
  const [ratingsQunatity, setRatingsQunatity] = useState(0);
  const [active, setActive] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [workingHours, setWorkingHours] = useState([
    { day: 'Monday', open: '', close: '' },
    { day: 'Tuesday', open: '', close: '' },
    { day: 'Wednesday', open: '', close: '' },
    { day: 'Thursday', open: '', close: '' },
    { day: 'Friday', open: '', close: '' },
    { day: 'Saturday', open: '', close: '' },
    { day: 'Sunday', open: '', close: '' },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch merchants for dropdown
    fetchItems('users?role=merchant').then((res) => {
      setMerchants(res.data.data.data);
    });
  }, []);

  useEffect(() => {
    const getStore = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchItem('stores', id);
        const store = res.data.data.data;
        setName(store.name || '');
        setMerchant(store.merchant || '');
        setImage(store.image || null);
        setPhone(store.phone || '');
        setAddress(store.address || '');
        setLng(store.location?.coordinates?.[0] || '');
        setLat(store.location?.coordinates?.[1] || '');
        setRatingsAverage(store.ratingsAverage || 4.0);
        setRatingsQunatity(store.ratingsQunatity || 0);
        setActive(store.active !== undefined ? store.active : true);
        setIsVerified(store.isVerified || false);
        setWorkingHours(
          store.workingHours || [
            { day: 'Monday', open: '', close: '' },
            { day: 'Tuesday', open: '', close: '' },
            { day: 'Wednesday', open: '', close: '' },
            { day: 'Thursday', open: '', close: '' },
            { day: 'Friday', open: '', close: '' },
            { day: 'Saturday', open: '', close: '' },
            { day: 'Sunday', open: '', close: '' },
          ]
        );
      } catch (err) {
        setError('Failed to load store');
      }
      setLoading(false);
    };
    getStore();
  }, [id]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'Server Images');
    formData.append('folder', 'Cassiel/Store Images');
    setSaving(true);
    try {
      const res = await fetch(
        'https://api.cloudinary.com/v1_1/du0sqginv/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );
      const data = await res.json();
      setImage(data.secure_url);
    } catch (err) {
      setError('Image upload failed');
    }
    setSaving(false);
  };

  const handleWorkingHourChange = (idx, field, value) => {
    setWorkingHours((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const location = {
        type: 'Point',
        coordinates: [parseFloat(lng), parseFloat(lat)],
      };
      const storeData = {
        name,
        merchant,
        image,
        phone,
        address,
        location,
        ratingsAverage: parseFloat(ratingsAverage),
        ratingsQunatity: parseInt(ratingsQunatity),
        active,
        isVerified,
        workingHours,
      };
      await submitUpdate(storeData, `stores/${id}`);
      navigate('/store');
    } catch (err) {
      setError('Failed to update store');
    }
    setSaving(false);
  };

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
        className="bg-white p-8 rounded-lg shadow max-w-xl w-full"
        onSubmit={handleSubmit}
        encType="multipart/form-data"
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Store</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Store Name</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Merchant</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            required
          >
            <option value="">Select Merchant</option>
            {merchants.map((m) => (
              <option key={m._id} value={m._id}>
                {m.name} ({m.email})
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} />
          {image && (
            <img
              src={image}
              alt="Store"
              className="mt-2 w-24 h-24 object-cover rounded"
            />
          )}
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Phone</label>
          <input
            type="number"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Address</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-700 mb-2">Store Location</label>
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
          <div className="h-[32rem] w-full rounded overflow-hidden">
            <MapContainer
              center={lat && lng ? [parseFloat(lat), parseFloat(lng)] : [0, 0]}
              zoom={lat && lng ? 15 : 2}
              style={{ height: '100%', width: '100%' }}
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
            Click on the map or search for a place to set the store location.
          </div>
        </div>
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <label className="block text-gray-700 mb-2">Ratings Average</label>
            <input
              type="number"
              step="0.1"
              min="1"
              max="5"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={ratingsAverage}
              onChange={(e) => setRatingsAverage(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="block text-gray-700 mb-2">Ratings Quantity</label>
            <input
              type="number"
              min="0"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={ratingsQunatity}
              onChange={(e) => setRatingsQunatity(e.target.value)}
            />
          </div>
        </div>
        <div className="mb-4 flex gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
            />{' '}
            Active
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isVerified}
              onChange={(e) => setIsVerified(e.target.checked)}
            />{' '}
            Verified
          </label>
        </div>
        <div className="mb-6">
          <label className="block text-gray-700 mb-2">Working Hours</label>
          <div className="flex flex-col gap-2">
            {workingHours.map((wh, idx) => (
              <div key={wh.day} className="flex gap-2 items-center">
                <span className="w-20">{wh.day}</span>
                <input
                  type="time"
                  className="border border-gray-300 rounded px-2 py-1"
                  value={wh.open}
                  onChange={(e) =>
                    handleWorkingHourChange(idx, 'open', e.target.value)
                  }
                  required
                />
                <span>-</span>
                <input
                  type="time"
                  className="border border-gray-300 rounded px-2 py-1"
                  value={wh.close}
                  onChange={(e) =>
                    handleWorkingHourChange(idx, 'close', e.target.value)
                  }
                  required
                />
              </div>
            ))}
          </div>
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
