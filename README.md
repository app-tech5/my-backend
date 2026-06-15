# Food Delivery Backend API

A complete Node.js backend for a food delivery application built with Express.js, MongoDB, Socket.io, and modern development practices.

## 🚀 Features

### Core Functionality
- **🔐 User Authentication** - JWT-based authentication with role management (customer, restaurant, delivery driver)
- **🍽️ Restaurant Management** - Complete restaurant, product, menu, and category management
- **🛒 Shopping Cart** - Persistent cart with item management and validation
- **📦 Order Processing** - Order lifecycle management from placement to delivery
- **🚚 Delivery System** - Real-time driver tracking and delivery management
- **💳 Payment Integration** - Multiple payment methods and transaction handling
- **⭐ Reviews & Ratings** - Customer reviews and rating system
- **📍 Geolocation** - Location-based services for delivery and restaurant discovery 

### Technical Features
- **🔄 Real-time Updates** - Socket.io for live order tracking and notifications
- **🌐 Internationalization** - English and French language support
- **📁 File Upload** - Image and document upload with Multer
- **🗄️ Database Migrations** - MongoDB migration system for schema management
- **🧪 Testing** - Vitest testing framework with MongoDB Memory Server
- **🔒 Security** - Password hashing, CORS, input validation
- **📊 Analytics** - Comprehensive reporting and statistics

## 🛠️ Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time**: Socket.io
- **File Handling**: Multer
- **Internationalization**: i18n library
- **Testing**: Vitest + MongoDB Memory Server
- **Migration**: migrate-mongo
- **Security**: bcryptjs, CORS
- **Deployment**: Render


## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone and install dependencies**
```bash
cd my-backend
npm install
```

2. **Environment Setup**
Create a `.env` file in the root directory:
```env
# Database
MONGO_URI=mongodb://127.0.0.1:27017/good-foods

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Server
PORT=5000
NODE_ENV=development

# CORS (comma-separated URLs)
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

3. **Database Setup**
```bash
# Test database connection
npm run test:db

# Run migrations
npm run migrate:up
```

4. **Start the server**
```bash
# Development mode
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:5000`

## 📊 Database & Migrations

### Database Setup
```bash
# Test connection
npm run test:db

# Run all migrations
npm run migrate:up

# Check migration status
npm run migrate:status

# Rollback last migration (if needed)
npm run migrate:down

# Create new migration
npm run migrate:create
```

### Migration Order
Migrations run in dependency order:
1. Base schemas (currencies, languages, settings)
2. Reference data (taxes, categories)
3. Users and authentication
4. Products and menus
5. Orders and transactions
6. Reports and analytics

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start development server (with nodemon) |
| `npm test` | Run tests with Vitest |
| `npm run test:db` | Test database connection |
| `npm run migrate:up` | Run database migrations |
| `npm run migrate:status` | Check migration status |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix linting issues |

## 📁 Project Structure

```
src/
├── config/           # Configuration files
│   ├── db.js         # MongoDB connection
│   └── i18n.js       # Internationalization setup
├── controllers/      # Route controllers (10 files)
├── middleware/       # Custom middleware
│   ├── authMiddleware.js
│   └── responseHandler.js
├── models/          # Mongoose schemas (32 files)
│   ├── User.js, Restaurant.js, Order.js, etc.
├── routes/          # API routes (16 files)
│   ├── authRoutes.js, userRoutes.js, etc.
├── utils/           # Helper functions
└── server.js        # Express server setup

migrations/          # Database migrations
scripts/             # Utility scripts
uploads/             # File storage
locales/             # i18n files (en, fr)
__tests__/           # Test files
render.yaml          # Deployment config
```

## 🔧 Troubleshooting

### Common Issues

**Database Connection**
```bash
# Test connection
npm run test:db

# Check MongoDB status
sudo systemctl status mongod  # Linux
brew services list | grep mongodb  # macOS
```

**Migration Issues**
```bash
# Check status
npm run migrate:status

# Re-run if collections are empty
npm run migrate:up
```

**Server Issues**
- Check `.env` file exists and has correct values
- Ensure PORT is not in use
- Check CORS_ORIGINS for frontend URLs

## 🔒 Security Best Practices

- Never commit `.env` files with real credentials
- Use strong, unique JWT secrets for each environment
- Implement proper input validation and sanitization
- Use HTTPS in production
- Regularly update dependencies for security patches
- Implement rate limiting for API endpoints

## 📚 API Reference

### Base URL
```
http://localhost:5000/api
```

### Authentication
Most endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

### Core Endpoints

#### Authentication
```
POST /api/auth/signup    # User registration
POST /api/auth/login     # User login
```

#### Users
```
GET  /api/users          # Get users (admin)
POST /api/users          # Create user (admin)
GET  /api/users/:id      # Get user profile
PUT  /api/users/:id      # Update user
```

#### Restaurants
```
GET  /api/restaurant/restaurants     # List restaurants
POST /api/restaurant/restaurants     # Create restaurant
GET  /api/restaurant/restaurants/:id # Get restaurant
PUT  /api/restaurant/restaurants/:id # Update restaurant
GET  /api/restaurant/products        # Get products
POST /api/restaurant/products        # Add product
```

#### Orders
```
GET  /api/orders         # User orders
POST /api/orders         # Create order
GET  /api/orders/:id     # Order details
PUT  /api/orders/:id     # Update order status
```

#### Cart
```
GET  /api/cart           # Get cart
POST /api/cart           # Add to cart
PUT  /api/cart/:id       # Update item
DELETE /api/cart/:id     # Remove item
DELETE /api/cart         # Clear cart
```

#### Drivers
```
GET  /api/drivers        # List drivers
POST /api/drivers        # Register driver
GET  /api/drivers/:id    # Driver profile
PUT  /api/drivers/:id    # Update driver
```

### Additional Endpoints
```
GET  /api/settings       # App settings
GET  /api/languages      # Available languages
GET  /api/currencies     # Currency list
GET  /api/categories     # Product categories
```

### Real-time Features
- **Socket.io** integration for live order tracking
- **Driver location** updates in real-time
- **Order status** notifications
- **Restaurant notifications** for new orders

### Response Format
All API responses follow a consistent structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed"
}
```

## 🚀 Deployment

### Render
The project includes `render.yaml` for easy Render deployment:
1. Connect GitHub repo to Render
2. Render auto-detects configuration
3. Set environment variables in Render dashboard
4. Deploy automatically

### Environment Variables (Production)
```env
NODE_ENV=production
MONGO_URI=your-production-mongo-uri
JWT_SECRET=your-production-jwt-secret
CORS_ORIGINS=https://your-frontend-domain.com
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run migration tests
npm run test:migrations
```

Uses Vitest + MongoDB Memory Server for isolated testing.
- **Migration Tests**: Ensure database migrations work correctly

### Writing Tests

Tests are located in the `__tests__/` directory. Example test structure:

```javascript
const request = require('supertest');
const app = require('../src/server');

describe('Authentication API', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });
});
```

## 🌐 Internationalization

The application supports multiple languages:
- English (default)
- French

Language can be set via:
- Cookie: `lang=en` or `lang=fr`
- Query parameter: `?lang=en`
- Header: `Accept-Language: en`

## 📝 License

This project is licensed under the MIT License.

## 💡 Development Best Practices

### Code Quality
- Use ESLint for code linting (`npm run lint`)
- Follow consistent naming conventions
- Add proper error handling for all routes
- Use meaningful commit messages

### Security
- Never commit sensitive data (passwords, API keys)
- Use environment variables for configuration
- Implement proper input validation
- Keep dependencies updated
- Use HTTPS in production

### Database
- Run migrations before starting the application
- Backup your database regularly
- Monitor database performance
- Use indexes for frequently queried fields

### API Design
- Follow RESTful conventions
- Use consistent response formats
- Implement proper HTTP status codes
- Document all endpoints


## 📝 License

MIT License

---

**Built with ❤️ for food delivery applications**
