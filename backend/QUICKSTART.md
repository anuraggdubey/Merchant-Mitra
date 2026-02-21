# 🚀 Quick Start Guide - Automatic SMS Verification

## What's Been Built

A **Node.js backend service** that automatically detects SMS notifications and verifies payments without any manual intervention!

## How It Works

```
Customer Pays → Bank Sends SMS → Backend Detects → Payment Verified ✅
```

## Setup Steps (5 minutes)

### Step 1: Get Firebase Service Account Key

1. Go to https://console.firebase.google.com/
2. Select project: **merchant-mitra-b8c39**
3. Click ⚙️ → Project Settings → Service Accounts
4. Click "Generate New Private Key"
5. Save as `firebase-service-account.json` in the `backend` folder

### Step 2: Start Backend Server

```bash
cd backend
npm install  # (if not done already)
npm run dev
```

You should see:
```
🚀 SMS Verification Service running on port 3001
📡 Webhook endpoint: http://localhost:3001/api/sms-webhook
📝 Manual SMS endpoint: http://localhost:3001/api/submit-sms
⏰ Timeout checker running every 30 seconds
```

### Step 3: Test Automatic Verification

**Option A: Using curl (Terminal)**
```bash
# 1. Create a payment in the app (e.g., ₹500)
# 2. Get your merchant UID from Firebase Console
# 3. Run this command:

curl -X POST http://localhost:3001/api/submit-sms -H "Content-Type: application/json" -d "{\"merchantId\":\"YOUR_MERCHANT_UID\",\"smsText\":\"Rs.500 credited to your account. UPI Ref: 123456789\"}"
```

**Option B: Using Postman**
1. POST to `http://localhost:3001/api/submit-sms`
2. Body (JSON):
```json
{
  "merchantId": "your-merchant-uid-here",
  "smsText": "Rs.500 credited to your account"
}
```

**Option C: Using Browser Console**
```javascript
fetch('http://localhost:3001/api/submit-sms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    merchantId: 'your-merchant-uid-here',
    smsText: 'Rs.500 credited to your account'
  })
}).then(r => r.json()).then(console.log);
```

## Complete Test Flow

1. **Start both servers:**
   - Frontend: `npm run dev` (port 5173)
   - Backend: `cd backend && npm run dev` (port 3001)

2. **Create payment:**
   - Go to http://localhost:5173
   - Login → Collect Payment
   - Enter ₹500 → Generate QR

3. **Get your merchant UID:**
   - Open Firebase Console
   - Go to Authentication
   - Copy your user UID

4. **Simulate SMS:**
   - Open new terminal
   - Run curl command with your UID and amount

5. **Watch magic happen:**
   - Payment status updates to SUCCESS automatically!
   - No button clicks needed!

## Production Setup (Later)

### Option 1: SMS Provider (Twilio/MSG91)
- Forward SMS to webhook automatically
- Works for any phone number
- Costs: ~₹0.10 per SMS

### Option 2: Android App
- Build simple app to read SMS
- Free forever
- Best for India

### Option 3: Cloud Function
- Deploy backend to Firebase Functions
- Auto-scales
- Pay per use

## Troubleshooting

**Backend won't start:**
- Make sure `firebase-service-account.json` exists in backend folder
- Run `npm install` in backend folder

**Payment not verifying:**
- Check amount matches exactly (₹500 = Rs.500)
- Verify merchant UID is correct
- Check backend logs for errors

**Where to get merchant UID:**
- Firebase Console → Authentication → Your email → Copy UID
- OR check browser console: `firebase.auth().currentUser.uid`

---

**Ready to test?** Follow Step 3 above!
