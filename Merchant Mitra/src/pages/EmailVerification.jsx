import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import { auth } from '../config/firebase';

const EmailVerification = () => {
    const navigate = useNavigate();
    const { currentUser, logout } = useAuth();
    const [message, setMessage] = useState({ type: '', text: '' });
    const [resendDisabled, setResendDisabled] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [checking, setChecking] = useState(false);

    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            setResendDisabled(false);
        }
    }, [countdown]);

    const handleResendEmail = async () => {
        try {
            setResendDisabled(true);
            await sendEmailVerification(currentUser);
            setMessage({
                type: 'success',
                text: 'Verification email sent! Please check your inbox.'
            });
            setCountdown(60); // 60 seconds cooldown
        } catch (error) {
            console.error('Resend error:', error);
            setMessage({
                type: 'error',
                text: 'Failed to send verification email. Please try again.'
            });
            setResendDisabled(false);
        }
    };

    const handleCheckVerification = async () => {
        setChecking(true);
        try {
            await currentUser.reload();
            if (currentUser.emailVerified) {
                setMessage({
                    type: 'success',
                    text: 'Email verified! Redirecting to dashboard...'
                });
                setTimeout(() => {
                    navigate('/dashboard');
                }, 1500);
            } else {
                setMessage({
                    type: 'error',
                    text: 'Email not verified yet. Please check your inbox and click the verification link.'
                });
            }
        } catch (error) {
            console.error('Check verification error:', error);
            setMessage({
                type: 'error',
                text: 'Failed to check verification status. Please try again.'
            });
        }
        setChecking(false);
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-md w-full">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-4 shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-800 mb-2">
                        Verify Your Email
                    </h1>
                    <p className="text-slate-600">
                        We've sent a verification link to
                    </p>
                    <p className="text-primary-600 font-semibold mt-1">
                        {currentUser?.email}
                    </p>
                </div>

                {/* Main Card */}
                <div className="glass-card p-8">
                    {message.text && (
                        <div className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                                ? 'bg-green-50 text-green-800 border border-green-200'
                                : 'bg-red-50 text-red-800 border border-red-200'
                            }`}>
                            <p className="text-sm font-medium">{message.text}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {/* Instructions */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h3 className="font-semibold text-blue-900 mb-2">📧 Check Your Email</h3>
                            <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                                <li>Open your email inbox</li>
                                <li>Find the verification email from UPI Sahayak</li>
                                <li>Click the verification link</li>
                                <li>Return here and click "I've Verified"</li>
                            </ol>
                        </div>

                        {/* Check Verification Button */}
                        <button
                            onClick={handleCheckVerification}
                            disabled={checking}
                            className="btn-primary w-full"
                        >
                            {checking ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Checking...
                                </span>
                            ) : (
                                "I've Verified My Email"
                            )}
                        </button>

                        {/* Resend Email Button */}
                        <button
                            onClick={handleResendEmail}
                            disabled={resendDisabled}
                            className="btn-secondary w-full"
                        >
                            {resendDisabled && countdown > 0
                                ? `Resend in ${countdown}s`
                                : 'Resend Verification Email'}
                        </button>

                        {/* Logout Button */}
                        <button
                            onClick={handleLogout}
                            className="w-full px-6 py-3 text-slate-600 hover:text-slate-800 font-medium transition-colors"
                        >
                            Logout
                        </button>
                    </div>

                    {/* Help Text */}
                    <div className="mt-6 text-center">
                        <p className="text-xs text-slate-500">
                            Didn't receive the email? Check your spam folder or click resend.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailVerification;
