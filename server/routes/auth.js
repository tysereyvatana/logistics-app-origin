// -------------------------------------------------------------------
// FILE: routes/auth.js
// DESCRIPTION: Defines API endpoints for user authentication.
// -------------------------------------------------------------------
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

// --- Register a new user ---
// @route   POST /api/auth/register
// @desc    Register a new user (admin, staff, or client)
router.post('/register', async (req, res) => {
    const { fullName, email, password, role = 'client' } = req.body;

    // Basic validation
    if (!fullName || !email || !password) {
        return res.status(400).json({ msg: 'Please enter all fields' });
    }

    try {
        // Check for existing user
        const userExists = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ msg: 'User with that email already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Save user to database
        const newUser = await pool.query(
            'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, email, role',
            [fullName, email, passwordHash, role]
        );

        res.status(201).json({
            msg: 'User registered successfully!',
            user: newUser.rows[0],
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// --- Login a user ---
// @route   POST /api/auth/login
// @desc    Authenticate a user and return a JWT token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ msg: 'Please provide email and password' });
    }

    try {
        // Check if user exists
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // Compare password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }

        // User is authenticated, create JWT payload
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        // Sign the token
        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' }, // Token expires in 5 hours
            (err, token) => {
                if (err) throw err;
                res.json({
                    token,
                    user: {
                        id: user.id,
                        fullName: user.full_name,
                        email: user.email,
                        role: user.role
                    }
                });
            }
        );

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});


module.exports = router;
