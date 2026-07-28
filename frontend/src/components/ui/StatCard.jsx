import { TrendingUp, TrendingDown } from 'lucide-react';

const StatCard = ({ icon: Icon, label, value, trend, trendValue, color = 'primary', delay = 0 }) => {
  const colorMap = {
    primary: 'from-primary-500 to-primary-700',
    green: 'from-green-500 to-emerald-700',
    purple: 'from-purple-500 to-violet-700',
    orange: 'from-orange-500 to-amber-700',
    blue: 'from-blue-500 to-cyan-700',
    pink: 'from-pink-500 to-rose-700',
  };

  const glowMap = {
    primary: '0 0 30px rgba(99, 102, 241, 0.25)',
    green: '0 0 30px rgba(34, 197, 94, 0.25)',
    purple: '0 0 30px rgba(139, 92, 246, 0.25)',
    orange: '0 0 30px rgba(249, 115, 22, 0.25)',
    blue: '0 0 30px rgba(59, 130, 246, 0.25)',
    pink: '0 0 30px rgba(236, 72, 153, 0.25)',
  };

  return (
    <div
      className="glass-card p-6 flex items-start gap-4 animate-enter"
      style={{ animationDelay: `${delay}ms`, boxShadow: glowMap[color] }}
    >
      {/* Icon */}
      <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${colorMap[color]} flex items-center justify-center`}>
        <Icon size={22} className="text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider opacity-50 mb-1">{label}</p>
        <p className="text-2xl font-bold truncate">{value}</p>
        {trendValue !== undefined && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
            {trend === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
