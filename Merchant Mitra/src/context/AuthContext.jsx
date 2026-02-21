import { createContext, useContext, useState, useEffect } from 'react';
import { observeAuthState, logoutUser } from '../services/auth.service';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [merchantData, setMerchantData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch merchant data from Firestore
    const fetchMerchantData = async (uid, user) => {
        try {
            const merchantDoc = await getDoc(doc(db, 'merchants', uid));
            if (merchantDoc.exists()) {
                setMerchantData(merchantDoc.data());
                return merchantDoc.data();
            } else {
                // Doc doesn't exist yet — use displayName from Firebase Auth as fallback
                const fallback = {
                    merchantId: uid,
                    shopName: user?.displayName || user?.email?.split('@')[0] || 'Merchant',
                    email: user?.email || ''
                };
                setMerchantData(fallback);
                return fallback;
            }
        } catch (err) {
            console.error('Error fetching merchant data:', err);
            setError('Failed to load merchant profile');
            return null;
        }
    };

    // Listen to auth state changes
    useEffect(() => {
        const unsubscribe = observeAuthState(async (user) => {
            setLoading(true);
            setError(null);

            if (user) {
                setCurrentUser(user);
                // Fetch merchant data from Firestore
                await fetchMerchantData(user.uid, user);
            } else {
                setCurrentUser(null);
                setMerchantData(null);
            }

            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Logout function
    const logout = async () => {
        try {
            await logoutUser();
            setCurrentUser(null);
            setMerchantData(null);
            return { success: true };
        } catch (err) {
            console.error('Logout error:', err);
            return { success: false, error: err.message };
        }
    };

    // Refresh merchant data
    const refreshMerchantData = async () => {
        if (currentUser) {
            await fetchMerchantData(currentUser.uid);
        }
    };

    const value = {
        currentUser,
        merchantData,
        loading,
        error,
        logout,
        refreshMerchantData,
        isAuthenticated: !!currentUser,
        isEmailVerified: currentUser?.emailVerified || false
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
