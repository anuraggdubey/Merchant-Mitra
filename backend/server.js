import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import { sendPaymentRequestSms, generateUpiDeepLink } from './sms.service.js';
import { db } from './firebaseAdmin.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;


// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// SMS Parsing Logic (Conservative)
function parseSmsForPayment(smsText) {
    // Only match CREDIT/RECEIVED messages
    const creditKeywords = ['credited', 'received', 'deposited', 'added to', 'cr.', 'credit'];
    const hasCredit = creditKeywords.some(keyword =>
        smsText.toLowerCase().includes(keyword)
    );

    if (!hasCredit) {
        console.log('❌ SMS does not contain credit keywords');
        return null; // Ignore non-credit SMS
    }

    // Extract amount (₹ or Rs. followed by numbers)
    const amountMatch = smsText.match(/(?:₹|Rs\.?|INR)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i);
    if (!amountMatch) {
        console.log('❌ Could not extract amount from SMS');
        return null;
    }

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

    // Extract UPI reference if present
    const utrMatch = smsText.match(/(?:UTR|Ref(?:erence)?|UPI Ref|Transaction ID)[\s:]+(\w+)/i);
    const utr = utrMatch ? utrMatch[1] : null;

    console.log('✅ SMS parsed successfully:', { amount, utr });
    return {
        amount,
        utr,
        timestamp: Date.now(),
        rawSms: smsText
    };
}

// Match SMS to payment
async function matchSmsToPayment(merchantId, smsData) {
    try {
        const { amount, timestamp } = smsData;

        // Find payments in WAITING_FOR_SMS status within ±5 minutes
        const fiveMinutes = 5 * 60 * 1000;
        const minTime = timestamp - fiveMinutes;
        const maxTime = timestamp + fiveMinutes;

        const paymentsRef = db.collection('payments');
        const snapshot = await paymentsRef
            .where('merchantId', '==', merchantId)
            .where('status', '==', 'WAITING_FOR_SMS')
            .where('createdAt', '>=', minTime)
            .where('createdAt', '<=', maxTime)
            .get();

        if (snapshot.empty) {
            console.log('❌ No matching payments found');
            return null;
        }

        // Find exact amount match
        let matchedPayment = null;
        snapshot.forEach((doc) => {
            const payment = doc.data();
            if (Math.abs(payment.amount - amount) < 0.01) { // Allow 1 paisa difference
                matchedPayment = { id: doc.id, ...payment };
            }
        });

        if (matchedPayment) {
            // Mark as success
            await paymentsRef.doc(matchedPayment.id).update({
                status: 'SUCCESS',
                verifiedAt: Date.now(),
                verificationMethod: 'SMS',
                smsData,
                updatedAt: Date.now()
            });

            console.log('✅ Payment verified:', matchedPayment.id);
            return matchedPayment;
        }

        console.log('❌ No exact amount match found');
        return null;
    } catch (error) {
        console.error('❌ Error matching SMS to payment:', error);
        return null;
    }
}

// Webhook endpoint for SMS (can be used with Twilio, MSG91, etc.)
app.post('/api/sms-webhook', async (req, res) => {
    try {
        console.log('📨 SMS webhook received:', req.body);

        // Extract SMS data based on your SMS provider's format
        // This example works with most providers
        const smsText = req.body.text || req.body.Body || req.body.message || '';
        const fromNumber = req.body.from || req.body.From || req.body.sender || '';

        if (!smsText) {
            return res.status(400).json({ error: 'No SMS text provided' });
        }

        // Parse SMS
        const smsData = parseSmsForPayment(smsText);

        if (!smsData) {
            return res.json({ message: 'SMS ignored (not a credit message)' });
        }

        // Get merchant ID from phone number (you'll need to maintain this mapping)
        // For now, we'll accept merchantId in the request
        const merchantId = req.body.merchantId || req.query.merchantId;

        if (!merchantId) {
            return res.status(400).json({ error: 'Merchant ID required' });
        }

        // Match and verify payment
        const matchedPayment = await matchSmsToPayment(merchantId, smsData);

        if (matchedPayment) {
            res.json({
                success: true,
                message: 'Payment verified',
                paymentId: matchedPayment.id
            });
        } else {
            res.json({
                success: false,
                message: 'No matching payment found'
            });
        }

    } catch (error) {
        console.error('❌ SMS webhook error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Manual SMS submission endpoint (for testing)
app.post('/api/submit-sms', async (req, res) => {
    try {
        const { merchantId, smsText } = req.body;

        if (!merchantId || !smsText) {
            return res.status(400).json({ error: 'merchantId and smsText required' });
        }

        console.log('📝 Manual SMS submission:', { merchantId, smsText });

        // Parse SMS
        const smsData = parseSmsForPayment(smsText);

        if (!smsData) {
            return res.json({
                success: false,
                message: 'SMS does not contain credit information'
            });
        }

        // Match and verify payment
        const matchedPayment = await matchSmsToPayment(merchantId, smsData);

        if (matchedPayment) {
            res.json({
                success: true,
                message: 'Payment verified automatically',
                paymentId: matchedPayment.id,
                amount: smsData.amount
            });
        } else {
            res.json({
                success: false,
                message: 'No matching payment found for this amount'
            });
        }

    } catch (error) {
        console.error('❌ Submit SMS error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Send Payment Request via SMS
app.post('/api/send-payment-request', async (req, res) => {
    try {
        const { customerPhone, amount, merchantName, upiId } = req.body;

        // Validate required fields
        if (!customerPhone) {
            return res.status(400).json({ success: false, error: 'Customer phone number is required' });
        }
        if (!amount || parseFloat(amount) <= 0) {
            return res.status(400).json({ success: false, error: 'Valid amount is required' });
        }
        if (!upiId) {
            return res.status(400).json({ success: false, error: 'Merchant UPI ID is required' });
        }

        console.log('📱 Sending payment request:', { customerPhone, amount, merchantName, upiId });

        // Send SMS with UPI deep link
        const result = await sendPaymentRequestSms(
            customerPhone,
            parseFloat(amount),
            merchantName || 'Merchant',
            upiId
        );

        if (result.success) {
            // Also return the UPI link for WhatsApp fallback
            const upiLink = generateUpiDeepLink(upiId, amount, merchantName || 'Merchant');

            res.json({
                success: true,
                message: result.message,
                requestId: result.requestId,
                upiLink: upiLink
            });
        } else {
            res.status(400).json({
                success: false,
                error: result.error
            });
        }

    } catch (error) {
        console.error('❌ Send payment request error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', message: 'SMS verification service running' });
});

// Timeout checker (run periodically)
async function checkPaymentTimeouts() {
    try {
        const twoMinutes = 2 * 60 * 1000;
        const cutoffTime = Date.now() - twoMinutes;

        const paymentsRef = db.collection('payments');
        const snapshot = await paymentsRef
            .where('status', '==', 'WAITING_FOR_SMS')
            .where('createdAt', '<=', cutoffTime)
            .get();

        const updates = [];
        snapshot.forEach((doc) => {
            updates.push(
                paymentsRef.doc(doc.id).update({
                    status: 'NEEDS_MANUAL_CONFIRMATION',
                    timeoutAt: Date.now(),
                    updatedAt: Date.now()
                })
            );
        });

        if (updates.length > 0) {
            await Promise.all(updates);
            console.log(`⏰ Marked ${updates.length} payments as needing manual confirmation`);
        }
    } catch (error) {
        console.error('❌ Timeout checker error:', error);
    }
}

// Run timeout checker every 30 seconds
setInterval(checkPaymentTimeouts, 30000);

app.listen(PORT, () => {
    console.log(`🚀 SMS Verification Service running on port ${PORT}`);
    console.log(`📡 Webhook endpoint: http://localhost:${PORT}/api/sms-webhook`);
    console.log(`📝 Manual SMS endpoint: http://localhost:${PORT}/api/submit-sms`);
    console.log(`⏰ Timeout checker running every 30 seconds`);
});
