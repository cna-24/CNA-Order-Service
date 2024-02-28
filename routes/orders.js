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
      const userId = 'testUser'; // Example user ID
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

// ID av order får man från get request ovan, kanske måste implementera get by id.
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { orderNumber, product, quantity, totalPrice } = req.body;

   
    const userId = req.authUser.id;

    // Check if the order belongs to the authenticated user
    const order = await prisma.orders.findFirst({
      where: {
        AND: [
          { id: orderId },
          { userId: userId }
        ]
      },
    });

    if (!order) {
      return res.status(403).json({ error: 'Unauthorized to update this order' });
    }

    // Update the order
    const updatedOrder = await prisma.orders.update({
      where: {
        id: orderId,
      },
      data: {
        orderNumber,
        product,
        quantity,
        totalPrice,
        updatedAt: new Date(), 
      },
    });

    res.json({ message: 'Order updated successfully', order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Failed to update the order' });
  }
});

router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.id;
    const userId = req.authUser.id;

    // Check if the order belongs to the authenticated user
    const order = await prisma.orders.findFirst({
      where: {
        AND: [
          { id: orderId },
          { userId: userId }
        ]
      },
    });

    if (!order) {
      return res.status(403).json({ error: 'Unauthorized to delete this order' });
    }

    // Delete the order
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


router.get('/myorders/:id', authenticateToken, async (req, res) => {
  try {
    // Accessing the user ID from req.authUser
    const userId = req.authUser.id;
    const orderId = req.params.id;

    const userOrder = await prisma.orders.findUnique({
      where: {
        id: orderId,
        userId: userId,
      },
    });

    if (!userOrder) {
      return res.status(404).json({ message: 'Order not found for this user.' });
    }

    res.json(userOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch order for the user.' });
  }
});

// New route to process an order and send an email
router.post('/process-order/:cartId', authenticateToken, async (req, res) => {
  const cartId = req.params.cartId;
  const cartServiceURL = `https://cartserviceem.azurewebsites.net/cart/${cartId}`;
  const emailServiceURL = 'http://your-email-service-url/send_email'; // Replace with the actual email api endpoint

  try {
    // Get the cart details
    const cartResponse = await axios.get(cartServiceURL);
    const cartData = cartResponse.data;

    // Here, transform the cartData as needed to match the Email API's expected format
    // This is a simplified example.
    const emailData = {
      email_address: 'customer@example.com', // This should be dynamically set based on your application's logic
      subject: 'Your Order Details',
      body: `Your order with ID ${cartId} has been processed. Details: ${JSON.stringify(cartData)}`,
    };

    // Send the data to the Email API
    // Generate a JWT for Email API authentication
    const emailApiToken = jwt.sign({ user: 'yourUserIdentifier' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const emailResponse = await axios.post(emailServiceURL, emailData, {
      headers: {
        Authorization: `Bearer ${emailApiToken}`,
      },
    });

    // Success response
    res.status(200).json({
      message: 'Order processed and email sent successfully',
      emailServiceResponse: emailResponse.data,
    });
  } catch (error) {
    console.error('Failed to process order and send email:', error);
    res.status(500).json({ error: 'Failed to process order and send email' });
  }
});

module.exports = router;