
const jwt = require('jsonwebtoken')
require('dotenv').config() 

module.exports = (req, res, next) => {
    try {

        
        const token = req.headers['authorization'].split(' ')[1]
        
        
        const authUser = jwt.verify(token, process.env.JWT_SECRET)

        
        req.authUser = authUser

      

        next()

    } catch (error) {
        console.log("JWT error: ", error.message)
        res.status(401).send({
            msg: "Authorization failed",
            error: error.message
        })

    }

}

