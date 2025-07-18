import React, { useState, useEffect } from 'react';
import Modal from './Modal';

const initialFormState = {
    origin_address: '',
    destination_address: '',
    estimated_delivery: '',
    weight_kg: '',
    service_type: 'standard',
    status: 'pending',
    sender_name: '',
    sender_phone: '',
    receiver_name: '',
    receiver_phone: '',
    is_cod: false,
    cod_amount: ''
};

const EditShipmentModal = ({ isOpen, onClose, shipment, onShipmentUpdated }) => {
  const [formData, setFormData] = useState(initialFormState);
  const [location, setLocation] = useState('');
  const [statusUpdateMessage, setStatusUpdateMessage] = useState('');

  useEffect(() => {
    if (shipment) {
      const estDeliveryDate = shipment.estimated_delivery 
        ? new Date(shipment.estimated_delivery).toISOString().split('T')[0] 
        : '';
      
      setFormData({
        origin_address: shipment.origin_address || '',
        destination_address: shipment.destination_address || '',
        estimated_delivery: estDeliveryDate,
        weight_kg: shipment.weight_kg || '',
        service_type: shipment.service_type || 'standard',
        status: shipment.status || 'pending',
        sender_name: shipment.sender_name || '',
        sender_phone: shipment.sender_phone || '',
        receiver_name: shipment.receiver_name || '',
        receiver_phone: shipment.receiver_phone || '',
        is_cod: shipment.is_cod || false,
        cod_amount: shipment.cod_amount || ''
      });
      setLocation('');
      setStatusUpdateMessage('');
    }
  }, [shipment]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setFormData(prev => ({ ...prev, [name]: val }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalData = { ...formData };
    if (location && statusUpdateMessage) {
      finalData.location = location;
      finalData.status_update_message = statusUpdateMessage;
    }
    // Ensure cod_amount is 0 if it's not a COD shipment
    finalData.cod_amount = finalData.is_cod ? finalData.cod_amount : 0;
    onShipmentUpdated(shipment.id, finalData);
  };

  if (!shipment) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Shipment #${shipment.tracking_number}`}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Sender and Receiver Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="sender_name">Sender Name</label>
              <input name="sender_name" value={formData.sender_name} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="sender_phone">Sender Phone</label>
              <input name="sender_phone" value={formData.sender_phone} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="receiver_name">Receiver Name</label>
              <input name="receiver_name" value={formData.receiver_name} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="receiver_phone">Receiver Phone</label>
              <input name="receiver_phone" value={formData.receiver_phone} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" />
            </div>
          </div>

          <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="weight_kg">Weight (kg)</label>
              <input name="weight_kg" type="number" value={formData.weight_kg} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="service_type">Service</label>
              <select name="service_type" value={formData.service_type} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg bg-white">
                <option value="standard">Standard</option>
                <option value="express">Express</option>
                <option value="overnight">Overnight</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="origin_address">Origin</label>
              <input name="origin_address" value={formData.origin_address} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="destination_address">Destination</label>
              <input name="destination_address" value={formData.destination_address} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="estimated_delivery">Est. Delivery</label>
              <input name="estimated_delivery" type="date" value={formData.estimated_delivery} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg" />
            </div>
          </div>

          {/* New COD Section */}
          <div className="border-t pt-4 space-y-4">
            <div className="flex items-center">
                <input
                    id="edit_is_cod"
                    name="is_cod"
                    type="checkbox"
                    checked={formData.is_cod}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="edit_is_cod" className="ml-2 block text-sm font-medium text-gray-900">
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
                        required={formData.is_cod}
                    />
                </div>
            )}
          </div>
          
          <div className="border-t pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Add New Status Update (Optional)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="status">Status</label>
                    <select name="status" value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 border rounded-lg bg-white">
                        <option value="pending">Pending</option>
                        <option value="in_transit">In Transit</option>
                        <option value="delivered">Delivered</option>
                        <option value="delayed">Delayed</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="location">Location</label>
                    <input value={location} onChange={(e) => setLocation(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg" placeholder="e.g., Phnom Penh Facility" />
                </div>
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="statusUpdateMessage">Update Message</label>
                    <input value={statusUpdateMessage} onChange={(e) => setStatusUpdateMessage(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg" placeholder="e.g., Arrived at sorting center" />
                </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end mt-6">
          <button type="button" onClick={onClose} className="mr-3 px-5 py-2.5 bg-gray-200 rounded-lg">Cancel</button>
          <button type="submit" className="px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-lg">Save Changes</button>
        </div>
      </form>
    </Modal>
  );
};

export default EditShipmentModal;
