import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    updateProfile,
    sendPasswordResetEmail,
    sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

// Register new user
export const registerUser = async (email, password, userData) => {
    try {
        // Create user account
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update profile with display name
        await updateProfile(user, {
            displayName: userData.shopName
        });

        // Send email verification
        await sendEmailVerification(user);

        // Create merchant profile in Firestore
        await setDoc(doc(db, 'merchants', user.uid), {
            merchantId: user.uid,
            email: email,
            shopName: userData.shopName,
            phone: userData.phone || '',
            upiId: userData.upiId || '',
            language: userData.language || 'en',
            category: userData.category || '',
            address: userData.address || '',
            createdAt: Date.now(),
            emailVerified: false,
            isActive: true
        });

        return {
            success: true,
            user: user,
            message: 'Registration successful! Please verify your email.'
        };
    } catch (error) {
        console.error('Registration error:', error);
        return {
            success: false,
            error: error.code,
            message: getErrorMessage(error.code)
        };
    }
};

// Login user
export const loginUser = async (email, password) => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get merchant profile
        const merchantDoc = await getDoc(doc(db, 'merchants', user.uid));

        if (!merchantDoc.exists()) {
            throw new Error('Merchant profile not found');
        }

        return {
            success: true,
            user: user,
            merchantData: merchantDoc.data(),
            message: 'Login successful!'
        };
    } catch (error) {
        console.error('Login error:', error);
        return {
            success: false,
            error: error.code,
            message: getErrorMessage(error.code)
        };
    }
};

// Logout user
export const logoutUser = async () => {
    try {
        await signOut(auth);
        return {
            success: true,
            message: 'Logged out successfully'
        };
    } catch (error) {
        console.error('Logout error:', error);
        return {
            success: false,
            error: error.code,
            message: 'Failed to logout'
        };
    }
};

// Reset password
export const resetPassword = async (email) => {
    try {
        await sendPasswordResetEmail(auth, email);
        return {
            success: true,
            message: 'Password reset email sent!'
        };
    } catch (error) {
        console.error('Password reset error:', error);
        return {
            success: false,
            error: error.code,
            message: getErrorMessage(error.code)
        };
    }
};

// Auth state observer
export const observeAuthState = (callback) => {
    return onAuthStateChanged(auth, callback);
};

// Get user-friendly error messages
const getErrorMessage = (errorCode) => {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered. Please login instead.',
        'auth/invalid-email': 'Invalid email address format.',
        'auth/operation-not-allowed': 'Email/password accounts are not enabled.',
        'auth/weak-password': 'Password should be at least 6 characters long.',
        'auth/user-disabled': 'This account has been disabled.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/invalid-credential': 'Invalid email or password.',
        'auth/too-many-requests': 'Too many failed attempts. Please try again later.',
        'auth/network-request-failed': 'Network error. Please check your connection.',
    };

    return errorMessages[errorCode] || 'An error occurred. Please try again.';
};
