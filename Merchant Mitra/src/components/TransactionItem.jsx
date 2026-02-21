import { formatCurrency, formatRelativeTime, maskPhoneNumber } from '../utils/formatters';

const TransactionItem = ({ transaction, onClick }) => {
    const isIncome = transaction.amount > 0;
    const statusColors = {
        SUCCESS: 'bg-green-100 text-green-800',
        PENDING: 'bg-amber-100 text-amber-800',
        FAILED: 'bg-red-100 text-red-800'
    };

    const typeLabels = {
        SALE: 'Sale',
        EXPENSE: 'Expense',
        UDHAAR_RECEIVED: 'Credit Received',
        UDHAAR_GIVEN: 'Credit Given'
    };

    return (
        <div
            className="flex items-center justify-between p-4 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer border-b border-slate-100 last:border-0"
            onClick={() => onClick && onClick(transaction)}
        >
            <div className="flex items-center space-x-4 flex-1">
                {/* Icon */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isIncome ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                    <svg
                        className={`w-5 h-5 ${isIncome ? 'text-green-600' : 'text-red-600'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        {isIncome ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                        )}
                    </svg>
                </div>

                {/* Transaction Details */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                            {transaction.customerName}
                        </p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[transaction.status]}`}>
                            {transaction.status}
                        </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-500">
                        <span>{maskPhoneNumber(transaction.customerPhone)}</span>
                        <span>•</span>
                        <span>{typeLabels[transaction.type]}</span>
                        <span>•</span>
                        <span>{formatRelativeTime(transaction.createdAt)}</span>
                    </div>
                </div>
            </div>

            {/* Amount */}
            <div className="text-right ml-4">
                <p className={`text-lg font-bold ${isIncome ? 'text-green-600' : 'text-red-600'}`}>
                    {isIncome ? '+' : ''}{formatCurrency(transaction.amount)}
                </p>
                {transaction.utr && (
                    <p className="text-xs text-slate-400 mt-1">UTR: {transaction.utr.slice(-6)}</p>
                )}
            </div>
        </div>
    );
};

export default TransactionItem;
