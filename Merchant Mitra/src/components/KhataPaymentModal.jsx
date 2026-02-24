import { useState } from 'react';
import QRCode from 'react-qr-code';
import { generateUpiLink } from '../services/payment.service';
import { addEntry } from '../services/khata.service';

/* ─────────────────────────────────────────────────────────────────────────────
   KhataPaymentModal
   Props:
     open        – boolean
     onClose     – () => void
     customer    – customer object  { id, name, phone, totalBalance }
     merchantData– { upiId, shopName }
     merchantId  – currentUser.uid
     onSuccess   – () => void   (called after entry recorded)
───────────────────────────────────────────────────────────────────────────── */

const UPI_APPS = [
    { name: 'GPay', icon: '🟢', scheme: 'gpay' },
    { name: 'PhonePe', icon: '🟣', scheme: 'phonepe' },
    { name: 'Paytm', icon: '🔵', scheme: 'paytm' },
];

const KhataPaymentModal = ({ open, onClose, customer, merchantData, merchantId, onSuccess }) => {
    const [step, setStep] = useState('form');   // 'form' | 'upi_qr' | 'success'
    const [mode, setMode] = useState('cash');   // 'cash' | 'upi'
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [received, setReceived] = useState(false); // for cash: "Mark Received"

    const reset = () => {
        setStep('form'); setMode('cash'); setAmount('');
        setNote(''); setLoading(false); setError('');
        setReceived(false);
    };
    const handleClose = () => { reset(); onClose(); };

    const upiLink = merchantData?.upiId && amount
        ? generateUpiLink(merchantData.upiId, parseFloat(amount) || 0, `khata-${customer?.id}`, merchantData.shopName || 'Merchant')
        : '';

    // Record DEBIT entry in khata
    const recordPayment = async () => {
        setLoading(true);
        const result = await addEntry(merchantId, customer.id, {
            type: 'DEBIT',
            amount: parseFloat(amount),
            description: `Payment received – ${mode === 'cash' ? 'Cash' : 'UPI'}`,
            note: note || '',
        });
        setLoading(false);
        if (result.success) {
            setStep('success');
            onSuccess?.();
        } else {
            setError('Failed to record payment. Please try again.');
        }
    };

    const handleCashConfirm = async () => {
        if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return; }
        setError('');
        await recordPayment();
    };

    const handleUpiProceed = () => {
        if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount'); return; }
        if (!merchantData?.upiId) { setError('Add your UPI ID in Profile first'); return; }
        setError('');
        setStep('upi_qr');
    };

    const handleUpiConfirm = async () => {
        await recordPayment();
    };

    const handleWhatsAppShare = () => {
        const phone = customer?.phone?.replace(/\D/g, '').slice(-10);
        if (!phone) return;
        const msg = `Hello ${customer?.name} ji 🙏\n\nPlease pay *₹${amount}* to *${merchantData?.shopName || 'Merchant'}* via UPI.\n\n👇 Click to pay:\n${upiLink}\n\nThank you!`;
        window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
            <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden">

                {/* ── Header ── */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4 flex items-center justify-between">
                    <div>
                        <p className="text-white font-bold text-base">
                            {step === 'success' ? '✅ Payment Recorded' : '💳 Collect Payment'}
                        </p>
                        <p className="text-indigo-200 text-xs">{customer?.name}</p>
                    </div>
                    <button onClick={handleClose} className="text-white/70 hover:text-white p-1">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-5">
                    {/* ── SUCCESS ── */}
                    {step === 'success' && (
                        <div className="text-center py-4">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <p className="text-2xl font-bold text-slate-800 mb-1">₹{parseFloat(amount).toFixed(2)}</p>
                            <p className="text-slate-500 text-sm mb-1">Payment recorded via <span className="font-semibold capitalize">{mode}</span></p>
                            {note && <p className="text-slate-400 text-xs mb-4">"{note}"</p>}
                            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-5 text-sm text-green-700 font-medium">
                                Khata balance has been updated ✓
                            </div>
                            <button onClick={handleClose} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold">
                                Done
                            </button>
                        </div>
                    )}

                    {/* ── UPI QR SCREEN ── */}
                    {step === 'upi_qr' && (
                        <div className="flex flex-col items-center">
                            <p className="text-slate-500 text-sm mb-1">Scan to pay</p>
                            <p className="text-3xl font-bold text-slate-800 mb-4">₹{parseFloat(amount).toFixed(2)}</p>

                            {/* QR */}
                            <div className="bg-white border-4 border-indigo-100 rounded-2xl p-4 mb-4 shadow-md">
                                <QRCode value={upiLink} size={200} />
                            </div>

                            <p className="text-xs text-slate-400 mb-1">UPI ID: <span className="font-semibold text-slate-600">{merchantData?.upiId}</span></p>
                            <p className="text-xs text-slate-400 mb-4">Works with GPay • PhonePe • Paytm • Any UPI app</p>

                            {/* UPI app quick-links */}
                            <div className="flex gap-2 mb-4 w-full">
                                {UPI_APPS.map(app => (
                                    <a
                                        key={app.name}
                                        href={upiLink}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="flex-1 flex flex-col items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl py-2 hover:bg-slate-100 transition-colors"
                                    >
                                        <span className="text-xl">{app.icon}</span>
                                        <span className="text-xs font-semibold text-slate-600">{app.name}</span>
                                    </a>
                                ))}
                            </div>

                            {/* WhatsApp share (if phone available) */}
                            {customer?.phone && (
                                <button
                                    onClick={handleWhatsAppShare}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm mb-3 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    Send Link to {customer.name}
                                </button>
                            )}

                            {error && <p className="text-red-500 text-xs mb-2">{error}</p>}

                            {/* Confirm received button */}
                            <button
                                onClick={handleUpiConfirm}
                                disabled={loading}
                                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-sm disabled:opacity-60"
                            >
                                {loading ? 'Recording...' : '✅ Mark Payment Received'}
                            </button>
                            <button onClick={() => setStep('form')} className="mt-2 w-full py-2 text-slate-500 text-sm">← Back</button>
                        </div>
                    )}

                    {/* ── FORM ── */}
                    {step === 'form' && (
                        <>
                            {/* Outstanding balance */}
                            {customer?.totalBalance > 0 && (
                                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                                    <span className="text-sm text-red-600 font-medium">Outstanding Balance</span>
                                    <span className="text-lg font-bold text-red-600">₹{customer.totalBalance.toFixed(2)}</span>
                                </div>
                            )}

                            {/* Amount */}
                            <div className="mb-4">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Amount (₹) *</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl font-bold text-slate-400">₹</span>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        min="1"
                                        step="0.01"
                                        className="w-full pl-9 pr-4 py-3 text-2xl font-bold text-slate-800 border-2 border-slate-200 rounded-xl focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none"
                                    />
                                </div>
                                {/* Quick amounts */}
                                {customer?.totalBalance > 0 && (
                                    <div className="flex gap-2 mt-2">
                                        {[customer.totalBalance, Math.ceil(customer.totalBalance / 2)].filter(v => v > 0).map(v => (
                                            <button
                                                key={v}
                                                onClick={() => setAmount(v.toFixed(2))}
                                                className="text-xs px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full font-semibold hover:bg-indigo-100"
                                            >
                                                ₹{v.toFixed(0)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Note */}
                            <div className="mb-5">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Note (optional)</label>
                                <input
                                    type="text"
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="e.g. Partial payment, July dues..."
                                    className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-400 outline-none"
                                />
                            </div>

                            {/* Payment Mode */}
                            <div className="mb-5">
                                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Payment Mode</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {/* Cash */}
                                    <button
                                        onClick={() => setMode('cash')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${mode === 'cash'
                                            ? 'border-green-500 bg-green-50 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                    >
                                        <span className="text-3xl">💵</span>
                                        <span className={`font-bold text-sm ${mode === 'cash' ? 'text-green-700' : 'text-slate-600'}`}>Cash</span>
                                        <span className="text-xs text-slate-400">Instant confirmation</span>
                                        {mode === 'cash' && (
                                            <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Selected ✓</span>
                                        )}
                                    </button>

                                    {/* UPI */}
                                    <button
                                        onClick={() => setMode('upi')}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${mode === 'upi'
                                            ? 'border-indigo-500 bg-indigo-50 shadow-sm'
                                            : 'border-slate-200 bg-white hover:border-slate-300'}`}
                                    >
                                        <span className="text-3xl">📱</span>
                                        <span className={`font-bold text-sm ${mode === 'upi' ? 'text-indigo-700' : 'text-slate-600'}`}>UPI</span>
                                        <span className="text-xs text-slate-400">QR / GPay / PhonePe</span>
                                        {mode === 'upi' && (
                                            <span className="text-xs bg-indigo-500 text-white px-2 py-0.5 rounded-full">Selected ✓</span>
                                        )}
                                    </button>
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

                            {/* Action button */}
                            {mode === 'cash' ? (
                                <button
                                    onClick={handleCashConfirm}
                                    disabled={loading}
                                    className="w-full py-3.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-shadow disabled:opacity-60"
                                >
                                    {loading ? 'Recording...' : '💵 Confirm Cash Received'}
                                </button>
                            ) : (
                                <button
                                    onClick={handleUpiProceed}
                                    className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-base shadow-lg hover:shadow-xl transition-shadow"
                                >
                                    📱 Generate UPI QR Code →
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default KhataPaymentModal;
