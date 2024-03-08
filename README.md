# CNA-Order-Service
Order Service API
https://cna-order-service.azurewebsites.net/
Swagger
https://cna-order-service.azurewebsites.net/api-docs
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

Replace {{token}} with your generated token.
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
### GET ORDER BY ORDER ID
GET https://cna-order-service.azurewebsites.net/orders/myorders/:id
Authorization: Bearer {{token}}
```

```bash
### GET ORDER FOR LOGGED-IN USER
GET https://cna-order-service.azurewebsites.net/orders/myorders
Authorization: Bearer {{token}}
```

```bash
### POST ORDER

POST https://cna-order-service.azurewebsites.net/orders
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "product": "CAMEL001",
  "quantity": 1,
  "price": 50000
}
```

```bash
### PATCH ORDER

PATCH https://cna-order-service.azurewebsites.net/orders/:id
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "product": "CAM002",
  "quantity": 3,
  "price": 15000
}
```

```bash
### DELETE ORDER

DELETE https://cna-order-service.azurewebsites.net/orders/:id
Authorization: Bearer {{token}}
```
