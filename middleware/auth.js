
const jwt = require('jsonwebtoken')
require('dotenv').config()
module.exports = (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            throw new Error('No Authorization header found');
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new Error('Bearer token not found');
        }

        const authUser = jwt.verify(token, process.env.JWT_SECRET);
        req.authUser = authUser;
        console.log(authUser)
        next();

    } catch (error) {
        console.log("JWT error: ", error.message);
        res.status(401).send({
            msg: "Authorization failed",
            error: error.message
        });
    }
};


