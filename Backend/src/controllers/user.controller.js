const bcrypt = require('bcrypt');
const { User } = require('../models');


exports.createUser = async (req, res, next) => {
    try {
        const { name, user, password , rol} = req.body;
        if (!name || !user || !password) return res.status(400).json({ message: 'name, user and password required' });

        if(!rol) {
            rol = 'user';
        }


        const existing = await User.findOne({ where: { user } });
        if (existing) return res.status(409).json({ message: 'User already exists' });


        const hashed = await bcrypt.hash(password, 10);
        const newUser = await User.create({ name, user, password: hashed, rol });


        res.status(201).json({ id: newUser.id, name: newUser.name, user: newUser.user, rol: newUser.rol });
    } catch (err) {
        next(err);
    }
};
exports.getAll = async (req, res, next) => {
    try {
        const users = await User.findAll({ attributes: ['id', 'name', 'user','rol', 'createdAt', 'updatedAt'] });
        res.json(users);
    } catch (err) {
        next(err);
    }
};


exports.getById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, { attributes: ['id', 'name', 'user','rol'] });
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json(user);
    } catch (err) {
        next(err);
    }
};


exports.updateUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, user, password, rol } = req.body;


        const found = await User.findByPk(id);
        if (!found) return res.status(404).json({ message: 'User not found' });


        if (user && user !== found.user) {
            const exists = await User.findOne({ where: { user } });
            if (exists) return res.status(409).json({ message: 'Username already taken' });
            found.user = user;
        }


        if (name) found.name = name;
        if (rol) found.rol = rol;
        if (password) found.password = await bcrypt.hash(password, 10);


        await found.save();


        res.json({ id: found.id, name: found.name, user: found.user, rol: found.rol });
    } catch (err) {
        next(err);
    }
};


exports.deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const found = await User.findByPk(id);
        if (!found) return res.status(404).json({ message: 'User not found' });


        await found.destroy();
        res.json({ message: 'User deleted' });
    } catch (err) {
        next(err);
    }
};