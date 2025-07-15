import React from 'react';
import { HelpCircle, Mail, Phone, MessageSquare } from 'lucide-react';

const HelpSupportScreen = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-white mb-4 flex items-center">
          <HelpCircle className="w-8 h-8 mr-3 text-amber-500" />
          Help & Support
        </h1>
        <p className="text-gray-300 text-lg">
          We're here to help! Find answers to common questions or get in touch with our support team.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Mail className="w-5 h-5 mr-2 text-amber-500" />
            Email Support
          </h2>
          <p className="text-gray-300 mb-2">support@salestracker.com</p>
          <p className="text-gray-400 text-sm">Response time: 24 hours</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-amber-500" />
            Phone Support
          </h2>
          <p className="text-gray-300 mb-2">1-800-SALES-01</p>
          <p className="text-gray-400 text-sm">Mon-Fri: 9AM-5PM EST</p>
        </div>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-amber-500 mb-2">How do I add a new lead?</h3>
            <p className="text-gray-300">Click the "+" button in the bottom right corner and select "Add Lead" from the menu.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-amber-500 mb-2">How do I convert a lead to a client?</h3>
            <p className="text-gray-300">Open the lead details and click the "Convert to Client" button. This will move the lead to your client portfolio.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-amber-500 mb-2">How do I reset my password?</h3>
            <p className="text-gray-300">Go to Profile > Account and click "Reset Password" to receive a password reset email.</p>
          </div>
          
          <div>
            <h3 className="font-semibold text-amber-500 mb-2">How do I change my theme?</h3>
            <p className="text-gray-300">Go to Profile > Settings > Appearance and select your preferred theme.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpSupportScreen;
