# 🏠 Tenant Ticketing System

A professional, full-stack web application for managing maintenance requests and communication between tenants, landlords, and maintenance workers. Built with modern technologies and production-ready features.

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with secure token management
- Role-based access control (Admin, Owner, Landlord, Tenant, Worker)
- Password encryption with bcrypt
- Session management and automatic logout

### 🎫 Ticket Management
- Create, view, update, and track maintenance tickets
- Priority levels (Low, Medium, High, Urgent)
- Category-based organization (Plumbing, Electrical, HVAC, etc.)
- Status tracking (Unassigned → In Progress → Completed → Resolved)
- Due date management and overdue notifications
- Location details (Building, Unit, Room)

### 💬 Communication
- Comment system for ticket discussions
- Internal comments for staff-only communication
- Real-time status updates and notifications
- Email and SMS integration (Nodemailer & Twilio)

### 📊 Dashboard & Analytics
- Role-specific dashboards with relevant metrics
- Ticket statistics and filtering
- Search and sort functionality
- Responsive design for mobile and desktop

### 🛡️ Security & Performance
- Rate limiting and request validation
- Input sanitization and XSS protection
- Comprehensive error handling and logging
- Database indexing for optimal performance
- CORS configuration and security headers

## 🚀 Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt
- **Validation**: Custom validation middleware
- **Security**: Helmet, CORS, Rate limiting
- **Logging**: Custom logging utility
- **Communication**: Nodemailer (Email), Twilio (SMS)

### Frontend
- **Framework**: React 18+
- **Styling**: Tailwind CSS with custom components
- **Routing**: React Router DOM
- **State Management**: Context API with custom hooks
- **HTTP Client**: Axios with interceptors
- **UI Components**: Custom component library
- **Icons**: Heroicons

### DevOps & Deployment
- **Containerization**: Docker & Docker Compose
- **Reverse Proxy**: Nginx
- **Process Management**: PM2 ready
- **Environment**: Multi-environment configuration
- **Health Checks**: Built-in health monitoring

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB 6.0+
- Docker & Docker Compose (optional)
- Git

## 🛠️ Installation & Setup

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tenant-ticketing-system
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env

   # Edit .env with your configuration
   nano .env
   ```

5. **Start MongoDB**
   ```bash
   # Using MongoDB service
   sudo systemctl start mongod

   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:6.0
   ```

6. **Seed the database (optional)**
   ```bash
   node seedAdmin.js
   ```

7. **Start the application**
   ```bash
   # Terminal 1: Start backend
   npm run dev

   # Terminal 2: Start frontend
   cd client && npm start
   ```

### Option 2: Docker Deployment

1. **Clone and configure**
   ```bash
   git clone <repository-url>
   cd tenant-ticketing-system
   cp .env.example .env
   # Edit .env file with your settings
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose up -d
   ```

3. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000
   - MongoDB: localhost:27017

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Database
MONGO_URI=mongodb://localhost:27017/tenant-ticketing-system
MONGO_URI_TEST=mongodb://localhost:27017/tenant-ticketing-system-test

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRE=7d

# Server
PORT=5000
NODE_ENV=development

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# SMS (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=your-twilio-phone-number

# Client
CLIENT_URL=http://localhost:3000

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/create-user` | Create new user | Admin/Owner |
| GET | `/api/auth/profile` | Get user profile | Private |
| PUT | `/api/auth/profile` | Update profile | Private |
| PUT | `/api/auth/change-password` | Change password | Private |
| POST | `/api/auth/logout` | User logout | Private |

### Ticket Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/tickets` | Get tickets (filtered by role) | Private |
| POST | `/api/tickets` | Create new ticket | Tenant/Owner/Admin |
| GET | `/api/tickets/:id` | Get ticket by ID | Private |
| PUT | `/api/tickets/:id` | Update ticket | Owner/Admin/Worker |
| POST | `/api/tickets/:id/comments` | Add comment | Private |

### User Management Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users` | Get all users | Admin/Owner |
| GET | `/api/users/:id` | Get user by ID | Admin/Owner |
| PUT | `/api/users/:id` | Update user | Admin/Owner |
| DELETE | `/api/users/:id` | Delete user | Admin |

## 👥 User Roles & Permissions

### 🔑 Admin
- Full system access
- User management (create, update, delete)
- View and manage all tickets
- System configuration

### 🏢 Owner
- Property management
- View all tickets for their properties
- Assign workers to tickets
- User management for their properties

### 🏠 Landlord
- Manage assigned properties
- Create tickets on behalf of tenants
- Assign workers
- View property-related tickets

### 👤 Tenant
- Create maintenance tickets
- View their own tickets
- Add comments to their tickets
- Update profile information

### 🔧 Worker
- View assigned tickets
- Update ticket status
- Add comments and notes
- Mark tickets as completed

## 🎨 UI Components

The application includes a comprehensive set of reusable UI components:

- **Button**: Multiple variants (primary, secondary, outline, ghost)
- **Input**: Form inputs with validation states
- **Select**: Dropdown selectors
- **Alert**: Success, error, warning, info notifications
- **LoadingSpinner**: Loading indicators
- **TicketCard**: Ticket display component
- **StatusBadge**: Status indicators with colors

## 🚀 Deployment

### Production Deployment with Docker

1. **Build and deploy**
   ```bash
   # Build images
   docker-compose -f docker-compose.prod.yml build

   # Start services
   docker-compose -f docker-compose.prod.yml up -d
   ```

2. **Environment setup**
   - Update `.env` with production values
   - Configure SSL certificates
   - Set up domain and DNS

### Manual Deployment

1. **Backend deployment**
   ```bash
   # Install PM2 globally
   npm install -g pm2

   # Start with PM2
   pm2 start ecosystem.config.js
   ```

2. **Frontend deployment**
   ```bash
   cd client
   npm run build
   # Serve build folder with nginx or similar
   ```

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client && npm test

# Run with coverage
npm run test:coverage
```

## 📝 Development Scripts

```bash
# Backend development
npm run dev          # Start with nodemon
npm start           # Production start
npm test            # Run tests
npm run lint        # Lint code

# Frontend development
cd client
npm start           # Development server
npm run build       # Production build
npm test            # Run tests
npm run lint        # Lint code
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Email: support@tenant-ticketing.com
- Documentation: [Wiki](https://github.com/your-repo/wiki)

## 🙏 Acknowledgments

- Built with [Create React App](https://create-react-app.dev/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Icons by [Heroicons](https://heroicons.com/)
- Database by [MongoDB](https://mongodb.com/)

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
