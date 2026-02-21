import {
    collection, doc, addDoc, getDoc, getDocs, updateDoc, deleteDoc,
    query, where, orderBy, onSnapshot, serverTimestamp, setDoc, writeBatch
} from 'firebase/firestore';
import { db } from '../config/firebase';

const CUSTOMERS_COL = 'customers';
const ENTRIES_COL = 'khataEntries';

// ─── CUSTOMER CRUD ──────────────────────────────────────────────────────────

export const addCustomer = async (merchantId, data) => {
    try {
        const docRef = await addDoc(collection(db, CUSTOMERS_COL), {
            merchantId,
            name: data.name,
            phone: data.phone || '',
            email: data.email || '',
            address: data.address || '',
            notes: data.notes || '',
            tags: data.tags || [],
            khataType: data.khataType || 'monthly', // 'daily' | 'weekly' | 'monthly'
            creditLimit: parseFloat(data.creditLimit) || 0,
            avatarColor: data.avatarColor || '#6366f1',
            totalBalance: 0, // positive = customer owes merchant
            totalCredit: 0,
            totalDebit: 0,
            isActive: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            lastEntryAt: null,
        });
        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Add customer error:', error);
        return { success: false, error: error.message };
    }
};

export const getCustomers = async (merchantId) => {
    try {
        const q = query(
            collection(db, CUSTOMERS_COL),
            where('merchantId', '==', merchantId),
            where('isActive', '==', true),
            orderBy('updatedAt', 'desc')
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return { success: true, data };
    } catch (error) {
        console.error('Get customers error:', error);
        return { success: false, error: error.message, data: [] };
    }
};

export const subscribeCustomers = (merchantId, callback) => {
    const q = query(
        collection(db, CUSTOMERS_COL),
        where('merchantId', '==', merchantId),
        where('isActive', '==', true),
        orderBy('updatedAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback({ success: true, data });
    }, (error) => {
        callback({ success: false, error: error.message, data: [] });
    });
};

export const getCustomer = async (customerId) => {
    try {
        const d = await getDoc(doc(db, CUSTOMERS_COL, customerId));
        if (!d.exists()) return { success: false, error: 'Customer not found' };
        return { success: true, data: { id: d.id, ...d.data() } };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const updateCustomer = async (customerId, data) => {
    try {
        await updateDoc(doc(db, CUSTOMERS_COL, customerId), {
            ...data,
            updatedAt: Date.now(),
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteCustomer = async (customerId) => {
    try {
        await updateDoc(doc(db, CUSTOMERS_COL, customerId), {
            isActive: false,
            updatedAt: Date.now(),
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ─── ENTRY CRUD ─────────────────────────────────────────────────────────────

/**
 * type: 'CREDIT' (goods given, customer owes more)
 *       'DEBIT'  (payment received, balance reduces)
 *       'NOTE'   (non-monetary note)
 */
export const addEntry = async (merchantId, customerId, data) => {
    try {
        const amount = parseFloat(data.amount) || 0;
        const entryRef = await addDoc(collection(db, ENTRIES_COL), {
            merchantId,
            customerId,
            type: data.type, // 'CREDIT' | 'DEBIT' | 'NOTE'
            amount,
            description: data.description || '',
            note: data.note || '',
            dueDate: data.dueDate || null,
            status: data.type === 'DEBIT' ? 'PAID' : (data.dueDate ? 'PENDING' : 'PAID'),
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Update customer balance
        const balanceDelta = data.type === 'CREDIT' ? amount : data.type === 'DEBIT' ? -amount : 0;
        const creditDelta = data.type === 'CREDIT' ? amount : 0;
        const debitDelta = data.type === 'DEBIT' ? amount : 0;

        const custRef = doc(db, CUSTOMERS_COL, customerId);
        const custSnap = await getDoc(custRef);
        if (custSnap.exists()) {
            const cur = custSnap.data();
            await updateDoc(custRef, {
                totalBalance: (cur.totalBalance || 0) + balanceDelta,
                totalCredit: (cur.totalCredit || 0) + creditDelta,
                totalDebit: (cur.totalDebit || 0) + debitDelta,
                lastEntryAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        return { success: true, id: entryRef.id };
    } catch (error) {
        console.error('Add entry error:', error);
        return { success: false, error: error.message };
    }
};

export const getEntries = async (customerId) => {
    try {
        const q = query(
            collection(db, ENTRIES_COL),
            where('customerId', '==', customerId),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message, data: [] };
    }
};

export const subscribeEntries = (customerId, callback) => {
    const q = query(
        collection(db, ENTRIES_COL),
        where('customerId', '==', customerId),
        orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        callback({ success: true, data });
    }, (error) => {
        callback({ success: false, error: error.message, data: [] });
    });
};

export const updateEntry = async (entryId, customerId, oldData, newData) => {
    try {
        await updateDoc(doc(db, ENTRIES_COL, entryId), {
            ...newData,
            updatedAt: Date.now(),
        });

        // Recalculate balance delta
        const oldDelta = oldData.type === 'CREDIT' ? oldData.amount : oldData.type === 'DEBIT' ? -oldData.amount : 0;
        const newAmount = parseFloat(newData.amount) || 0;
        const newDelta = newData.type === 'CREDIT' ? newAmount : newData.type === 'DEBIT' ? -newAmount : 0;

        const custRef = doc(db, CUSTOMERS_COL, customerId);
        const custSnap = await getDoc(custRef);
        if (custSnap.exists()) {
            const cur = custSnap.data();
            await updateDoc(custRef, {
                totalBalance: (cur.totalBalance || 0) - oldDelta + newDelta,
                updatedAt: Date.now(),
            });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const deleteEntry = async (entryId, customerId, entryData) => {
    try {
        await deleteDoc(doc(db, ENTRIES_COL, entryId));

        // Reverse balance
        const delta = entryData.type === 'CREDIT' ? -entryData.amount : entryData.type === 'DEBIT' ? entryData.amount : 0;
        const creditDelta = entryData.type === 'CREDIT' ? -entryData.amount : 0;
        const debitDelta = entryData.type === 'DEBIT' ? -entryData.amount : 0;

        const custRef = doc(db, CUSTOMERS_COL, customerId);
        const custSnap = await getDoc(custRef);
        if (custSnap.exists()) {
            const cur = custSnap.data();
            await updateDoc(custRef, {
                totalBalance: (cur.totalBalance || 0) + delta,
                totalCredit: (cur.totalCredit || 0) + creditDelta,
                totalDebit: (cur.totalDebit || 0) + debitDelta,
                updatedAt: Date.now(),
            });
        }
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

export const markEntryPaid = async (entryId, customerId) => {
    try {
        await updateDoc(doc(db, ENTRIES_COL, entryId), {
            status: 'PAID',
            paidAt: Date.now(),
            updatedAt: Date.now(),
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ─── STATS ──────────────────────────────────────────────────────────────────

export const getKhataStats = async (merchantId) => {
    try {
        const q = query(
            collection(db, CUSTOMERS_COL),
            where('merchantId', '==', merchantId),
            where('isActive', '==', true)
        );
        const snap = await getDocs(q);
        let totalToCollect = 0, totalToPay = 0, customersCount = 0, overdueCount = 0;
        snap.docs.forEach(d => {
            const data = d.data();
            customersCount++;
            if (data.totalBalance > 0) totalToCollect += data.totalBalance;
            else if (data.totalBalance < 0) totalToPay += Math.abs(data.totalBalance);
        });
        return { success: true, data: { totalToCollect, totalToPay, customersCount, overdueCount } };
    } catch (error) {
        return { success: false, error: error.message };
    }
};

// ─── EXPORT ──────────────────────────────────────────────────────────────────

export const exportKhataCSV = (customer, entries) => {
    const rows = [
        ['Date', 'Type', 'Description', 'Credit (₹)', 'Debit (₹)', 'Balance (₹)', 'Status'],
    ];
    let runningBalance = 0;
    const sorted = [...entries].sort((a, b) => a.createdAt - b.createdAt);
    sorted.forEach(e => {
        const credit = e.type === 'CREDIT' ? e.amount : 0;
        const debit = e.type === 'DEBIT' ? e.amount : 0;
        runningBalance += credit - debit;
        rows.push([
            new Date(e.createdAt).toLocaleDateString('en-IN'),
            e.type,
            e.description,
            credit || '',
            debit || '',
            runningBalance.toFixed(2),
            e.status,
        ]);
    });
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Khata_${customer.name}_${new Date().toLocaleDateString('en-IN').replace(/\//g, '-')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

// ─── WHATSAPP ────────────────────────────────────────────────────────────────

export const sendWhatsAppReminder = (customer, merchantName) => {
    const balance = customer.totalBalance;
    const absBalance = Math.abs(balance).toFixed(2);
    let message;
    if (balance > 0) {
        message = `Namaste ${customer.name} ji 🙏\n\nYour khata balance at *${merchantName}* is:\n\n*₹${absBalance}* is due from you.\n\nPlease clear this at your earliest convenience.\n\nThank you! 🙏`;
    } else {
        message = `Namaste ${customer.name} ji 🙏\n\nYour khata at *${merchantName}*:\n\nWe owe you *₹${absBalance}*.\n\nPlease visit us to collect.\n\nThank you! 🙏`;
    }
    const phone = customer.phone?.replace(/\D/g, '');
    const url = `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
};
