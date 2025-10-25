const http = require('http');

// Test login and get token
function makeRequest(path, method, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    
    const options = {
      hostname: 'localhost',
      port: 5001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });
    
    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function getToken() {
  console.log('🔐 Testing Login...\n');
  
  try {
    // Try admin login
    const response = await makeRequest('/api/auth/login', 'POST', {
      email: 'admin@payroll.com',
      password: 'admin123456'
    });
    
    if (!response.success) {
      throw new Error(response.message || 'Login failed');
    }
    
    console.log('✅ LOGIN SUCCESSFUL!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('User Info:');
    console.log(`  Name: ${response.user.name}`);
    console.log(`  Email: ${response.user.email}`);
    console.log(`  Role: ${response.user.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('🎫 YOUR JWT TOKEN:\n');
    console.log(response.token);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📋 COPY THIS FOR POSTMAN:\n');
    console.log('Authorization: Bearer ' + response.token);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('✅ Use this token for all protected API calls!');
    
  } catch (error) {
    console.error('❌ LOGIN FAILED!\n');
    console.error('Error:', error.message);
    
    console.log('\n💡 Possible issues:');
    console.log('  1. Wrong password for parameshk@axesstechnology.in');
    console.log('  2. Server not running on port 5001');
    console.log('  3. MongoDB not connected');
    
    console.log('\n📝 Try these admin accounts:');
    console.log('  - test@test.com');
    console.log('  - parameshk@axesstechnology.in');
    
    console.log('\n🔧 Or use Postman directly:');
    console.log('POST http://localhost:5001/api/auth/login');
    console.log('Body: { "email": "test@test.com", "password": "YOUR_PASSWORD" }');
  }
}

getToken();

