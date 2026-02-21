/**
 * SMS Service - Frontend API calls
 */

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

/**
 * Send payment request via SMS
 * @param {Object} params - Payment request parameters
 * @param {string} params.customerPhone - Customer's phone number
 * @param {number} params.amount - Payment amount
 * @param {string} params.merchantName - Merchant/Shop name
 * @param {string} params.upiId - Merchant's UPI ID
 * @returns {Promise<{success: boolean, message?: string, error?: string, upiLink?: string}>}
 */
export const sendPaymentRequest = async ({ customerPhone, amount, merchantName, upiId }) => {
    try {
        const response = await fetch(`${BACKEND_URL}/api/send-payment-request`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                customerPhone,
                amount,
                merchantName,
                upiId
            })
        });

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Send payment request error:', error);
        return {
            success: false,
            error: 'Failed to send payment request. Please check your connection.'
        };
    }
};

export default {
    sendPaymentRequest
};
