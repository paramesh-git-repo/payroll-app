# Development Guide

## Quick Start

1. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

2. **Start development servers:**
   ```bash
   npm run dev
   ```

## Project Structure

### Backend (`/backend`)
- **Models**: Database schemas (Mongoose)
- **Routes**: API endpoints
- **Middleware**: Authentication and validation
- **Server**: Main Express server

### Frontend (`/frontend`)
- **Components**: Reusable UI components
- **Pages**: Main application pages
- **Contexts**: React context providers
- **Utils**: Helper functions and API client

## Development Workflow

### Backend Development
```bash
cd backend
npm run dev  # Start with nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm start    # Start React development server
```

### Full Stack Development
```bash
npm run dev  # Start both servers concurrently
```

## API Testing

### Using curl
```bash
# Test authentication
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'

# Test employees endpoint
curl -X GET http://localhost:5001/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Using Postman
- Import the API collection
- Set base URL: `http://localhost:5001`
- Configure authentication headers

## Database

### MongoDB Connection
- Default: `mongodb://localhost:27017/payroll-app`
- Configure in `backend/config.env`

### Sample Data
- Use CSV files in `backend/` for bulk imports
- Sample employees: `sample-employees.csv`
- Sample salary sheet: `sample-salary-sheet.csv`

## Troubleshooting

### Common Issues

1. **Port already in use**
   ```bash
   lsof -ti:5001 | xargs kill -9  # Kill process on port 5001
   lsof -ti:3000 | xargs kill -9  # Kill process on port 3000
   ```

2. **MongoDB connection failed**
   - Ensure MongoDB is running
   - Check connection string in `config.env`

3. **Dependencies not installed**
   ```bash
   npm run install-all
   ```

### Debugging

- Backend logs: Check terminal output
- Frontend logs: Check browser console
- Network requests: Use browser DevTools
- Database: Use MongoDB Compass

## Deployment

### Production Build
```bash
npm run build  # Build frontend
npm start      # Start production backend
```

### Environment Variables
- Copy `backend/config.env.example` to `backend/config.env`
- Update production values
- Never commit `.env` files
