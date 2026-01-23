const jwt = require('jsonwebtoken');


exports.verifyToken = (req, res, next) => {
    try {
        const header = req.headers['authorization'] || req.headers['Authorization'];
        if (!header) return res.status(401).json({ message: 'No token provided' });


        const parts = header.split(' ');
        if (parts.length !== 2) return res.status(401).json({ message: 'Token error' });


        const scheme = parts[0];
        const token = parts[1];


        if (!/^Bearer$/i.test(scheme)) return res.status(401).json({ message: 'Token malformatted' });


        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) return res.status(401).json({ message: 'Token invalid' });


            // attach user data to request
            req.user = decoded;
            next();
        });
    } catch (err) {
        next(err);
    }
};