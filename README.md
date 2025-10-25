# Payroll Management Application

A comprehensive MERN stack application for managing employee payroll, attendance, and salary calculations.

## Project Structure

```
payroll-app/
├── backend/                 # Node.js/Express backend
│   ├── models/             # Mongoose models
│   ├── routes/             # API routes
│   ├── middleware/         # Custom middleware
│   ├── uploads/            # File uploads directory
│   ├── server.js           # Main server file
│   ├── config.env          # Environment variables
│   └── package.json        # Backend dependencies
├── frontend/               # React frontend
│   ├── src/                # React source code
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts
│   │   └── utils/          # Utility functions
│   ├── public/             # Static assets
│   └── package.json        # Frontend dependencies
└── package.json            # Root package.json for scripts
```

## Features

- **Employee Management**: Add, edit, and manage employee information
- **Attendance Tracking**: Record and manage employee attendance
- **Salary Calculation**: Automatic salary component calculations
- **Payslip Generation**: Generate and download payslips
- **CSV Upload**: Bulk upload employee data and attendance records
- **Role-based Access**: Admin and employee dashboards
- **Real-time Calculations**: Live salary calculations in forms

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd payroll-app
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   - Copy `backend/config.env.example` to `backend/config.env`
   - Update the MongoDB connection string and other variables

4. **Start the development servers**
   ```bash
   npm run dev
   ```

This will start:
- Backend server on `http://localhost:5001`
- Frontend development server on `http://localhost:3000`

### Available Scripts

- `npm start` - Start production backend server
- `npm run dev` - Start both frontend and backend in development mode
- `npm run backend` - Start only the backend server
- `npm run frontend` - Start only the frontend server
- `npm run build` - Build frontend for production
- `npm run install-all` - Install dependencies for all projects

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Employees
- `GET /api/employees` - Get all employees
- `POST /api/employees` - Create new employee
- `PUT /api/employees/:id` - Update employee
- `DELETE /api/employees/:id` - Delete employee

### Attendance
- `GET /api/attendance` - Get attendance records
- `POST /api/attendance` - Create/update attendance record
- `POST /api/attendance/upload-csv` - Upload CSV attendance data

### Payslips
- `GET /api/payslips` - Get payslips
- `POST /api/payslips` - Generate payslip
- `GET /api/payslips/:id/pdf` - Download payslip PDF

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Multer (file uploads)
- Puppeteer (PDF generation)

### Frontend
- React
- Material-UI
- React Router
- Axios
- Context API

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.