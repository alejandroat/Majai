const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');


const generateToken = require('../utils/generateToken');


exports.login = async (req, res, next) => {
    try {
        const { user, password } = req.body;
        if (!user || !password) return res.status(400).json({ message: 'user and password required' });


        const found = await User.findOne({ where: { user } });
        if (!found) return res.status(401).json({ message: 'Invalid credentials' });


        const match = await bcrypt.compare(password, found.password);
        if (!match) return res.status(401).json({ message: 'Invalid credentials' });


        const token = generateToken({ id: found.id, user: found.user, cargo: found.cargo });


        res.json({ token, user: { id: found.id, name: found.name, user: found.user, cargo: found.cargo } });
    } catch (err) {
        next(err);
    }
};

// GET /api/auth/me
exports.me = async (req, res, next) => {
    try {
        const { id } = req.user; // viene del middleware tras verificar el token
        if (!id) return res.status(400).json({ message: 'Invalid token payload' });

        const found = await User.findByPk(id, { attributes: ['id', 'name', 'user', 'cargo'] });
        if (!found) return res.status(404).json({ message: 'User not found' });

        res.json({ id: found.id, name: found.name, user: found.user, cargo: found.cargo });
    } catch (err) {
        next(err);
    }
};