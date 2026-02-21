import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { addCustomer, updateCustomer, getCustomer } from '../services/khata.service';
import { getAvatarColor } from '../components/CustomerCard';

const KHATA_TYPES = [
    {
        value: 'daily',
        icon: '📅',
        label: 'Daily',
        desc: 'Entries close each day. Best for daily supplies like milk, bread, newspaper.',
        color: 'border-green-300',
        activeColor: 'border-green-500 bg-green-50 ring-2 ring-green-200',
        badge: 'bg-green-100 text-green-700',
    },
    {
        value: 'weekly',
        icon: '📆',
        label: 'Weekly',
        desc: 'Entries close every 7 days. Best for weekly deliveries or services.',
        color: 'border-blue-300',
        activeColor: 'border-blue-500 bg-blue-50 ring-2 ring-blue-200',
        badge: 'bg-blue-100 text-blue-700',
    },
    {
        value: 'monthly',
        icon: '🗓',
        label: 'Monthly',
        desc: 'Entries close each month-end. Best for regular credit customers with monthly settlement.',
        color: 'border-purple-300',
        activeColor: 'border-purple-500 bg-purple-50 ring-2 ring-purple-200',
        badge: 'bg-purple-100 text-purple-700',
    },
];

const AVATAR_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
    '#f97316', '#0ea5e9', '#84cc16', '#a855f7',
];

const PRESET_TAGS = ['Regular', 'VIP', 'Wholesale', 'Retail', 'Credit Risk', 'Old Customer'];

const AddCustomer = () => {
    const navigate = useNavigate();
    const { customerId } = useParams(); // set when editing
    const { currentUser } = useAuth();
    const isEditing = !!customerId;

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        notes: '',
        khataType: 'monthly',
        creditLimit: '',
        avatarColor: '#6366f1',
        tags: [],
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [tagInput, setTagInput] = useState('');

    useEffect(() => {
        if (isEditing) {
            getCustomer(customerId).then(r => {
                if (r.success) {
                    const d = r.data;
                    setForm({
                        name: d.name || '',
                        phone: d.phone || '',
                        email: d.email || '',
                        address: d.address || '',
                        notes: d.notes || '',
                        khataType: d.khataType || 'monthly',
                        creditLimit: d.creditLimit || '',
                        avatarColor: d.avatarColor || '#6366f1',
                        tags: d.tags || [],
                    });
                }
            });
        }
    }, [customerId, isEditing]);

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Name is required';
        if (form.phone && !/^[6-9]\d{9}$/.test(form.phone.replace(/\s/g, ''))) {
            e.phone = 'Enter valid 10-digit Indian mobile number';
        }
        if (form.creditLimit && (isNaN(parseFloat(form.creditLimit)) || parseFloat(form.creditLimit) < 0)) {
            e.creditLimit = 'Enter a valid credit limit';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setLoading(true);
        const payload = {
            ...form,
            creditLimit: parseFloat(form.creditLimit) || 0,
            avatarColor: form.avatarColor || getAvatarColor(form.name),
        };
        let result;
        if (isEditing) {
            result = await updateCustomer(customerId, payload);
        } else {
            result = await addCustomer(currentUser.uid, payload);
        }
        setLoading(false);
        if (result.success) {
            if (isEditing) {
                navigate(`/khata/${customerId}`);
            } else {
                navigate(`/khata/${result.id}`);
            }
        }
    };

    const toggleTag = (tag) => {
        setForm(f => ({
            ...f,
            tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
        }));
    };

    const addCustomTag = () => {
        const t = tagInput.trim();
        if (t && !form.tags.includes(t)) {
            setForm(f => ({ ...f, tags: [...f.tags, t] }));
        }
        setTagInput('');
    };

    const initials = form.name
        ? form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
        : '?';

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-xl mx-auto px-4 py-4 flex items-center gap-3">
                    <button onClick={() => navigate(isEditing ? `/khata/${customerId}` : '/khata')} className="p-2 rounded-full hover:bg-slate-100 transition-colors">
                        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-bold text-slate-800">{isEditing ? 'Edit Customer' : 'Add Customer'}</h1>
                </div>
            </div>

            <div className="max-w-xl mx-auto px-4 py-6 pb-24">

                {/* Avatar Preview */}
                <div className="flex flex-col items-center mb-6">
                    <div
                        className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3 transition-colors duration-200"
                        style={{ backgroundColor: form.avatarColor }}
                    >
                        {initials}
                    </div>
                    <p className="text-xs text-slate-400 mb-2">Pick a color</p>
                    <div className="flex gap-2 flex-wrap justify-center">
                        {AVATAR_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setForm(f => ({ ...f, avatarColor: c }))}
                                className={`w-7 h-7 rounded-full transition-transform ${form.avatarColor === c ? 'scale-125 ring-2 ring-offset-1 ring-slate-400' : 'hover:scale-110'}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Basic Info</h2>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name *</label>
                            <input
                                type="text"
                                placeholder="Customer's full name"
                                value={form.name}
                                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                className={`input-field ${errors.name ? 'border-red-400' : ''}`}
                            />
                            {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Mobile Number</label>
                            <input
                                type="tel"
                                placeholder="10-digit mobile number"
                                value={form.phone}
                                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                                maxLength={10}
                                className={`input-field ${errors.phone ? 'border-red-400' : ''}`}
                            />
                            {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Email (Optional)</label>
                            <input
                                type="email"
                                placeholder="customer@email.com"
                                value={form.email}
                                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                className="input-field"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Address (Optional)</label>
                            <textarea
                                placeholder="Customer's address"
                                value={form.address}
                                onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                                rows={2}
                                className="input-field resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Khata Type */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Khata Type</h2>
                    <div className="flex flex-col gap-3">
                        {KHATA_TYPES.map(type => (
                            <button
                                key={type.value}
                                onClick={() => setForm(f => ({ ...f, khataType: type.value }))}
                                className={`flex items-start gap-3 p-4 border-2 rounded-xl text-left transition-all ${form.khataType === type.value ? type.activeColor : `${type.color} bg-white hover:bg-slate-50`
                                    }`}
                            >
                                <span className="text-2xl">{type.icon}</span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-semibold text-slate-800">{type.label} Khata</p>
                                        {form.khataType === type.value && (
                                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${type.badge}`}>Selected</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-0.5">{type.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Credit & Tags */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-4">
                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-4">Credit & Notes</h2>
                    <div className="flex flex-col gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Credit Limit (₹)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                                <input
                                    type="number"
                                    placeholder="0 = No limit"
                                    value={form.creditLimit}
                                    onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value }))}
                                    className={`input-field pl-8 ${errors.creditLimit ? 'border-red-400' : ''}`}
                                />
                            </div>
                            {errors.creditLimit && <p className="text-xs text-red-500 mt-1">{errors.creditLimit}</p>}
                        </div>

                        {/* Tags */}
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Tags</label>
                            <div className="flex flex-wrap gap-2 mb-2">
                                {PRESET_TAGS.map(tag => (
                                    <button
                                        key={tag}
                                        onClick={() => toggleTag(tag)}
                                        className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${form.tags.includes(tag)
                                                ? 'bg-indigo-600 text-white border-indigo-600'
                                                : 'border-slate-200 text-slate-600 hover:border-indigo-300'
                                            }`}
                                    >
                                        {tag}
                                    </button>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Custom tag..."
                                    value={tagInput}
                                    onChange={e => setTagInput(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addCustomTag()}
                                    className="input-field text-sm py-2"
                                />
                                <button onClick={addCustomTag} className="px-3 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-semibold hover:bg-indigo-200 transition-colors">Add</button>
                            </div>
                            {form.tags.filter(t => !PRESET_TAGS.includes(t)).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {form.tags.filter(t => !PRESET_TAGS.includes(t)).map(t => (
                                        <span key={t} className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-full flex items-center gap-1">
                                            {t}
                                            <button onClick={() => toggleTag(t)} className="text-slate-400 hover:text-red-500">×</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Notes</label>
                            <textarea
                                placeholder="Any special notes about this customer..."
                                value={form.notes}
                                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                rows={2}
                                className="input-field resize-none"
                            />
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-4 text-base"
                >
                    {loading ? (
                        <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                    ) : (
                        isEditing ? '✏️ Update Customer' : '✅ Add Customer'
                    )}
                </button>
            </div>
        </div>
    );
};

export default AddCustomer;
