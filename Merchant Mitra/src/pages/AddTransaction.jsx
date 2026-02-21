import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addTransaction } from '../services/transaction.service';
import useVoiceInput from '../hooks/useVoiceInput';
import { useLanguage } from '../context/LanguageContext';
import { analyzeReceiptImage, parseTransactionText } from '../services/gemini.service';

const AddTransaction = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const { isListening, transcript, startListening, isSupported, error: voiceError } = useVoiceInput();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { language, t } = useLanguage();
    const [aiProcessing, setAiProcessing] = useState(false);

    const [formData, setFormData] = useState({
        amount: '',
        type: 'SALE', // SALE, EXPENSE, UDHAAR_GIVEN, UDHAAR_RECEIVED
        customerName: '',
        customerPhone: '',
        note: ''
    });

    // Handle Receipt Image Upload
    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Basic validation
        if (!file.type.startsWith('image/')) {
            setMessage({ type: 'error', text: 'Please upload a valid image file.' });
            return;
        }

        setIsAnalyzing(true);
        setMessage({ type: 'info', text: 'Analyzing receipt with Gemini AI...' });

        try {
            const result = await analyzeReceiptImage(file, language);

            if (result.success) {
                const { amount, customerName, note, type } = result.data;

                setFormData(prev => ({
                    ...prev,
                    amount: amount || prev.amount,
                    type: type || prev.type,
                    customerName: customerName || prev.customerName,
                    note: note || prev.note
                }));
                setMessage({ type: 'success', text: 'Receipt analyzed successfully!' });
            } else {
                setMessage({ type: 'error', text: result.error });
            }
        } catch (error) {
            console.error('Analysis error:', error);
            setMessage({ type: 'error', text: 'Failed to analyze receipt.' });
        } finally {
            setIsAnalyzing(false);
            // Clear message after delay
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);

            // Reset input
            e.target.value = '';
        }
    };

    // Show voice errors to user
    useEffect(() => {
        if (voiceError) {
            setMessage({ type: 'error', text: voiceError });
            setTimeout(() => setMessage({ type: '', text: '' }), 4000);
        }
    }, [voiceError]);

    // Auto-fill form when voice result comes in
    useEffect(() => {
        const processVoiceInput = async () => {
            if (transcript && !isListening) { // Only process when stopped listening
                console.log('Processing transcript:', transcript);
                setAiProcessing(true);
                try {
                    const result = await parseTransactionText(transcript, language);

                    if (result.success) {
                        const parsed = result.data;
                        setFormData(prev => ({
                            ...prev,
                            amount: parsed.amount || prev.amount,
                            type: parsed.type || prev.type,
                            customerName: parsed.customerName || prev.customerName,
                            note: parsed.note || prev.note
                        }));

                        // Show a quick feedback message
                        setMessage({ type: 'success', text: `Heard: "${transcript}"` });

                        // Clear success message after a few seconds
                        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                    } else {
                        setMessage({ type: 'error', text: 'Failed to parse voice input' });
                        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                    }
                } catch (err) {
                    console.error('Error processing voice input:', err);
                    setMessage({ type: 'error', text: 'Error processing voice input' });
                    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
                } finally {
                    setAiProcessing(false);
                }
            }
        };

        if (transcript) {
            // Debounce to wait for silence/stop
            const timer = setTimeout(processVoiceInput, 500); // 500ms debounce
            return () => clearTimeout(timer);
        }
    }, [transcript, isListening, language]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.amount || isNaN(formData.amount) || parseFloat(formData.amount) <= 0) {
            setMessage({ type: 'error', text: 'Please enter a valid amount' });
            return;
        }

        // Require Customer Name for Udhaar transactions
        if ((formData.type === 'UDHAAR_GIVEN' || formData.type === 'UDHAAR_RECEIVED') && !formData.customerName.trim()) {
            setMessage({ type: 'error', text: 'Customer Name is required for Udhaar transactions' });
            return;
        }

        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Adjust amount sign based on type
            let finalAmount = parseFloat(formData.amount);
            if (formData.type === 'EXPENSE' || formData.type === 'UDHAAR_GIVEN') {
                finalAmount = -Math.abs(finalAmount);
            } else {
                finalAmount = Math.abs(finalAmount);
            }

            const transactionData = {
                amount: finalAmount,
                type: formData.type,
                customerName: formData.customerName,
                customerPhone: formData.customerPhone,
                note: formData.note,
                status: 'SUCCESS', // Manual entry assumed success
                verificationMethod: 'MANUAL'
            };

            const result = await addTransaction(currentUser.uid, transactionData);

            if (result.success) {
                setMessage({ type: 'success', text: 'Transaction added successfully!' });
                // Reset form slightly or navigate back
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            } else {
                setMessage({ type: 'error', text: result.error || 'Failed to add transaction' });
            }
        } catch (error) {
            console.error('Submit transaction error:', error);
            setMessage({ type: 'error', text: 'An unexpected error occurred' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-4 sm:py-8 px-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="flex items-center mb-6">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mr-3 p-2 rounded-full hover:bg-slate-200 transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-bold text-slate-800">{t('add_transaction')}</h1>
                </div>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* AI Input Section (Voice Only) */}
                    <div className="bg-slate-50 border-b border-slate-100 p-4">
                        <div className="flex justify-center">
                            {/* Voice Input */}
                            {isSupported && (
                                <button
                                    onClick={() => startListening(language)}
                                    disabled={isListening || isAnalyzing || aiProcessing}
                                    className={`flex flex-col items-center justify-center p-4 w-full rounded-xl border-2 transition-all ${isListening
                                        ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                                        : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600'
                                        }`}
                                >
                                    <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                    </svg>
                                    <span className="text-sm font-bold">
                                        {isListening ? t('listening') : aiProcessing ? t('analyzing') : t('voice_entry')}
                                    </span>
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="p-6">
                        {message.text && (
                            <div className={`mb-6 p-4 rounded-lg flex items-center ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                {message.type === 'success' ? (
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                )}
                                {message.text}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Transaction Type */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">{t('transaction_type')}</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {[
                                        { id: 'SALE', label: t('sale'), icon: '💰', color: 'bg-green-100 text-green-700 border-green-200' },
                                        { id: 'EXPENSE', label: t('expense'), icon: '💸', color: 'bg-red-100 text-red-700 border-red-200' },
                                        { id: 'UDHAAR_GIVEN', label: t('udhaar_given'), icon: '📤', color: 'bg-amber-100 text-amber-700 border-amber-200' },
                                        { id: 'UDHAAR_RECEIVED', label: t('udhaar_received'), icon: '📥', color: 'bg-blue-100 text-blue-700 border-blue-200' }
                                    ].map((type) => (
                                        <div
                                            key={type.id}
                                            onClick={() => setFormData({ ...formData, type: type.id })}
                                            className={`cursor-pointer p-3 rounded-xl border-2 transition-all text-center ${formData.type === type.id
                                                ? 'border-primary-500 ring-1 ring-primary-500 bg-primary-50'
                                                : 'border-slate-100 hover:border-slate-300 bg-slate-50'
                                                }`}
                                        >
                                            <div className="text-xl mb-1">{type.icon}</div>
                                            <div className="text-xs font-semibold">{type.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('amount')} (₹)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                    <input
                                        type="number"
                                        name="amount"
                                        value={formData.amount}
                                        onChange={handleChange}
                                        className="pl-8 w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all font-bold text-lg"
                                        placeholder="0.00"
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            {/* Customer Details */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('customer_name')}</label>
                                    <input
                                        type="text"
                                        name="customerName"
                                        value={formData.customerName}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                                        placeholder={t('optional')}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('phone_number')}</label>
                                    <input
                                        type="tel"
                                        name="customerPhone"
                                        value={formData.customerPhone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all"
                                        placeholder={t('optional')}
                                    />
                                </div>
                            </div>

                            {/* Note */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">{t('note')}</label>
                                <textarea
                                    name="note"
                                    value={formData.note}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 outline-none transition-all resize-none"
                                    placeholder={t('note') + " (e.g. Rice, Sugar)"}
                                ></textarea>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl hover:from-primary-700 hover:to-primary-800 transform hover:-translate-y-0.5 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
                            >
                                {loading ? (
                                    <span className="flex items-center justify-center">
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        {t('save')}...
                                    </span>
                                ) : (
                                    t('save')
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddTransaction;
