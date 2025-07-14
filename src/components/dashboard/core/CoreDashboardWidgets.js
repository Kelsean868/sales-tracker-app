import React from 'react';
import { DollarSign, FileText, Target, TrendingUp, Users } from 'lucide-react';

const KPICard = ({ title, value, icon: Icon, color = 'blue' }) => (
  <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-full bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
  </div>
);

const CoreDashboardWidgets = ({ kpiStats }) => {
  const kpis = [
    {
      title: 'Total Premium',
      value: `$${(kpiStats.my.totalPremium || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'green'
    },
    {
      title: 'Policies Sold',
      value: kpiStats.my.policiesSold || 0,
      icon: FileText,
      color: 'blue'
    },
    {
      title: 'Clients Converted',
      value: kpiStats.my.clientsConverted || 0,
      icon: Users,
      color: 'purple'
    },
    {
      title: 'New Leads',
      value: kpiStats.my.newLeads || 0,
      icon: Target,
      color: 'orange'
    },
    {
      title: 'Closing Ratio',
      value: `${kpiStats.my.closingRatio || 0}%`,
      icon: TrendingUp,
      color: 'indigo'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard key={index} {...kpi} />
        ))}
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold mb-4">Monthly Performance</h3>
        <p className="text-gray-600">
          Your performance metrics for the current month. All data updates in real-time.
        </p>
      </div>
    </div>
  );
};

export default CoreDashboardWidgets;
