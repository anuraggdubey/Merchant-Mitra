import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LandingPage = () => {
    const navigate = useNavigate();
    const { currentUser, loading: authLoading } = useAuth();

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && currentUser) {
            navigate('/dashboard', { replace: true });
        }
    }, [currentUser, authLoading, navigate]);

    const [isVisible, setIsVisible] = useState(false);
    const [activeFeature, setActiveFeature] = useState(0);

    // Load Google Fonts
    useEffect(() => {
        const link = document.createElement('link');
        link.href = 'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Courier+Prime:wght@400;700&display=swap';
        link.rel = 'stylesheet';
        document.head.appendChild(link);
    }, []);

    // Color palette
    const colors = {
        deepTwilight: '#03045e',
        tealBlue: '#0077b6',
        turquoise: '#00b4d8',
        frosted: '#90e0ef',
        lightCyan: '#caf0f8',
    };

    // Font families
    const fonts = {
        heading: "'Oswald', sans-serif",
        body: "'Courier Prime', monospace"
    };

    useEffect(() => {
        setIsVisible(true);

        const interval = setInterval(() => {
            setActiveFeature(prev => (prev + 1) % 4);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    const features = [
        {
            icon: '📱',
            title: 'UPI QR Payments',
            titleHi: 'यूपीआई क्यूआर पेमेंट',
            description: 'Generate instant QR codes for any amount. Customers scan & pay securely.',
            bgColor: colors.tealBlue
        },
        {
            icon: '📤',
            title: 'Request Payments',
            titleHi: 'पेमेंट रिक्वेस्ट',
            description: 'Send payment requests directly via link to any UPI ID.',
            bgColor: colors.turquoise
        },
        {
            icon: '📊',
            title: 'Track Everything',
            titleHi: 'सब कुछ ट्रैक करें',
            description: 'Real-time dashboard with sales, transactions & pending payments.',
            bgColor: colors.deepTwilight
        },
        {
            icon: '🔔',
            title: 'Smart Reminders',
            titleHi: 'स्मार्ट रिमाइंडर',
            description: 'Send payment reminders to customers with one tap.',
            bgColor: colors.frosted
        }
    ];

    const trustBadges = [
        { icon: '🔒', text: 'Bank-Grade Security' },
        { icon: '🏦', text: 'RBI Compliant' },
        { icon: '✅', text: 'UPI Certified' },
        { icon: '🛡️', text: 'Data Protected' }
    ];

    return (
        <div className="min-h-screen" style={{ background: `linear-gradient(180deg, ${colors.lightCyan} 0%, ${colors.frosted}40 30%, white 60%, ${colors.lightCyan}50 100%)` }}>
            {/* Navigation */}
            <nav className="sticky top-0 z-50 backdrop-blur-md border-b" style={{ backgroundColor: 'rgba(255,255,255,0.9)', borderColor: `${colors.frosted}` }}>
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.deepTwilight}, ${colors.tealBlue})` }}>
                            <span className="text-white text-lg font-bold">M</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-bold" style={{ color: colors.deepTwilight, fontFamily: fonts.heading }}>Merchant Mitra</h1>
                            <p className="text-[10px] -mt-0.5" style={{ color: colors.tealBlue, fontFamily: fonts.body }}>Trusted Payment Partner</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-5 py-2 font-medium transition-colors hover:opacity-80"
                            style={{ color: colors.deepTwilight, fontFamily: fonts.heading }}
                        >
                            Login
                        </button>
                        <button
                            onClick={() => navigate('/register')}
                            className="px-5 py-2 text-white rounded-lg font-medium shadow-lg transition-all hover:shadow-xl"
                            style={{ background: `linear-gradient(135deg, ${colors.tealBlue}, ${colors.turquoise})`, fontFamily: fonts.heading }}
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className={`px-6 pt-16 pb-20 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="max-w-6xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div>
                            {/* Trust Badge */}
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6" style={{ backgroundColor: `${colors.turquoise}20`, border: `1px solid ${colors.turquoise}40` }}>
                                <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: colors.turquoise }}></span>
                                <span className="text-sm font-medium" style={{ color: colors.tealBlue, fontFamily: fonts.body }}>Trusted by 50,000+ merchants across India</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4" style={{ color: colors.deepTwilight, fontFamily: fonts.heading }}>
                                Accept Payments
                                <br />
                                <span style={{ background: `linear-gradient(135deg, ${colors.tealBlue}, ${colors.turquoise})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontFamily: fonts.heading }}>
                                    The Smart Way
                                </span>
                            </h1>

                            <p className="text-lg mb-2" style={{ color: colors.tealBlue, fontFamily: fonts.body }}>
                                पेमेंट लेना अब बहुत आसान और सुरक्षित!
                            </p>

                            <p className="mb-8 max-w-lg" style={{ color: '#4a5568', fontFamily: fonts.body }}>
                                Generate UPI QR codes, request payments via link and can be shared on whatsapp, and track all your sales in one place. Completely free, forever.
                            </p>

                            {/* CTA Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                                <button
                                    onClick={() => navigate('/register')}
                                    className="px-8 py-4 text-white rounded-xl font-semibold text-lg shadow-lg transition-all hover:shadow-xl flex items-center justify-center gap-2"
                                    style={{ background: `linear-gradient(135deg, ${colors.tealBlue}, ${colors.turquoise})`, boxShadow: `0 10px 40px ${colors.tealBlue}40`, fontFamily: fonts.heading }}
                                >
                                    <span>Start Free Now</span>
                                    <span>→</span>
                                </button>
                                <button
                                    onClick={() => navigate('/login')}
                                    className="px-8 py-4 bg-white rounded-xl font-semibold transition-all hover:shadow-md"
                                    style={{ color: colors.deepTwilight, border: `2px solid ${colors.frosted}`, fontFamily: fonts.heading }}
                                >
                                    I already have an account
                                </button>
                            </div>

                            {/* Trust Badges */}
                            <div className="flex flex-wrap gap-4">
                                {trustBadges.map((badge, index) => (
                                    <div key={index} className="flex items-center gap-2 text-sm" style={{ color: '#5a6a7a', fontFamily: fonts.body }}>
                                        <span>{badge.icon}</span>
                                        <span>{badge.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right - App Preview */}
                        <div className="relative flex justify-center">
                            {/* Phone Mockup */}
                            <div className="relative w-72 h-[580px] rounded-[3rem] p-3 shadow-2xl" style={{ backgroundColor: colors.deepTwilight }}>
                                <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-6 rounded-full" style={{ backgroundColor: colors.deepTwilight }}></div>
                                <div className="w-full h-full rounded-[2.5rem] overflow-hidden" style={{ background: `linear-gradient(180deg, ${colors.lightCyan}, white)` }}>
                                    {/* App Screen Content */}
                                    <div className="p-6 pt-10">
                                        <div className="text-center mb-6">
                                            <div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${colors.tealBlue}, ${colors.turquoise})` }}>
                                                <span className="text-2xl text-white font-bold">M</span>
                                            </div>
                                            <h3 className="font-bold" style={{ color: colors.deepTwilight, fontFamily: fonts.heading }}>Merchant Mitra</h3>
                                        </div>

                                        {/* Sample QR */}
                                        <div className="bg-white rounded-2xl shadow-lg p-4 mb-4">
                                            <div className="w-full aspect-square rounded-xl flex items-center justify-center" style={{ backgroundColor: colors.lightCyan }}>
                                                <div className="grid grid-cols-3 gap-1">
                                                    {[...Array(9)].map((_, i) => (
                                                        <div key={i} className="w-8 h-8 rounded" style={{ backgroundColor: i % 2 === 0 ? colors.deepTwilight : 'white', border: i % 2 !== 0 ? `1px solid ${colors.frosted}` : 'none' }}></div>
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-center text-sm mt-3" style={{ color: '#5a6a7a', fontFamily: fonts.body }}>Scan to Pay ₹500</p>
                                        </div>

                                        {/* Sample Stats */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: `${colors.turquoise}20` }}>
                                                <p className="text-lg font-bold" style={{ color: colors.tealBlue, fontFamily: fonts.heading }}>₹12,450</p>
                                                <p className="text-xs" style={{ color: '#5a6a7a', fontFamily: fonts.body }}>Today's Sales</p>
                                            </div>
                                            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: `${colors.tealBlue}15` }}>
                                                <p className="text-lg font-bold" style={{ color: colors.deepTwilight, fontFamily: fonts.heading }}>47</p>
                                                <p className="text-xs" style={{ color: '#5a6a7a', fontFamily: fonts.body }}>Transactions</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Elements */}
                            <div className="absolute -right-4 top-20 bg-white rounded-xl shadow-lg p-3 flex items-center gap-2 animate-bounce" style={{ animationDuration: '3s', border: `1px solid ${colors.frosted}` }}>
                                <span style={{ color: colors.turquoise }} className="text-xl">✓</span>
                                <span className="text-sm font-medium" style={{ color: colors.deepTwilight, fontFamily: fonts.heading }}>Payment Received!</span>
                            </div>
                            <div className="absolute -left-4 bottom-32 bg-white rounded-xl shadow-lg p-3 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s', border: `1px solid ${colors.frosted}` }}>
                                <div className="flex items-center gap-2">
                                    <span style={{ color: colors.tealBlue }} className="text-xl">📱</span>
                                    <span className="text-sm font-medium" style={{ color: colors.deepTwilight, fontFamily: fonts.heading }}>QR Generated</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="px-6 py-20" style={{ background: `linear-gradient(135deg, white, ${colors.lightCyan}30, ${colors.frosted}20)` }}>
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-3" style={{ color: colors.deepTwilight, fontFamily: fonts.heading }}>
                            Everything You Need to Grow
                        </h2>
                        <p style={{ color: colors.tealBlue, fontFamily: fonts.body }}>आपके बिज़नेस के लिए सब कुछ एक जगह</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="p-6 rounded-2xl transition-all duration-300 cursor-pointer bg-white hover:shadow-lg"
                                style={{
                                    border: activeFeature === index ? `2px solid ${colors.tealBlue}` : `2px solid ${colors.frosted}`,
                                    boxShadow: activeFeature === index ? `0 10px 40px ${colors.tealBlue}20` : 'none'
                                }}
                                onClick={() => setActiveFeature(index)}
                            >
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 shadow-md" style={{ backgroundColor: feature.bgColor }}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold mb-1" style={{ color: colors.deepTwilight, fontFamily: fonts.heading }}>{feature.title}</h3>
                                <p className="text-xs mb-2" style={{ color: colors.tealBlue, fontFamily: fonts.body }}>{feature.titleHi}</p>
                                <p className="text-sm" style={{ color: '#5a6a7a', fontFamily: fonts.body }}>{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="px-6 py-20" style={{ background: `linear-gradient(135deg, ${colors.turquoise}15, ${colors.lightCyan}40, ${colors.frosted}30)` }}>
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold mb-3" style={{ color: colors.deepTwilight, fontFamily: fonts.heading }}>
                            Get Started in Minutes
                        </h2>
                        <p style={{ color: colors.tealBlue, fontFamily: fonts.body }}>सिर्फ 3 आसान स्टेप्स में शुरू करें</p>
                    </div>

                    <div className="space-y-6">
                        {[
                            { step: '1', title: 'Create Free Account', titleHi: 'मुफ्त अकाउंट बनाएं', desc: 'Sign up with your phone number or email. It takes less than a minute.', icon: '📝', gradient: `linear-gradient(135deg, ${colors.tealBlue}, ${colors.turquoise})` },
                            { step: '2', title: 'Add Your UPI ID', titleHi: 'अपना UPI ID जोड़ें', desc: 'Link your existing UPI ID where you want to receive payments.', icon: '🔗', gradient: `linear-gradient(135deg, ${colors.turquoise}, ${colors.frosted})` },
                            { step: '3', title: 'Start Collecting', titleHi: 'पैसे लेना शुरू करें', desc: 'Generate QR codes, share payment links, and track everything.', icon: '💰', gradient: `linear-gradient(135deg, ${colors.deepTwilight}, ${colors.tealBlue})` }
                        ].map((item, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-6 p-6 bg-white rounded-2xl hover:shadow-lg transition-all"
                                style={{ border: `1px solid ${colors.frosted}` }}
                            >
                                <div className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-md flex-shrink-0" style={{ background: item.gradient, fontFamily: fonts.heading }}>
                                    {item.step}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-lg font-bold" style={{ color: colors.deepTwilight, fontFamily: fonts.heading }}>{item.title}</h3>
                                        <span className="text-xl">{item.icon}</span>
                                    </div>
                                    <p className="text-sm mb-1" style={{ color: colors.tealBlue, fontFamily: fonts.body }}>{item.titleHi}</p>
                                    <p style={{ color: '#5a6a7a', fontFamily: fonts.body }}>{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Security Section */}
            <section className="px-6 py-16" style={{ background: `linear-gradient(135deg, ${colors.deepTwilight}, ${colors.tealBlue})` }}>
                <div className="max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6" style={{ backgroundColor: `${colors.turquoise}30` }}>
                        <span style={{ color: colors.lightCyan }}>🔒</span>
                        <span className="font-medium" style={{ color: colors.lightCyan, fontFamily: fonts.heading }}>Bank-Level Security</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-4" style={{ fontFamily: fonts.heading }}>
                        Your Money, Completely Safe
                    </h2>
                    <p className="max-w-2xl mx-auto mb-8" style={{ color: colors.frosted, fontFamily: fonts.body }}>
                        We use the same security standards as banks. Your payments go directly to your UPI account — we never hold your money.
                    </p>
                    <div className="flex flex-wrap justify-center gap-8">
                        {[
                            { icon: '🏦', text: 'Direct to Your Bank' },
                            { icon: '🔐', text: '256-bit Encryption' },
                            { icon: '✅', text: 'NPCI Certified' },
                            { icon: '🛡️', text: 'Zero Data Sharing' }
                        ].map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-white">
                                <span className="text-2xl">{item.icon}</span>
                                <span className="font-medium" style={{ fontFamily: fonts.heading }}>{item.text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="px-6 py-20" style={{ background: `linear-gradient(135deg, ${colors.lightCyan}, ${colors.frosted}40, ${colors.turquoise}20)` }}>
                <div className="max-w-3xl mx-auto text-center">
                    <h2 className="text-3xl font-bold mb-4" style={{ color: colors.deepTwilight, fontFamily: fonts.heading }}>
                        Ready to Accept Payments?
                    </h2>
                    <p className="mb-8" style={{ color: colors.tealBlue, fontFamily: fonts.body }}>
                        Join 50,000+ merchants who trust Merchant Mitra for their business
                    </p>
                    <button
                        onClick={() => navigate('/register')}
                        className="px-10 py-5 text-white rounded-xl font-bold text-xl shadow-lg transition-all hover:shadow-xl"
                        style={{ background: `linear-gradient(135deg, ${colors.tealBlue}, ${colors.turquoise})`, boxShadow: `0 10px 40px ${colors.tealBlue}40`, fontFamily: fonts.heading }}
                    >
                        🚀 Get Started — It's Free
                    </button>
                    <p className="text-sm mt-4" style={{ color: '#5a6a7a', fontFamily: fonts.body }}>No credit card required • Setup in 2 minutes • Free forever</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="px-6 py-10" style={{ backgroundColor: colors.deepTwilight, borderTop: `1px solid ${colors.tealBlue}40` }}>
                <div className="max-w-6xl mx-auto">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.tealBlue}, ${colors.turquoise})` }}>
                                <span className="text-white font-bold">M</span>
                            </div>
                            <div>
                                <p className="font-bold text-white" style={{ fontFamily: fonts.heading }}>Merchant Mitra</p>
                                <p className="text-xs" style={{ color: colors.frosted, fontFamily: fonts.body }}>Trusted Payment Partner</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6 text-sm" style={{ color: colors.frosted, fontFamily: fonts.body }}>
                            <a href="#" className="transition-colors" style={{ color: colors.frosted }} onMouseEnter={(e) => e.target.style.color = colors.turquoise} onMouseLeave={(e) => e.target.style.color = colors.frosted}>Privacy Policy</a>
                            <a href="#" className="transition-colors" style={{ color: colors.frosted }} onMouseEnter={(e) => e.target.style.color = colors.turquoise} onMouseLeave={(e) => e.target.style.color = colors.frosted}>Terms of Service</a>
                            <a href="#" className="transition-colors" style={{ color: colors.frosted }} onMouseEnter={(e) => e.target.style.color = colors.turquoise} onMouseLeave={(e) => e.target.style.color = colors.frosted}>Support</a>
                            <a href="#" className="transition-colors" style={{ color: colors.frosted }} onMouseEnter={(e) => e.target.style.color = colors.turquoise} onMouseLeave={(e) => e.target.style.color = colors.frosted}>Contact</a>
                        </div>
                    </div>
                    <div className="mt-8 pt-6 text-center" style={{ borderTop: `1px solid ${colors.tealBlue}30` }}>
                        <p className="text-sm" style={{ color: colors.frosted, fontFamily: fonts.body }}>
                            © 2026 Merchant Mitra. Made with ❤️ in India
                        </p>
                        <p className="text-xs mt-1" style={{ color: colors.tealBlue, fontFamily: fonts.body }}>
                            Secure payments powered by UPI • NPCI Certified
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
