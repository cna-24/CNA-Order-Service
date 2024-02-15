# CNA-Order-Service
Order Service API

# Installation

Instructions for setting up the project locally:

```bash
git clone [repository-url]
cd [project-directory]
npm install
npm start
```
## Usage

Token Generation
To generate a token for testing, make a GET request to:
```bash
http://localhost:3030/orders/generate-token
```

## Endpoints Overview

Get all orders for the authenticated user.
```bash
GET /orders/myorders
```

Get a specific order for the authenticated user.
```bash
GET /orders/myorders/:id
```

Create a new order for the authenticated user.
```bash
POST /orders
```

Update a specific order for the authenticated user.
```bash
PATCH /orders/:id
```

Delete a specific order for the authenticated user.
```bash
DELETE /orders/:id
```

## Examples

### GET ALL
GET {{apiUrl}}/orders/

### GET BY ID
GET {{apiUrl}}/orders/myorders/:id
Authorization: Bearer {{token}}

### GET ORDERS FOR LOGGED-IN USER
GET {{apiUrl}}/orders/myorders
Authorization: Bearer {{token}}
#/* TOKEN GENERATOR FOR TESTING USER ID
#http://localhost:3030/orders/generate-token to get ur token which you add to HTTP auth bearer
#*/

### Get token from above link and add to authorization for testing purposes! Also change userId in generator...
POST http://localhost:3030/orders
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "orderNumber": "new test",
  "product": "donny bump",
  "quantity": 2,
  "totalPrice": 50
}

### PATCH ORDER

PATCH http://localhost:3030/orders/:id
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "orderNumber": "123456",
  "product": "Updated 2",
  "quantity": 5,
  "totalPrice": 50.99
}

### DELETE ORDER

DELETE {{apiUrl}}/orders/:id
Authorization: Bearer {{token}}

