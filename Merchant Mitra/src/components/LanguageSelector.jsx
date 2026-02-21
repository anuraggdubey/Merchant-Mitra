import { useLanguage } from '../context/LanguageContext';

const LanguageSelector = () => {
    const { language, setLanguage } = useLanguage();

    return (
        <div className="flex items-center space-x-2 bg-slate-100 rounded-full px-3 py-1 border border-slate-200">
            <span className="text-sm">🌐</span>
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none cursor-pointer"
            >
                <option value="en-IN">English</option>
                <option value="hi-IN">Hindi (हिंदी)</option>
            </select>
        </div>
    );
};

export default LanguageSelector;
