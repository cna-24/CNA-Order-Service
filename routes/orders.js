const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const authenticateToken = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
require('dotenv').config()




/* TOKEN GENERATOR FOR TESTING USER ID
http://localhost:3030/orders/generate-token to get ur token which you add to HTTP auth bearer
*/

router.get('/generate-token', (req, res) => {
  try {
      const userId = 'exampleUserId'; // Example user ID
      const jwtSecret = process.env.JWT_SECRET; // Your secret key from environment variable
      const token = jwt.sign({ id: userId }, jwtSecret, { expiresIn: '1h' });
      res.status(200).json({ token });
  } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to generate token' });
  }
});





// Route for User front-end. Get 
router.get('/myorders', authenticateToken, async (req, res) => {
  try {
    // Accessing the user ID from req.authUser
    const userId = req.authUser.id;

    const userOrders = await prisma.orders.findMany({
      where: {
        userId: userId, // Ensure this matches the field in your Orders model that references the user ID
      },
    });

    if (userOrders.length === 0) {
      return res.status(404).json({ message: 'No orders found for this user.' });
    }

    res.json(userOrders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders for the user.' });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { orderNumber, product, quantity, totalPrice  } = req.body;
    const userId = req.authUser.id;

    if (!orderNumber || !product || !quantity || !totalPrice ) {
      return res.status(400).json({ error: 'Invalid request data. Please provide order details.' });
    }

    // Create a new order
    const newOrder = await prisma.orders.create({
      data: {
        orderNumber: orderNumber,
        userId: userId, 
        product: product,
        quantity: quantity,
        totalPrice: totalPrice,
      },
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create an order' });
  }
});

// ./routes/orders.js

// Define your routes and middleware here

/* GET all orders not secure
router.get('/', async (req, res) => {
  try {
    const orders = await prisma.orders.findMany();
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});
*/
/*
router.get('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await prisma.orders.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch the order' });
  }
});
*/
/* patch by id, not secure
router.patch('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    const { orderNumber } = req.body;

    const updatedOrder = await prisma.orders.update({
      where: {
        id: orderId,
      },
      data: {
        orderNumber,
      },
    });

    res.json(updatedOrder);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to update the order' });
  }
});
*/

/* delete by id, not secure
router.delete('/:id', async (req, res) => {
  try {
    const orderId = req.params.id;
    await prisma.orders.delete({
      where: {
        id: orderId,
      },
    });

    res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to delete the order' });
  }
});
*/
module.exports = router;
