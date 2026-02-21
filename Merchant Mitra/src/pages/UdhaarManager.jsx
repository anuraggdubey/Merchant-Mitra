import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllTransactions } from '../services/transaction.service';

const UdhaarManager = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const [udhaarList, setUdhaarList] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUdhaarData();
    }, [currentUser]);

    const loadUdhaarData = async () => {
        setLoading(true);
        try {
            const result = await getAllTransactions(currentUser.uid);
            if (result.success) {
                // Calculate Udhaar balances by customer
                const balances = {};

                result.data.forEach(txn => {
                    // Normalize identifier: Phone is primary, fallback to Name
                    let identifier = txn.customerPhone || txn.customerName;

                    // If both are missing, use a generic identifier so we don't lose the record
                    if (!identifier) {
                        identifier = `unknown_${txn.id}`; // Unique ID for unknown to avoid merging unrelated unknowns (or maybe merge them? merging 'Unknown' is usually better for 'General Udhaar')
                        // Let's merge all unknowns for now or keep separate? 
                        // Merging all unknowns might be confusing if they are different people.
                        // But for now, let's just ensure they show up. 
                        // If we use txn.id, they will be separate entries "Unknown".
                        // Let's try to group them under 'Unknown' generally if neither exists?
                        // Actually, better to just use 'Unknown Customer' as key.
                        identifier = 'Unknown Customer';
                    }

                    if (!balances[identifier]) {
                        balances[identifier] = {
                            name: txn.customerName || 'Unknown Customer',
                            phone: txn.customerPhone || '',
                            balance: 0,
                            lastTxnDate: 0
                        };
                    }

                    // Logic: 
                    // UDHAAR_GIVEN (You gave goods on credit) -> +Amount (Customer owes you)
                    // UDHAAR_RECEIVED (Customer paid back udhaar) -> -Amount (Debt reduces)
                    if (txn.type === 'UDHAAR_GIVEN') {
                        balances[identifier].balance += Math.abs(txn.amount);
                    } else if (txn.type === 'UDHAAR_RECEIVED') {
                        balances[identifier].balance -= Math.abs(txn.amount);
                    }

                    if (txn.createdAt > balances[identifier].lastTxnDate) {
                        balances[identifier].lastTxnDate = txn.createdAt;
                    }
                });

                // Filter out zero balances and convert to array
                const list = Object.values(balances)
                    .filter(item => Math.abs(item.balance) > 0)
                    .sort((a, b) => b.balance - a.balance); // Sort by highest amount owed to me

                setUdhaarList(list);
            }
        } catch (error) {
            console.error('Load udhaar data error:', error);
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 py-4 flex items-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="mr-3 p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-6 h-6 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">Manage Udhaar</h1>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6">
                {/* Total Stats */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl shadow-lg p-6 mb-8 text-white">
                    <h2 className="text-sm font-medium text-blue-100 mb-1">Total Udhaar to Collect</h2>
                    <div className="text-3xl font-bold">
                        ₹ {udhaarList.reduce((sum, item) => sum + (item.balance > 0 ? item.balance : 0), 0).toFixed(2)}
                    </div>
                </div>

                {/* List */}
                <h3 className="text-lg font-bold text-slate-800 mb-4">Customer List</h3>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600 mb-2"></div>
                    </div>
                ) : udhaarList.length > 0 ? (
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 divide-y divide-slate-100">
                        {udhaarList.map((item, idx) => (
                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold">
                                        {item.name ? item.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                    <div>
                                        <div className="font-semibold text-slate-800">{item.name || 'Unknown'}</div>
                                        <div className="text-xs text-slate-500">{item.phone}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`font-bold ${item.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                        {item.balance > 0 ? 'To Collect' : 'To Pay'}
                                    </div>
                                    <div className="text-lg">₹ {Math.abs(item.balance).toFixed(2)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                        <p className="text-slate-500">No active Udhaar accounts found.</p>
                        <button
                            onClick={() => navigate('/add-transaction')}
                            className="mt-4 text-primary-600 font-medium hover:underline"
                        >
                            Give Udhaar to start
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default UdhaarManager;
