const express = require('express')
const router = express.Router()
const axios = require('axios');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const authenticateToken = require('../middleware/auth')
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()
require('dotenv').config()

/* FUNCTIONS */

// Function to create a new order in the system.
// Called in the "process-order" route below.
async function createOrder(userId, userName, address, cartData) {
  try {
    const newOrder = await prisma.orders.create({
      data: {
        user_id: userId,
        username: userName,
        address: address,
        rows: {
          createMany: {
            data: cartData.map(cartItem => ({
              product: cartItem.product_id, 
              price: parseFloat(cartItem.price),
              quantity: cartItem.quantity
            }))
          }
        }
      },
      include: {
        rows: true
      }
    });
    return newOrder;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to create an order');
  }
}

// Function to delete cart data in the cart service
// Called in the "process-order" route below.
const deleteCartData = async (userToken) => {
  const cartServiceURL = `https://cartserviceem.azurewebsites.net/cart`;

  try {
    const result = await axios.delete(cartServiceURL, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    // Response
    return result.data;
  } catch (error) {
    console.error('Failed to retrieve cart data:', error);
    throw new Error('Failed to retrieve cart data');
  }
};

// Function to retrieve cart data from the cart service
// Called in the "process-order" route below.
const getCartData = async (userToken) => {
  const cartServiceURL = 'https://cartserviceem.azurewebsites.net/cart';

  try {
    const response = await axios.get(cartServiceURL, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    // Response
    return response.data;
  } catch (error) {
    console.error('Failed to retrieve cart data:', error);
    throw new Error('Failed to retrieve cart data');
  }
};

// Function to retrieve product details from the product service
// Called in the updateProductQuantity function below.
const getProductDetails = async (userToken, productId) => {
  const productServiceURL = `https://cna-product-service.azurewebsites.net/products/${productId}`;

  try {
    const productResponse = await axios.get(productServiceURL, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    // Response
    return productResponse.data;
  } catch (error) {
    console.error(`Failed to retrieve product details for ID ${productId}:`, error);
    throw new Error(`Failed to retrieve product details for ID ${productId}`);
  }
};

// Function to update product quantity in the product service
// Called in the "process-order" route below.
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

    // Response
    console.log(`Product with ID ${productId} quantity updated from ${currentQuantity} to ${updatedQuantity}`);
  } catch (error) {
    console.error(`Failed to update product with ID ${productId} quantity:`, error);
    throw new Error(`Failed to update product with ID ${productId} quantity`);
  }
};

// Function to send order confirmation email using the email service
// Called in the "process-order" route below.
const postEmail = async (userToken, orderData) => {
  const emailServiceURL = `https://cna-email-service.azurewebsites.net/process-order`;

  try {
    const emailResponse = await axios.post(emailServiceURL, {
      orderData: orderData
    }, {
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });
    
    // Response
    return emailResponse;
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, message: 'Failed to send confirmation email' };
  }  
};

/* ROUTES */

// Route to process an order, update product quantity, and send confirmation email
// For use in frontend when making a purchase.
router.post('/process-order', authenticateToken, async (req, res) => {
  const userToken = req.authUser.token;

  try {
    const { id: userId } = req.authUser;
    const { address } = req.body;
    const userName = req.authUser.username;

    // Retrieve cart data
    const cartData = await getCartData(userToken);

    // Check if cartData is empty
    if (!cartData || cartData.length === 0) {
      return res.status(400).json({ error: 'No products found in the cart.' });
    }

    // Update product quantities in the product-service
    for (const cartItem of cartData) {
      const productId = cartItem.product_id;
      const cartQuantity = cartItem.quantity;

      // Update product quantity using the updateProductQuantity function
      await updateProductQuantity(userToken, productId, cartQuantity).catch(error => {
        console.error(`Failed to update product with ID ${productId} quantity:`, error);
        throw new Error(`Failed to update product with ID ${productId} quantity`);
      });
    }

    // Create order
    const newOrder = await createOrder(userId, userName, address, cartData);

    // Send confirmation email
    const emailResponse = await postEmail(userToken, newOrder);

    // Delete cart data
    await deleteCartData(userToken);

    // Response
    res.status(200).json({
      message: 'Order processed, product quantities updated, and cart data retrieved successfully',
      orderDetails: newOrder,
      emailResponse: emailResponse.data
    });
  } catch (error) {
    console.error('Failed to process order and update product quantities:', error);
    res.status(500).json({ error: 'Failed to process order and update product quantities' });
  }
});

// Route for frontend to get the current users orders.
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

// GET your specific order based on order Id
router.get('/myorders/:orderId', authenticateToken, async (req, res) => {
  try {
    // Accessing the user ID from req.authUser
    const userId = req.authUser.id;
    const userName = req.authUser.username;
    const orderId = req.params.orderId;

    const userOrder = await prisma.orders.findUnique({
      where: {
        id: orderId,
        user_id: userId,
        username: userName
      },
      include: {
        rows: true
      }
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

// ID av order får man från get request ovan
// Patch route for admins/customer support
router.patch('/:orderId', authenticateToken, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { address, products } = req.body; // Updated order data
    const userId = req.authUser.id;
    const userName = req.authUser.username;

    // Check if order ID is provided
    if (!orderId) {
      return res.status(400).json({ error: 'Invalid request data. Order ID is required.' });
    }

    const existingOrder = await prisma.orders.findUnique({
      where: {
        id: orderId,
        user_id: userId,
        username: userName
      }
    });

    if (!existingOrder) {
      return res.status(404).json({ error: 'Order not found.' });
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

// Delete your specific order and rows belonging to that order
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
    
    if (order.user_id !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this order.' });
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

/* TESTING ROUTES */

// Route for TESTING POST, use the "process-order" route for posting orders instead!
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

/**
 * @swagger
 * /orders/myorders/{orderId}:
 *   get:
 *     summary: Retrieve a single order by ID for the authenticated user.
 *     description: Fetches details of a specific order by its ID, only if it belongs to the authenticated user.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to retrieve.
 *     responses:
 *       200:
 *         description: Detailed information about the order.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found for this user.
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /orders/{orderId}:
 *   delete:
 *     summary: Deletes a specific order.
 *     description: Allows for the deletion of an order by its ID. Only accessible by the user who created the order.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to delete.
 *     responses:
 *       200:
 *         description: Order deleted successfully.
 *       403:
 *         description: Unauthorized to delete this order.
 *       404:
 *         description: Order not found.
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /orders/{orderId}:
 *   patch:
 *     summary: Updates an existing order.
 *     description: Allows for updating the details of an existing order. Only accessible by the user who created the order.
 *     parameters:
 *       - in: path
 *         name: orderId
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
 *               address:
 *                 type: string
 *                 description: The updated shipping address for the order.
 *               products:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Order'
 *                 description: The updated list of products in the order.
 *     responses:
 *       200:
 *         description: Order updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       403:
 *         description: Unauthorized to update this order.
 *       404:
 *         description: Order not found.
 *       500:
 *         description: Failed to update the order.
 *     security:
 *       - bearerAuth: []
 */

/**
 * @swagger
 * /orders/process-order:
 *   post:
 *     summary: Processes an order from the cart.
 *     description: Authenticates the user, retrieves cart data, updates product quantities, creates an order, sends an email confirmation, and deletes the cart data.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               address:
 *                 type: string
 *                 description: Shipping address for the order.
 *             required:
 *               - address
 *     responses:
 *       200:
 *         description: Order processed successfully. Product quantities updated, cart data deleted, and email sent.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order processed, product quantities updated, and cart data retrieved successfully
 *                 orderDetails:
 *                   $ref: '#/components/schemas/Order'
 *                 emailResponse:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: Email sent successfully
 *       400:
 *         description: Bad request, e.g., no products found in the cart.
 *       500:
 *         description: Server error, e.g., failed to process order and update product quantities.
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
 *        address:
 *          type: string
 *          example: '123 Main St, Cityville'
 *      required:
 *        - orderNumber
 *        - user_id
 *        - product
 *        - quantity
 *        - price
 */

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Retrieve a single order by ID.
 *     description: Fetches details of a specific order by its ID.
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the order to retrieve.
 *     responses:
 *       200:
 *         description: Detailed information about the order.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       404:
 *         description: Order not found.
 */



module.exports = router;