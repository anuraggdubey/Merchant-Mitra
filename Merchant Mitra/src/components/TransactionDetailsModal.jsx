import { useState } from 'react';
import { formatCurrency, formatRelativeTime } from '../utils/formatters';
import { manualConfirmPayment, updatePaymentStatus } from '../services/payment.service';
import { deleteTransaction } from '../services/transaction.service';

const TransactionDetailsModal = ({ transaction, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!transaction) return null;

    const isPending = transaction.status === 'WAITING_FOR_SMS' || transaction.status === 'PENDING';
    const isIncome = transaction.amount > 0;

    const handleStatusUpdate = async (newStatus) => {
        setLoading(true);
        setError('');
        try {
            let result;
            if (newStatus === 'SUCCESS') {
                result = await manualConfirmPayment(transaction.id, true);
            } else if (newStatus === 'FAILED') {
                result = await updatePaymentStatus(transaction.id, 'FAILED');
            }

            if (result && result.success) {
                if (onUpdate) onUpdate();
                onClose();
            } else {
                setError(result?.error || 'Failed to update status');
            }
        } catch (err) {
            console.error('Update status error:', err);
            setError('An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this transaction record? This cannot be undone.')) return;

        setLoading(true);
        const result = await deleteTransaction(transaction.id);
        if (result.success) {
            if (onUpdate) onUpdate();
            onClose();
        } else {
            setError(result.error);
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:px-4 backdrop-blur-sm">
            <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md overflow-hidden max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className={`p-4 sm:p-6 text-white ${isIncome ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-red-500 to-red-600'} flex-shrink-0`}>
                    {/* Drag handle on mobile */}
                    <div className="w-10 h-1 bg-white/30 rounded-full mx-auto mb-3 sm:hidden" />
                    <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                            <p className="text-white/80 text-sm font-medium mb-1">
                                {isIncome ? 'Received from' : 'Paid to'}
                            </p>
                            <h2 className="text-xl sm:text-2xl font-bold truncate">{transaction.customerName || 'Unknown Customer'}</h2>
                            <p className="text-white/90 text-sm mt-1">{transaction.customerPhone}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-1.5 transition-colors ml-2 flex-shrink-0"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <div className="mt-4">
                        <h3 className="text-3xl sm:text-4xl font-bold">
                            {formatCurrency(Math.abs(transaction.amount))}
                        </h3>
                        <p className="text-white/80 text-sm mt-1">
                            {formatRelativeTime(transaction.createdAt)}
                        </p>
                    </div>
                </div>

                {/* Body */}
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 overscroll-contain">
                    {/* Status Badge */}
                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
                        <span className="text-slate-500 font-medium text-sm">Status</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-bold ${transaction.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                            transaction.status === 'FAILED' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                            }`}>
                            {transaction.status.replace(/_/g, ' ')}
                        </span>
                    </div>

                    {/* Details Grid */}
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between">
                            <span className="text-slate-500 text-sm">Transaction Type</span>
                            <span className="text-slate-800 font-medium">{transaction.type?.replace(/_/g, ' ') || 'Sale'}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-slate-500 text-sm">Transaction ID</span>
                            <span className="text-slate-800 font-mono text-xs bg-slate-100 px-2 py-1 rounded">{transaction.id}</span>
                        </div>
                        {transaction.utr && (
                            <div className="flex justify-between">
                                <span className="text-slate-500 text-sm">UTR / Ref</span>
                                <span className="text-slate-800 font-medium">{transaction.utr}</span>
                            </div>
                        )}
                        {transaction.note && (
                            <div className="pt-4 border-t border-slate-100">
                                <span className="text-slate-500 text-xs uppercase font-bold tracking-wider block mb-2">Note</span>
                                <p className="text-slate-700 bg-slate-50 p-3 rounded-lg text-sm">{transaction.note}</p>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="mb-6 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    {/* Actions for Pending Transactions */}
                    {isPending && (
                        <div className="space-y-3">
                            <p className="text-center text-sm text-slate-500 mb-2">
                                Payment not verified yet? Update manually:
                            </p>
                            <button
                                onClick={() => handleStatusUpdate('SUCCESS')}
                                disabled={loading}
                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-200 transition-all transform active:scale-95 disabled:opacity-50"
                            >
                                {loading ? 'Updating...' : 'Mark as Received (Success)'}
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('FAILED')}
                                disabled={loading}
                                className="w-full py-3 bg-white border-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl font-bold transition-all disabled:opacity-50"
                            >
                                Mark as Failed
                            </button>
                        </div>
                    )}

                    {!isPending && (
                        <button
                            onClick={onClose}
                            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all mb-3"
                        >
                            Close
                        </button>
                    )}

                    <button
                        onClick={handleDelete}
                        disabled={loading}
                        className="w-full py-2 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                    >
                        Delete Record
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransactionDetailsModal;
