const jwt = require('jsonwebtoken');


module.exports = function generateToken(payload) {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_EXPIRES_IN || '1d';


    return jwt.sign(payload, secret, { expiresIn });
};