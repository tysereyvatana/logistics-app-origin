import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import api from '../services/api';

const CreateShipmentModal = ({ isOpen, onClose, onShipmentCreated }) => {
  const [formData, setFormData] = useState({
    clientId: '',
    origin_address: '',
    destination_address: '',
    estimated_delivery: '',
    weight_kg: '',
    service_type: 'standard',
    sender_name: '',
    sender_phone: '',
    receiver_name: '',
    receiver_phone: '',
    is_cod: false, // New COD state
    cod_amount: ''  // New COD amount state
  });
  const [clients, setClients] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      const fetchClients = async () => {
        try {
          const response = await api.get('/api/users/clients');
          setClients(response.data);
        } catch (err) {
          console.error("Failed to fetch clients", err);
          setError("Could not load the client list.");
        }
      };
      fetchClients();
      // Reset form on open
      setFormData({
        clientId: '',
        origin_address: '',
        destination_address: '',
        estimated_delivery: '',
        weight_kg: '',
        service_type: 'standard',
        sender_name: '',
        sender_phone: '',
        receiver_name: '',
        receiver_phone: '',
        is_cod: false,
        cod_amount: ''
      });
      setError('');
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { clientId, ...rest } = formData;
    const newShipmentData = {
      ...rest,
      client_id: clientId,
      // Ensure cod_amount is 0 if it's not a COD shipment
      cod_amount: rest.is_cod ? rest.cod_amount : 0,
    };
    onShipmentCreated(newShipmentData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Shipment">
      <form onSubmit={handleSubmit}>
        {error && <p className="p-3 bg-red-100 text-red-700 rounded-lg mb-4">{error}</p>}
        <div className="space-y-4">
          {/* Sender and Receiver Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="sender_name">Sender Name</label>
              <input name="sender_name" value={formData.sender_name} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="sender_phone">Sender Phone</label>
              <input name="sender_phone" value={formData.sender_phone} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="receiver_name">Receiver Name</label>
              <input name="receiver_name" value={formData.receiver_name} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="receiver_phone">Receiver Phone</label>
              <input name="receiver_phone" value={formData.receiver_phone} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" required />
            </div>
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="clientId">Assign to Client Account</label>
            <select name="clientId" value={formData.clientId} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg bg-white" required>
              <option value="" disabled>-- Select a Client --</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.full_name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="weight_kg">Weight (kg)</label>
              <input name="weight_kg" type="number" step="0.01" value={formData.weight_kg} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="service_type">Service Type</label>
              <select name="service_type" value={formData.service_type} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg bg-white">
                <option value="standard">Standard</option>
                <option value="express">Express</option>
                <option value="overnight">Overnight</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="origin_address">Origin Address</label>
            <input name="origin_address" value={formData.origin_address} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="destination_address">Destination Address</label>
            <input name="destination_address" value={formData.destination_address} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="estimated_delivery">Estimated Delivery Date</label>
            <input name="estimated_delivery" type="date" value={formData.estimated_delivery} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" required />
          </div>

          {/* New COD Section */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center">
                <input
                    id="is_cod"
                    name="is_cod"
                    type="checkbox"
                    checked={formData.is_cod}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_cod" className="ml-2 block text-sm font-medium text-gray-900">
                    Cash on Delivery (COD)
                </label>
            </div>
            {formData.is_cod && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="cod_amount">COD Amount to Collect ($)</label>
                    <input
                        name="cod_amount"
                        type="number"
                        step="0.01"
                        value={formData.cod_amount}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 border rounded-lg"
                        placeholder="e.g., 25.50"
                        required={formData.is_cod}
                    />
                </div>
            )}
          </div>

        </div>
        <div className="flex justify-end mt-6">
          <button type="button" onClick={onClose} className="mr-3 px-5 py-2.5 bg-gray-200 rounded-lg">Cancel</button>
          <button type="submit" className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg">Create Shipment</button>
        </div>
      </form>
    </Modal>
  );
};

export default CreateShipmentModal;
