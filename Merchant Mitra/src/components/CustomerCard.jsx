const AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
    '#10b981', '#3b82f6', '#ef4444', '#14b8a6'
];

export const getAvatarColor = (name = '') => {
    const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
    return AVATAR_COLORS[Math.max(0, idx)];
};

const KhataTypeBadge = ({ type }) => {
    const styles = {
        daily: 'bg-green-100 text-green-700',
        weekly: 'bg-blue-100 text-blue-700',
        monthly: 'bg-purple-100 text-purple-700',
    };
    const labels = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' };
    return (
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${styles[type] || styles.monthly}`}>
            {labels[type] || 'Monthly'}
        </span>
    );
};

const CustomerCard = ({ customer, onClick }) => {
    const initials = (customer.name || 'C').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const balance = customer.totalBalance || 0;
    const color = customer.avatarColor || getAvatarColor(customer.name);

    const formatDate = (ts) => {
        if (!ts) return 'No entries yet';
        const d = new Date(ts);
        const today = new Date();
        const diff = today - d;
        if (diff < 86400000) return 'Today';
        if (diff < 172800000) return 'Yesterday';
        return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div
            onClick={() => onClick(customer)}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 flex items-center gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer active:scale-[0.98]"
        >
            {/* Avatar */}
            <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 shadow-sm"
                style={{ backgroundColor: color }}
            >
                {initials}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-semibold text-slate-800 truncate">{customer.name}</p>
                    <KhataTypeBadge type={customer.khataType} />
                </div>
                <p className="text-xs text-slate-400 truncate">
                    {customer.phone || 'No phone'} · {formatDate(customer.lastEntryAt)}
                </p>
                {customer.tags?.length > 0 && (
                    <div className="flex gap-1 mt-1 flex-wrap">
                        {customer.tags.slice(0, 2).map(tag => (
                            <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-md">{tag}</span>
                        ))}
                    </div>
                )}
            </div>

            {/* Balance */}
            <div className="text-right flex-shrink-0">
                {balance === 0 ? (
                    <span className="inline-block bg-slate-100 text-slate-500 text-xs font-semibold px-2 py-1 rounded-full">Settled</span>
                ) : balance > 0 ? (
                    <div>
                        <p className="text-xs text-red-500 font-medium">To Collect</p>
                        <p className="text-base font-bold text-red-600">₹{balance.toFixed(2)}</p>
                    </div>
                ) : (
                    <div>
                        <p className="text-xs text-green-500 font-medium">To Pay</p>
                        <p className="text-base font-bold text-green-600">₹{Math.abs(balance).toFixed(2)}</p>
                    </div>
                )}
            </div>

            {/* Chevron */}
            <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    );
};

export default CustomerCard;
