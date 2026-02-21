import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getCustomer, subscribeEntries, addEntry, updateEntry, deleteEntry,
    sendWhatsAppReminder, exportKhataCSV, updateCustomer
} from '../services/khata.service';
import KhataEntryModal from '../components/KhataEntryModal';
import { getAvatarColor } from '../components/CustomerCard';

const CYCLE_VIEWS = ['All', 'Daily', 'Weekly', 'Monthly'];

const formatDate = (ts) => {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (ts) => {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
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

    useEffect(() => {
        if (!customerId) return;
        getCustomer(customerId).then(r => {
            if (r.success) setCustomer(r.data);
        });
        const unsub = subscribeEntries(customerId, (r) => {
            if (r.success) setEntries(r.data);
            setLoading(false);
        });
        return () => unsub();
    }, [customerId]);

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
            // Refresh customer balance display
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

    // Running balance for full view
    const runningBalances = (() => {
        const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);
        let bal = 0;
        const map = {};
        sorted.forEach(e => {
            if (e.type === 'CREDIT') bal += e.amount || 0;
            else if (e.type === 'DEBIT') bal -= e.amount || 0;
            map[e.id] = bal;
        });
        return map;
    })();

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
                            <span className={`text-xs font-semibold px-2 py-1 rounded-full ${customer?.khataType === 'daily' ? 'bg-white/20' :
                                    customer?.khataType === 'weekly' ? 'bg-white/20' : 'bg-white/20'
                                }`}>
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
                {loading ? (
                    <div className="flex justify-center py-10">
                        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                    </div>
                ) : entries.length === 0 ? (
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
