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
## Endpoints Overview

### Get Item
- **Endpoint:** `/item/{id}`
- **Method:** `GET`
- **Description:** Retrieves details of an item by ID.

### Add Item
- **Endpoint:** `/item`
- **Method:** `POST`
- **Description:** Adds a new item to the collection.

### Update Item
- **Endpoint:** `/item/{id}`
- **Method:** `PUT`
- **Description:** Updates an existing item by ID.

### Delete Item
- **Endpoint:** `/item/{id}`
- **Method:** `DELETE`
- **Description:** Deletes an item by ID.

## Examples

### Get Item Example
```bash
GET /item/123
Authorization: Bearer YOUR_API_KEY
```
### Add Item Example
```bash
POST /item
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "name": "New Item",
  "description": "Description of the new item"
}
```

