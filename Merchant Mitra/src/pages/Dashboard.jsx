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
            // Load stats
            const statsResult = await getDashboardStats(currentUser.uid);
            if (statsResult.success) {
                setStats(statsResult.data);
            }

            // Load recent transactions
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
        loadDashboardData(); // Refresh data after update
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
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            {/* Profile Avatar */}
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {getInitials(merchantData?.shopName || 'M')}
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-slate-800">
                                    {merchantData?.shopName || 'Merchant Dashboard'}
                                </h1>
                                <p className="text-sm text-slate-500">{merchantData?.category || 'Business'}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            {/* Language Selector */}
                            <LanguageSelector />
                            {/* Debug: explicit lang code */}
                            <span className="text-xs text-slate-400 font-mono hidden">{t('voice_language')}: {language}</span>

                            {/* Logout Button */}
                            <button
                                onClick={() => setShowLogoutConfirm(true)}
                                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                                {t('logout')}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* AI Insights Widget */}
                <AIInsightsWidget transactions={transactions} />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatsCard
                        icon={
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        }
                        title={t('pending_payments')}
                        value={`${stats?.pendingPayments || 0} (${formatCurrency(stats?.pendingAmount || 0)})`}
                        color="amber"
                    />

                    <StatsCard
                        icon={
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
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
                                className="glass-card p-4 hover:shadow-xl transition-all duration-200 text-center"
                            >
                                <div className="text-3xl mb-2">{item.icon}</div>
                                <p className="text-xs font-medium text-slate-700">{item.label}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-slate-800">{t('recent_transactions')}</h2>

                        {/* Search Bar */}
                        <div className="relative">
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search transactions..."
                                className="pl-10 pr-4 py-2 border-2 border-slate-300 rounded-lg focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Transactions List */}
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
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 text-slate-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-slate-500 font-medium">No transactions found</p>
                            <p className="text-sm text-slate-400 mt-1">Start by collecting your first payment!</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Logout Confirmation Modal */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Confirm Logout</h3>
                        <p className="text-slate-600 mb-6">Are you sure you want to logout?</p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 px-4 py-2 border-2 border-slate-300 rounded-lg font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleLogout}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
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
