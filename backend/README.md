# SMS Verification Backend - Setup Instructions

## Overview
This backend service automatically detects SMS notifications and verifies payments without manual intervention.

## Features
- ✅ **Automatic SMS Detection** - Webhook endpoint for SMS providers
- ✅ **Conservative SMS Parsing** - Only processes credit/received messages
- ✅ **Exact Amount Matching** - Matches payments within ±1 paisa
- ✅ **Timeout Checker** - Auto-marks old payments as needing confirmation
- ✅ **Manual SMS Submission** - Testing endpoint

## Setup Instructions

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Get Firebase Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **merchant-mitra-b8c39**
3. Click ⚙️ Settings → Project Settings
4. Go to "Service Accounts" tab
5. Click "Generate New Private Key"
6. Save the downloaded JSON file as `firebase-service-account.json` in the `backend` folder

### 3. Start the Backend Server
```bash
npm run dev
```

The server will start on http://localhost:3001

## API Endpoints

### 1. SMS Webhook (for SMS providers)
**POST** `/api/sms-webhook`

Receives SMS from providers like Twilio, MSG91, etc.

**Request Body:**
```json
{
  "text": "Rs.500 credited to your account. UTR: 123456789",
  "from": "+919876543210",
  "merchantId": "merchant-uid-here"
}
```

### 2. Manual SMS Submission (for testing)
**POST** `/api/submit-sms`

Submit SMS text manually for testing.

**Request Body:**
```json
{
  "merchantId": "your-merchant-uid",
  "smsText": "Rs.500 credited to your account on 24-Jan-2026. UPI Ref: 123456789"
}
```

**Example using curl:**
```bash
curl -X POST http://localhost:3001/api/submit-sms \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "YOUR_MERCHANT_UID",
    "smsText": "Rs.500 credited to your account. UTR: 123456789"
  }'
```

### 3. Health Check
**GET** `/health`

Check if service is running.

## How It Works

### Automatic Verification Flow:
1. **Customer pays** via UPI
2. **Bank sends SMS** to merchant's phone
3. **SMS provider forwards** SMS to webhook
4. **Backend parses** SMS (conservative - only credit messages)
5. **Matches payment** by amount and time window (±5 minutes)
6. **Updates Firebase** payment status to SUCCESS
7. **Frontend updates** in real-time via Firestore listener

### SMS Parsing Rules (Conservative):
- ✅ Only processes SMS with keywords: "credited", "received", "deposited", "cr."
- ✅ Extracts amount (₹, Rs., INR format)
- ✅ Extracts UTR/Reference if present
- ❌ Ignores "processing", "pending", "debited" messages
- ❌ Never auto-marks as FAILED

### Payment Matching Logic:
- Exact amount match (±1 paisa tolerance)
- Time window: ±5 minutes from payment creation
- Only matches payments in WAITING_FOR_SMS status

### Timeout Logic:
- Runs every 30 seconds
- Checks payments older than 2 minutes
- Auto-updates to NEEDS_MANUAL_CONFIRMATION
- Never marks as FAILED

## Testing Without SMS Provider

### Option 1: Use Manual SMS Endpoint
```bash
# 1. Create a payment in the app
# 2. Copy your merchant UID from Firebase
# 3. Submit SMS manually:

curl -X POST http://localhost:3001/api/submit-sms \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "YOUR_MERCHANT_UID",
    "smsText": "Rs.500.00 credited to your account. UPI Ref: 123456789"
  }'
```

### Option 2: Use Postman
1. Open Postman
2. Create POST request to `http://localhost:3001/api/submit-sms`
3. Set Content-Type: application/json
4. Body:
```json
{
  "merchantId": "your-uid-here",
  "smsText": "Rs.500 credited to your account"
}
```

## Integrating with SMS Providers

### Twilio
1. Sign up at [Twilio](https://www.twilio.com/)
2. Get a phone number
3. Set webhook URL: `http://your-server.com/api/sms-webhook`
4. Twilio will forward all SMS to your webhook

### MSG91 (India)
1. Sign up at [MSG91](https://msg91.com/)
2. Configure webhook URL
3. Receive SMS notifications automatically

### Android App (Best for India)
Build a simple Android app that:
1. Reads SMS with permission
2. Filters credit messages
3. Sends to your backend API

## Production Deployment

### Deploy Backend:
1. **Heroku**: `git push heroku main`
2. **Railway**: Connect GitHub repo
3. **Render**: Deploy from GitHub
4. **DigitalOcean**: Deploy on droplet

### Set Environment Variables:
- Upload `firebase-service-account.json`
- Set PORT if needed
- Configure CORS for your domain

## Security Notes
- ✅ Firebase Admin SDK uses service account (secure)
- ✅ Conservative SMS parsing (no false positives)
- ✅ Exact amount matching
- ✅ Time window validation
- ⚠️ Add authentication to webhook in production
- ⚠️ Use HTTPS in production
- ⚠️ Validate SMS provider signatures

## Troubleshooting

### Backend won't start:
- Check if `firebase-service-account.json` exists
- Run `npm install` first
- Check port 3001 is not in use

### Payments not verifying:
- Check backend logs for SMS parsing
- Verify merchant UID is correct
- Check amount matches exactly
- Verify payment is in WAITING_FOR_SMS status
- Check time window (±5 minutes)

### Firebase errors:
- Verify service account key is valid
- Check Firestore rules allow backend access
- Ensure Firebase project ID matches

## Next Steps
1. ✅ Start backend server
2. ✅ Test with manual SMS endpoint
3. 🔄 Integrate with SMS provider (Twilio/MSG91)
4. 🔄 Deploy to production server
5. 🔄 Build Android app for SMS reading (optional)
