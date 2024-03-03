const express = require('express')
const router = express.Router()
const axios = require('axios');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const authenticateToken = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
require('dotenv').config()




// Function to retrieve cart data from the cart service
const getCartData = async (cartId) => {
  const cartServiceURL = `https://cartserviceem.azurewebsites.net/cart/${cartId}`;

  try {
    const cartResponse = await axios.get(cartServiceURL);
    return cartResponse.data;
  } catch (error) {
    console.error('Failed to retrieve cart data:', error);
    throw new Error('Failed to retrieve cart data');
  }
};

// Function to retrieve product details from the product service
const getProductDetails = async (productId) => {
  const productServiceURL = `{{apiUrl}}/${productId}`;

  try {
    const productResponse = await axios.get(productServiceURL);
    return productResponse.data;
  } catch (error) {
    console.error(`Failed to retrieve product details for ID ${productId}:`, error);
    throw new Error(`Failed to retrieve product details for ID ${productId}`);
  }
};

// Function to update product quantity in the product service
const updateProductQuantity = async (productId, cartQuantity) => {
  const productServiceURL = `{{apiUrl}}/${productId}`;

  try {
    // Make a GET request to retrieve current product details
    const currentProductDetails = await getProductDetails(productId);
    const currentQuantity = currentProductDetails.quantity;

    // Subtract cartQuantity from currentQuantity
    const updatedQuantity = currentQuantity - cartQuantity;

    // Make a PUT request to update product quantity
    await axios.put(productServiceURL, {
      quantity: updatedQuantity,
    });

    console.log(`Product with ID ${productId} quantity updated from ${currentQuantity} to ${updatedQuantity}`);
  } catch (error) {
    console.error(`Failed to update product with ID ${productId} quantity:`, error);
    throw new Error(`Failed to update product with ID ${productId} quantity`);
  }
};


/* TOKEN GENERATOR FOR TESTING USER ID
http://localhost:3030/orders/generate-token to get ur token which you add to HTTP auth bearer
*/

router.get('/generate-token', (req, res) => {
  try {
      const userId = 'testUser'; // Example user ID
      const jwtSecret = process.env.JWT_SECRET; // Your secret key from environment variable
      const token = jwt.sign({ user_id: userId }, jwtSecret, { expiresIn: '1h' });
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
    const userId = req.authUser.user_id;

    const userOrders = await prisma.orders.findMany({
      where: {
        user_id: userId, // Ensure this matches the field in your Orders model that references the user ID
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
    const { orderNumber, product, quantity, price  } = req.body;
    const userId = req.authUser.user_id;

    if (!orderNumber || !product || !quantity || !price ) {
      return res.status(400).json({ error: 'Invalid request data. Please provide order details.' });
    }

    // Create a new order
    const newOrder = await prisma.orders.create({
      data: {
        orderNumber: orderNumber,
        user_id: userId, 
        product: product,
        quantity: quantity,
        price: price,
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
    const { orderNumber, product, quantity, price } = req.body;

   
    const userId = req.authUser.user_id;

    // Check if the order belongs to the authenticated user
    const order = await prisma.orders.findFirst({
      where: {
        AND: [
          { id: orderId },
          { user_id: userId }
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
        price,
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
    const userId = req.authUser.user_id;

    // Check if the order belongs to the authenticated user
    const order = await prisma.orders.findFirst({
      where: {
        AND: [
          { id: orderId },
          { user_id: userId }
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
    const userId = req.authUser.user_id;
    const orderId = req.params.id;

    const userOrder = await prisma.orders.findUnique({
      where: {
        id: orderId,
        user_id: userId,
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

// New route to process an order, update product quantity, and send an email with userId only
router.post('/process-order/:cartId', authenticateToken, async (req, res) => {
  const cartId = req.params.cartId;
  const emailServiceURL = 'http://your-email-service-url/send_email'; // Replace with the actual email API endpoint

  try {
    // Retrieve cart data using the getCartData function
    const cartData = await getCartData(cartId);
    const userId = cartData.user_id; // Assuming getCartData includes userId in its response

    // Update product quantities in the product-service
    for (const product of cartData.products) {
      const productId = product.id;
      const cartQuantity = product.quantity;

      // Update product quantity using the updateProductQuantity function
      await updateProductQuantity(productId, cartQuantity);
    }

    // Transform the cartData as needed to match the Email API's expected format, sending userId only
    const emailData = {
      user_id: userId, // Only include the userId in the email data
      subject: 'Your Order Details',
      body: `Your order with ID ${cartId} has been processed. Details: ${JSON.stringify(cartData)}`,
    };

    // Send the data to the Email API with JWT for authentication
    const emailApiToken = jwt.sign({  service: 'OrderProcessingService'}, process.env.JWT_SECRET, { expiresIn: '1h' });

    const emailResponse = await axios.post(emailServiceURL, emailData, {
      headers: {
        Authorization: `Bearer ${emailApiToken}`,
      },
    });

    // Success response
    res.status(200).json({
      message: 'Order processed, product quantities updated, and email data sent successfully with userId',
      emailServiceResponse: emailResponse.data,
    });
  } catch (error) {
    console.error('Failed to process order, update product quantities, and send email data with userId:', error);
    res.status(500).json({ error: 'Failed to process order, update product quantities, and send email data with userId' });
  }
});



module.exports = router;