# CNA-Order-Service
Order Service API
https://cna-order-service.azurewebsites.net/
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
https://cna-order-service.azurewebsites.net/orders/generate-token
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

```bash
### GET ALL
GET https://cna-order-service.azurewebsites.net/orders/
```

```bash
### GET BY ID
GET https://cna-order-service.azurewebsites.net/orders/myorders/:id
Authorization: Bearer {{token}}
```

```bash
### GET ORDERS FOR LOGGED-IN USER
GET https://cna-order-service.azurewebsites.net/orders/myorders
Authorization: Bearer {{token}}
#/* TOKEN GENERATOR FOR TESTING USER ID
#http://localhost:3030/orders/generate-token to get ur token which you add to HTTP auth bearer
#*/
```

```bash
### Get token from above link and add to authorization for testing purposes! Also change userId in generator...
POST https://cna-order-service.azurewebsites.net/orders
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "orderNumber": "new test",
  "product": "donny bump",
  "quantity": 2,
  "totalPrice": 50
}
```

```bash
### PATCH ORDER

PATCH https://cna-order-service.azurewebsites.net/orders/:id
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "orderNumber": "123456",
  "product": "Updated 2",
  "quantity": 5,
  "totalPrice": 50.99
}
```

```bash
### DELETE ORDER

DELETE https://cna-order-service.azurewebsites.net/orders/:id
Authorization: Bearer {{token}}
```
