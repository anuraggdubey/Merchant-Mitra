/**
 * SMS Service using Fast2SMS
 * Sends payment request SMS with UPI deep links
 */

import dotenv from 'dotenv';
dotenv.config();

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;
const FAST2SMS_URL = 'https://www.fast2sms.com/dev/bulkV2';

/**
 * Generate UPI deep link for payment
 * @param {string} upiId - Merchant's UPI ID
 * @param {number} amount - Payment amount
 * @param {string} merchantName - Merchant/Shop name
 * @param {string} transactionNote - Transaction note
 * @returns {string} UPI deep link
 */
export const generateUpiDeepLink = (upiId, amount, merchantName, transactionNote = '') => {
    const params = new URLSearchParams({
        pa: upiId,                              // Payee address (UPI ID)
        pn: merchantName,                       // Payee name
        am: amount.toString(),                  // Amount
        cu: 'INR',                              // Currency
        tn: transactionNote || `Pay to ${merchantName}` // Transaction note
    });

    return `upi://pay?${params.toString()}`;
};

/**
 * Send payment request SMS to customer
 * @param {string} phoneNumber - Customer's phone number (10 digits, no country code)
 * @param {number} amount - Payment amount
 * @param {string} merchantName - Merchant/Shop name  
 * @param {string} upiId - Merchant's UPI ID
 * @returns {Promise<{success: boolean, message?: string, error?: string}>}
 */
export const sendPaymentRequestSms = async (phoneNumber, amount, merchantName, upiId) => {
    // Validate API key
    if (!FAST2SMS_API_KEY) {
        console.error('❌ FAST2SMS_API_KEY is not set in environment variables');
        return {
            success: false,
            error: 'SMS service not configured. Please add FAST2SMS_API_KEY to .env'
        };
    }

    // Clean phone number (remove +91, spaces, etc.)
    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);

    if (cleanPhone.length !== 10) {
        return {
            success: false,
            error: 'Invalid phone number. Please enter a 10-digit mobile number.'
        };
    }

    // Generate UPI deep link
    const upiLink = generateUpiDeepLink(upiId, amount, merchantName);

    // Create SMS message
    const message = `${merchantName} has requested Rs.${amount}. Pay now: ${upiLink}`;

    console.log('------------------------------------------');
    console.log('📱 SMS REQUEST SIMULATION');
    console.log('To:', cleanPhone);
    console.log('Message:', message);
    console.log('Link:', upiLink);
    console.log('------------------------------------------');

    try {
        const response = await fetch(FAST2SMS_URL, {
            method: 'POST',
            headers: {
                'authorization': FAST2SMS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                route: 'q',                    // Quick SMS route (for transactional)
                message: message,
                language: 'english',
                flash: 0,                      // 0 = normal SMS, 1 = flash SMS
                numbers: cleanPhone
            })
        });

        const data = await response.json();
        console.log('📨 Fast2SMS Response:', data);

        if (data.return === true) {
            return {
                success: true,
                message: 'Payment request sent successfully!',
                requestId: data.request_id
            };
        } else {
            return {
                success: false,
                error: data.message || 'Failed to send SMS'
            };
        }
    } catch (error) {
        console.error('❌ SMS sending error:', error);
        return {
            success: false,
            error: 'Failed to send SMS. Please try again.'
        };
    }
};

/**
 * Send Flash SMS (appears directly on screen without saving)
 * Note: Flash SMS still won't auto-open links, but is more prominent
 */
export const sendFlashPaymentSms = async (phoneNumber, amount, merchantName, upiId) => {
    if (!FAST2SMS_API_KEY) {
        return {
            success: false,
            error: 'SMS service not configured'
        };
    }

    const cleanPhone = phoneNumber.replace(/\D/g, '').slice(-10);
    const upiLink = generateUpiDeepLink(upiId, amount, merchantName);
    const message = `Pay Rs.${amount} to ${merchantName}: ${upiLink}`;

    try {
        const response = await fetch(FAST2SMS_URL, {
            method: 'POST',
            headers: {
                'authorization': FAST2SMS_API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                route: 'q',
                message: message,
                language: 'english',
                flash: 1,                      // Flash SMS - displays on screen immediately
                numbers: cleanPhone
            })
        });

        const data = await response.json();

        if (data.return === true) {
            return {
                success: true,
                message: 'Flash SMS sent!',
                requestId: data.request_id
            };
        } else {
            return {
                success: false,
                error: data.message || 'Failed to send flash SMS'
            };
        }
    } catch (error) {
        console.error('❌ Flash SMS error:', error);
        return {
            success: false,
            error: 'Failed to send SMS'
        };
    }
};

export default {
    sendPaymentRequestSms,
    sendFlashPaymentSms,
    generateUpiDeepLink
};
