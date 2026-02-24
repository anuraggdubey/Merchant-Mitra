import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getCustomer, subscribeEntries, addEntry, updateEntry, deleteEntry,
    sendWhatsAppReminder, exportKhataCSV
} from '../services/khata.service';
import KhataEntryModal from '../components/KhataEntryModal';
import KhataPaymentModal from '../components/KhataPaymentModal';
import { getAvatarColor } from '../components/CustomerCard';

const CYCLE_VIEWS = ['All', 'Daily', 'Weekly', 'Monthly'];

const DATE_RANGES = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'Last 3 Months', value: '3months' },
    { label: 'All Time', value: 'all' },
];

const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDateTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) +
        ' · ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

// Group entries by date label based on cycle
const groupEntries = (entries, cycle) => {
    if (cycle === 'All') {
        const groups = {};
        entries.forEach(e => {
            const key = new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(e);
        });
        return Object.entries(groups).map(([label, items]) => ({ label, items }));
    }
    if (cycle === 'Weekly') {
        const groups = {};
        entries.forEach(e => {
            const d = new Date(e.createdAt);
            const day = d.getDay();
            const monday = new Date(d);
            monday.setDate(d.getDate() - ((day + 6) % 7));
            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);
            const key = `${monday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${sunday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(e);
        });
        return Object.entries(groups).map(([label, items]) => ({ label, items }));
    }
    if (cycle === 'Monthly') {
        const groups = {};
        entries.forEach(e => {
            const key = new Date(e.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
            if (!groups[key]) groups[key] = [];
            groups[key].push(e);
        });
        return Object.entries(groups).map(([label, items]) => ({ label, items }));
    }
    return [];
};

// Get start timestamp for a date-range filter
const getRangeStart = (range) => {
    const now = new Date();
    if (range === 'today') {
        const d = new Date(now); d.setHours(0, 0, 0, 0); return d.getTime();
    }
    if (range === 'week') {
        const d = new Date(now);
        d.setDate(now.getDate() - ((now.getDay() + 6) % 7));
        d.setHours(0, 0, 0, 0);
        return d.getTime();
    }
    if (range === 'month') {
        return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    }
    if (range === '3months') {
        return new Date(now.getFullYear(), now.getMonth() - 3, 1).getTime();
    }
    return 0; // all
};

const EntryRow = ({ entry, onEdit, onDelete, onMarkPaid }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const isCredit = entry.type === 'CREDIT';
    const isDebit = entry.type === 'DEBIT';

    return (
        <div className="flex items-start gap-3 py-3 px-4 hover:bg-slate-50 rounded-xl transition-colors relative group">
            {/* Icon */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCredit ? 'bg-red-100' : isDebit ? 'bg-green-100' : 'bg-slate-100'
                }`}>
                <span className="text-base">{isCredit ? '📦' : isDebit ? '💵' : '📝'}</span>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">{entry.description}</p>
                {entry.note && <p className="text-xs text-slate-400 truncate mt-0.5">{entry.note}</p>}
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-slate-400">{formatTime(entry.createdAt)}</span>
                    {entry.dueDate && entry.status === 'PENDING' && (
                        <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${new Date(entry.dueDate) < new Date()
                            ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                            }`}>
                            Due {formatDate(entry.dueDate)}
                        </span>
                    )}
                    {entry.status === 'PAID' && entry.type === 'CREDIT' && (
                        <span className="text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full">Paid</span>
                    )}
                </div>
            </div>

            {/* Amount */}
            <div className="text-right flex-shrink-0">
                {entry.type !== 'NOTE' && (
                    <p className={`font-bold text-sm ${isCredit ? 'text-red-600' : 'text-green-600'}`}>
                        {isCredit ? '+' : '-'}₹{entry.amount?.toFixed(2)}
                    </p>
                )}
                {/* Menu */}
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen(m => !m)}
                        className="text-slate-300 hover:text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="12" cy="19" r="1.5" />
                        </svg>
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-6 bg-white shadow-xl rounded-xl border border-slate-100 z-20 py-1 min-w-[130px]">
                            <button onClick={() => { onEdit(entry); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 text-slate-700">✏️ Edit</button>
                            {entry.type === 'CREDIT' && entry.status !== 'PAID' && (
                                <button onClick={() => { onMarkPaid(entry); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 text-green-700">✅ Mark Paid</button>
                            )}
                            <button onClick={() => { onDelete(entry); setMenuOpen(false); }} className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 text-red-600">🗑 Delete</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// ─── History Tab ─────────────────────────────────────────────────────────────

const HistoryTab = ({ entries }) => {
    const [dateRange, setDateRange] = useState('all');
    const [search, setSearch] = useState('');

    // Filter by date range + search
    const filtered = useMemo(() => {
        // DEBUG: trace exactly what arrives
        console.log('[HistoryTab] entries.length =', entries.length);
        if (entries.length > 0) {
            console.log('[HistoryTab] first entry sample =', JSON.stringify(entries[0]));
        }
        const rangeStart = getRangeStart(dateRange);
        console.log('[HistoryTab] rangeStart =', rangeStart, 'dateRange =', dateRange);
        const result = [...entries]
            .filter(e => e.createdAt != null && (rangeStart === 0 || e.createdAt >= rangeStart))
            .filter(e => !search || e.description?.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
        console.log('[HistoryTab] filtered.length =', result.length);
        return result;
    }, [entries, dateRange, search]);

    // Compute running balance (oldest → newest)
    const rows = useMemo(() => {
        let bal = 0;
        return filtered.map(e => {
            if (e.type === 'CREDIT') bal += e.amount || 0;
            else if (e.type === 'DEBIT') bal -= e.amount || 0;
            return { ...e, runningBalance: bal };
        });
    }, [filtered]);

    // Summary stats
    const totalCredit = filtered.filter(e => e.type === 'CREDIT').reduce((s, e) => s + (e.amount || 0), 0);
    const totalDebit = filtered.filter(e => e.type === 'DEBIT').reduce((s, e) => s + (e.amount || 0), 0);
    const net = totalCredit - totalDebit;

    return (
        <div className="flex flex-col gap-4">
            {/* Date Range Filters */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {DATE_RANGES.map(r => (
                    <button
                        key={r.value}
                        onClick={() => setDateRange(r.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 ${dateRange === r.value
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                            }`}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Search */}
            <div className="relative">
                <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                    type="text"
                    placeholder="Search entries..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                />
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2">
                <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                    <p className="text-xs text-red-400 font-medium mb-0.5">Credit Given</p>
                    <p className="text-base font-bold text-red-600">₹{totalCredit.toFixed(0)}</p>
                </div>
                <div className={`rounded-xl p-3 text-center border ${net > 0 ? 'bg-red-50 border-red-100' : net < 0 ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                    <p className={`text-xs font-medium mb-0.5 ${net > 0 ? 'text-red-400' : net < 0 ? 'text-green-400' : 'text-slate-400'}`}>Net Balance</p>
                    <p className={`text-base font-bold ${net > 0 ? 'text-red-600' : net < 0 ? 'text-green-600' : 'text-slate-600'}`}>
                        {net > 0 ? '+' : ''}₹{Math.abs(net).toFixed(0)}
                    </p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                    <p className="text-xs text-green-400 font-medium mb-0.5">Payments</p>
                    <p className="text-base font-bold text-green-600">₹{totalDebit.toFixed(0)}</p>
                </div>
            </div>

            {/* Ledger Table */}
            {rows.length === 0 ? (
                <div className="text-center py-14">
                    <div className="text-5xl mb-3">🔍</div>
                    <p className="text-slate-600 font-semibold">No entries found</p>
                    <p className="text-slate-400 text-sm mt-1">
                        {search ? 'Try a different keyword' : 'No transactions in this period'}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-2 bg-slate-50 border-b border-slate-100 gap-3">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Description</p>
                        <p className="text-xs font-semibold text-red-400 uppercase tracking-wide text-right">Credit</p>
                        <p className="text-xs font-semibold text-green-400 uppercase tracking-wide text-right">Payment</p>
                        <p className="text-xs font-semibold text-indigo-400 uppercase tracking-wide text-right">Balance</p>
                    </div>

                    {/* Rows */}
                    <div className="divide-y divide-slate-50">
                        {rows.map((entry, idx) => {
                            const isCredit = entry.type === 'CREDIT';
                            const isDebit = entry.type === 'DEBIT';
                            const balPositive = entry.runningBalance > 0;
                            return (
                                <div
                                    key={entry.id}
                                    className="grid grid-cols-[1fr_auto_auto_auto] items-center px-4 py-3 hover:bg-slate-50 transition-colors gap-3"
                                >
                                    {/* Left: Description + date */}
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-sm">{isCredit ? '📦' : isDebit ? '💵' : '📝'}</span>
                                            <p className="text-sm font-medium text-slate-800 truncate">{entry.description || '—'}</p>
                                        </div>
                                        <p className="text-xs text-slate-400 mt-0.5">{formatDateTime(entry.createdAt)}</p>
                                        {entry.status === 'PAID' && entry.type === 'CREDIT' && (
                                            <span className="inline-block text-xs bg-green-100 text-green-600 px-1.5 py-0.5 rounded-full mt-0.5">Paid</span>
                                        )}
                                        {entry.dueDate && entry.status === 'PENDING' && (
                                            <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full mt-0.5 font-medium ${new Date(entry.dueDate) < new Date() ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}>
                                                Due {formatDate(entry.dueDate)}
                                            </span>
                                        )}
                                    </div>

                                    {/* Credit */}
                                    <p className={`text-sm font-semibold text-right ${isCredit ? 'text-red-600' : 'text-slate-200'}`}>
                                        {isCredit ? `₹${entry.amount?.toFixed(2)}` : '—'}
                                    </p>

                                    {/* Payment/Debit */}
                                    <p className={`text-sm font-semibold text-right ${isDebit ? 'text-green-600' : 'text-slate-200'}`}>
                                        {isDebit ? `₹${entry.amount?.toFixed(2)}` : '—'}
                                    </p>

                                    {/* Running balance */}
                                    <div className="text-right">
                                        <span className={`text-sm font-bold px-2 py-0.5 rounded-lg ${balPositive
                                            ? 'bg-red-50 text-red-600'
                                            : entry.runningBalance < 0
                                                ? 'bg-green-50 text-green-600'
                                                : 'bg-slate-50 text-slate-500'
                                            }`}>
                                            ₹{Math.abs(entry.runningBalance).toFixed(0)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Legend footer */}
                    <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-xs text-slate-400">
                            <span><span className="text-red-500 font-semibold">Balance (red)</span> = Customer owes you</span>
                            <span>·</span>
                            <span><span className="text-green-500 font-semibold">Balance (green)</span> = You owe customer</span>
                        </div>
                        <span className="text-xs text-slate-400">{rows.length} entries</span>
                    </div>
                </div>
            )}
        </div>
    );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const CustomerKhata = () => {
    const { customerId } = useParams();
    const navigate = useNavigate();
    const { currentUser, merchantData } = useAuth();

    const [customer, setCustomer] = useState(null);
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [entryLoading, setEntryLoading] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingEntry, setEditingEntry] = useState(null);
    const [cycleView, setCycleView] = useState('All');
    const [confirmDelete, setConfirmDelete] = useState(null);
    const [toast, setToast] = useState('');
    const [activeTab, setActiveTab] = useState('entries'); // 'entries' | 'history'
    const [paymentModalOpen, setPaymentModalOpen] = useState(false);

    useEffect(() => {
        if (!customerId || !currentUser?.uid) return;
        getCustomer(customerId).then(r => {
            if (r.success) setCustomer(r.data);
        });
        const unsub = subscribeEntries(currentUser.uid, customerId, (r) => {
            console.log('[CustomerKhata] subscribeEntries response:', r.success, 'count:', r.data?.length, 'error:', r.error);
            if (r.success) setEntries(r.data);
            else console.warn('subscribeEntries error:', r.error);
            setLoading(false);
        });
        return () => unsub();
    }, [customerId, currentUser?.uid]);

    const refreshCustomer = async () => {
        const r = await getCustomer(customerId);
        if (r.success) setCustomer(r.data);
    };

    const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 2500);
    };

    const handleSaveEntry = async (data) => {
        setEntryLoading(true);
        let result;
        if (editingEntry) {
            result = await updateEntry(editingEntry.id, customerId, editingEntry, data);
        } else {
            result = await addEntry(currentUser.uid, customerId, data);
        }
        setEntryLoading(false);
        if (result.success) {
            setModalOpen(false);
            setEditingEntry(null);
            showToast(editingEntry ? '✅ Entry updated' : '✅ Entry added');
            const r = await getCustomer(customerId);
            if (r.success) setCustomer(r.data);
        }
    };

    const handleDelete = async (entry) => {
        await deleteEntry(entry.id, customerId, entry);
        const r = await getCustomer(customerId);
        if (r.success) setCustomer(r.data);
        setConfirmDelete(null);
        showToast('🗑 Entry deleted');
    };

    const handleMarkPaid = async (entry) => {
        const { markEntryPaid } = await import('../services/khata.service');
        await markEntryPaid(entry.id, customerId);
        showToast('✅ Marked as paid');
    };

    const grouped = groupEntries(entries, cycleView);

    if (!customer && !loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-slate-600">Customer not found</p>
                    <button onClick={() => navigate('/khata')} className="mt-4 btn-primary">Back to Khata Book</button>
                </div>
            </div>
        );
    }

    const balance = customer?.totalBalance || 0;
    const initials = (customer?.name || 'C').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const color = customer?.avatarColor || getAvatarColor(customer?.name || '');

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
            {/* Toast */}
            {toast && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-slate-800 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-xl animate-fade-in">
                    {toast}
                </div>
            )}

            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
                    <button onClick={() => navigate('/khata')} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: color }}>
                            {initials}
                        </div>
                        <div>
                            <p className="font-semibold text-slate-800 text-sm leading-none">{customer?.name || '...'}</p>
                            <p className="text-xs text-slate-400">{customer?.phone}</p>
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-1">
                        {/* Collect Payment */}
                        <button
                            onClick={() => setPaymentModalOpen(true)}
                            title="Collect Payment"
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold shadow hover:shadow-md transition-all"
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            Collect
                        </button>
                        {customer?.phone && (
                            <button
                                onClick={() => sendWhatsAppReminder(customer, merchantData?.shopName || 'Merchant')}
                                title="WhatsApp Reminder"
                                className="p-2 rounded-full hover:bg-green-50 text-green-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                </svg>
                            </button>
                        )}
                        <button
                            onClick={() => exportKhataCSV(customer, entries)}
                            title="Export CSV"
                            className="p-2 rounded-full hover:bg-blue-50 text-blue-600 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                        <button
                            onClick={() => navigate(`/khata/edit/${customerId}`)}
                            title="Edit Customer"
                            className="p-2 rounded-full hover:bg-slate-100 text-slate-500 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pb-28">
                {/* Balance Card */}
                <div className={`mt-4 rounded-2xl p-5 text-white shadow-lg mb-4 ${balance > 0
                    ? 'bg-gradient-to-br from-red-500 to-red-700'
                    : balance < 0
                        ? 'bg-gradient-to-br from-green-500 to-green-700'
                        : 'bg-gradient-to-br from-slate-500 to-slate-700'
                    }`}>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-white/70 text-sm mb-1">
                                {balance > 0 ? 'Customer owes you' : balance < 0 ? 'You owe customer' : 'All settled up!'}
                            </p>
                            <p className="text-3xl font-bold">₹{Math.abs(balance).toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-white/20">
                                {customer?.khataType === 'daily' ? '📅 Daily' :
                                    customer?.khataType === 'weekly' ? '📆 Weekly' : '🗓 Monthly'} Khata
                            </span>
                        </div>
                    </div>
                    <div className="flex gap-6 mt-4 pt-4 border-t border-white/20">
                        <div>
                            <p className="text-white/60 text-xs">Total Credit</p>
                            <p className="font-semibold">₹{(customer?.totalCredit || 0).toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-white/60 text-xs">Total Paid</p>
                            <p className="font-semibold">₹{(customer?.totalDebit || 0).toFixed(2)}</p>
                        </div>
                        {customer?.creditLimit > 0 && (
                            <div>
                                <p className="text-white/60 text-xs">Credit Limit</p>
                                <p className="font-semibold">₹{customer.creditLimit.toFixed(2)}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── TAB SWITCHER ── */}
                <div className="flex bg-slate-100 p-1 rounded-xl mb-4 gap-1">
                    <button
                        onClick={() => setActiveTab('entries')}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-all ${activeTab === 'entries'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Entries
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-all ${activeTab === 'history'
                            ? 'bg-white text-indigo-600 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        History
                    </button>
                </div>

                {/* LOADING */}
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : activeTab === 'history' ? (
                    /* ── HISTORY TAB ── */
                    <HistoryTab entries={entries} />
                ) : (
                    /* ── ENTRIES TAB ── */
                    <>
                        {/* Cycle View Tabs */}
                        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-4">
                            {CYCLE_VIEWS.map(view => (
                                <button
                                    key={view}
                                    onClick={() => setCycleView(view)}
                                    className={`flex-1 text-xs font-semibold py-2 rounded-lg transition-all ${cycleView === view
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                >
                                    {view}
                                </button>
                            ))}
                        </div>

                        {/* Entries */}
                        {entries.length === 0 ? (
                            <div className="text-center py-16">
                                <div className="text-5xl mb-3">📋</div>
                                <p className="text-slate-600 font-semibold">No entries yet</p>
                                <p className="text-slate-400 text-sm mt-1">Tap + to add the first entry</p>
                            </div>
                        ) : grouped.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-slate-500">No entries for this view</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {grouped.map(({ label, items }) => {
                                    const groupCredit = items.filter(e => e.type === 'CREDIT').reduce((s, e) => s + (e.amount || 0), 0);
                                    const groupDebit = items.filter(e => e.type === 'DEBIT').reduce((s, e) => s + (e.amount || 0), 0);
                                    return (
                                        <div key={label} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                            {/* Group Header */}
                                            <div className="px-4 py-2 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
                                                <div className="flex gap-3 text-xs">
                                                    {groupCredit > 0 && <span className="text-red-500 font-semibold">+₹{groupCredit.toFixed(0)}</span>}
                                                    {groupDebit > 0 && <span className="text-green-500 font-semibold">-₹{groupDebit.toFixed(0)}</span>}
                                                </div>
                                            </div>
                                            <div className="divide-y divide-slate-50">
                                                {items.map(entry => (
                                                    <EntryRow
                                                        key={entry.id}
                                                        entry={entry}
                                                        onEdit={(e) => { setEditingEntry(e); setModalOpen(true); }}
                                                        onDelete={(e) => setConfirmDelete(e)}
                                                        onMarkPaid={handleMarkPaid}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Add Entry FAB */}
            <button
                onClick={() => { setEditingEntry(null); setModalOpen(true); }}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-xl text-2xl flex items-center justify-center hover:scale-110 transition-transform z-30"
            >
                +
            </button>

            {/* Entry Modal */}
            <KhataEntryModal
                open={modalOpen}
                onClose={() => { setModalOpen(false); setEditingEntry(null); }}
                onSave={handleSaveEntry}
                editEntry={editingEntry}
                loading={entryLoading}
            />

            {/* Collect Payment Modal */}
            <KhataPaymentModal
                open={paymentModalOpen}
                onClose={() => setPaymentModalOpen(false)}
                customer={customer}
                merchantData={merchantData}
                merchantId={currentUser?.uid}
                onSuccess={() => { refreshCustomer(); showToast('✅ Payment recorded'); }}
            />

            {/* Delete Confirm */}
            {confirmDelete && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-xs w-full shadow-2xl">
                        <p className="font-bold text-slate-800 mb-1">Delete Entry?</p>
                        <p className="text-sm text-slate-500 mb-5">"{confirmDelete.description}" will be removed and balance will be reversed.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setConfirmDelete(null)} className="flex-1 btn-secondary py-2">Cancel</button>
                            <button onClick={() => handleDelete(confirmDelete)} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerKhata;
