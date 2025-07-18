import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { io } from 'socket.io-client';

const TrackingPage = () => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Use a ref to hold the socket instance so it persists across re-renders
  const socketRef = useRef(null);

  // This effect runs only once to establish and clean up the socket connection
  useEffect(() => {
    // Connect to the WebSocket server when the component mounts
    socketRef.current = io('http://localhost:5000');

    // Set up the listener for incoming updates
    socketRef.current.on('shipmentUpdated', (updatedData) => {
      // Use a functional update to safely update state
      // This checks if the incoming update is for the shipment we are currently viewing
      setResult((currentResult) => {
        if (currentResult && updatedData.shipment.tracking_number === currentResult.shipment.tracking_number) {
          console.log("Real-time update received!", updatedData);
          return updatedData;
        }
        return currentResult;
      });
    });

    // Clean up the connection when the component unmounts
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []); // The empty array ensures this effect runs only once

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingNumber) {
      setError('Please enter a tracking number.');
      return;
    }
    setLoading(true);
    setResult(null);
    setError('');

    try {
      const response = await api.get(`/api/shipments/track/${trackingNumber}`);
      setResult(response.data);
      
      // After successfully fetching, join the WebSocket room using our single, persistent socket
      if (socketRef.current) {
        socketRef.current.emit('joinRoom', trackingNumber);
      }

    } catch (err) {
      if (err.response && err.response.status === 404) {
        setError('No shipment found with that tracking number.');
      } else {
        setError('An error occurred. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-lg text-center">
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Track Your Shipment</h1>
        <p className="text-gray-500 mb-6">Get real-time updates on your package's location.</p>
        <form onSubmit={handleTrack} className="max-w-lg mx-auto">
          <div className="flex rounded-lg shadow-md">
            <input 
              type="text" 
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="Enter tracking number (e.g., LS1234567890)" 
              className="w-full px-5 py-3 border-t border-l border-b border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button type="submit" disabled={loading} className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-r-lg hover:bg-blue-700 disabled:bg-blue-400 transition-all">
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              ) : 'Track'}
            </button>
          </div>
          {error && <p className="text-red-500 mt-4">{error}</p>}
        </form>
      </div>

      {result && (
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Details for #{result.shipment.tracking_number}</h2>
          <div className="grid md:grid-cols-3 gap-6 mb-6 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Status</p>
                <p className="font-bold text-lg text-blue-600">{result.shipment.status.replace('_', ' ').toUpperCase()}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Origin</p>
                <p className="font-semibold text-gray-700">{result.shipment.origin_address}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Destination</p>
                <p className="font-semibold text-gray-700">{result.shipment.destination_address}</p>
            </div>
          </div>
          
          <h3 className="text-xl font-bold mb-4">Tracking History</h3>
          <div className="flow-root">
            <ul className="-mb-8">
              {result.history.map((update, index) => (
                <li key={update.id}>
                  <div className="relative pb-8">
                    {index !== result.history.length - 1 && (
                      <span className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" aria-hidden="true"></span>
                    )}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-800 font-semibold">{update.status_update}</p>
                          <p className="text-sm text-gray-500">{update.location}</p>
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          <time dateTime={update.timestamp}>{new Date(update.timestamp).toLocaleDateString()}</time>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackingPage;
