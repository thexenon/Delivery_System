import React, { useEffect, useState } from 'react';
import { fetchItem } from '../../services/user_api';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

export default function RequestDetails() {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const id = searchParams.get('id');

  useEffect(() => {
    if (id) {
      fetchItem('servicerequests', id).then((res) => {
        setDetails(res?.data?.data.data || null);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading)
    return (
      <div className="p-8 text-center text-lg text-gray-500">Loading...</div>
    );
  if (!details)
    return (
      <div className="p-8 text-center text-lg text-gray-500">
        No details found.
      </div>
    );

  const coords = details.location?.coordinates || [0, 0];
  const mapCenter =
    coords[0] && coords[1]
      ? [Number(coords[1]), Number(coords[0])]
      : [7.9465, 1.0232];

  return (
    <div className="max-w-3xl mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <h2 className="text-3xl font-bold mb-6 text-blue-700">
        Service Request Details
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="space-y-4">
          <div>
            <span className="font-semibold text-gray-700">Customer:</span>
            <span className="ml-2 text-gray-900">
              {details.customer?.name || details.customer}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Service:</span>
            <span className="ml-2 text-gray-900">
              {details.service?.name || details.service}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Artisan:</span>
            <span className="ml-2 text-gray-900">
              {details.artisan?.name || details.artisan}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Artisan Shop:</span>
            <span className="ml-2 text-gray-900">
              {details.artisanShop?.name || details.artisanShop}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Status:</span>
            <span
              className={`ml-2 px-2 py-1 rounded text-xs font-bold ${
                details.status === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : details.status === 'completed'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {details.status}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Scheduled Time:</span>
            <span className="ml-2 text-gray-900">
              {details.scheduledTime
                ? new Date(details.scheduledTime).toLocaleString()
                : ''}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Preference:</span>
            <span className="ml-2 text-gray-900">{details.preference}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Address:</span>
            <span className="ml-2 text-gray-900">{details.address}</span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Created At:</span>
            <span className="ml-2 text-gray-900">
              {details.createdAt
                ? new Date(details.createdAt).toLocaleString()
                : ''}
            </span>
          </div>
          <div>
            <span className="font-semibold text-gray-700">Updated At:</span>
            <span className="ml-2 text-gray-900">
              {details.updatedAt
                ? new Date(details.updatedAt).toLocaleString()
                : ''}
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <div className="font-semibold text-gray-700 mb-2">Shop Location</div>
          <div className="rounded-lg overflow-hidden shadow border">
            <MapContainer
              center={mapCenter}
              zoom={15}
              style={{ width: '100%', height: 300 }}
              scrollWheelZoom={true}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
              />
              {coords[0] && coords[1] && (
                <Marker position={[Number(coords[1]), Number(coords[0])]} />
              )}
            </MapContainer>
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Longitude: {coords[0]}, Latitude: {coords[1]}
          </div>
        </div>
      </div>
    </div>
  );
}
