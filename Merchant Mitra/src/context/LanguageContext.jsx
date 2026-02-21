import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
    // Default to English (India)
    // Try to get from localStorage if available
    const [language, setLanguage] = useState(() => {
        const savedLang = localStorage.getItem('merchant_mitra_lang');
        return savedLang || 'en-IN';
    });

    useEffect(() => {
        localStorage.setItem('merchant_mitra_lang', language);
    }, [language]);

    const translations = {
        'en-IN': {
            'app_name': 'Merchant Mitra',
            'dashboard': 'Dashboard',
            'add_transaction': 'Add Transaction',
            'voice_entry': 'Voice Entry',
            'scan_receipt': 'Scan Receipt',
            'listening': 'Listening...',
            'analyzing': 'Analyzing...',
            'save': 'Save',
            'cancel': 'Cancel',
            'logout': 'Logout',
            'todays_sales': "Today's Sales",
            'total_transactions': 'Total Transactions',
            'pending_payments': 'Pending Payments',
            'this_month': 'This Month',
            'recent_transactions': 'Recent Transactions',
            'view_all': 'View All',
            'collect_payment': 'Collect Payment',
            'manage_udhaar': 'Manage Udhaar',
            'generate_report': 'Generate Report',
            'settings': 'Settings',
            'transaction_type': 'Transaction Type',
            'amount': 'Amount',
            'customer_name': 'Customer Name',
            'phone_number': 'Phone Number',
            'note': 'Note / Description',
            'optional': 'Optional',
            'sale': 'Sale',
            'expense': 'Expense',
            'udhaar_given': 'Udhaar Given',
            'udhaar_received': 'Udhaar Received',
            'voice_language': 'Voice Language',
            'collect_payment_title': 'Collect Payment',
            'scan_qr_code': 'Show QR Code',
            'send_request': 'Send Request',
            'share_whatsapp': 'Share on WhatsApp',
            'amount_error': 'Please enter a valid amount',
            'upi_error': 'Please complete your profile and add UPI ID first',
            'generate_qr': 'Generate QR Code',
            'generating': 'Generating...',
            'payment_received': 'Payment Received!',
            'waiting_payment': 'Waiting for payment...',
            'share_message': 'Hello, please pay',
            'to': 'to'
        },
        'hi-IN': {
            'app_name': 'मर्चेंट मित्र',
            'dashboard': 'डैशबोर्ड',
            'add_transaction': 'लेनदेन जोड़ें',
            'voice_entry': 'बोलकर लिखें',
            'scan_receipt': 'रसीद स्कैन करें',
            'listening': 'सुन रहा हूँ...',
            'analyzing': 'विश्लेषण कर रहा हूँ...',
            'save': 'सहेजें',
            'cancel': 'रद्द करें',
            'logout': 'लॉग आउट',
            'todays_sales': 'आज की बिक्री',
            'total_transactions': 'कुल लेनदेन',
            'pending_payments': 'बकाया भुगतान',
            'this_month': 'इस महीने',
            'recent_transactions': 'हाल ही के लेनदेन',
            'view_all': 'सभी देखें',
            'collect_payment': 'भुगतान लें',
            'manage_udhaar': 'उधारी प्रबंधित करें',
            'generate_report': 'रिपोर्ट बनाएं',
            'settings': 'सेटिंग्स',
            'transaction_type': 'लेनदेन का प्रकार',
            'amount': 'राशि',
            'customer_name': 'ग्राहक का नाम',
            'phone_number': 'फ़ोन नंबर',
            'note': 'नोट / विवरण',
            'optional': 'वैकल्पिक',
            'sale': 'बिक्री',
            'expense': 'खर्च',
            'udhaar_given': 'उधार दिया',
            'udhaar_received': 'उधार मिला',
            'voice_language': 'बोलने की भाषा',
            'collect_payment_title': 'भुगतान स्वीकार करें',
            'scan_qr_code': 'QR कोड दिखाएं',
            'send_request': 'अनुरोध भेजें',
            'share_whatsapp': 'व्हाट्सएप पर शेयर करें',
            'amount_error': 'कृपया मान्य राशि दर्ज करें',
            'upi_error': 'कृपया पहले अपनी प्रोफ़ाइल में UPI ID जोड़ें',
            'generate_qr': 'QR कोड बनाएं',
            'generating': 'बना रहा हूँ...',
            'payment_received': 'भुगतान प्राप्त हुआ!',
            'waiting_payment': 'भुगतान की प्रतीक्षा है...',
            'share_message': 'नमस्ते, कृपया भुगतान करें',
            'to': 'को'
        },
        // Fallbacks for others to English/Hindi can be added or full translations
        'mr-IN': {
            'app_name': 'मर्चेंट मित्र',
            'dashboard': 'डैशबोर्ड',
            'add_transaction': 'व्यवहार जोडा',
            'voice_entry': 'आवाजाद्वारे नोंद',
            'scan_receipt': 'पावती स्कॅन करा',
            'listening': 'ऐकत आहे...',
            'analyzing': 'विश्लेषण करत आहे...',
            'save': 'जतन करा',
            'cancel': 'रद्द करा',
            'logout': 'बाहेर पडा',
            'todays_sales': 'आजची विक्री',
            'total_transactions': 'एकूण व्यवहार',
            'pending_payments': 'थकबाकी',
            'this_month': 'या महिन्यात',
            'recent_transactions': 'अलीकडील व्यवहार',
            'view_all': 'सर्व पहा',
            'collect_payment': 'पेमेंट घ्या',
            'manage_udhaar': 'उधारी व्यवस्थापन',
            'generate_report': 'अहवाल',
            'settings': 'सेटिंग्ज',
            'transaction_type': 'व्यवहाराचा प्रकार',
            'amount': 'रक्कम',
            'customer_name': 'ग्राहकाचे नाव',
            'phone_number': 'फोन नंबर',
            'note': 'टीप / वर्णन',
            'optional': 'पर्यायी',
            'sale': 'विक्री',
            'expense': 'खर्च',
            'udhaar_given': 'उधार दिले',
            'udhaar_received': 'उधार मिळाले',
            'voice_language': 'बोलण्याची भाषा'
        }
    };

    const t = (key) => {
        if (!translations) return key;
        const currentLang = language || 'en-IN';
        const langData = translations[currentLang] || translations['en-IN'];
        if (!langData) return key;

        return langData[key] || translations['en-IN'][key] || key;
    };

    const value = {
        language,
        setLanguage,
        t,
        getLanguageName: (code) => {
            const langs = {
                'en-IN': 'English',
                'hi-IN': 'Hindi (हिंदी)',
                'mr-IN': 'Marathi (मराठी)',
                'gu-IN': 'Gujarati (ગુજરાતી)',
                'ta-IN': 'Tamil (தமிழ்)',
                'te-IN': 'Telugu (తెలుగు)',
                'kn-IN': 'Kannada (ಕನ್ನಡ)',
                'bn-IN': 'Bengali (বাংলা)'
            };
            return langs[code] || code;
        }
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
};
