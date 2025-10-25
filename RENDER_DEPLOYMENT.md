# 🚀 Render Deployment Guide - Payroll Management System

This guide will help you deploy your MERN stack Payroll Management System to Render.

## 📋 Prerequisites

1. **GitHub Repository** - Your code pushed to GitHub
2. **Render Account** - Sign up at https://render.com (free tier available)
3. **MongoDB Atlas** - Cloud MongoDB instance (required for production)
4. **Gmail App Password** - For email functionality

---

## 🗄️ Step 1: Setup MongoDB Atlas (Database)

### 1.1 Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up for free account
3. Create a new project: "Payroll System"

### 1.2 Create Database Cluster
1. Click **"Build a Database"**
2. Choose **M0 Free Tier**
3. Select cloud provider and region (closest to your users)
4. Cluster Name: `payroll-cluster`
5. Click **"Create"**

### 1.3 Configure Database Access
1. Go to **Database Access** (left sidebar)
2. Click **"Add New Database User"**
3. Choose **Password** authentication
4. Username: `payroll-admin`
5. Password: Generate secure password (save it!)
6. Built-in Role: **Atlas admin** (or Read and write to any database)
7. Click **"Add User"**

### 1.4 Configure Network Access
1. Go to **Network Access** (left sidebar)
2. Click **"Add IP Address"**
3. Click **"Allow Access from Anywhere"** (0.0.0.0/0)
   - This is needed for Render to connect
4. Click **"Confirm"**

### 1.5 Get Connection String
1. Go to **Database** → Click **"Connect"**
2. Choose **"Connect your application"**
3. Driver: **Node.js**, Version: **4.1 or later**
4. Copy the connection string:
   ```
   mongodb+srv://payroll-admin:<password>@payroll-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual password
6. Add database name: `/payroll-app` before the `?`
   ```
   mongodb+srv://payroll-admin:YOUR_PASSWORD@payroll-cluster.xxxxx.mongodb.net/payroll-app?retryWrites=true&w=majority
   ```

---

## 🚀 Step 2: Deploy Backend to Render

### 2.1 Create Web Service
1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Select repository: `payroll-management-system`

### 2.2 Configure Service Settings

| Setting | Value |
|---------|-------|
| **Name** | `payroll-backend` |
| **Region** | Choose closest to you |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | `Free` |

### 2.3 Add Environment Variables

Click **"Advanced"** → **"Add Environment Variable"**

Add these variables ONE BY ONE:

#### Database Configuration
```
MONGODB_URI
Value: mongodb+srv://payroll-admin:YOUR_PASSWORD@payroll-cluster.xxxxx.mongodb.net/payroll-app?retryWrites=true&w=majority
```

#### Server Configuration
```
PORT
Value: 5001
```

```
NODE_ENV
Value: production
```

#### JWT Configuration
```
JWT_SECRET
Value: [Generate using: openssl rand -base64 32]
Example: Xy9ZpQm4K8vN2wR7tH3jL6sF1dG5bC9aE8xW0uY4iO=
```

```
JWT_EXPIRE
Value: 30d
```

#### Email Configuration (Gmail)
```
GMAIL_USER
Value: your-email@gmail.com
```

```
GMAIL_PASS
Value: your-16-character-app-password
```

```
EMAIL_FROM_NAME
Value: AXESS & V-ACCEL Payroll System
```

#### Frontend URL
```
FRONTEND_URL
Value: [Leave empty for now, will update after frontend deployment]
```

#### CORS Configuration
```
CORS_ORIGIN
Value: [Leave empty for now, will update after frontend deployment]
```

### 2.4 Deploy Backend
1. Click **"Create Web Service"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, copy the URL: `https://payroll-backend.onrender.com`

---

## 🎨 Step 3: Deploy Frontend to Render

### 3.1 Create Static Site
1. Click **"New +"** → **"Static Site"**
2. Connect same GitHub repository
3. Select repository: `payroll-management-system`

### 3.2 Configure Static Site Settings

| Setting | Value |
|---------|-------|
| **Name** | `payroll-frontend` |
| **Branch** | `main` |
| **Root Directory** | `frontend` |
| **Build Command** | `npm install && npm run build` |
| **Publish Directory** | `build` |

### 3.3 Add Frontend Environment Variable

Click **"Advanced"** → **"Add Environment Variable"**

```
REACT_APP_API_URL
Value: https://payroll-backend.onrender.com
```

### 3.4 Deploy Frontend
1. Click **"Create Static Site"**
2. Wait for deployment (5-10 minutes)
3. Once deployed, copy the URL: `https://payroll-frontend.onrender.com`

---

## 🔗 Step 4: Update Environment Variables

### 4.1 Update Backend Environment
Go to backend service → **Environment** → Update:

```
FRONTEND_URL
Value: https://payroll-frontend.onrender.com

CORS_ORIGIN
Value: https://payroll-frontend.onrender.com
```

Click **"Save Changes"** (triggers redeploy)

### 4.2 Update Axios Base URL (Important!)
Update `frontend/src/utils/axios.js`:

```javascript
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001',
  headers: {
    'Content-Type': 'application/json'
  }
});
```

Commit and push to trigger redeploy.

---

## 📋 Complete Environment Variables Reference

### Backend Environment Variables (Render Dashboard)

```env
# Database
MONGODB_URI=mongodb+srv://payroll-admin:PASSWORD@cluster.mongodb.net/payroll-app?retryWrites=true&w=majority

# Server
PORT=5001
NODE_ENV=production

# JWT
JWT_SECRET=Xy9ZpQm4K8vN2wR7tH3jL6sF1dG5bC9aE8xW0uY4iO=
JWT_EXPIRE=30d

# Email (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=abcdefghijklmnop
EMAIL_FROM_NAME=AXESS & V-ACCEL Payroll System

# URLs
FRONTEND_URL=https://payroll-frontend.onrender.com
CORS_ORIGIN=https://payroll-frontend.onrender.com
```

### Frontend Environment Variables (Render Dashboard)

```env
REACT_APP_API_URL=https://payroll-backend.onrender.com
```

---

## ✅ Step 5: Verify Deployment

### 5.1 Check Backend
1. Visit: `https://payroll-backend.onrender.com/api/auth/test`
2. Should see API response (not 404)

### 5.2 Check Frontend
1. Visit: `https://payroll-frontend.onrender.com`
2. Should see login page
3. Try to register/login

### 5.3 Check Logs
- Backend logs: Render Dashboard → Backend Service → **Logs**
- Look for:
  - `Server running on port 5001`
  - `MongoDB connected successfully`

---

## 🔧 Step 6: Create Admin User

### 6.1 Register First User
1. Go to: `https://payroll-frontend.onrender.com/register`
2. Register with your email
3. Note the credentials

### 6.2 Make User Admin (MongoDB Atlas)
1. Go to MongoDB Atlas
2. Click **"Browse Collections"**
3. Find database: `payroll-app` → collection: `users`
4. Find your user document
5. Click **"Edit Document"**
6. Change `role` from `"employee"` to `"admin"`
7. Click **"Update"**

### 6.3 Verify Admin Access
1. Login with your credentials
2. Should see admin dashboard
3. Can now create employees and generate payslips

---

## 🎯 Step 7: Test Email Functionality

### 7.1 Generate Test Payslip
1. Login as admin
2. Navigate to Payslips
3. Generate a test payslip
4. Try sending email

### 7.2 Check Email Logs
- Check Render logs for email status
- Check Gmail for sent email
- Verify PDF download link works

---

## 🔒 Security Best Practices

### ✅ Do's
- ✅ Use MongoDB Atlas (not local MongoDB)
- ✅ Generate strong JWT_SECRET (32+ characters)
- ✅ Use Gmail App Password (not regular password)
- ✅ Set NODE_ENV=production
- ✅ Use HTTPS URLs (Render provides automatically)
- ✅ Whitelist specific CORS origins
- ✅ Regularly rotate secrets

### ❌ Don'ts
- ❌ Don't commit `.env` files to git
- ❌ Don't use weak JWT secrets
- ❌ Don't expose MongoDB connection string publicly
- ❌ Don't use `CORS_ORIGIN=*` in production
- ❌ Don't share credentials via email/chat

---

## 🐛 Troubleshooting

### Issue: "Application failed to respond"
**Solution:**
- Check backend logs in Render dashboard
- Verify MongoDB connection string is correct
- Ensure PORT is set to 5001

### Issue: "CORS Error" in browser
**Solution:**
- Update CORS_ORIGIN in backend environment
- Redeploy backend service
- Clear browser cache

### Issue: "Cannot connect to backend"
**Solution:**
- Verify REACT_APP_API_URL in frontend environment
- Check backend service is running
- Redeploy frontend

### Issue: "MongoDB connection timeout"
**Solution:**
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check connection string format
- Verify database user has correct permissions

### Issue: "Email not sending"
**Solution:**
- Verify GMAIL_USER and GMAIL_PASS are correct
- Check Gmail App Password is 16 characters
- Look for email errors in backend logs

### Issue: "Free tier sleeping"
**Solution:**
- Render free tier sleeps after 15 mins of inactivity
- First request may take 30-60 seconds to wake up
- Consider upgrading for production use

---

## 💰 Cost Breakdown

### Free Tier (Suitable for testing)
- **Backend**: Free (750 hours/month, sleeps after 15 mins)
- **Frontend**: Free (100 GB bandwidth/month)
- **MongoDB Atlas**: Free (512 MB storage, M0 cluster)
- **Total**: $0/month

### Paid Tier (Recommended for production)
- **Backend**: $7/month (always on, no sleeping)
- **Frontend**: Free (static site)
- **MongoDB Atlas**: Free or $9/month (M2 cluster)
- **Total**: $7-16/month

---

## 📊 Performance Tips

1. **Enable Caching**: Add Redis for session management
2. **CDN**: Render provides global CDN for static sites
3. **Database Indexing**: Create indexes on frequently queried fields
4. **Connection Pooling**: Already configured in code
5. **Compression**: Enable gzip in Express (already done)

---

## 🔄 CI/CD (Auto-Deploy)

Render automatically deploys when you push to GitHub:

1. Push to `main` branch
2. Render detects changes
3. Auto-builds and deploys
4. Check deployment status in dashboard

---

## 📞 Support Resources

- **Render Docs**: https://render.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com
- **Community**: https://community.render.com

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] Network access configured (0.0.0.0/0)
- [ ] Backend deployed to Render
- [ ] All backend environment variables added
- [ ] Frontend deployed to Render
- [ ] Frontend environment variable added
- [ ] Backend updated with frontend URL
- [ ] CORS configured correctly
- [ ] Admin user created and verified
- [ ] Email functionality tested
- [ ] Application accessible via HTTPS

---

**🎉 Congratulations! Your Payroll Management System is now live!**

**Backend URL**: https://payroll-backend.onrender.com  
**Frontend URL**: https://payroll-frontend.onrender.com

**Remember to**:
1. Test all features thoroughly
2. Monitor logs regularly
3. Backup database periodically
4. Update environment variables as needed

---

**Need Help?** Check the logs or open an issue on GitHub!
