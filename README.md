# GRAVITY_BACKEND_MARKETLINK_TECHWIZ7

# API Documentation - MarketLink Backend

## Introduction

MarketLink is a comprehensive backend API for a marketplace platform. This API handles user authentication, product management, order processing, and more. All API endpoints follow RESTful conventions with JSON request and response bodies.

---

## Environment Configuration

### Database
```
DB_CONNECTION=mysql
DB_HOST=your_mysql_host
DB_PORT=3306
DB_DATABASE=your_database_name
DB_USERNAME=your_database_user
DB_PASSWORD=your_database_password
```

### JWT (JSON Web Tokens)
```
JWT_SECRET=your_jwt_secret_key
JWT_TTL=900
```

### Admin Users
The database contains pre-configured admin users with the following credentials:
```
Email: [EMAIL_ADDRESS] | [EMAIL_ADDRESS] | [EMAIL_ADDRESS]
Password: [PASSWORD] | [PASSWORD] | [PASSWORD]
```

---

## Authentication

All endpoints except `/auth/*` require authentication.

### Token Refresh
```http
POST /api/v1/auth/refresh
```
**Body:**
```json
{
  "token": "your_expired_or_refresh_token"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "new_access_token",
    "token_type": "Bearer",
    "expires_in": 300
  }
}
```

---

## User Management

### View User Profile
```http
GET /api/v1/users/view
```
**Headers:**
```
Authorization: Bearer <access_token>
```
**Response:**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Doe",
      "email": "[EMAIL_ADDRESS]",
      "phone": "1234567890",
      "address": "123 Main St",
      "city": "New York",
      "country": "USA",
      "created_at": "2026-01-15T10:30:00.000000Z",
      "updated_at": "2026-01-20T14:20:00.000000Z"
    }
  }
}
```

### Update User Profile
```http
PUT /api/v1/users/update
```
**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```
**Body:**
```json
{
  "name": "John Updated",
  "phone": "0987654321",
  "address": "456 Updated St",
  "city": "Los Angeles",
  "country": "USA",
  "image": "https://example.com/profile.jpg"
}
```
**Response:**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "user": {
      "id": 1,
      "name": "John Updated",
      "email": "[EMAIL_ADDRESS]",
      "phone": "0987654321",
      "address": "456 Updated St",
      "city": "Los Angeles",
      "country": "USA",
      "image": "https://example.com/profile.jpg",
      "created_at": "2026-01-15T10:30:00.000000Z",
      "updated_at": "2026-01-25T09:15:00.000000Z"
    }
  }
}
```

---

## Product Management

### Create Product
```http
POST /api/v1/products
```
**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```
**Body:**
```json
{
  "name": "Premium T-Shirt",
  "description": "High quality cotton t-shirt",
  "category": "Apparel",
  "price": 25.00,
  "stock": 100,
  "color": "Blue",
  "size": "L",
  "image": "https://example.com/tshirt.jpg",
  "seller_id": 1
}
```
**Response:**
```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "product": {
      "id": 1,
      "name": "Premium T-Shirt",
      "description": "High quality cotton t-shirt",
      "category": "Apparel",
      "price": 25.00,
      "stock": 100,
      "color": "Blue",
      "size": "L",
      "image": "https://example.com/tshirt.jpg",
      "seller_id": 1,
      "created_at": "2026-01-25T11:30:00.000000Z",
      "updated_at": "2026-01-25T11:30:00.000000Z"
    }
  }
}
```

### Update Product
```http
PUT /api/v1/products/<id>
```
**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```
**Path Parameters:**
- `id`: Product ID (integer, required)

**Body:**
```json
{
  "name": "Premium T-Shirt",
  "price": 27.50,
  "stock": 95,
  "image": "https://example.com/new_tshirt.jpg"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Product updated successfully",
  "data": {
    "product": {
      "id": 1,
      "name": "Premium T-Shirt",
      "description": "High quality cotton t-shirt",
      "category": "Apparel",
      "price": 27.50,
      "stock": 95,
      "color": "Blue",
      "size": "L",
      "image": "https://example.com/new_tshirt.jpg",
      "seller_id": 1,
      "created_at": "2026-01-25T11:30:00.000000Z",
      "updated_at": "2026-01-25T12:45:00.000000Z"
    }
  }
}
```

### Delete Product
```http
DELETE /api/v1/products/<id>
```
**Headers:**
```
Authorization: Bearer <access_token>
```
**Path Parameters:**
- `id`: Product ID (integer, required)

**Response:**
```json
{
  "success": true,
  "message": "Product deleted successfully",
  "data": null
}
```

### List Products
```http
GET /api/v1/products
```
**Query Parameters:**
- `seller_id`: Filter by seller (optional)
- `category`: Filter by category (optional)
- `min_price`: Minimum price (optional)
- `max_price
