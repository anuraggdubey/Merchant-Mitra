import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getDashboardStats } from '../services/merchant.service';
import { getRecentTransactions, searchTransactions, exportTransactionsCSV, getAllTransactions } from '../services/transaction.service';
import StatsCard from '../components/StatsCard';
import TransactionItem from '../components/TransactionItem';
import TransactionDetailsModal from '../components/TransactionDetailsModal';
import AIInsightsWidget from '../components/AIInsightsWidget';
import LanguageSelector from '../components/LanguageSelector';
import { formatCurrency, getInitials } from '../utils/formatters';

const Dashboard = () => {
    const navigate = useNavigate();
    const { currentUser, merchantData, logout } = useAuth();
    const { t, language } = useLanguage();
    const [stats, setStats] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    useEffect(() => {
        loadDashboardData();
    }, [currentUser]);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            const statsResult = await getDashboardStats(currentUser.uid);
            if (statsResult.success) {
                setStats(statsResult.data);
            }
            const txnResult = await getRecentTransactions(currentUser.uid, 10);
            if (txnResult.success) {
                setTransactions(txnResult.data);
            }
        } catch (error) {
            console.error('Load dashboard error:', error);
        }
        setLoading(false);
    };

    const handleSearch = async (query) => {
        setSearchQuery(query);
        if (query.trim() === '') {
            loadDashboardData();
            return;
        }
        const result = await searchTransactions(currentUser.uid, query);
        if (result.success) {
            setTransactions(result.data);
        }
    };

    const handleExport = async () => {
        const result = await getAllTransactions(currentUser.uid);
        if (result.success) {
            exportTransactionsCSV(result.data);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleTransactionClick = (txn) => {
        setSelectedTransaction(txn);
    };

    const handleTransactionUpdate = () => {
        loadDashboardData();
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-600 mb-4"></div>
                    <p className="text-slate-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-4">
                    <div className="flex items-center justify-between gap-2">
                        {/* Left: Avatar + Name */}
                        <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
                            <div className="w-9 h-9 sm:w-12 sm:h-12 flex-shrink-0 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm sm:text-lg shadow-lg">
                                {getInitials(merchantData?.shopName || 'M')}
                            </div>
                            <div className="min-w-0">
                                <h1 className="text-base sm:text-xl font-bold text-slate-800 truncate max-w-[140px] xs:max-w-[180px] sm:max-w-xs">
                                    {merchantData?.shopName || 'Merchant Dashboard'}
                                </h1>
                                <p className="text-xs text-slate-500 truncate">{merchantData?.category || 'Business'}</p>
                            </div>
                        </div>

                        {/* Right: Language + Logout */}
                        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
                            <LanguageSelector />
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="flex items-center gap-1.5 px-2 sm:px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 active:scale-95 rounded-lg transition-all"
                                title="Logout"
                            >
                                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                <span className="hidden sm:inline">{t('logout')}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

                {/* AI Insights Widget */}
                <AIInsightsWidget transactions={transactions} />

                {/* Stats Cards — 2 cols on mobile, 4 on desktop */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                    <StatsCard
                        icon={
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        title={t('todays_sales')}
                        value={formatCurrency(stats?.todaySales || 0)}
                        previousValue={stats?.yesterdaySales}
                        color="primary"
                        trend="vs yesterday"
                    />

                    <StatsCard
                        icon={
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        }
                        title={t('total_transactions')}
                        value={stats?.totalTransactions || 0}
                        previousValue={stats?.yesterdayTransactions}
                        color="green"
                        trend="vs yesterday"
                    />

                    <StatsCard
                        icon={
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        title={t('pending_payments')}
                        value={`${stats?.pendingPayments || 0}`}
                        color="amber"
                    />

                    <StatsCard
                        icon={
                            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                            </svg>
                        }
                        title={t('this_month')}
                        value={formatCurrency(stats?.monthRevenue || 0)}
                        previousValue={stats?.lastMonthRevenue}
                        color="purple"
                        trend="vs last month"
                    />
                </div>

                {/* Quick Actions */}
                <div className="mb-6 sm:mb-8">
                    <h2 className="text-base sm:text-lg font-bold text-slate-800 mb-3 sm:mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
                        {[
                            { icon: '💰', label: t('collect_payment'), action: () => navigate('/collect-payment') },
                            { icon: '➕', label: t('add_transaction'), action: () => navigate('/add-transaction') },
                            { icon: '📒', label: 'Khata Book', action: () => navigate('/khata') },
                            { icon: '📊', label: t('view_all'), action: () => navigate('/transactions') },
                            { icon: '📝', label: t('manage_udhaar'), action: () => navigate('/udhaar') },
                            { icon: '⚙️', label: t('settings'), action: () => navigate('/profile-setup') }
                        ].map((item, idx) => (
                            <button
                                key={idx}
                                onClick={item.action}
                                className="glass-card p-2 sm:p-4 hover:shadow-xl active:scale-95 transition-all duration-200 text-center"
                            >
                                <div className="text-xl sm:text-3xl mb-1 sm:mb-2">{item.icon}</div>
                                <p className="text-[9px] sm:text-xs font-medium text-slate-700 leading-tight">{item.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="glass-card p-4 sm:p-6">
                    {/* Stack on mobile, row on sm+ */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
                        <h2 className="text-base sm:text-lg font-bold text-slate-800">{t('recent_transactions')}</h2>
                        <div className="relative w-full sm:w-64">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search transactions..."
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all text-sm"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {transactions.length > 0 ? (
                        <div className="space-y-2">
                            {transactions.map((txn) => (
                                <TransactionItem
                                    key={txn.id}
                                    transaction={txn}
                                    onClick={handleTransactionClick}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 sm:py-12">
                            <svg className="w-12 h-12 sm:w-16 sm:h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-slate-500 font-medium">No transactions found</p>
                            <p className="text-sm text-slate-400 mt-1">Start by collecting your first payment!</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Logout Confirmation Modal — slides up from bottom on mobile */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-slide-up sm:animate-none">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Confirm Logout</h3>
                        <p className="text-slate-600 mb-6">Are you sure you want to logout?</p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-2.5 border-2 border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 active:scale-95 transition-all"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 active:scale-95 transition-all"
                            >
                                {t('logout')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Transaction Details Modal */}
            {selectedTransaction && (
                <TransactionDetailsModal
                    transaction={selectedTransaction}
                    onClose={() => setSelectedTransaction(null)}
                    onUpdate={handleTransactionUpdate}
                />
            )}
        </div>
    );
};

export default Dashboard;
