const express = require('express');
const authorizeToken = require('./middleware/auth')
const PORT = process.env.PORT || 3030
const app = express();
const cors = require('cors')
app.use(cors())
app.use(express.json())




app.use('/', express.static(__dirname + '/public/'))


const ordersEndpoint = require('./routes/orders.js')
app.use('/orders', ordersEndpoint)



app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`)
})


