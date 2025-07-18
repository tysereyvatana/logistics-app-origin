import React, { useRef } from 'react';
import Modal from './Modal';
import { QRCodeSVG } from 'qrcode.react'; // The fix is here: using a named import
import { useReactToPrint } from 'react-to-print';

const PrintLabelModal = ({ isOpen, onClose, shipment }) => {
  const labelRef = useRef();

  // This hook handles the print functionality
  const handlePrint = useReactToPrint({
    content: () => labelRef.current,
  });

  if (!shipment) return null;

  // Construct the tracking URL for the QR code
  const trackingUrl = `${window.location.origin}/track/${shipment.tracking_number}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Print Shipping Label">
      {/* This is the printable area */}
      <div ref={labelRef} className="p-4 border rounded-lg">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold">LogistiCo.</h2>
          <p className="text-sm">Shipping Label</p>
        </div>
        <div className="grid grid-cols-2 gap-4 border-t border-b py-4">
          <div>
            <p className="text-xs font-bold uppercase">From:</p>
            <p>{shipment.sender_name}</p>
            <p>{shipment.origin_address}</p>
            <p>Phone: {shipment.sender_phone}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase">To:</p>
            <p>{shipment.receiver_name}</p>
            <p>{shipment.destination_address}</p>
            <p>Phone: {shipment.receiver_phone}</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4">
          <div className="text-center">
            {/* Use the correctly imported component */}
            <QRCodeSVG value={trackingUrl} size={100} />
            <p className="text-xs font-mono mt-1">{shipment.tracking_number}</p>
          </div>
          <div className="text-right">
            <p className="text-sm">Service: <span className="font-bold">{shipment.service_type}</span></p>
            <p className="text-sm">Weight: <span className="font-bold">{shipment.weight_kg} kg</span></p>
            {shipment.is_cod && (
              <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded">
                <p className="font-bold text-yellow-800">COD: ${parseFloat(shipment.cod_amount).toFixed(2)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* This button will not be part of the printed content */}
      <div className="flex justify-end mt-6">
        <button onClick={handlePrint} className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-lg">
          Print
        </button>
      </div>
    </Modal>
  );
};

export default PrintLabelModal;
