const ProgressBar = ({ percentage, showLabel = true }) => {
    return (
        <div className="w-full">
            {showLabel && (
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">Profile Completion</span>
                    <span className="text-sm font-bold text-primary-600">{percentage}%</span>
                </div>
            )}

            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-700 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${percentage}%` }}
                >
                    <div className="h-full w-full bg-white/20 animate-pulse"></div>
                </div>
            </div>

            {percentage < 100 && (
                <p className="mt-2 text-xs text-slate-500">
                    Complete your profile to start collecting payments
                </p>
            )}
        </div>
    );
};

export default ProgressBar;
