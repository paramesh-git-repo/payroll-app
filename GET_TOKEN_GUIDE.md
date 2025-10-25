# 🔑 How to Get a Valid JWT Token

## Option 1: Using Postman (Recommended)

### Step 1: Login to Get Token

**Endpoint:**
```
POST http://localhost:5001/api/auth/login
```

**Headers:**
```
Content-Type: application/json
```

**Body (raw JSON):**
```json
{
  "email": "parameshk@axesstechnology.in",
  "password": "admin123"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Paramesh K",
    "email": "parameshk@axesstechnology.in",
    "role": "admin"
  }
}
```

### Step 2: Copy the Token

Copy the `token` value from the response.

### Step 3: Use Token in Protected Routes

For any protected API call, add this header:

**Headers:**
```
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json
```

**Example Protected Request:**
```
GET http://localhost:5001/api/employees
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Option 2: Using cURL

### Get Token:
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "parameshk@axesstechnology.in",
    "password": "admin123"
  }'
```

### Use Token:
```bash
# Replace YOUR_TOKEN with the token from login response
curl -X GET http://localhost:5001/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

---

## Option 3: Create Test Admin User (If needed)

If you need a fresh admin account:

**Endpoint:**
```
POST http://localhost:5001/api/auth/register
```

**Body:**
```json
{
  "name": "Test Admin",
  "email": "admin@example.com",
  "password": "admin123456",
  "role": "admin"
}
```

---

## Available Admin Accounts

Based on your database, these admin accounts exist:

1. **test@test.com** (Role: admin)
2. **parameshk@axesstechnology.in** (Role: admin)

**Note:** You need to know the password for these accounts. If you don't remember, you can:
- Create a new admin user using the register endpoint
- Reset the password in the database

---

## Troubleshooting

### Error: "Invalid credentials"
- Check email and password are correct
- Ensure user account is active (`isActive: true`)

### Error: "Account is deactivated"
- The user account has `isActive: false`
- Update the user in the database

### Error: "Server error during login"
- Check MongoDB is running
- Check backend server logs for details

---

## Quick Test Script

Save this as `test-login.js` in your backend folder:

```javascript
const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'parameshk@axesstechnology.in',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Token:', response.data.token);
    console.log('\nUser:', response.data.user);
    console.log('\n📋 Copy this token for API calls:');
    console.log(response.data.token);
    
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
  }
}

testLogin();
```

Run it:
```bash
node test-login.js
```

