import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { subscribeCustomers, getKhataStats, deleteCustomer } from '../services/khata.service';
import CustomerCard from '../components/CustomerCard';

const SORT_OPTIONS = [
    { value: 'updated', label: 'Recently Active' },
    { value: 'balance_high', label: 'Highest Balance' },
    { value: 'balance_low', label: 'Lowest Balance' },
    { value: 'name', label: 'Name (A-Z)' },
];

const FILTER_TYPES = ['All', 'daily', 'weekly', 'monthly'];

const KhataBook = () => {
    const navigate = useNavigate();
    const { currentUser, merchantData } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [stats, setStats] = useState({ totalToCollect: 0, totalToPay: 0, customersCount: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [search, setSearch] = useState('');
    const [sortBy, setSortBy] = useState('updated');
    const [filterType, setFilterType] = useState('All');

    useEffect(() => {
        if (!currentUser) return;
        setLoading(true);
        setError('');

        const unsub = subscribeCustomers(currentUser.uid, (result) => {
            if (result.success) {
                setCustomers(result.data);
                // Calculate stats from live data
                let totalToCollect = 0, totalToPay = 0;
                result.data.forEach(c => {
                    if (c.totalBalance > 0) totalToCollect += c.totalBalance;
                    else if (c.totalBalance < 0) totalToPay += Math.abs(c.totalBalance);
                });
                setStats({ totalToCollect, totalToPay, customersCount: result.data.length });
                setError('');
            } else {
                console.error('Khata load error:', result.error);
                setError(result.error || 'Failed to load customers. Please try again.');
            }
            setLoading(false);
        });

        return () => unsub();
    }, [currentUser]);

    const filtered = customers
        .filter(c => {
            const matchSearch = !search ||
                c.name?.toLowerCase().includes(search.toLowerCase()) ||
                c.phone?.includes(search) ||
                c.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()));
            const matchType = filterType === 'All' || c.khataType === filterType;
            return matchSearch && matchType;
        })
        .sort((a, b) => {
            if (sortBy === 'updated') return (b.updatedAt || 0) - (a.updatedAt || 0);
            if (sortBy === 'balance_high') return Math.abs(b.totalBalance || 0) - Math.abs(a.totalBalance || 0);
            if (sortBy === 'balance_low') return Math.abs(a.totalBalance || 0) - Math.abs(b.totalBalance || 0);
            if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
            return 0;
        });

    const net = stats.totalToCollect - stats.totalToPay;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-20">
                <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-800">📒 Khata Book</h1>
                        <p className="text-xs text-slate-400">{stats.customersCount} customers</p>
                    </div>
                    <button
                        onClick={() => navigate('/khata/add')}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        + Add
                    </button>
                </div>
            </div>

            <div className="max-w-2xl mx-auto px-4 pb-24">
                {/* Stats Banner */}
                <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3 mb-5">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                        <p className="text-xs text-slate-500 mb-1">To Collect</p>
                        <p className="text-lg font-bold text-red-600">₹{stats.totalToCollect.toFixed(0)}</p>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl p-4 shadow-lg text-center">
                        <p className="text-xs text-indigo-200 mb-1">Net Balance</p>
                        <p className="text-lg font-bold text-white">
                            {net >= 0 ? '+' : '-'}₹{Math.abs(net).toFixed(0)}
                        </p>
                    </div>
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 text-center">
                        <p className="text-xs text-slate-500 mb-1">To Pay</p>
                        <p className="text-lg font-bold text-green-600">₹{stats.totalToPay.toFixed(0)}</p>
                    </div>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search by name, phone or tag..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition-all"
                    />
                </div>

                {/* Filters + Sort */}
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
                    {FILTER_TYPES.map(type => (
                        <button
                            key={type}
                            onClick={() => setFilterType(type)}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${filterType === type
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'
                                }`}
                        >
                            {type === 'All' ? '🗂 All' : type === 'daily' ? '📅 Daily' : type === 'weekly' ? '📆 Weekly' : '🗓 Monthly'}
                        </button>
                    ))}
                    <div className="ml-auto flex-shrink-0">
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white text-slate-600 outline-none"
                        >
                            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="flex flex-col gap-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-2xl h-20 animate-pulse border border-slate-100" />
                        ))}
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <div className="text-5xl mb-4">⚠️</div>
                        <p className="text-red-600 font-semibold text-base mb-2">Could not load customers</p>
                        <p className="text-slate-400 text-sm mb-1">{error}</p>
                        <p className="text-slate-400 text-xs">Check your internet connection and try reloading the page.</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📒</div>
                        <p className="text-slate-600 font-semibold text-lg">
                            {search ? 'No customers found' : 'No customers yet'}
                        </p>
                        <p className="text-slate-400 text-sm mt-1">
                            {search ? 'Try a different search' : 'Add your first customer to start a khata'}
                        </p>
                        {!search && (
                            <button
                                onClick={() => navigate('/khata/add')}
                                className="mt-6 btn-primary"
                            >
                                + Add First Customer
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filtered.map(customer => (
                            <CustomerCard
                                key={customer.id}
                                customer={customer}
                                onClick={(c) => navigate(`/khata/${c.id}`)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* FAB */}
            <button
                onClick={() => navigate('/khata/add')}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-full shadow-xl text-2xl flex items-center justify-center hover:scale-110 transition-transform z-30"
            >
                +
            </button>
        </div>
    );
};

export default KhataBook;
