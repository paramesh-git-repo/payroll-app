const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
require('dotenv').config({ path: './config.env' });

const app = express();

// CORS must be FIRST to handle preflight requests
// Determine origin based on environment
const allowedOrigin = process.env.NODE_ENV === 'production'
  ? 'https://axess-payroll-app.netlify.app'
  : ['http://localhost:3000', 'http://localhost:3001'];

const corsOptions = {
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Apply CORS
app.use(cors(corsOptions));

// Explicitly handle OPTIONS requests (preflight)
app.options('*', cors(corsOptions));

// Debug CORS configuration
console.log('🔒 CORS Configuration:');
console.log('Environment:', process.env.NODE_ENV || 'development');
console.log('Allowed origin:', corsOptions.origin);

// Compression middleware - reduces response size by 60-80%
app.use(compression());

// Parse JSON and URL-encoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/payslips', require('./routes/payslips'));
app.use('/api/payroll', require('./routes/payroll'));
app.use('/api/salary', require('./routes/salary'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/attendance', require('./routes/attendance'));

// Root route for testing
app.get('/', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Payroll Backend API is running!',
    environment: process.env.NODE_ENV || 'development',
    mongodb: 'Connected'
  });
});

// Serve static files from React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Database connection with optimized settings
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/payroll_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  maxPoolSize: 10, // Maintain up to 10 socket connections
  minPoolSize: 2, // Maintain at least 2 socket connections
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  connectTimeoutMS: 10000 // Give up initial connection after 10 seconds
})
.then(() => console.log('MongoDB connected successfully'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Server will continue to run but database operations will fail');
});

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
