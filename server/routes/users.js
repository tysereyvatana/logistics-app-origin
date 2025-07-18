// -------------------------------------------------------------------
// FILE: routes/users.js
// DESCRIPTION: API routes for user-related actions, including editing roles.
// -------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const pool = require('../db');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const allUsers = await pool.query(
            "SELECT id, full_name, email, role, created_at FROM users ORDER BY created_at DESC"
        );
        res.json(allUsers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/users/clients
// @desc    Get all users with the 'client' role (for shipment creation)
// @access  Private (Admin, Staff)
router.get('/clients', protect, authorize('admin', 'staff'), async (req, res) => {
    try {
        const clientUsers = await pool.query(
            "SELECT id, full_name FROM users WHERE role = 'client' ORDER BY full_name"
        );
        res.json(clientUsers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// --- NEW ROUTE TO EDIT USER ROLE ---
// @route   PUT /api/users/:id/role
// @desc    Update a user's role
// @access  Private (Admin)
router.put('/:id/role', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validate the role
        if (!['admin', 'staff', 'client'].includes(role)) {
            return res.status(400).json({ msg: 'Invalid role specified.' });
        }

        // Prevent an admin from changing their own role
        if (req.user.id === id) {
            return res.status(400).json({ msg: 'You cannot change your own role.' });
        }

        const updatedUser = await pool.query(
            'UPDATE users SET role = $1 WHERE id = $2 RETURNING id, full_name, email, role, created_at',
            [role, id]
        );

        if (updatedUser.rows.length === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json(updatedUser.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const { id } = req.params;

        if (req.user.id === id) {
            return res.status(400).json({ msg: 'You cannot delete your own account.' });
        }

        const deleteOp = await pool.query('DELETE FROM users WHERE id = $1', [id]);

        if (deleteOp.rowCount === 0) {
            return res.status(404).json({ msg: 'User not found' });
        }

        res.json({ msg: 'User removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
