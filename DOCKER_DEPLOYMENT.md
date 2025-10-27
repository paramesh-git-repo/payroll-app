# 🐳 Docker Deployment Guide

Deploy your Payroll App backend using Docker on various platforms.

## 🎯 Supported Platforms

- **Fly.io** (Recommended) - Best for Puppeteer
- **DigitalOcean App Platform**
- **AWS ECS/Fargate**
- **Google Cloud Run**
- **Azure Container Instances**
- **Heroku** (with Docker)
- **Portainer**
- **Any Docker host**

---

## 📋 Prerequisites

1. Docker installed locally
2. GitHub account
3. Account on your chosen platform

---

## 🚀 Quick Start - Fly.io (Recommended)

### Step 1: Install Fly CLI

```bash
# macOS
brew install flyctl

# Linux/WSL
curl -L https://fly.io/install.sh | sh

# Windows
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### Step 2: Login to Fly.io

```bash
flyctl auth login
```

### Step 3: Initialize and Deploy

```bash
cd backend

# Initialize Fly.io app
flyctl launch

# Answer the prompts:
# - App name: your-app-name
# - Region: ord (or your preferred region)
# - PostgreSQL: No (we're using MongoDB)
# - Redis: No
# - Deploy: Yes

# OR deploy manually:
flyctl deploy
```

### Step 4: Set Environment Variables

```bash
# Set all environment variables
flyctl secrets set NODE_ENV=production
flyctl secrets set PORT=5001
flyctl secrets set MONGODB_URI=your-mongodb-uri
flyctl secrets set JWT_SECRET=your-jwt-secret
flyctl secrets set JWT_EXPIRE=7d
flyctl secrets set EMAIL_PROVIDER=gmail
flyctl secrets set GMAIL_USER=your-email@gmail.com
flyctl secrets set GMAIL_PASS=your-app-password
flyctl secrets set EMAIL_FROM_NAME="AXESS & V-ACCEL Payroll System"
flyctl secrets set FRONTEND_URL=https://axess-payroll-app.netlify.app
```

### Step 5: Scale Up (Optional)

```bash
# For better performance (Paid plan)
flyctl scale vm shared-cpu-2x
```

---

## 🚀 Deploy to DigitalOcean

### Step 1: Create Dockerfile Push to GitHub

```bash
git add backend/Dockerfile
git commit -m "Add Dockerfile for deployment"
git push origin main
```

### Step 2: Deploy on DigitalOcean

1. Go to https://cloud.digitalocean.com
2. Click "Create" → "Apps"
3. Select "GitHub" source
4. Choose your repository
5. Set build directory: `backend`
6. Add environment variables
7. Deploy!

---

## 🐳 Local Docker Testing

### Build the Image

```bash
cd backend
docker build -t payroll-backend .
```

### Run Locally

```bash
# With environment variables
docker run -p 5001:5001 \
  -e NODE_ENV=development \
  -e MONGODB_URI=your-mongodb-uri \
  -e JWT_SECRET=your-secret \
  -e GMAIL_USER=your-email \
  -e GMAIL_PASS=your-password \
  payroll-backend
```

### Test PDF Generation

```bash
# Access your app
curl http://localhost:5001/api/payslips/.../pdf
```

---

## 📊 Environment Variables

Required variables for Docker deployment:

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `production` |
| `PORT` | Server port | `5001` |
| `MONGODB_URI` | MongoDB connection | `mongodb+srv://...` |
| `JWT_SECRET` | JWT secret key | `your-secret` |
| `JWT_EXPIRE` | JWT expiration | `7d` |
| `EMAIL_PROVIDER` | Email provider | `gmail` or `sendgrid` |
| `GMAIL_USER` | Gmail username | `your-email@gmail.com` |
| `GMAIL_PASS` | Gmail app password | `xxxx` |
| `FRONTEND_URL` | Frontend URL | `https://yourapp.com` |
| `EMAIL_FROM_NAME` | Email sender name | `Your Company` |

Optional (for SendGrid):

| Variable | Description |
|----------|-------------|
| `SENDGRID_API_KEY` | SendGrid API key |
| `SENDGRID_FROM_EMAIL` | SendGrid sender email |

---

## 🔧 Dockerfile Explanation

```dockerfile
# Base image
FROM node:18-slim

# Install Chromium dependencies
RUN apt-get update && apt-get install -y \
    # ... dependencies ...

# Set working directory
WORKDIR /app

# Copy and install
COPY package*.json ./
RUN npm ci --only=production

# Install Chromium
RUN npx puppeteer browsers install chrome

# Copy code
COPY . .

# Expose port
EXPOSE 5001

# Run
CMD ["node", "server.js"]
```

---

## ✅ Advantages of Docker

- ✅ **Works anywhere** - Deploy on any platform
- ✅ **Consistent** - Same behavior everywhere
- ✅ **Chromium included** - No download issues
- ✅ **Isolated** - No conflicts with host OS
- ✅ **Scalable** - Easy to scale up/down
- ✅ **Reproducible** - Same environment every time

---

## 🎯 Recommended Platforms

### 1. Fly.io (Best for Puppeteer)
- **Pros**: Excellent for Chromium, fast deployment
- **Cons**: Learning curve
- **Pricing**: Free tier available
- **Setup**: ~5 minutes

### 2. DigitalOcean App Platform
- **Pros**: Simple, GitHub integration
- **Cons**: More expensive
- **Pricing**: $5/month+
- **Setup**: ~3 minutes

### 3. AWS ECS/Fargate
- **Pros**: Very powerful
- **Cons**: Complex setup
- **Pricing**: Pay per use
- **Setup**: ~30 minutes

### 4. Google Cloud Run
- **Pros**: Serverless, pay per use
- **Cons**: Cold starts
- **Pricing**: Very affordable
- **Setup**: ~10 minutes

---

## 🚨 Troubleshooting

### Puppeteer not working
- Check if Chromium installed: `ls /app/node_modules/puppeteer/.local-chromium`
- Verify dependencies installed in Dockerfile

### Out of memory
- Increase memory limit
- Use `--single-process` flag (already added)

### Slow PDF generation
- Upgrade to paid tier
- Use caching
- Optimize HTML size

---

## 📝 Next Steps

1. Push code to GitHub
2. Choose a platform (Fly.io recommended)
3. Follow platform-specific setup
4. Deploy!
5. Test PDF generation

---

## 🎉 Benefits

With Docker:
- ✅ Chromium included in image
- ✅ No download during deployment
- ✅ Works on any platform
- ✅ Consistent environment
- ✅ Easy to scale

No more Chromium download issues! 🚀

