import { collection, addDoc, doc, getDoc, updateDoc, query, where, getDocs, onSnapshot, orderBy, limit } from 'firebase/firestore';
import { db } from '../config/firebase';

// Payment states
export const PAYMENT_STATES = {
    CREATED: 'CREATED',
    WAITING_FOR_SMS: 'WAITING_FOR_SMS',
    SUCCESS: 'SUCCESS',
    NEEDS_MANUAL_CONFIRMATION: 'NEEDS_MANUAL_CONFIRMATION',
    FAILED: 'FAILED'
};

// Create a new payment
export const createPayment = async (merchantId, amount, note = '', customerName = '', customerPhone = '') => {
    try {
        const paymentData = {
            merchantId,
            amount: parseFloat(amount),
            note,
            customerName,
            customerPhone,
            status: PAYMENT_STATES.CREATED,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            verificationAttempts: 0,
            type: 'SALE' // Default to SALE for collected payments
        };

        const paymentRef = await addDoc(collection(db, 'payments'), paymentData);

        // Update status to WAITING_FOR_SMS
        await updateDoc(paymentRef, {
            status: PAYMENT_STATES.WAITING_FOR_SMS,
            paymentId: paymentRef.id,
            updatedAt: Date.now()
        });

        return {
            success: true,
            paymentId: paymentRef.id,
            data: { ...paymentData, paymentId: paymentRef.id, status: PAYMENT_STATES.WAITING_FOR_SMS }
        };
    } catch (error) {
        console.error('Create payment error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Generate UPI deep link
export const generateUpiLink = (upiId, amount, paymentId, merchantName) => {
    const params = new URLSearchParams({
        pa: upiId,                    // Payee address (UPI ID)
        pn: merchantName,             // Payee name
        am: amount.toString(),        // Amount
        cu: 'INR',                    // Currency
        tn: `Payment to ${merchantName}`, // Transaction note
        tr: paymentId                 // Transaction reference (our payment ID)
    });

    return `upi://pay?${params.toString()}`;
};

// Generate UPI QR code data
export const generateUpiQrData = (upiId, amount, paymentId, merchantName) => {
    return generateUpiLink(upiId, amount, paymentId, merchantName);
};

// Update payment status
export const updatePaymentStatus = async (paymentId, status, metadata = {}) => {
    try {
        await updateDoc(doc(db, 'payments', paymentId), {
            status,
            ...metadata,
            updatedAt: Date.now()
        });

        return { success: true };
    } catch (error) {
        console.error('Update payment status error:', error);
        return { success: false, error: error.message };
    }
};

// Mark payment as success (from SMS verification)
export const markPaymentSuccess = async (paymentId, smsData = {}) => {
    try {
        await updateDoc(doc(db, 'payments', paymentId), {
            status: PAYMENT_STATES.SUCCESS,
            verifiedAt: Date.now(),
            verificationMethod: 'SMS',
            smsData,
            updatedAt: Date.now()
        });

        return { success: true };
    } catch (error) {
        console.error('Mark payment success error:', error);
        return { success: false, error: error.message };
    }
};

// Mark payment as needing manual confirmation (timeout)
export const markPaymentNeedsConfirmation = async (paymentId) => {
    try {
        await updateDoc(doc(db, 'payments', paymentId), {
            status: PAYMENT_STATES.NEEDS_MANUAL_CONFIRMATION,
            timeoutAt: Date.now(),
            updatedAt: Date.now()
        });

        return { success: true };
    } catch (error) {
        console.error('Mark payment needs confirmation error:', error);
        return { success: false, error: error.message };
    }
};

// Manual confirmation by merchant
export const manualConfirmPayment = async (paymentId, confirmed) => {
    try {
        await updateDoc(doc(db, 'payments', paymentId), {
            status: confirmed ? PAYMENT_STATES.SUCCESS : PAYMENT_STATES.FAILED,
            verifiedAt: Date.now(),
            verificationMethod: 'MANUAL',
            manuallyConfirmed: confirmed,
            updatedAt: Date.now()
        });

        return { success: true };
    } catch (error) {
        console.error('Manual confirm payment error:', error);
        return { success: false, error: error.message };
    }
};

// Get payment by ID
export const getPayment = async (paymentId) => {
    try {
        const paymentDoc = await getDoc(doc(db, 'payments', paymentId));
        if (paymentDoc.exists()) {
            return {
                success: true,
                data: { id: paymentDoc.id, ...paymentDoc.data() }
            };
        }
        return { success: false, error: 'Payment not found' };
    } catch (error) {
        console.error('Get payment error:', error);
        return { success: false, error: error.message };
    }
};

// Listen to payment status changes
export const subscribeToPayment = (paymentId, callback) => {
    return onSnapshot(
        doc(db, 'payments', paymentId),
        (doc) => {
            if (doc.exists()) {
                callback({ success: true, data: { id: doc.id, ...doc.data() } });
            } else {
                callback({ success: false, error: 'Payment not found' });
            }
        },
        (error) => {
            console.error('Payment subscription error:', error);
            callback({ success: false, error: error.message });
        }
    );
};

// Get merchant's payment history
export const getPaymentHistory = async (merchantId, limit = 50) => {
    try {
        const q = query(
            collection(db, 'payments'),
            where('merchantId', '==', merchantId),
            orderBy('createdAt', 'desc'),
            limit(limit)
        );

        const querySnapshot = await getDocs(q);
        const payments = [];
        querySnapshot.forEach((doc) => {
            payments.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: payments };
    } catch (error) {
        console.error('Get payment history error:', error);
        return { success: false, error: error.message };
    }
};

// SMS Parsing Logic (conservative approach)
export const parseSmsForPayment = (smsText) => {
    // Only match CREDIT/RECEIVED messages
    const creditKeywords = ['credited', 'received', 'deposited', 'added to', 'cr.'];
    const hasCredit = creditKeywords.some(keyword =>
        smsText.toLowerCase().includes(keyword)
    );

    if (!hasCredit) {
        return null; // Ignore non-credit SMS
    }

    // Extract amount (₹ or Rs. followed by numbers)
    const amountMatch = smsText.match(/(?:₹|Rs\.?)\s*(\d+(?:,\d+)*(?:\.\d{2})?)/i);
    if (!amountMatch) {
        return null;
    }

    const amount = parseFloat(amountMatch[1].replace(/,/g, ''));

    // Extract UPI reference if present
    const utrMatch = smsText.match(/(?:UTR|Ref(?:erence)?|UPI Ref)[\s:]+(\w+)/i);
    const utr = utrMatch ? utrMatch[1] : null;

    return {
        amount,
        utr,
        timestamp: Date.now(),
        rawSms: smsText
    };
};

// Match SMS to payment (conservative matching)
export const matchSmsToPayment = async (merchantId, smsData) => {
    try {
        const { amount, timestamp } = smsData;

        // Find payments in WAITING_FOR_SMS status within ±5 minutes
        const fiveMinutes = 5 * 60 * 1000;
        const minTime = timestamp - fiveMinutes;
        const maxTime = timestamp + fiveMinutes;

        const q = query(
            collection(db, 'payments'),
            where('merchantId', '==', merchantId),
            where('status', '==', PAYMENT_STATES.WAITING_FOR_SMS),
            where('createdAt', '>=', minTime),
            where('createdAt', '<=', maxTime)
        );

        const querySnapshot = await getDocs(q);

        // Find exact amount match
        let matchedPayment = null;
        querySnapshot.forEach((doc) => {
            const payment = doc.data();
            if (Math.abs(payment.amount - amount) < 0.01) { // Allow 1 paisa difference
                matchedPayment = { id: doc.id, ...payment };
            }
        });

        if (matchedPayment) {
            // Mark as success
            await markPaymentSuccess(matchedPayment.id, smsData);
            return { success: true, paymentId: matchedPayment.id };
        }

        return { success: false, error: 'No matching payment found' };
    } catch (error) {
        console.error('Match SMS to payment error:', error);
        return { success: false, error: error.message };
    }
};

// Timeout checker (should be run by a cron job or Cloud Function)
export const checkPaymentTimeouts = async (merchantId) => {
    try {
        const twoMinutes = 2 * 60 * 1000;
        const cutoffTime = Date.now() - twoMinutes;

        const q = query(
            collection(db, 'payments'),
            where('merchantId', '==', merchantId),
            where('status', '==', PAYMENT_STATES.WAITING_FOR_SMS),
            where('createdAt', '<=', cutoffTime)
        );

        const querySnapshot = await getDocs(q);
        const updates = [];

        querySnapshot.forEach((doc) => {
            updates.push(markPaymentNeedsConfirmation(doc.id));
        });

        await Promise.all(updates);

        return { success: true, count: updates.length };
    } catch (error) {
        console.error('Check payment timeouts error:', error);
        return { success: false, error: error.message };
    }
};
