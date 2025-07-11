import React, { useState, useEffect } from 'react';
import { fetchItems, submitPost } from '../../services/user_api';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function AddRequest() {
  const [form, setForm] = useState({
    customer: '',
    service: '',
    artisan: '',
    artisanShop: '',
    status: 'pending',
    scheduledTime: '',
    preference: '',
    address: '',
    location: { type: 'Point', coordinates: [0, 0] },
  });
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapSearch, setMapSearch] = useState('');
  const [mapCenter, setMapCenter] = useState([7.9465, 1.0232]);
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchItems('users').then((res) => setUsers(res?.data?.data.data || []));
    fetchItems('services').then((res) =>
      setServices(res?.data?.data.data || [])
    );
  }, []);

  useEffect(() => {
    if (form.service) {
      const selectedService = services.find((s) => s._id === form.service);
      if (selectedService) {
        setForm((f) => ({
          ...f,
          artisan: selectedService.artisan?._id || selectedService.artisan,
          artisanShop:
            selectedService.artisanShop?._id || selectedService.artisanShop,
        }));
      }
    }
  }, [form.service, services]);

  useEffect(() => {
    const coords = form.location.coordinates;
    if (coords[0] && coords[1]) {
      setMapCenter([Number(coords[1]), Number(coords[0])]);
    }
  }, [form.location]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleLocation = (lng, lat) => {
    setForm((f) => ({
      ...f,
      location: { type: 'Point', coordinates: [lng, lat] },
    }));
  };

  async function handleMapSearch() {
    if (!mapSearch) return;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          mapSearch
        )}`
      );
      const data = await response.json();
      setSearchResults(data);
      if (data && data.length > 0) {
        // Do not auto-select, let user pick
      } else {
        alert('Location not found. Please try a different search.');
      }
    } catch (err) {
      alert('Failed to search for location.');
    }
  }

  const handleSelectLocation = (place) => {
    handleLocation(place.lon, place.lat);
    setMapCenter([parseFloat(place.lat), parseFloat(place.lon)]);
    setMapSearch(place.display_name);
    setSearchResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await submitPost(form, 'servicerequests').then((res) => {
      if (res.status == 201) {
        alert('Service request created successfully');
        navigate('/request');
      } else {
        setError(res.message);
        setLoading(false);
        throw new Error('Failed to create service request');
      }
    });
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Add New Service Request</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Customer</label>
          <select
            name="customer"
            value={form.customer}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Customer</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Service</label>
          <select
            name="service"
            value={form.service}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Service</option>
            {services.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {/* Artisan and ArtisanShop are auto-populated and hidden */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block mb-1">Artisan</label>
            <input
              type="text"
              value={form.artisan}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1">Artisan Shop</label>
            <input
              type="text"
              value={form.artisanShop}
              disabled
              className="w-full border rounded px-3 py-2 bg-gray-100"
            />
          </div>
        </div>
        <div>
          <label className="block mb-1">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            {[
              'pending',
              'accepted',
              'in_progress',
              'completed',
              'cancelled',
            ].map((opt) => (
              <option key={opt} value={opt}>
                {opt.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1">Scheduled Time</label>
          <input
            type="datetime-local"
            name="scheduledTime"
            value={form.scheduledTime}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block mb-1">Preference</label>
          <input
            type="text"
            name="preference"
            value={form.preference}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block mb-1">Address</label>
          <input
            type="text"
            name="address"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        {/* Map Search for Location */}
        <div className="mb-4">
          <label className="block mb-1">Location</label>
          <input
            type="text"
            className="border rounded px-3 py-2 w-full mb-2"
            placeholder="Search for a location..."
            value={mapSearch}
            onChange={(e) => setMapSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === 'NumpadEnter')
                e.preventDefault();
            }}
            onKeyUp={(e) => {
              if (e.key === 'Enter' || e.key === 'NumpadEnter')
                handleMapSearch();
            }}
          />
          <button
            type="button"
            className="mb-2 bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
            onClick={handleMapSearch}
          >
            Search
          </button>
          {searchResults.length > 0 && (
            <ul className="bg-white border rounded shadow max-h-40 overflow-auto mb-2">
              {searchResults.map((place) => (
                <li
                  key={place.place_id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleSelectLocation(place)}
                >
                  {place.display_name}
                </li>
              ))}
            </ul>
          )}
          <div style={{ width: '100%', height: 300 }}>
            <MapContainer
              center={mapCenter}
              zoom={15}
              style={{ width: '100%', height: '100%' }}
              scrollWheelZoom={true}
              whenCreated={(map) => {
                const coords = form.location.coordinates;
                if (coords[0] && coords[1]) {
                  map.flyTo([Number(coords[1]), Number(coords[0])], 15);
                }
              }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {form.location.coordinates[0] && form.location.coordinates[1] && (
                <Marker
                  position={[
                    Number(form.location.coordinates[1]),
                    Number(form.location.coordinates[0]),
                  ]}
                />
              )}
            </MapContainer>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Longitude: {form.location.coordinates[0]}, Latitude:{' '}
            {form.location.coordinates[1]}
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full"
        >
          {loading ? 'Submitting...' : 'Submit Request'}
        </button>
      </form>
    </div>
  );
}
