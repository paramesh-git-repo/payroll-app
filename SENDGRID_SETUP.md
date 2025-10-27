# 📧 SendGrid Email Setup Guide

This guide helps you set up SendGrid for transactional emails in production.

## 🎯 Why SendGrid?

✅ **Better Deliverability** - 99%+ inbox delivery rate  
✅ **Production Ready** - Designed for transactional emails  
✅ **Reliable** - More stable than personal Gmail accounts  
✅ **No Rate Limits** - Unlimited emails on paid plans  
✅ **Better Logs** - Track email delivery and bounces  
✅ **Render Friendly** - Works perfectly on Render  

---

## 📋 Setup Steps

### Step 1: Create SendGrid Account

1. Go to https://sendgrid.com/
2. Click "Start for Free"
3. Sign up with your email
4. Verify your email address

### Step 2: Create API Key

1. Go to Settings → API Keys
2. Click "Create API Key"
3. Name it: `Payroll App Production`
4. Choose permissions: **Full Access** or **Mail Send** only
5. Click "Create & View"
6. **⚠️ COPY THE KEY NOW** - You won't see it again!

### Step 3: Verify Sender Email

1. Go to Settings → Sender Authentication
2. Click "Verify a Single Sender"
3. Fill in the form:
   - **From Name**: `AXESS & V-ACCEL Payroll System`
   - **From Email**: `noreply@yourdomain.com` (or your business email)
   - **Reply To**: `noreply@yourdomain.com`
   - **Company Address**: Your company address
4. Click "Create"
5. **Verify your email** by clicking the link in the verification email

### Step 4: Add Environment Variables to Render

Go to your Render dashboard → Backend Service → Environment:

Add these variables:

```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
EMAIL_FROM_NAME=AXESS & V-ACCEL Payroll System
```

**Important:**
- `EMAIL_PROVIDER=sendgrid` switches to SendGrid
- `SENDGRID_API_KEY` is the API key from Step 2
- `SENDGRID_FROM_EMAIL` is your verified sender email
- Keep all other variables as they are

### Step 5: Redeploy Backend

1. Go to Render dashboard
2. Click "Manual Deploy"
3. Wait for deployment to complete
4. Test email sending!

---

## 🔄 Switching Between Providers

### Use Gmail (Current):
```
EMAIL_PROVIDER=gmail
GMAIL_USER=your-email@gmail.com
GMAIL_PASS=your-app-password
```

### Use SendGrid (Recommended for Production):
```
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

---

## 📊 SendGrid Pricing

### Free Tier:
- **100 emails/day** (perfect for testing)
- All features included
- No credit card required

### Paid Plans:
- **Essentials**: $19.95/month - 50K emails
- **Pro**: $89.95/month - 100K emails
- **Premier**: Custom pricing

For production with many employees, **Essentials plan** is recommended.

---

## ✅ Testing

After deployment:

1. Login to your payroll app
2. Generate a payslip
3. Click "Send Email"
4. Check email inbox - should arrive instantly!

**Check SendGrid Dashboard:**
1. Go to Activity Feed
2. See all sent emails
3. Track opens, clicks, bounces

---

## 🆘 Troubleshooting

### Emails not sending:

1. **Check API Key**: Verify `SENDGRID_API_KEY` in Render
2. **Check Sender**: Verify sender email is verified
3. **Check Logs**: Look at Render logs for errors
4. **Check Status**: Go to SendGrid Activity Feed

### Common Errors:

**"Unauthorized"**
- API key is incorrect or expired
- Regenerate API key in SendGrid

**"From email not verified"**
- Verify your sender email in SendGrid
- Check spam folder for verification email

**"Rate limit exceeded"**
- Free tier limit: 100 emails/day
- Upgrade to paid plan

---

## 📝 Code Changes Made

✅ Updated `backend/config/email.js`:
- Added `getSendGridTransporter()` function
- Added `getTransporter()` selector
- Supports both Gmail and SendGrid
- Automatically switches based on `EMAIL_PROVIDER`

✅ Ready to use:
- Just add environment variables
- No code changes needed
- Works with existing email code

---

## 🎯 Summary

1. ✅ Sign up for SendGrid (free account)
2. ✅ Create API key
3. ✅ Verify sender email
4. ✅ Add environment variables to Render
5. ✅ Redeploy backend
6. ✅ Test email sending

**Result:**
- ✅ Professional emails
- ✅ Better deliverability
- ✅ Production ready
- ✅ More reliable than Gmail

---

## 💡 Pro Tips

1. **Domain Authentication**: For best results, authenticate your entire domain (not just single sender)
2. **Template Use**: Consider using SendGrid's template builder for even better emails
3. **Webhooks**: Set up webhooks to track email events in real-time
4. **Bounce Handling**: SendGrid automatically handles bounces and unsubscribes

Happy Emailing! 📧

