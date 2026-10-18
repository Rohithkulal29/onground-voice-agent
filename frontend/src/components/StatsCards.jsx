import React from 'react';
import { Users, Clock, PhoneCall, CheckCircle, TrendingUp } from 'lucide-react';

export default function StatsCards({ leads }) {
  const total = leads.length;
  const pending = leads.filter(l => l.call_status === 'Pending').length;
  const active = leads.filter(l => l.call_status === 'Calling' || l.call_status === 'In-Progress').length;
  const completed = leads.filter(l => l.call_status === 'Completed').length;
  const failed = leads.filter(l => l.call_status === 'Failed').length;

  const conversionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const stats = [
    {
      label: 'Total Campaign Leads',
      value: total,
      subtext: 'Retail customer contacts',
      icon: Users,
      color: 'from-blue-500/20 to-indigo-500/20 text-indigo-400 border-indigo-500/30'
    },
    {
      label: 'Outbound Queue',
      value: pending,
      subtext: 'Pending dispatch',
      icon: Clock,
      color: 'from-amber-500/20 to-orange-500/20 text-amber-400 border-amber-500/30'
    },
    {
      label: 'Live Active Calls',
      value: active,
      subtext: active > 0 ? 'Dialing & In-Progress' : 'Ready to dial',
      icon: PhoneCall,
      color: 'from-cyan-500/20 to-teal-500/20 text-cyan-400 border-cyan-500/30',
      pulse: active > 0
    },
    {
      label: 'Completed Calls',
      value: completed,
      subtext: `${conversionRate}% completion rate`,
      icon: CheckCircle,
      color: 'from-emerald-500/20 to-green-500/20 text-emerald-400 border-emerald-500/30'
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        return (
          <div
            key={idx}
            className="glass-card rounded-2xl p-5 border relative overflow-hidden transition-all duration-200 hover:border-slate-600/60"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-slate-400 tracking-wide">{stat.label}</p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span className="text-2xl font-bold text-white tracking-tight">{stat.value}</span>
                  {stat.pulse && (
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{stat.subtext}</p>
              </div>

              <div className={`p-3 rounded-xl bg-gradient-to-br border ${stat.color}`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
