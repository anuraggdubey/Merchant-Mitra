import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { createPayment, generateUpiQrData, subscribeToPayment, manualConfirmPayment, markPaymentSuccess, PAYMENT_STATES } from '../services/payment.service';
import { sendPaymentRequest } from '../services/sms.service';
import QRCode from 'react-qr-code';
import { formatCurrency } from '../utils/formatters';

const CollectPayment = () => {
    const navigate = useNavigate();
    const { currentUser, merchantData } = useAuth();
    const { t } = useLanguage();
    const [amount, setAmount] = useState('');
    const [paymentMode, setPaymentMode] = useState('QR'); // 'QR' or 'REQUEST'
    const [note, setNote] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerPhone, setCustomerPhone] = useState('');
    const [payment, setPayment] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timeLeft, setTimeLeft] = useState(120); // 2 minutes
    const [smsSent, setSmsSent] = useState(false);
    const [smsError, setSmsError] = useState('');

    // Subscribe to payment updates
    useEffect(() => {
        if (!payment) return;

        const unsubscribe = subscribeToPayment(payment.paymentId, (result) => {
            if (result.success) {
                setPayment(result.data);
            }
        });

        return () => unsubscribe();
    }, [payment?.paymentId]);

    // Countdown timer
    useEffect(() => {
        if (!payment || payment.status !== PAYMENT_STATES.WAITING_FOR_SMS) return;

        const interval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - payment.createdAt) / 1000);
            const remaining = Math.max(0, 120 - elapsed);
            setTimeLeft(remaining);

            if (remaining === 0) {
                clearInterval(interval);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [payment]);

    // Send Payment Request via WhatsApp (Free & Professional)
    const handleSendRequest = (phone = customerPhone, amt = amount, id = payment?.paymentId) => {
        if (!amt || !phone || !merchantData?.upiId) return;

        const upiLink = generateUpiQrData(merchantData.upiId, parseFloat(amt), id, merchantData.shopName);
        const message = `*Hello!* 👋\n\n*${merchantData.shopName}* has requested a payment of *₹${amt}*.\n\nClick the link below to pay directly using any UPI app (GPay, PhonePe, Paytm):\n👇👇👇\n${upiLink}\n\n_Thank you for your business!_`;

        // Clean phone number (add 91 country code for India)
        const cleanPhone = phone.replace(/\D/g, '').slice(-10);
        const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(message)}`;

        // Opens WhatsApp (Web on PC, App on Mobile)
        window.open(waUrl, '_blank');
        setSmsSent(true);
    };

    const handleCreatePayment = async (e) => {
        e.preventDefault();
        setError('');
        setSmsError('');
        setSmsSent(false);

        if (!amount || parseFloat(amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (!merchantData?.upiId) {
            setError('Please complete your profile and add UPI ID first');
            return;
        }

        if (paymentMode === 'REQUEST' && !customerPhone.trim()) {
            setError('Phone number is required to send request');
            return;
        }

        setLoading(true);
        const result = await createPayment(currentUser.uid, parseFloat(amount), note, customerName, customerPhone);

        if (!result.success) {
            setLoading(false);
            setError(result.error);
            return;
        }

        setPayment(result.data);

        if (paymentMode === 'REQUEST') {
            handleSendRequest(customerPhone, amount, result.paymentId);
        }

        setLoading(false);
    };

    const handleManualConfirm = async (confirmed) => {
        setLoading(true);
        await manualConfirmPayment(payment.paymentId, confirmed);
        setLoading(false);

        if (confirmed) {
            setTimeout(() => navigate('/dashboard'), 1500);
        }
    };

    const handleNewPayment = () => {
        setPayment(null);
        setAmount('');
        setNote('');
        setCustomerName('');
        setCustomerPhone('');
        setTimeLeft(120);
        setSmsSent(false);
        setSmsError('');
    };

    const handleResendSms = () => {
        handleSendRequest();
    };

    // Simulate SMS for testing
    const handleSimulateSms = async () => {
        if (!payment) return;

        setLoading(true);
        // Simulate SMS verification
        await markPaymentSuccess(payment.paymentId, {
            amount: payment.amount,
            timestamp: Date.now(),
            rawSms: `SIMULATED: Rs.${payment.amount} credited to your account`,
            simulated: true
        });
        setLoading(false);
    };

    // Share via WhatsApp
    const handleShareWhatsApp = () => {
        if (!payment) return;
        const upiLink = generateUpiQrData(merchantData.upiId, payment.amount, payment.paymentId, merchantData.shopName);

        const message = `${t('share_message')} ₹${payment.amount} ${t('to')} ${merchantData.shopName}. ${t('note')}: ${note}. Link: ${upiLink}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

        window.open(whatsappUrl, '_blank');
    };

    if (!payment) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
                <div className="max-w-md mx-auto">
                    <div className="mb-8 flex items-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mr-3 p-2 rounded-full hover:bg-slate-200 transition-colors"
                        >
                            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-2xl font-bold text-slate-800">{t('collect_payment_title')}</h1>
                    </div>

                    {/* Mode Toggle */}
                    <div className="flex p-1 bg-white rounded-xl shadow-sm mb-6 border border-slate-200">
                        <button
                            onClick={() => setPaymentMode('QR')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${paymentMode === 'QR' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t('scan_qr_code')}
                        </button>
                        <button
                            onClick={() => setPaymentMode('REQUEST')}
                            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${paymentMode === 'REQUEST' ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {t('send_request')}
                        </button>
                    </div>

                    <form onSubmit={handleCreatePayment} className="glass-card p-6 space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('amount')} (₹) *</label>
                            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="input-field text-2xl font-bold" placeholder="0.00" step="0.01" min="1" />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('customer_name')} ({t('optional')})</label>
                            <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="input-field" placeholder={t('customer_name')} />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('phone_number')} ({t('optional')})</label>
                            <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="input-field" placeholder={t('phone_number')} />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">{t('note')} ({t('optional')})</label>
                            <input type="text" value={note} onChange={(e) => setNote(e.target.value)} className="input-field" placeholder={t('note')} />
                        </div>

                        {error && <div className="p-4 bg-red-50 text-red-800 border border-red-200 rounded-lg"><p className="text-sm font-medium">{error}</p></div>}

                        <button type="submit" disabled={loading} className="btn-primary w-full">
                            {loading ? t('generating') : paymentMode === 'QR' ? t('generate_qr') : t('send_request')}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    const upiLink = generateUpiQrData(merchantData.upiId, payment.amount, payment.paymentId, merchantData.shopName);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
            <div className="max-w-md mx-auto">
                <div className="glass-card p-6">
                    {/* Amount Display */}
                    <div className="text-center mb-6">
                        <p className="text-sm text-slate-600 mb-1">Amount to Collect</p>
                        <p className="text-4xl font-bold text-slate-800">{formatCurrency(payment.amount)}</p>
                        {payment.note && <p className="text-sm text-slate-500 mt-1">{payment.note}</p>}
                    </div>

                    {/* QR Code or SMS Status */}
                    {paymentMode === 'QR' ? (
                        <div className="bg-white p-6 rounded-xl mb-6 flex justify-center">
                            <QRCode value={upiLink} size={256} />
                        </div>
                    ) : (
                        <div className="bg-white p-6 rounded-xl mb-6 flex flex-col items-center">
                            {smsSent ? (
                                <>
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-bold text-green-700 mb-2">SMS Sent! 📱</p>
                                    <p className="text-center text-slate-600 mb-4 text-sm">
                                        Payment request sent to <span className="font-semibold">{customerPhone}</span>
                                    </p>
                                    <p className="text-xs text-slate-500 mb-4 text-center">
                                        Customer will receive a link to pay ₹{payment.amount} directly via UPI
                                    </p>
                                    <button
                                        onClick={handleResendSms}
                                        disabled={loading}
                                        className="w-full py-2 bg-slate-100 text-slate-700 rounded-lg font-medium hover:bg-slate-200 transition-colors mb-3"
                                    >
                                        {loading ? 'Sending...' : '🔄 Resend SMS'}
                                    </button>
                                </>
                            ) : smsError ? (
                                <>
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </div>
                                    <p className="text-lg font-bold text-red-700 mb-2">SMS Failed</p>
                                    <p className="text-center text-red-600 mb-4 text-sm">{smsError}</p>
                                    <button
                                        onClick={handleResendSms}
                                        disabled={loading}
                                        className="w-full py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors mb-3"
                                    >
                                        {loading ? 'Sending...' : '🔄 Retry SMS'}
                                    </button>
                                </>
                            ) : (
                                <div className="flex items-center justify-center py-4">
                                    <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <span className="ml-3 text-slate-600">Sending SMS...</span>
                                </div>
                            )}

                            {/* WhatsApp Fallback */}
                            <div className="w-full pt-3 border-t border-slate-100">
                                <p className="text-xs text-slate-500 text-center mb-2">Or share via WhatsApp</p>
                                <button
                                    onClick={handleShareWhatsApp}
                                    className="w-full py-3 bg-green-500 text-white rounded-lg font-bold shadow-lg hover:bg-green-600 transition-colors flex items-center justify-center"
                                >
                                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.615 2.664-.698c.993.595 1.954.915 3.016.915 3.181 0 5.767-2.587 5.768-5.765l-.001-.004c.001-3.181-2.586-5.767-5.787-5.767zm3.392 7.787c-.167.361-1.353 1.155-1.528 1.235-.12.054-.265.115-.494.067-.534-.11-1.371-.476-2.607-1.579-1.297-1.159-2.029-2.571-2.029-2.571-.565-.68-.813-1.093-.865-1.341-.052-.249.034-.492.203-.681.168-.189.378-.456.378-.456s.13-.153.197-.246c.068-.093.033-.176-.017-.276-.051-.1-.453-1.091-.62-1.488-.161-.383-.326-.331-.448-.337-.11-.006-.236-.007-.362-.007-.126 0-.329.047-.502.235-.173.188-.661.646-.661 1.575 0 .93.676 1.79 1.517 2.966l.044.059c.646.883 1.391 1.636 2.223 2.233.832.597 1.533.818 1.983.899.45.081.933.006 1.486-.183.553-.189 1.196-.869 1.411-1.353.216-.484.216-.9.152-1.013-.064-.112-.236-.18-.496-.312z" />
                                    </svg>
                                    {t('share_whatsapp')}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Status */}
                    {payment.status === PAYMENT_STATES.WAITING_FOR_SMS && (
                        <div className="space-y-4">
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-sm font-semibold text-blue-900">⏳ {t('waiting_payment')}</p>
                                    <p className="text-sm font-bold text-blue-600">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
                                </div>
                                <p className="text-xs text-blue-700">{paymentMode === 'QR' ? 'Customer should scan and pay.' : 'Customer should click link and pay.'} We'll auto-verify via SMS.</p>
                            </div>

                            {/* Simulate SMS Button for Testing */}
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                <p className="text-xs font-semibold text-amber-900 mb-2">🧪 Testing Mode</p>
                                <button
                                    onClick={handleSimulateSms}
                                    disabled={loading}
                                    className="w-full px-4 py-2 bg-amber-600 text-white rounded-lg font-medium hover:bg-amber-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Simulating...' : 'Simulate SMS Verification'}
                                </button>
                                <p className="text-xs text-amber-700 mt-2">Click this to simulate receiving payment SMS (for testing)</p>
                            </div>
                        </div>
                    )}

                    {payment.status === PAYMENT_STATES.SUCCESS && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                            <p className="text-sm font-semibold text-green-900">✅ {t('payment_received')}</p>
                            <p className="text-xs text-green-700 mt-1">Verified via {payment.verificationMethod}</p>
                        </div>
                    )}

                    {payment.status === PAYMENT_STATES.NEEDS_MANUAL_CONFIRMATION && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                            <p className="text-sm font-semibold text-amber-900">⚠️ Could not auto-verify</p>
                            <p className="text-xs text-amber-700 mt-1">Please check your bank and confirm manually</p>
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => handleManualConfirm(false)} className="flex-1 px-4 py-2 bg-white border-2 border-amber-600 text-amber-700 rounded-lg font-medium hover:bg-amber-50">Not Received</button>
                                <button onClick={() => handleManualConfirm(true)} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">Received</button>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="space-y-3">
                        {payment.status === PAYMENT_STATES.SUCCESS && (
                            <button onClick={handleNewPayment} className="btn-primary w-full">New Payment</button>
                        )}
                        <button onClick={() => navigate('/dashboard')} className="btn-secondary w-full">Back to Dashboard</button>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default CollectPayment;
