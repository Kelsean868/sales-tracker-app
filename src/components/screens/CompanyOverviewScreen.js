import React from 'react';
import { Building, Calendar, MapPin, Users } from 'lucide-react';

const CompanyOverviewScreen = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-white mb-4 flex items-center">
          <Building className="w-8 h-8 mr-3 text-amber-500" />
          Company Overview
        </h1>
        <p className="text-gray-300 text-lg">
          Welcome to our comprehensive insurance sales platform designed to streamline your workflow and maximize performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-amber-500" />
            Founded
          </h2>
          <p className="text-gray-300">2024</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-amber-500" />
            Headquarters
          </h2>
          <p className="text-gray-300">Digital First Company</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Users className="w-5 h-5 mr-2 text-amber-500" />
            Mission
          </h2>
          <p className="text-gray-300">
            To empower insurance sales teams with cutting-edge technology and insights that drive results.
          </p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Platform Features</h2>
          <ul className="text-gray-300 space-y-2">
            <li>• Lead Management & Tracking</li>
            <li>• Client Portfolio Management</li>
            <li>• Activity Logging & Scheduling</li>
            <li>• Performance Analytics</li>
            <li>• Team Collaboration Tools</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CompanyOverviewScreen;
