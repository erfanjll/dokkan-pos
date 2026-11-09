import React from 'react';
import { LayoutDashboard, Boxes, Users, FileText, PieChart, CreditCard } from 'lucide-react';

export default function Navigation({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
    { id: 'expenses', label: 'هزینه‌ها و سود', icon: PieChart },
    { id: 'inventory', label: 'انبار و کالاها', icon: Boxes },
    { id: 'customers', label: 'طرف‌حساب‌ها', icon: Users },
    { id: 'invoices', label: 'فاکتورها', icon: FileText },
    { id: 'cheques', label: 'دفتر چک و داده‌ها', icon: CreditCard },
  ];

  return (
    <nav className="no-print bg-slate-900 border-b border-slate-800 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-start gap-2 overflow-x-auto pb-1 sm:pb-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[46px] sm:min-h-[50px] px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl flex items-center gap-2 text-sm sm:text-base font-bold whitespace-nowrap transition-all duration-200 cursor-pointer active:scale-95 shrink-0 ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

