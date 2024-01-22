const express = require('express')
const router = express.Router()
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
require('dotenv').config()

// ./routes/orders.js

// Define your routes and middleware here




  router.post('/', async (req, res) => {
    try {
   
    const { orderNumber } = req.body;

    // Validate request data
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



module.exports = router;
