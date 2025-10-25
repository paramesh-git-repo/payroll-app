# 🏢 AXESS & V-ACCEL Payroll Management System

A comprehensive, modern payroll management system built with React and Node.js, featuring employee management, payslip generation, email automation, and PDF downloads.

## ✨ Features

### 🔐 Authentication & Authorization
- **Secure Login/Register** with JWT tokens
- **Role-based Access Control** (Admin/Employee)
- **Protected Routes** with automatic redirects
- **Session Management** with token refresh

### 👥 Employee Management
- **Complete CRUD Operations** for employee records
- **Bulk Upload** via CSV files
- **Employee Search & Filtering** by department, status
- **Modal-based Forms** for seamless UX
- **Real-time Validation** with detailed error messages

### 💰 Payslip Management
- **Automated Payslip Generation** with salary calculations
- **PDF Generation** with professional formatting
- **Email Automation** with Gmail integration
- **Multiple Send Capability** with send history tracking
- **Download Links** for secure PDF access

### 📧 Email System
- **Gmail App Password Integration** for reliable delivery
- **Professional Email Templates** with company branding
- **Automated Email Sending** with error handling
- **Send History Tracking** for audit purposes
- **No-reply System** for automated communications

### 📊 Dashboard & Analytics
- **Admin Dashboard** with system overview
- **Employee Dashboard** with personal data
- **Real-time Statistics** and metrics
- **Responsive Design** for all devices

## 🚀 Quick Start

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Gmail account with App Password

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd payroll-app
   ```

2. **Install dependencies**
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp backend/config.env.example backend/config.env
   
   # Edit config.env with your settings
   nano backend/config.env
   ```

4. **Start the application**
   ```bash
   # Start backend (Terminal 1)
   cd backend
   npm start
   
   # Start frontend (Terminal 2)
   cd frontend
   npm start
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5001

## ⚙️ Configuration

### Environment Variables

Create `backend/config.env` with the following:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/payroll-app

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=30d

# Email Configuration
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-16-character-app-password
EMAIL_FROM_NAME=AXESS & V-ACCEL Payroll System

# Server
PORT=5001
NODE_ENV=development
```

### Gmail Setup

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use the 16-character password** in `GMAIL_PASS`

## 📁 Project Structure

```
payroll-app/
├── backend/
│   ├── config/
│   │   └── email.js          # Email configuration
│   ├── middleware/
│   │   └── auth.js           # Authentication middleware
│   ├── models/
│   │   ├── Employee.js       # Employee schema
│   │   ├── Payslip.js        # Payslip schema
│   │   └── User.js           # User schema
│   ├── routes/
│   │   ├── auth.js           # Authentication routes
│   │   ├── employees.js      # Employee management
│   │   └── payslips.js       # Payslip operations
│   └── server.js             # Main server file
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.js     # Main layout component
│   │   │   └── ProtectedRoute.js
│   │   ├── pages/
│   │   │   ├── EmployeeList.js
│   │   │   ├── PayslipList.js
│   │   │   └── PayslipPDF.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js
│   │   └── utils/
│   │       └── axios.js      # API configuration
│   └── public/
└── README.md
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Payslips
- `GET /api/payslips` - Get all payslips
- `POST /api/payslips/generate` - Generate payslip
- `GET /api/payslips/:id/pdf` - Download PDF
- `POST /api/payslips/:id/send-email` - Send email

## 🎨 UI Components

### Material-UI Integration
- **Consistent Design System** with Material-UI components
- **Responsive Grid Layout** for all screen sizes
- **Professional Color Scheme** with company branding
- **Interactive Elements** with hover effects and animations

### Key Components
- **EmployeeForm** - Modal-based employee creation/editing
- **PayslipList** - Comprehensive payslip management
- **PayslipPDF** - Automatic PDF download handler
- **Layout** - Responsive navigation and layout

## 🛠️ Recent Updates

### Bug Fixes
- ✅ Fixed MUI Grid deprecation warnings
- ✅ Fixed controlled input warnings in forms
- ✅ Fixed employee creation 400 errors
- ✅ Fixed undefined employee ID errors
- ✅ Fixed modal closing after successful operations
- ✅ Fixed PDF download route missing

### New Features
- ✅ **Multiple Payslip Sends** - Send same payslip multiple times
- ✅ **Email History Tracking** - Track all email send attempts
- ✅ **Enhanced Error Handling** - Detailed error messages
- ✅ **PDF Download Route** - Direct PDF download links
- ✅ **Modal Auto-close** - Automatic modal closing after operations

## 🔒 Security Features

- **JWT Token Authentication** with secure token handling
- **Password Hashing** with bcrypt
- **Input Validation** with express-validator
- **CORS Protection** for API security
- **Role-based Authorization** for sensitive operations

## 📱 Responsive Design

- **Mobile-first Approach** with responsive breakpoints
- **Touch-friendly Interface** for mobile devices
- **Adaptive Layout** for tablets and desktops
- **Consistent UX** across all devices

## 🚀 Deployment

### Production Setup
1. **Set NODE_ENV=production** in environment
2. **Use production MongoDB** connection string
3. **Configure production email** settings
4. **Build frontend** with `npm run build`
5. **Use PM2** for process management

### Docker Support
```bash
# Build and run with Docker
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- **Email**: support@axess-vaccel.com
- **Documentation**: [Wiki](https://github.com/your-username/payroll-app/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-username/payroll-app/issues)

## 🎯 Roadmap

- [ ] **Advanced Reporting** with charts and analytics
- [ ] **Bulk Operations** for multiple employees
- [ ] **Email Templates** customization
- [ ] **Mobile App** with React Native
- [ ] **API Documentation** with Swagger
- [ ] **Automated Testing** with Jest and Cypress

---

**Built with ❤️ for AXESS & V-ACCEL**