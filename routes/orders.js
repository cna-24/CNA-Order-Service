const express = require('express')
const router = express.Router()
const axios = require('axios');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const authenticateToken = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
require('dotenv').config()

async function createOrder(userId, product, quantity, price) {
  try {
    const GeneratedorderNumber = generateOrderNumber();
    // Create a new order
    const newOrder = await prisma.orders.create({
      data: {
        orderNumber: GeneratedorderNumber,
        id: userId,
        product: product,
        quantity: quantity,
        price: price,
      },
    });

    return newOrder;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to create an order');
  }
}

//Simple Function to generate a random order number for when creating a new order
function generateOrderNumber() {
  // Take the last 6 digits of the current timestamp
  const timestamp = Date.now().toString().slice(-6);
  // Generate a random string of length 6
  const random = Math.random().toString(36).substr(2, 6);
  // Combine timestamp and random components to create the order number
  const orderNumber = `${timestamp}${random}`;
  return orderNumber;
}

// Function to delete cart data in the cart service
const deleteCartData = async (userToken) => {
  const cartServiceURL = `https://cartserviceem.azurewebsites.net/cart`;

  try {
    const result = await axios.delete(cartServiceURL, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    return result.data;
  } catch (error) {
    console.error('Failed to retrieve cart data:', error);
    throw new Error('Failed to retrieve cart data');
  }
};

// Function to retrieve cart data from the cart service
const getCartData = async (userToken) => {
  const cartServiceURL = `https://cartserviceem.azurewebsites.net/cart`;

  try {
    const result = await axios.get(cartServiceURL, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    return result.data;
  } catch (error) {
    console.error('Failed to retrieve cart data:', error);
    throw new Error('Failed to retrieve cart data');
  }
};

// Function to retrieve product details from the product service
const getProductDetails = async (userToken, productId) => {
  const productServiceURL = `https://cna-product-service.azurewebsites.net/products/${productId}`;

  try {
    const productResponse = await axios.get(productServiceURL, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });
    return productResponse.data;
  } catch (error) {
    console.error(`Failed to retrieve product details for ID ${productId}:`, error);
    throw new Error(`Failed to retrieve product details for ID ${productId}`);
  }
};

// Function to update product quantity in the product service
const updateProductQuantity = async (userToken, productId, cartQuantity) => {
  const productServiceURL = `https://cna-product-service.azurewebsites.net/products/${productId}`;

  try {
    // Make a GET request to retrieve current product details
    const currentProductDetails = await getProductDetails(userToken, productId);
    const currentQuantity = currentProductDetails.quantity;

    // Subtract cartQuantity from currentQuantity
    const updatedQuantity = currentQuantity - cartQuantity;

    // Make a PATCH request to update product quantity
    await axios.patch(productServiceURL, {
      quantity: updatedQuantity,
    }, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    console.log(`Product with ID ${productId} quantity updated from ${currentQuantity} to ${updatedQuantity}`);
  } catch (error) {
    console.error(`Failed to update product with ID ${productId} quantity:`, error);
    throw new Error(`Failed to update product with ID ${productId} quantity`);
  }
};


// TEST-CODE-STARTS
// Function to retrieve product details from the product service
const getProductDetailsTest = async (userToken, productId) => {
  const productServiceURL = `https://cna-product-service.azurewebsites.net/products/${productId}`;

  try {
    const productResponse = await axios.get(productServiceURL, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });
    return productResponse.data;
  } catch (error) {
    console.error(`Failed to retrieve product details for ID ${productId}:`, error);
    throw new Error(`Failed to retrieve product details for ID ${productId}`);
  }
};

// Function to update product quantity in the product service
const updateProductQuantityTest = async (userToken) => {
  
  const productId = "CAM-002";
  const cartQuantity = 1;
  const productServiceURL = `https://cna-product-service.azurewebsites.net/products/${productId}`;

  try {
    // Make a GET request to retrieve current product details
    const currentProductDetails = await getProductDetailsTest(userToken, productId);
    const currentQuantity = currentProductDetails.quantity;

    // Subtract cartQuantity from currentQuantity
    const updatedQuantity = currentQuantity - cartQuantity;

    // Make a PATCH request to update product quantity
    await axios.patch(productServiceURL, {
      quantity: updatedQuantity,
    }, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    console.log(`Product with ID ${productId} quantity updated from ${currentQuantity} to ${updatedQuantity}`);
  } catch (error) {
    console.error(`Failed to update product with ID ${productId} quantity:`, error);
    throw new Error(`Failed to update product with ID ${productId} quantity`);
  }
};


router.post('/product-service-test', authenticateToken, async (req, res) => {
  const userToken = req.authUser.token;

  try {
    // Update product quantity using the updateProductQuantityTest function
    await updateProductQuantityTest(userToken);
   
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// TEST-CODE-ENDS


// Route for User front-end. Get 
router.get('/myorders', authenticateToken, async (req, res) => {
  try {
    // Accessing the user ID from req.authUser
    const userId = req.authUser.id;
    const userName = req.authUser.username;

    const userOrders = await prisma.orders.findMany({
      where: {
        user_id: userId,
        username: userName
      },
      include: {
        rows: true
      }
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
    const { products, address } = req.body;
    const { id: userId, username: userName } = req.authUser;

    // Check if products is provided
    if (!products || (Array.isArray(products) && products.length === 0)) {
      return res.status(400).json({ error: 'Invalid request data. Please provide at least one product.' });
    }

    // Create an order with one or multiple products
    const newOrder = await prisma.orders.create({
      data: {
        user_id: userId,
        username: userName,
        address: address,
        rows: {
          createMany: {
            data: Array.isArray(products) ? products.map(product => ({
              product: product.product,
              price: product.price,
              quantity: product.quantity
            })) : [{
              product: products.product,
              price: products.price,
              quantity: products.quantity
            }]
          }
        }
      },
      include: {
        rows: true
      }
    });

    res.status(201).json(newOrder);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});



// ID av order får man från get request ovan, kanske måste implementera get by id.
router.patch('/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { address, products } = req.body; // Updated order data

    // Check if order ID is provided
    if (!orderId) {
      return res.status(400).json({ error: 'Invalid request data. Order ID is required.' });
    }
    // Begin transaction
    await prisma.$transaction([
      // Update order address
      prisma.orders.update({
        where: {
          id: orderId,
        },
        data: {
          address: address,
        },
      }),
      // Update or create products
      ...products.map(product => prisma.rows.upsert({
        where: { id: product.id },
        create: {
          product: product.product,
          price: product.price,
          quantity: product.quantity,
          order_id: orderId
        },
        update: {
          product: product.product,
          price: product.price,
          quantity: product.quantity,
        }
      }))
    ]);

    const updatedOrder = await prisma.orders.findUnique({
      where: {
        id: orderId
      },
      include: {
        rows: true
      }
    });
    res.status(200).json({ message: 'Order updated successfully.', order: updatedOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const userId = req.authUser.id;
    const userName = req.authUser.username;

    const order = await prisma.orders.findUnique({
      where: {
        id: orderId,
        user_id: userId,
        username: userName
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    // Delete associated rows first
    await prisma.rows.deleteMany({
      where: {
        order_id: orderId,
      },
    });

    // Delete the order
    await prisma.orders.delete({
      where: {
        id: orderId,
      },
    });

    res.status(200).json({ message: 'Order successfully deleted.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error.' });
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
        id: userId,
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
router.post('/process-order', authenticateToken, async (req, res) => {
  const userToken = req.authUser.token;
  const emailServiceURL = 'http://your-email-service-url/send_email'; // Replace with the actual email API endpoint

  try {
    // Retrieve cart data using the getCartData function
    const cartData = await getCartData(userToken);

    // Allting härifrån neråt behöver ännu testas/ändras

    const userId = cartData.id; // Assuming getCartData includes userId in its response

    // Update product quantities in the product-service
    for (const cartItem of cartData) {
      const productId = cartItem.product; // Assuming product field is the productId
      const cartQuantity = cartItem.quantity;

      // Update product quantity using the updateProductQuantity function
      await updateProductQuantity(productId, cartQuantity);
    }

    // Transform the cartData as needed to match the Email API's expected format, sending userId only
    const emailData = {
      id: userId, // Only include the userId in the email data
      subject: 'Your Order Details',
      body: `Your order with ID ${cartId} has been processed. Details: ${JSON.stringify(cartData)}`,
    };

    // Send the data to the Email API with JWT for authentication
    const emailApiToken = jwt.sign({ service: 'OrderProcessingService' }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const emailResponse = await axios.post(emailServiceURL, emailData, {
      headers: {
        Authorization: `Bearer ${emailApiToken}`,
      },
    });

    // Save the order to our database
    const orderDetails = cartData.items.map(item => ({
      product: item.productId,
      quantity: item.quantity,
      price: item.price // Adjust based on your data structure
    }));


    for (const detail of orderDetails) {
      await createOrder(userId, detail.product, detail.quantity, detail.price);
    }

    // Delete cart data using the deleteCartData function
    await deleteCartData(userToken);

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


/**
 * @swagger
 * /orders/myorders/{id}:
 *   get:
 *     summary: Retrieve a single order by ID for the authenticated user.
 *     description: Fetches details of a specific order by its ID, only if it belongs to the authenticated user.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to retrieve.
 *     responses:
 *       200:
 *         description: Detailed information about the order.
 *       404:
 *         description: Order not found for this user.
 *     security:
 *       - bearerAuth: []
 */


/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Deletes a specific order.
 *     description: Allows for the deletion of an order by its ID. Only accessible by the user who created the order.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to delete.
 *     responses:
 *       200:
 *         description: Order deleted successfully.
 *       403:
 *         description: Unauthorized to delete this order.
 *       400:
 *         description: Failed to delete the order.
 *     security:
 *       - bearerAuth: []
 */


/**
 * @swagger
 * /orders/{id}:
 *   patch:
 *     summary: Updates an existing order.
 *     description: Allows for updating the details of an existing order. Only accessible by the user who created the order.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               orderNumber:
 *                 type: string
 *               product:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               price:
 *                 type: number
 *                 format: float
 *     responses:
 *       200:
 *         description: Order updated successfully.
 *       403:
 *         description: Unauthorized to update this order.
 *       400:
 *         description: Failed to update the order.
 *     security:
 *       - bearerAuth: []
 */


/**
 * @swagger
 * /orders/process-order/{cartId}:
 *   post:
 *     summary: Processes an order from a cart.
 *     description: Retrieves cart data, updates product quantities, sends an email to the user, and saves the order to the database.
 *     parameters:
 *       - in: path
 *         name: cartId
 *         required: true
 *         schema:
 *           type: string
 *         description: The cart ID to process.
 *     responses:
 *       200:
 *         description: Order processed successfully, including product updates and email confirmation.
 *       500:
 *         description: Failed to process the order.
 *     security:
 *       - bearerAuth: []
 */


/**
 * @swagger
 * components:
 *  schemas:
 *    Order:
 *      type: object
 *      properties:
 *        orderNumber:
 *          type: string
 *          example: '123456abcdef'
 *        id:
 *          type: string
 *          example: 'userId123'
 *        product:
 *          type: string
 *          example: 'Product Name'
 *        quantity:
 *          type: integer
 *          example: 1
 *        price:
 *          type: number
 *          format: float
 *          example: 19.99
 *      required:
 *        - orderNumber
 *        - user_id
 *        - product
 *        - quantity
 *        - price
 */


/**
 * @swagger
 * /orders/myorders:
 *   get:
 *     summary: Retrieve all orders for the authenticated user.
 *     description: Fetches a list of orders placed by the authenticated user.
 *     responses:
 *       200:
 *         description: An array of orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       404:
 *         description: No orders found for this user.
 *     security:
 *       - bearerAuth: []
 */


module.exports = router;