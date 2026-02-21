import { useState, useEffect } from 'react';
import { generateBusinessInsights } from '../services/gemini.service';
import { useLanguage } from '../context/LanguageContext';

const AIInsightsWidget = ({ transactions }) => {
    const { t, language } = useLanguage();
    const [insight, setInsight] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasApiKey, setHasApiKey] = useState(true);

    useEffect(() => {
        // Check for API key existence (simple client-side check)
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
        if (!apiKey) {
            setHasApiKey(false);
            return;
        }

        if (transactions && transactions.length > 0) {
            fetchInsights();
        }
    }, [transactions]);

    const fetchInsights = async () => {
        setLoading(true);
        const result = await generateBusinessInsights(transactions, language);
        if (result.success) {
            setInsight(result.data);
        }
        setLoading(false);
    };

    if (!hasApiKey) return null; // Hide if no key

    // Don't show if no transactions to analyze
    if (!transactions || transactions.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden mb-8">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mr-4 -mt-4 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
            <div className="absolute bottom-0 left-0 -ml-4 -mb-4 w-32 h-32 bg-white opacity-5 rounded-full blur-xl"></div>

            <div className="relative z-10 flex items-start gap-4">
                {/* Robot Icon */}
                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>

                <div className="flex-1">
                    <h3 className="text-lg font-bold mb-1 flex items-center">
                        Mitra AI Insights
                        {loading && (
                            <span className="ml-2 inline-block w-2 h-2 bg-white rounded-full animate-bounce"></span>
                        )}
                    </h3>

                    {loading ? (
                        <p className="text-white/70 text-sm animate-pulse">{t('analyzing')}...</p>
                    ) : (
                        <p className="text-white/95 font-medium text-lg leading-relaxed">
                            "{insight || t('analyzing') + '...'}"
                        </p>
                    )}
                </div>

                {/* Refresh Button */}
                <button
                    onClick={fetchInsights}
                    disabled={loading}
                    className="text-white/70 hover:text-white transition-colors"
                >
                    <svg className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </button>
            </div>
        </div>
    );
};

export default AIInsightsWidget;
