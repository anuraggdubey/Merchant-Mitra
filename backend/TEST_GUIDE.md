# 🧪 Complete Testing Guide - Payment Verification System

## Prerequisites
- ✅ Backend server running on port 3001
- ✅ Frontend running on port 5173
- ✅ Firebase service account configured

## Step-by-Step Testing

### Step 1: Get Your Merchant UID

You need your Firebase user UID to test. Here are 3 ways to get it:

**Option A: From Firebase Console**
1. Go to https://console.firebase.google.com/
2. Select project: **merchant-mitra-b8c39**
3. Click Authentication → Users
4. Find your email and copy the UID

**Option B: From Browser Console**
1. Open your app at http://localhost:5173
2. Login to your account
3. Open browser console (F12)
4. Type: `firebase.auth().currentUser.uid`
5. Copy the UID

**Option C: From Frontend Code**
1. Open browser console while logged in
2. Type: `localStorage.getItem('merchantId')`
3. Or check the Network tab for any API calls

---

### Step 2: Create a Test Payment

1. Open http://localhost:5173 in your browser
2. Login with your merchant account
3. Go to "Collect Payment" page
4. Enter amount: **₹500.00**
5. Click "Generate QR Code"
6. **DO NOT CLOSE THIS PAGE** - keep it open to see real-time updates

The payment will be created with status: `WAITING_FOR_SMS`

---

### Step 3: Simulate SMS Verification

Now we'll simulate receiving an SMS from the bank. Open a **new terminal** and run:

**Windows PowerShell:**
```powershell
$merchantId = "YOUR_MERCHANT_UID_HERE"
$body = @{
    merchantId = $merchantId
    smsText = "Rs.500.00 credited to your account on 24-Jan-2026. UPI Ref: 123456789"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/api/submit-sms" -Method POST -Body $body -ContentType "application/json"
```

**Or use curl (Git Bash/WSL):**
```bash
curl -X POST http://localhost:3001/api/submit-sms \
  -H "Content-Type: application/json" \
  -d '{
    "merchantId": "YOUR_MERCHANT_UID_HERE",
    "smsText": "Rs.500.00 credited to your account on 24-Jan-2026. UPI Ref: 123456789"
  }'
```

**Replace `YOUR_MERCHANT_UID_HERE` with your actual UID from Step 1!**

---

### Step 4: Verify Automatic Update

After running the SMS simulation:

1. **Check the frontend** - The payment status should automatically change to `SUCCESS` ✅
2. **Check backend logs** - You should see:
   ```
   📝 Manual SMS submission: { merchantId: '...', smsText: '...' }
   ✅ SMS parsed successfully: { amount: 500, utr: '123456789' }
   ✅ Payment verified: <payment-id>
   ```

---

## Test Scenarios

### ✅ Scenario 1: Exact Amount Match
```json
{
  "merchantId": "YOUR_UID",
  "smsText": "Rs.500.00 credited to your account. UPI Ref: 123456789"
}
```
**Expected:** Payment verified ✅

### ✅ Scenario 2: Different Amount Format
```json
{
  "merchantId": "YOUR_UID",
  "smsText": "₹500 credited to A/c ending 1234. UTR: 987654321"
}
```
**Expected:** Payment verified ✅

### ❌ Scenario 3: Wrong Amount
```json
{
  "merchantId": "YOUR_UID",
  "smsText": "Rs.600.00 credited to your account"
}
```
**Expected:** No matching payment found ❌

### ❌ Scenario 4: Debit Message (Should be Ignored)
```json
{
  "merchantId": "YOUR_UID",
  "smsText": "Rs.500.00 debited from your account"
}
```
**Expected:** SMS ignored (not a credit message) ❌

### ⏰ Scenario 5: Timeout Test
1. Create a payment for ₹100
2. **Wait 2 minutes** without sending SMS
3. Payment should auto-update to `NEEDS_MANUAL_CONFIRMATION`

---

## Testing with Postman

1. **Download Postman** (if not installed)
2. Create a new POST request
3. URL: `http://localhost:3001/api/submit-sms`
4. Headers: `Content-Type: application/json`
5. Body (raw JSON):
```json
{
  "merchantId": "YOUR_MERCHANT_UID",
  "smsText": "Rs.500.00 credited to your account. UPI Ref: 123456789"
}
```
6. Click Send

---

## Testing with Browser Console

1. Open http://localhost:5173
2. Open browser console (F12)
3. Paste this code (replace YOUR_UID):

```javascript
fetch('http://localhost:3001/api/submit-sms', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    merchantId: 'YOUR_MERCHANT_UID',
    smsText: 'Rs.500.00 credited to your account. UPI Ref: 123456789'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Response:', data);
  if (data.success) {
    alert('Payment verified! Check the payment page.');
  }
});
```

---

## Troubleshooting

### Backend not responding
```bash
# Check if backend is running
curl http://localhost:3001/health
```
Expected: `{"status":"OK","message":"SMS verification service running"}`

### Payment not verifying
1. **Check merchant UID is correct**
   - Copy from Firebase Console → Authentication
2. **Check amount matches exactly**
   - ₹500 in app = Rs.500 in SMS
3. **Check payment status**
   - Must be `WAITING_FOR_SMS`
4. **Check time window**
   - SMS must be within ±5 minutes of payment creation
5. **Check backend logs**
   - Look for parsing errors

### Firebase errors
1. Verify `firebase-service-account.json` exists in backend folder
2. Check Firebase project ID matches
3. Verify Firestore rules allow backend access

---

## Next Steps After Testing

Once you've verified the system works:

1. ✅ **Test all scenarios above**
2. 🔄 **Deploy backend to production** (Heroku/Railway/Render)
3. 🔄 **Integrate with real SMS provider** (Twilio/MSG91)
4. 🔄 **Build Android app** for automatic SMS reading (optional)

---

## Quick Reference

**Backend Endpoints:**
- Health: `GET http://localhost:3001/health`
- SMS Webhook: `POST http://localhost:3001/api/sms-webhook`
- Manual SMS: `POST http://localhost:3001/api/submit-sms`

**Payment Statuses:**
- `WAITING_FOR_SMS` - Waiting for SMS verification
- `SUCCESS` - Payment verified ✅
- `NEEDS_MANUAL_CONFIRMATION` - Timeout, needs manual check
- `FAILED` - Payment failed (manual only)

**Time Windows:**
- SMS matching: ±5 minutes
- Timeout: 2 minutes
- Checker runs: Every 30 seconds
