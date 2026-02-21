import { useState, useEffect } from 'react';

const ENTRY_TYPES = [
    {
        value: 'CREDIT',
        label: 'Gave Goods / Credit',
        icon: '📦',
        desc: 'Customer will pay later',
        color: 'border-red-300 bg-red-50',
        activeColor: 'border-red-500 bg-red-100 ring-2 ring-red-300',
        textColor: 'text-red-700',
    },
    {
        value: 'DEBIT',
        label: 'Received Payment',
        icon: '💵',
        desc: 'Customer paid you',
        color: 'border-green-300 bg-green-50',
        activeColor: 'border-green-500 bg-green-100 ring-2 ring-green-300',
        textColor: 'text-green-700',
    },
    {
        value: 'NOTE',
        label: 'Add Note',
        icon: '📝',
        desc: 'Non-monetary memo',
        color: 'border-slate-300 bg-slate-50',
        activeColor: 'border-slate-500 bg-slate-100 ring-2 ring-slate-300',
        textColor: 'text-slate-700',
    },
];

const KhataEntryModal = ({ open, onClose, onSave, editEntry = null, loading = false }) => {
    const [form, setForm] = useState({
        type: 'CREDIT',
        amount: '',
        description: '',
        note: '',
        dueDate: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (editEntry) {
            setForm({
                type: editEntry.type || 'CREDIT',
                amount: editEntry.amount?.toString() || '',
                description: editEntry.description || '',
                note: editEntry.note || '',
                dueDate: editEntry.dueDate
                    ? new Date(editEntry.dueDate).toISOString().split('T')[0]
                    : '',
            });
        } else {
            setForm({ type: 'CREDIT', amount: '', description: '', note: '', dueDate: '' });
        }
        setErrors({});
    }, [editEntry, open]);

    const validate = () => {
        const e = {};
        if (form.type !== 'NOTE' && (!form.amount || isNaN(parseFloat(form.amount)) || parseFloat(form.amount) <= 0)) {
            e.amount = 'Enter a valid amount';
        }
        if (!form.description.trim()) e.description = 'Description is required';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSave({
            ...form,
            amount: parseFloat(form.amount) || 0,
            dueDate: form.dueDate ? new Date(form.dueDate).getTime() : null,
        });
    };

    if (!open) return null;

    const selectedType = ENTRY_TYPES.find(t => t.value === form.type);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md shadow-2xl z-10 p-6 animate-slide-up">
                {/* Handle */}
                <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5 sm:hidden" />

                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-bold text-slate-800">
                        {editEntry ? 'Edit Entry' : 'Add Entry'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                    >
                        <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Type Selector */}
                <div className="grid grid-cols-3 gap-2 mb-5">
                    {ENTRY_TYPES.map(type => (
                        <button
                            key={type.value}
                            onClick={() => setForm(f => ({ ...f, type: type.value }))}
                            className={`p-3 rounded-xl border-2 text-center transition-all duration-150 ${form.type === type.value ? type.activeColor : type.color
                                }`}
                        >
                            <div className="text-xl mb-1">{type.icon}</div>
                            <p className={`text-xs font-semibold leading-tight ${form.type === type.value ? type.textColor : 'text-slate-600'}`}>
                                {type.label}
                            </p>
                        </button>
                    ))}
                </div>

                {/* Amount */}
                {form.type !== 'NOTE' && (
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Amount (₹)</label>
                        <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">₹</span>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={form.amount}
                                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                                className={`input-field pl-8 text-lg font-bold ${errors.amount ? 'border-red-400' : ''}`}
                            />
                        </div>
                        {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                    </div>
                )}

                {/* Description */}
                <div className="mb-4">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Description *</label>
                    <input
                        type="text"
                        placeholder={
                            form.type === 'CREDIT' ? 'e.g. Rice 5kg, Sugar 2kg' :
                                form.type === 'DEBIT' ? 'e.g. Cash payment' : 'e.g. Customer on leave'
                        }
                        value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                        className={`input-field ${errors.description ? 'border-red-400' : ''}`}
                    />
                    {errors.description && <p className="text-xs text-red-500 mt-1">{errors.description}</p>}
                </div>

                {/* Due Date (only for CREDIT) */}
                {form.type === 'CREDIT' && (
                    <div className="mb-4">
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date (Optional)</label>
                        <input
                            type="date"
                            value={form.dueDate}
                            onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))}
                            className="input-field"
                            min={new Date().toISOString().split('T')[0]}
                        />
                    </div>
                )}

                {/* Note */}
                <div className="mb-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Note (Optional)</label>
                    <textarea
                        placeholder="Any additional remarks..."
                        value={form.note}
                        onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
                        rows={2}
                        className="input-field resize-none"
                    />
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                    ) : (
                        <>{editEntry ? '✏️ Update Entry' : `${selectedType?.icon} Save Entry`}</>
                    )}
                </button>
            </div>
        </div>
    );
};

export default KhataEntryModal;
