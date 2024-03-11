# CNA Order Service API Documentation

Welcome to the CNA Order Service API documentation. This API facilitates the management of orders within the system. Below you will find detailed information on how to use each endpoint provided by the API.

## Base URL

The base URL for accessing the CNA Order Service API is:

https://cna-order-service.azurewebsites.net/

## Swagger(not updated)

https://cna-order-service.azurewebsites.net/api-docs


## Authentication

Authentication is required for accessing most of the endpoints provided by this API. The authentication is done using JSON Web Tokens (JWT). When making requests to authenticated endpoints, you should include the JWT token in the `Authorization` header as follows:

Authorization: Bearer <your_jwt_token>


# Installation

Instructions for setting up the project locally:

```bash
git clone [repository-url]
cd [project-directory]
npm install
npm start
```


## Endpoints

### 1. Get User Orders

- **Endpoint:** `GET /orders/myorders`
- **Description:** Retrieve all orders belonging to the authenticated user.
- **Authentication:** Required
- **Response:** Returns an array of orders associated with the authenticated user.

```bash
# Get all Orders for the authenticated user.
GET https://cna-order-service.azurewebsites.net/orders/myorders
Authorization: Bearer {{token}}
```

### 2. Get Specific User Order

- **Endpoint:** `GET /orders/myorders/:orderId`
- **Description:** Retrieve a specific order based on the provided order ID.
- **Authentication:** Required
- **Response:** Returns the order details if found, otherwise returns a 404 error.

```bash
# Get specific order for the authenticated user based on order id.
GET https://cna-order-service.azurewebsites.net/orders/myorders/:orderId
Authorization: Bearer {{token}}
```

### 3. Create Order (Use process-order route instead!)

- **Endpoint:** `POST /orders`
- **Description:** Create a new order.
- **Authentication:** Required
- **Request Body:** Requires a JSON object containing `products`.
- **Response:** Returns the newly created order.

```bash
# Post order with one product_id. Address is not required in the request body*
POST https://cna-order-service.azurewebsites.net/orders
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "products": [
    {
      "product": "DRO-003",
      "price": 279.99,
      "quantity": 10
    }
  ],
  "address": "123 Main St"
}
```

```bash
# Post order with multiple product_id:s. Address is not required in the request body*
POST https://cna-order-service.azurewebsites.net/orders
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "products": [
    {
      "product": "CAM-007",
      "price": 30,
      "quantity": 1
    },
    {
      "product": "KUN-001",
      "price": 279.99,
      "quantity": 2
    }
  ],
  "address": "123 Sesame St"
}
```

### 4. Update Order

- **Endpoint:** `PATCH /orders/:orderId`
- **Description:** Update an existing order.
- **Authentication:** Required
- **Request Body:** Requires a JSON object containing `products`.
- **Response:** Returns the updated order details.

```bash
# Update Order by row id. Address is not required in the request body*
PATCH https://cna-order-service.azurewebsites.net/orders/:orderId
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "address": "3 Abbey Road",
  "products": [
    {
      "id": "65eb6a4c02aa42bcd5b5986d",
      "product": "DRO-003",
      "price": 279.99,
      "quantity": 55
    }
  ]
}
```

### 5. Delete Order

- **Endpoint:** `DELETE /orders/:orderId`
- **Description:** Delete a specific order.
- **Authentication:** Required
- **Response:** Returns a success message if the order is successfully deleted.

```bash
# Delete an entire Order and it's existing rows based on Order id.
DELETE https://cna-order-service.azurewebsites.net/orders/:orderId
Authorization: Bearer {{token}}
```

### 6. Process Order (Use this route for posting orders not the post route above!)

- **Endpoint:** `POST /orders/process-order`
- **Description:** Process an order by updating product quantities and creating the order.
- **Authentication:** Required
- **Response:** Returns a success message along with the order details.

```bash
# Correct Order POST route, it gets the data from the Cart API, then updates the product Quantity in Product API, creates the Order and deletes the current Cart. Additionally, the data is required to be in the correct format in the Cart API. If the product_id is wrong in the cart then this route will not work accordingly. Address is not required in the request body*
POST https://cna-order-service.azurewebsites.net/orders/process-order
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "address": "123 Tickleberry Lane"
}
```

## Error Handling

The API follows standard HTTP status codes for indicating the success or failure of a request. In case of an error, additional information may be provided in the response body.

- **400 Bad Request:** Indicates that the request is invalid or missing required parameters.
- **401 Unauthorized:** Indicates that authentication is required or the provided token is invalid.
- **403 Forbidden:** Indicates that the authenticated user does not have permission to access the requested resource.
- **404 Not Found:** Indicates that the requested resource was not found.
- **500 Internal Server Error:** Indicates that an unexpected error occurred on the server.

For any further inquiries or assistance, please contact the API administrator.

---

This documentation provides a comprehensive guide on how to use the CNA Order Service API. If you have any questions or need further assistance, please don't hesitate to reach out to us. Thank you for using our service!

