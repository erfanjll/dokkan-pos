import React from 'react';

export default function StatCard({ title, value, subtitle, icon: Icon, color = 'emerald', onClick }) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-500/10 border-emerald-500/30 hover:border-emerald-500/50',
      iconBg: 'bg-emerald-500/20 text-emerald-400',
      text: 'text-emerald-400'
    },
    rose: {
      bg: 'bg-rose-500/10 border-rose-500/30 hover:border-rose-500/50',
      iconBg: 'bg-rose-500/20 text-rose-400',
      text: 'text-rose-400'
    },
    amber: {
      bg: 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50',
      iconBg: 'bg-amber-500/20 text-amber-400',
      text: 'text-amber-400'
    },
    indigo: {
      bg: 'bg-indigo-500/10 border-indigo-500/30 hover:border-indigo-500/50',
      iconBg: 'bg-indigo-500/20 text-indigo-400',
      text: 'text-indigo-400'
    },
    sky: {
      bg: 'bg-sky-500/10 border-sky-500/30 hover:border-sky-500/50',
      iconBg: 'bg-sky-500/20 text-sky-400',
      text: 'text-sky-400'
    }
  };

  const scheme = colorMap[color] || colorMap.emerald;

  return (
    <div
      onClick={onClick}
      className={`p-5 rounded-3xl border transition-all duration-200 bg-slate-800/80 backdrop-blur-md shadow-lg ${scheme.bg} ${
        onClick ? 'cursor-pointer active:scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-400">{title}</span>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${scheme.iconBg}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="mt-1">
        <div className={`text-2xl font-black tracking-tight text-white ${scheme.text}`}>
          {value}
        </div>
        {subtitle && (
          <p className="mt-2 text-xs text-slate-400 font-medium">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

