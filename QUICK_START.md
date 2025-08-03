# 🚀 Quick Start Guide

## Option 1: Quick Demo (Recommended for Testing)

### Step 1: Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### Step 2: Setup Environment
```bash
# Copy environment template
copy .env.example .env
```

### Step 3: Start with In-Memory Database (No MongoDB Required)
```bash
# Terminal 1: Start backend with in-memory database
npm run dev:memory

# Terminal 2: Start frontend
cd client
npm start
```

## Option 2: Full Setup with MongoDB

### Prerequisites
- Node.js 18+ installed
- MongoDB installed OR Docker available

### Step 1: Start MongoDB

**Option A: Local MongoDB**
```bash
# Start MongoDB service
mongod
```

**Option B: Docker MongoDB**
```bash
# Run MongoDB in Docker
docker run -d --name mongodb -p 27017:27017 mongo:6.0
```

**Option C: MongoDB Atlas (Cloud)**
1. Create account at https://www.mongodb.com/atlas
2. Create cluster and get connection string
3. Update MONGO_URI in .env file

### Step 2: Start Application
```bash
# Terminal 1: Start backend
npm run dev

# Terminal 2: Start frontend
cd client
npm start
```

## 🌐 Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Health Check**: http://localhost:5000/health

## 👤 Demo Credentials

After starting, you can create an admin user or use these demo credentials:

```
Email: admin@example.com
Password: admin123
```

## 🔧 Troubleshooting

### MongoDB Connection Issues
- Check if MongoDB is running on port 27017
- Verify MONGO_URI in .env file
- Try using Docker MongoDB option

### Port Already in Use
- Backend (5000): Change PORT in .env file
- Frontend (3000): React will prompt to use different port

### Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules client/node_modules
npm install
cd client && npm install
```

## 📱 Features to Test

1. **Login/Authentication**
   - Create admin user
   - Login with different roles

2. **Ticket Management**
   - Create new tickets
   - View ticket list
   - Update ticket status
   - Add comments

3. **Dashboard**
   - View statistics
   - Filter tickets
   - Search functionality

4. **Responsive Design**
   - Test on mobile/tablet
   - Check different screen sizes
