# 🚀 Setup Guide - Payroll Management System

This guide will help you set up and run the Payroll Management System on your local machine or server.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download](https://www.mongodb.com/try/download/community)
- **npm** or **yarn** package manager (comes with Node.js)
- **Git** - [Download](https://git-scm.com/)
- **Gmail Account** with App Password access

## 🔧 Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/payroll-management-system.git
cd payroll-management-system
```

### 2. Backend Setup

#### 2.1 Install Backend Dependencies

```bash
cd backend
npm install
```

#### 2.2 Configure Environment Variables

```bash
# Copy the example configuration file
cp config.env.example config.env

# Edit config.env with your actual values
nano config.env
# or
code config.env
```

**Required Configuration:**

```env
# Database
MONGODB_URI=mongodb://localhost:27017/payroll-app

# JWT Secret (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key

# Gmail Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-character-app-password
EMAIL_FROM_NAME=AXESS & V-ACCEL Payroll System
```

#### 2.3 Generate Secure JWT Secret

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Copy the output and paste it as your `JWT_SECRET` in `config.env`.

### 3. Gmail App Password Setup

#### 3.1 Enable 2-Factor Authentication

1. Go to your Google Account settings: https://myaccount.google.com/security
2. Enable **2-Step Verification**
3. Complete the setup process

#### 3.2 Generate App Password

1. Visit: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)**
4. Enter name: **Payroll System**
5. Click **Generate**
6. Copy the 16-character password (remove spaces)
7. Paste it as `GMAIL_PASS` in your `config.env`

**Example:**
```env
GMAIL_PASS=abcdefghijklmnop
```

### 4. MongoDB Setup

#### Option A: Local MongoDB

```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb

# Windows
# Download and install MongoDB Community Edition
# Start MongoDB service from Services
```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a new cluster (free tier available)
3. Create database user
4. Whitelist your IP address (or use 0.0.0.0/0 for testing)
5. Get connection string and update `MONGODB_URI` in `config.env`

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/payroll-app?retryWrites=true&w=majority
```

### 5. Frontend Setup

```bash
cd ../frontend
npm install
```

## 🚀 Running the Application

### Development Mode

#### Terminal 1: Start Backend Server

```bash
cd backend
npm start
```

You should see:
```
Server running on port 5001
MongoDB connected successfully
```

#### Terminal 2: Start Frontend Server

```bash
cd frontend
npm start
```

The React app will open automatically at http://localhost:3000

### Production Mode

#### Build Frontend

```bash
cd frontend
npm run build
```

#### Serve Frontend from Backend

Update `backend/server.js` to serve static files:

```javascript
// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
  });
}
```

Then start the backend:

```bash
cd backend
NODE_ENV=production npm start
```

## 🔐 Initial Admin Setup

### Create Admin Account

1. Start the application
2. Open http://localhost:3000/register
3. Register a new account
4. Manually update the user role in MongoDB:

```bash
# Connect to MongoDB
mongo

# Use the payroll-app database
use payroll-app

# Find and update the user
db.users.updateOne(
  { email: "admin@example.com" },
  { $set: { role: "admin" } }
)
```

Or use MongoDB Compass:
1. Open MongoDB Compass
2. Connect to your database
3. Navigate to `payroll-app` → `users`
4. Find your user and change `role` to `"admin"`

## 🧪 Testing

### Test Email Configuration

Create a test script:

```bash
cd backend
node -e "
const nodemailer = require('nodemailer');
require('dotenv').config({ path: './config.env' });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

transporter.verify((error, success) => {
  if (error) {
    console.log('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server is ready to send messages');
  }
});
"
```

### Test MongoDB Connection

```bash
cd backend
node -e "
const mongoose = require('mongoose');
require('dotenv').config({ path: './config.env' });

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    process.exit(0);
  })
  .catch(err => {
    console.log('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
"
```

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Kill process on port 5001
lsof -ti:5001 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

#### MongoDB Connection Error

- Ensure MongoDB service is running
- Check connection string in `config.env`
- For Atlas, verify IP whitelist and credentials

#### Email Not Sending

- Verify Gmail App Password is correct (16 characters, no spaces)
- Ensure 2FA is enabled on Gmail account
- Check `GMAIL_USER` and `GMAIL_PASS` in `config.env`
- Look for detailed error messages in backend console

#### CORS Errors

Update `backend/server.js`:

```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

## 📁 Project Structure

```
payroll-management-system/
├── backend/
│   ├── config/
│   │   └── email.js           # Email configuration
│   ├── middleware/
│   │   └── auth.js            # Authentication middleware
│   ├── models/
│   │   ├── Employee.js        # Employee schema
│   │   ├── Payslip.js         # Payslip schema
│   │   └── User.js            # User schema
│   ├── routes/
│   │   ├── auth.js            # Authentication routes
│   │   ├── employees.js       # Employee management
│   │   └── payslips.js        # Payslip operations
│   ├── config.env.example     # Environment template
│   ├── package.json
│   └── server.js              # Main server file
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── pages/             # Page components
│   │   ├── contexts/          # React contexts
│   │   └── utils/             # Utility functions
│   └── package.json
└── README.md
```

## 🔒 Security Best Practices

1. **Never commit `config.env`** - It's in `.gitignore` for a reason
2. **Use strong JWT_SECRET** - Minimum 32 characters, random
3. **Rotate App Passwords** - Change periodically
4. **Use HTTPS in production** - SSL/TLS required
5. **Set NODE_ENV=production** - For production deployments
6. **Limit CORS origins** - Don't use `*` in production
7. **Regular backups** - Backup MongoDB regularly

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [JWT Best Practices](https://jwt.io/introduction)

## 🤝 Need Help?

- Check the [README.md](README.md) for feature documentation
- Open an issue on GitHub
- Contact: support@axess-vaccel.com

---

**Happy Coding! 🚀**
