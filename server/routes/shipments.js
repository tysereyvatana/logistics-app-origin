// -------------------------------------------------------------------
// FILE: routes/shipments.js
// DESCRIPTION: Added logic to handle Cash on Delivery (COD) fields.
// -------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

// --- Pricing Logic Helper Function ---
const calculatePrice = async (weight_kg, service_type) => {
    const weight = parseFloat(weight_kg) || 0;
    const ratePerKg = 1.5;
    const rateResult = await pool.query('SELECT base_rate FROM service_rates WHERE service_name = $1', [service_type]);
    const baseRate = rateResult.rows.length > 0 ? parseFloat(rateResult.rows[0].base_rate) : 5.00;
    const finalPrice = baseRate + (weight * ratePerKg);
    return finalPrice.toFixed(2);
};

// --- UPDATED POST ROUTE with COD Info ---
router.post('/', protect, authorize('admin', 'staff'), async (req, res) => {
    const { 
        client_id, origin_address, destination_address, estimated_delivery, 
        weight_kg, service_type,
        sender_name, sender_phone, receiver_name, receiver_phone,
        is_cod, cod_amount // New COD fields
    } = req.body;
    
    if (!client_id || client_id === '') { return res.status(400).json({ msg: 'A client must be selected for the shipment.' }); }
    if (!origin_address || !destination_address || !weight_kg || !service_type) { return res.status(400).json({ msg: 'All shipment details are required.' }); }
    if (!sender_name || !sender_phone || !receiver_name || !receiver_phone) { return res.status(400).json({ msg: 'Sender and Receiver name and phone are required.' }); }

    const price = await calculatePrice(weight_kg, service_type);
    const tracking_number = generateTrackingNumber();
    const status = 'pending';
    try {
        const newShipment = await pool.query(
            `INSERT INTO shipments (
                tracking_number, client_id, origin_address, destination_address, status, 
                estimated_delivery, weight_kg, service_type, price,
                sender_name, sender_phone, receiver_name, receiver_phone,
                is_cod, cod_amount
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
            [
                tracking_number, client_id, origin_address, destination_address, status, 
                estimated_delivery, weight_kg, service_type, price,
                sender_name, sender_phone, receiver_name, receiver_phone,
                is_cod || false, cod_amount || 0
            ]
        );
        const shipment = newShipment.rows[0];
        
        await pool.query(
            'INSERT INTO shipment_updates (shipment_id, location, status_update) VALUES ($1, $2, $3)',
            [shipment.id, shipment.origin_address, 'Shipment created and pending pickup.']
        );
        res.status(201).json(shipment);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- UPDATED PUT ROUTE with COD Info ---
router.put('/:id', protect, authorize('admin', 'staff'), async (req, res) => {
    const { id } = req.params;
    const {
        origin_address, destination_address, estimated_delivery,
        weight_kg, service_type, status,
        sender_name, sender_phone, receiver_name, receiver_phone,
        is_cod, cod_amount, // New COD fields
        location, status_update_message
    } = req.body;

    try {
        const currentShipmentResult = await pool.query('SELECT * FROM shipments WHERE id = $1', [id]);
        if (currentShipmentResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Shipment not found' });
        }
        const currentShipment = currentShipmentResult.rows[0];

        const queryParams = [
            origin_address || currentShipment.origin_address,
            destination_address || currentShipment.destination_address,
            estimated_delivery || currentShipment.estimated_delivery,
            weight_kg || currentShipment.weight_kg,
            service_type || currentShipment.service_type,
            status || currentShipment.status,
            await calculatePrice(weight_kg || currentShipment.weight_kg, service_type || currentShipment.service_type),
            sender_name || currentShipment.sender_name,
            sender_phone || currentShipment.sender_phone,
            receiver_name || currentShipment.receiver_name,
            receiver_phone || currentShipment.receiver_phone,
            // Handle boolean is_cod, fallback to current value if not provided
            (is_cod === true || is_cod === false) ? is_cod : currentShipment.is_cod,
            cod_amount || currentShipment.cod_amount,
            id
        ];

        const updatedShipmentResult = await pool.query(
            `UPDATE shipments SET 
                origin_address = $1, destination_address = $2, estimated_delivery = $3, 
                weight_kg = $4, service_type = $5, status = $6, price = $7,
                sender_name = $8, sender_phone = $9, receiver_name = $10, receiver_phone = $11,
                is_cod = $12, cod_amount = $13
            WHERE id = $14 RETURNING *`,
            queryParams
        );
        const updatedShipment = updatedShipmentResult.rows[0];

        if (status_update_message && location) {
            await pool.query(
                'INSERT INTO shipment_updates (shipment_id, location, status_update) VALUES ($1, $2, $3)',
                [id, location, status_update_message]
            );
            const historyResult = await pool.query('SELECT * FROM shipment_updates WHERE shipment_id = $1 ORDER BY "timestamp" DESC', [id]);
            const fullUpdate = { shipment: updatedShipment, history: historyResult.rows };
            req.io.to(updatedShipment.tracking_number).emit('shipmentUpdated', fullUpdate);
        }

        res.json(updatedShipment);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// ... (The rest of the file remains the same)
// --- PROTECTED ROUTE FOR CLIENTS ---
router.get('/my-shipments', protect, async (req, res) => {
    try {
        const clientId = req.user.id;
        const shipments = await pool.query(
            'SELECT * FROM shipments WHERE client_id = $1 ORDER BY created_at DESC',
            [clientId]
        );
        res.json(shipments.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// --- STAFF & ADMIN ROUTES ---
router.get('/recent-activity', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const activityQuery = `
            SELECT su.id, su.status_update, su.location, su.timestamp, s.tracking_number
            FROM shipment_updates su JOIN shipments s ON su.shipment_id = s.id
            ORDER BY su.timestamp DESC LIMIT 5;
        `;
        const result = await pool.query(activityQuery);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
router.get('/stats', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const statsQuery = `
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'in_transit') AS "inTransit",
                COUNT(*) FILTER (WHERE status = 'delivered') AS delivered,
                COUNT(*) FILTER (WHERE status = 'delayed') AS delayed
            FROM shipments;
        `;
        const result = await pool.query(statsQuery);
        const stats = {
            total: parseInt(result.rows[0].total, 10),
            inTransit: parseInt(result.rows[0].inTransit, 10),
            delivered: parseInt(result.rows[0].delivered, 10),
            delayed: parseInt(result.rows[0].delayed, 10),
        };
        res.json(stats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
const generateTrackingNumber = () => {
    const prefix = 'LS';
    const randomNumber = Math.floor(1000000000 + Math.random() * 9000000000);
    return `${prefix}${randomNumber}`;
};
router.get('/track/:trackingNumber', async (req, res) => {
    try {
        const { trackingNumber } = req.params;
        const shipmentResult = await pool.query('SELECT * FROM shipments WHERE tracking_number = $1', [trackingNumber]);
        if (shipmentResult.rows.length === 0) {
            return res.status(404).json({ msg: 'Shipment not found' });
        }
        const shipment = shipmentResult.rows[0];
        const updatesResult = await pool.query(
            'SELECT * FROM shipment_updates WHERE shipment_id = $1 ORDER BY "timestamp" DESC', 
            [shipment.id]
        );
        res.json({ shipment, history: updatesResult.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
router.get('/', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const shipments = await pool.query('SELECT * FROM shipments ORDER BY created_at DESC');
        res.json(shipments.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const deleteOp = await pool.query('DELETE FROM shipments WHERE id = $1', [id]);
        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ msg: 'Shipment not found' });
        }
        res.json({ msg: 'Shipment removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
