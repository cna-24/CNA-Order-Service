const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const authenticateToken = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
require('dotenv').config()

// ./routes/orders.js

// Define your routes and middleware here

router.get('/', async (req, res) => {
  try {
    const orders = await prisma.orders.findMany();
    res.json(orders);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch orders' });
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

router.post('/', async (req, res) => {
  try {

    const { orderNumber } = req.body;

    if (!orderNumber) {
      return res.status(400).json({ error: 'Order number is required.' });
    }

    const newOrder = await prisma.orders.create({
      data: {
        orderNumber,
      },
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to create an order' });
  }
});

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

module.exports = router;
