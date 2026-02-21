import { formatCurrency, formatNumber, calculatePercentageChange } from '../utils/formatters';

const StatsCard = ({ icon, title, value, previousValue, trend, color = 'primary', onClick }) => {
    const percentageChange = previousValue ? calculatePercentageChange(value, previousValue) : null;
    const isPositive = percentageChange >= 0;

    const colorClasses = {
        primary: 'from-primary-500 to-primary-700',
        green: 'from-green-500 to-green-700',
        amber: 'from-amber-500 to-amber-700',
        purple: 'from-purple-500 to-purple-700'
    };

    return (
        <div
            className={`glass-card p-3 sm:p-6 ${onClick ? 'cursor-pointer hover:shadow-2xl transition-all duration-200 active:scale-95' : ''}`}
            onClick={onClick}
        >
            <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg flex-shrink-0`}>
                    {icon}
                </div>
                {percentageChange !== null && (
                    <div className={`flex items-center text-xs sm:text-sm font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        <svg
                            className={`w-3 h-3 sm:w-4 sm:h-4 mr-0.5 sm:mr-1 ${isPositive ? '' : 'transform rotate-180'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                        >
                            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        {Math.abs(percentageChange)}%
                    </div>
                )}
            </div>

            <h3 className="text-[10px] sm:text-sm font-medium text-slate-600 mb-1 leading-tight">{title}</h3>
            <p className="text-base sm:text-2xl font-bold text-slate-800 truncate">
                {typeof value === 'number' && value >= 1000 ? formatNumber(value) : value}
            </p>

            {trend && (
                <p className="text-[9px] sm:text-xs text-slate-500 mt-1 sm:mt-2">{trend}</p>
            )}
        </div>
    );
};

export default StatsCard;
