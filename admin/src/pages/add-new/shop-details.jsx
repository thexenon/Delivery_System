import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchItem } from '../../services/user_api';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
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

export default function ShopDetails() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('id');
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItem('artisanshops', id)
      .then((res) => {
        console.log('====================================');
        console.log(res.data.data.data);
        console.log('====================================');
        setShop(res.data.data.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load shop details');
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="text-center py-10 text-lg text-gray-500">Loading...</div>
    );
  if (error)
    return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!shop) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow max-w-2xl w-full">
        <h2 className="text-3xl font-bold mb-4 text-blue-800">{shop.name}</h2>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1">
            <img
              src={shop.image}
              alt={shop.name}
              className="w-32 h-32 object-cover rounded mb-4 shadow"
            />
            <div className="mb-2 text-lg font-semibold text-gray-700">
              Profession: {shop.profession}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Bio:</span> {shop.bio}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Phone:</span> {shop.phone}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Email:</span> {shop.email}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Address:</span> {shop.address}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Available:</span>{' '}
              <span
                className={shop.available ? 'text-green-600' : 'text-red-600'}
              >
                {shop.available ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Verified:</span>{' '}
              <span
                className={shop.isVerified ? 'text-green-600' : 'text-red-600'}
              >
                {shop.isVerified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Experience Years:</span>{' '}
              {shop.experienceYears}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Socials:</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {shop.socials?.map((s, idx) => (
                <div key={idx} className="mb-1">
                  <span className="font-semibold">{s.platform}:</span>{' '}
                  <a
                    href={s.link}
                    className="text-blue-600 underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {s.link}
                  </a>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow">
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              Artisan Details
            </h3>
            {shop.artisan && (
              <div className="mb-2">
                <div className="font-semibold">Name:</div>{' '}
                {shop.artisan.name || shop.artisan}
                {shop.artisan.email && (
                  <div>
                    <span className="font-semibold">Email:</span>{' '}
                    {shop.artisan.email}
                  </div>
                )}
                {shop.artisan.phone && (
                  <div>
                    <span className="font-semibold">Phone:</span>{' '}
                    {shop.artisan.phone}
                  </div>
                )}
                {shop.artisan.bio && (
                  <div>
                    <span className="font-semibold">Bio:</span>{' '}
                    {shop.artisan.bio}
                  </div>
                )}
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-700 mt-4 mb-2">
              Services
            </h3>
            {shop.services && shop.services.length > 0 ? (
              <ul className="list-disc ml-4">
                {shop.services.map((service, idx) => (
                  <li key={idx} className="mb-1">
                    <span className="font-semibold">{service.name}</span> - ₦
                    {service.price} ({service.duration} hrs)
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-gray-500">No services listed.</div>
            )}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 shadow mt-4">
          <h3 className="text-lg font-bold text-gray-700 mb-2">Reviews</h3>
          {shop.reviews && shop.reviews.length > 0 ? (
            <div className="space-y-4">
              {shop.reviews.map((review, idx) => (
                <div key={idx} className="border-b pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-blue-700">
                      {review.user?.name || review.user || 'Anonymous'}
                    </span>
                    <span className="text-yellow-500">
                      {'★'.repeat(review.rating || 0)}
                    </span>
                  </div>
                  <div className="text-gray-700">{review.review}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No reviews yet.</div>
          )}
        </div>
        {shop.location?.coordinates && (
          <div className="bg-gray-50 rounded-lg p-4 shadow mt-4">
            <h3 className="text-lg font-bold text-gray-700 mb-2">Location</h3>
            <div className="h-64 w-full rounded overflow-hidden">
              <MapContainer
                center={[
                  shop.location.coordinates[1],
                  shop.location.coordinates[0],
                ]}
                zoom={16}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution="&copy; OpenStreetMap contributors"
                />
                <Marker
                  position={[
                    shop.location.coordinates[1],
                    shop.location.coordinates[0],
                  ]}
                  icon={markerIcon}
                />
              </MapContainer>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {shop.address} ({shop.location.coordinates[1]},{' '}
              {shop.location.coordinates[0]})
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
