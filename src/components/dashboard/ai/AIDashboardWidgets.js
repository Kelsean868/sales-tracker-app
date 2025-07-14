import React from 'react';
import { Brain, TrendingUp, AlertCircle } from 'lucide-react';
import CoreDashboardWidgets from '../core/CoreDashboardWidgets';

const AIDashboardWidgets = ({ kpiStats }) => {
  return (
    <div className="space-y-6">
      {/* AI-Enhanced Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6">
        <div className="flex items-center gap-3">
          <Brain className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">AI-Enhanced Dashboard</h2>
            <p className="text-blue-100">Powered by intelligent insights and predictive analytics</p>
          </div>
        </div>
      </div>

      {/* Core KPIs */}
      <CoreDashboardWidgets kpiStats={kpiStats} />

      {/* AI-Powered Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold">Performance Forecast</h3>
          </div>
          <p className="text-gray-600 mb-4">
            AI-powered predictions for your next 30 days based on current trends.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              Forecasting capabilities will be available when AI features are fully configured.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="text-lg font-semibold">Smart Recommendations</h3>
          </div>
          <p className="text-gray-600 mb-4">
            Intelligent suggestions to optimize your sales performance.
          </p>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">
              AI recommendations will appear here when the system is fully trained.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDashboardWidgets;
