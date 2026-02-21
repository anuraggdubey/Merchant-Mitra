import { collection, query, where, orderBy, limit, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Helper to convert Firestore timestamp to JS Date
const convertTimestamps = (data) => {
    return {
        ...data,
        createdAt: data.createdAt?.toMillis?.() || data.createdAt,
        updatedAt: data.updatedAt?.toMillis?.() || data.updatedAt
    };
};

// Add a new transaction
export const addTransaction = async (merchantId, transactionData) => {
    try {
        const docRef = await addDoc(collection(db, 'payments'), {
            merchantId,
            ...transactionData,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            source: 'MANUAL', // Differentiate from SMS auto-detected
            status: transactionData.status || 'SUCCESS' // Default to SUCCESS for manual entry unless specified
        });

        return {
            success: true,
            message: 'Transaction added successfully',
            id: docRef.id
        };
    } catch (error) {
        console.error('Add transaction error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Delete a transaction
export const deleteTransaction = async (transactionId) => {
    try {
        const { deleteDoc, doc } = await import('firebase/firestore');
        await deleteDoc(doc(db, 'payments', transactionId));
        return { success: true, message: 'Transaction deleted successfully' };
    } catch (error) {
        console.error('Delete transaction error:', error);
        return { success: false, error: error.message };
    }
};

// Get recent transactions
export const getRecentTransactions = async (merchantId, limitCount = 10) => {
    try {
        const q = query(
            collection(db, 'payments'),
            where('merchantId', '==', merchantId)
        );

        const querySnapshot = await getDocs(q);
        const transactions = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...convertTimestamps(doc.data()) });
        });

        // Client-side sort and limit
        transactions.sort((a, b) => b.createdAt - a.createdAt);

        return {
            success: true,
            data: transactions.slice(0, limitCount)
        };
    } catch (error) {
        console.error('Get recent transactions error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Search transactions (Client-side filtering for simplicity, can be optimized with compound indexes later)
export const searchTransactions = async (merchantId, searchQuery) => {
    try {
        // Fetch a reasonable amount of recent history to search within (e.g., last 100) or all depending on scale
        // For now, let's fetch last 100 and filter. For full search, we might need a dedicated search service or specific indexed queries.
        const q = query(
            collection(db, 'payments'),
            where('merchantId', '==', merchantId)
        );

        const querySnapshot = await getDocs(q);
        const transactions = [];
        const lowerOpenQuery = searchQuery.toLowerCase();

        querySnapshot.forEach((doc) => {
            const data = convertTimestamps(doc.data());
            const amount = data.amount?.toString() || '';
            const customerName = data.customerName?.toLowerCase() || '';
            const customerPhone = data.customerPhone || '';
            const utr = data.utr?.toLowerCase() || '';
            const note = data.note?.toLowerCase() || '';

            if (amount.includes(searchQuery) ||
                customerName.includes(lowerOpenQuery) ||
                customerPhone.includes(searchQuery) ||
                utr.includes(lowerOpenQuery) ||
                note.includes(lowerOpenQuery)) {
                transactions.push({ id: doc.id, ...data });
            }
        });

        return {
            success: true,
            data: transactions
        };
    } catch (error) {
        console.error('Search transactions error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Filter transactions
export const filterTransactions = async (merchantId, filters) => {
    try {
        let q = query(
            collection(db, 'payments'),
            where('merchantId', '==', merchantId)
        );

        // Note: Firestore has limitations on inequality filters with different fields.
        // We will fetch and filter in memory for advanced multi-field filtering not supported by simple composite indexes.

        const querySnapshot = await getDocs(q);
        let transactions = [];

        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...convertTimestamps(doc.data()) });
        });

        // Client-side sort
        transactions.sort((a, b) => b.createdAt - a.createdAt);

        if (filters.type && filters.type !== 'ALL') {
            transactions = transactions.filter(txn => txn.type === filters.type);
        }

        if (filters.status && filters.status !== 'ALL') {
            transactions = transactions.filter(txn => txn.status === filters.status);
        }

        if (filters.startDate) {
            transactions = transactions.filter(txn => txn.createdAt >= filters.startDate);
        }

        if (filters.endDate) {
            transactions = transactions.filter(txn => txn.createdAt <= filters.endDate);
        }

        if (filters.minAmount) {
            transactions = transactions.filter(txn => Math.abs(txn.amount) >= filters.minAmount);
        }

        if (filters.maxAmount) {
            transactions = transactions.filter(txn => Math.abs(txn.amount) <= filters.maxAmount);
        }

        return {
            success: true,
            data: transactions
        };
    } catch (error) {
        console.error('Filter transactions error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Get all transactions
export const getAllTransactions = async (merchantId) => {
    try {
        const q = query(
            collection(db, 'payments'),
            where('merchantId', '==', merchantId)
        );

        const querySnapshot = await getDocs(q);
        const transactions = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...convertTimestamps(doc.data()) });
        });

        // Client-side sort
        transactions.sort((a, b) => b.createdAt - a.createdAt);

        return {
            success: true,
            data: transactions
        };
    } catch (error) {
        console.error('Get all transactions error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Export transactions to CSV
export const exportTransactionsCSV = (transactions) => {
    try {
        const headers = ['Date', 'Time', 'Type', 'Customer', 'Phone', 'Amount', 'Status', 'UTR', 'Note'];
        const rows = transactions.map(txn => [
            new Date(txn.createdAt).toLocaleDateString('en-IN'),
            new Date(txn.createdAt).toLocaleTimeString('en-IN'),
            txn.type || 'SALE', // Default to SALE if undefined
            txn.customerName || 'N/A',
            txn.customerPhone || 'N/A',
            txn.amount,
            txn.status,
            txn.utr || 'N/A',
            txn.note || ''
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `transactions_${Date.now()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return { success: true };
    } catch (error) {
        console.error('Export CSV error:', error);
        return { success: false, error: error.message };
    }
};
