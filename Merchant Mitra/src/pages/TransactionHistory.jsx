import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllTransactions, filterTransactions, exportTransactionsCSV } from '../services/transaction.service';
import TransactionItem from '../components/TransactionItem';
import TransactionDetailsModal from '../components/TransactionDetailsModal';
import LanguageSelector from '../components/LanguageSelector';

const TransactionHistory = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({ type: 'ALL', status: 'ALL' });
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTransaction, setSelectedTransaction] = useState(null);

    useEffect(() => {
        loadTransactions();
    }, [currentUser, filter]);

    const loadTransactions = async () => {
        setLoading(true);
        try {
            const result = await filterTransactions(currentUser.uid, filter);
            if (result.success) {
                setTransactions(result.data);
            }
        } catch (error) {
            console.error('Load transactions error:', error);
        }
        setLoading(false);
    };

    const handleSearch = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleTransactionClick = (txn) => {
        setSelectedTransaction(txn);
    };

    const handleTransactionUpdate = () => {
        loadTransactions(); // Refresh list after status update
    };

    const filteredAndSearchedTransactions = transactions.filter(txn =>
        txn.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.customerPhone?.includes(searchTerm) ||
        txn.amount?.toString().includes(searchTerm)
    );

    const handleExport = () => {
        exportTransactionsCSV(filteredAndSearchedTransactions);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center">
                        <button
                            onClick={() => navigate('/dashboard')}
                            className="mr-3 p-2 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-bold text-slate-800">Transaction History</h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <LanguageSelector />
                        <button
                            onClick={handleExport}
                            className="flex items-center text-primary-600 font-medium text-sm hover:text-primary-700"
                        >
                            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Export CSV
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Filters */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search Name, Phone, Amount..."
                                value={searchTerm}
                                onChange={handleSearch}
                                className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                            />
                            <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>

                        {/* Type Filter */}
                        <select
                            value={filter.type}
                            onChange={(e) => setFilter({ ...filter, type: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        >
                            <option value="ALL">All Types</option>
                            <option value="SALE">Sales (In)</option>
                            <option value="EXPENSE">Expenses (Out)</option>
                            <option value="UDHAAR_GIVEN">Udhaar Given</option>
                            <option value="UDHAAR_RECEIVED">Udhaar Received</option>
                        </select>

                        {/* Status Filter */}
                        <select
                            value={filter.status}
                            onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                        >
                            <option value="ALL">All Status</option>
                            <option value="SUCCESS">Success</option>
                            <option value="PENDING">Pending</option>
                            <option value="WAITING_FOR_SMS">Verifying</option>
                            <option value="FAILED">Failed</option>
                        </select>
                    </div>
                </div>

                {/* List */}
                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mb-2"></div>
                        <p className="text-slate-500 text-sm">Loading transactions...</p>
                    </div>
                ) : filteredAndSearchedTransactions.length > 0 ? (
                    <div className="space-y-3">
                        {filteredAndSearchedTransactions.map((txn) => (
                            <TransactionItem
                                key={txn.id}
                                transaction={txn}
                                onClick={handleTransactionClick}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                        No transactions found matching your filters.
                    </div>
                )}
            </div>

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

export default TransactionHistory;
