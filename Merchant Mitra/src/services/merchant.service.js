import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

// Get merchant profile
export const getMerchantProfile = async (merchantId) => {
    try {
        const merchantDoc = await getDoc(doc(db, 'merchants', merchantId));
        if (merchantDoc.exists()) {
            return {
                success: true,
                data: merchantDoc.data()
            };
        } else {
            return {
                success: false,
                error: 'Merchant profile not found'
            };
        }
    } catch (error) {
        console.error('Get merchant profile error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Update merchant profile (uses setDoc with merge so it creates doc if missing)
export const updateMerchantProfile = async (merchantId, data) => {
    try {
        await setDoc(doc(db, 'merchants', merchantId), {
            ...data,
            updatedAt: Date.now()
        }, { merge: true });
        return {
            success: true,
            message: 'Profile updated successfully'
        };
    } catch (error) {
        console.error('Update merchant profile error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Real-time listener for merchant profile
export const subscribeMerchantProfile = (merchantId, callback) => {
    return onSnapshot(
        doc(db, 'merchants', merchantId),
        (doc) => {
            if (doc.exists()) {
                callback({ success: true, data: doc.data() });
            } else {
                callback({ success: false, error: 'Merchant not found' });
            }
        },
        (error) => {
            console.error('Merchant profile listener error:', error);
            callback({ success: false, error: error.message });
        }
    );
};

// Get dashboard stats (Real aggregation)
export const getDashboardStats = async (merchantId) => {
    try {
        // Fetch payments for stats
        // In a production app with many transactions, this should be done via Cloud Functions or aggregated documents
        // For this scale, client-side aggregation is acceptable
        const q = query(collection(db, 'payments'), where('merchantId', '==', merchantId));
        const querySnapshot = await getDocs(q);

        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const startOfYesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
        const endOfYesterday = startOfToday;
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).getTime();
        const endOfLastMonth = startOfMonth;

        let todaySales = 0;
        let yesterdaySales = 0;
        let totalTransactions = 0;
        let yesterdayTransactions = 0;
        let pendingPayments = 0;
        let pendingAmount = 0;
        let monthRevenue = 0;
        let lastMonthRevenue = 0;

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const txnDate = data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt;
            const amount = parseFloat(data.amount) || 0;
            const isSuccess = data.status === 'SUCCESS';
            const isPending = data.status === 'WAITING_FOR_SMS' || data.status === 'PENDING';

            totalTransactions++;

            // Pending stats
            if (isPending) {
                pendingPayments++;
                pendingAmount += amount;
            }

            // Sales stats (Only COUNT SUCCESS transactions for revenue)
            if (isSuccess) {
                if (txnDate >= startOfToday) {
                    todaySales += amount;
                } else if (txnDate >= startOfYesterday && txnDate < endOfYesterday) {
                    yesterdaySales += amount;
                    yesterdayTransactions++; // Approximate count for "yesterday transactions" trend
                }

                if (txnDate >= startOfMonth) {
                    monthRevenue += amount;
                } else if (txnDate >= startOfLastMonth && txnDate < endOfLastMonth) {
                    lastMonthRevenue += amount;
                }
            }
        });

        const stats = {
            todaySales,
            yesterdaySales,
            totalTransactions,
            yesterdayTransactions,
            pendingPayments,
            pendingAmount,
            monthRevenue,
            lastMonthRevenue
        };

        return {
            success: true,
            data: stats
        };
    } catch (error) {
        console.error('Get dashboard stats error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Upload shop photo to Firebase Storage
export const uploadShopPhoto = async (merchantId, file) => {
    try {
        const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
        const { storage } = await import('../config/firebase');

        // Create a reference to the file
        const storageRef = ref(storage, `merchants/${merchantId}/shop-photo.jpg`);

        // Upload the file
        await uploadBytes(storageRef, file);

        // Get the download URL
        const photoURL = await getDownloadURL(storageRef);

        // Update merchant profile with photo URL
        await setDoc(doc(db, 'merchants', merchantId), {
            shopPhotoURL: photoURL,
            updatedAt: Date.now()
        }, { merge: true });

        return {
            success: true,
            photoURL,
            message: 'Photo uploaded successfully'
        };
    } catch (error) {
        console.error('Upload photo error:', error);
        return {
            success: false,
            error: error.message
        };
    }
};

// Validate UPI ID format
export const validateUpiId = (upiId) => {
    // UPI ID format: username@handle
    const upiRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;

    if (!upiId || !upiId.trim()) {
        return { valid: false, error: 'UPI ID is required' };
    }

    if (!upiRegex.test(upiId)) {
        return { valid: false, error: 'Invalid UPI ID format. Example: merchant@paytm' };
    }

    return { valid: true };
};

// Calculate profile completion percentage
export const checkProfileCompletion = (merchantData) => {
    if (!merchantData) return 0;

    const requiredFields = [
        'shopName',
        'email',
        'phone',
        'category',
        'upiId',
        'address',
        'city',
        'state',
        'pincode'
    ];

    const optionalFields = [
        'shopPhotoURL',
        'gstNumber',
        'businessHours',
        'whatsappNumber'
    ];

    let completed = 0;
    let total = requiredFields.length + optionalFields.length;

    // Check required fields
    requiredFields.forEach(field => {
        if (merchantData[field] && merchantData[field].toString().trim() !== '') {
            completed++;
        }
    });

    // Check optional fields
    optionalFields.forEach(field => {
        if (merchantData[field] && merchantData[field].toString().trim() !== '') {
            completed++;
        }
    });

    return Math.round((completed / total) * 100);
};
