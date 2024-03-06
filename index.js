const express = require('express');
const authorizeToken = require('./middleware/auth');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const PORT = process.env.PORT || 3030;
const app = express();

app.use(cors());
app.use(express.json());

// Swagger set up
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express API for Order Service',
      version: '1.0.0',
      description: 'This is a REST API for an order processing service.',
    },
    servers: [
      {
        url: `http://localhost:${PORT}`,
        description: 'Local development server',
      },
      {
        url: 'https://cna-order-service.azurewebsites.net',
        description: 'Production server',
      },
    ],
  },
  // Path to the API docs
  apis: ['./routes/*.js'], // Adjust this path to wherever your route definitions are located
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Static files
app.use('/', express.static(__dirname + '/public/'));

// Order routes
const ordersEndpoint = require('./routes/orders.js');
app.use('/orders', authorizeToken, ordersEndpoint);

// Start the server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
