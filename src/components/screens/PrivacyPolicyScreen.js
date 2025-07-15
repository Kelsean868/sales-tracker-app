import React from 'react';
import { Shield } from 'lucide-react';

const PrivacyPolicyScreen = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-white mb-4 flex items-center">
          <Shield className="w-8 h-8 mr-3 text-amber-500" />
          Privacy Policy
        </h1>
        <p className="text-gray-300 text-sm">Last updated: January 2024</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Information We Collect</h2>
          <p className="text-gray-300 mb-4">
            We collect information you provide directly to us, such as when you create an account, 
            update your profile, or use our services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">How We Use Your Information</h2>
          <p className="text-gray-300 mb-4">
            We use the information we collect to provide, maintain, and improve our services, 
            process transactions, and communicate with you.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Data Security</h2>
          <p className="text-gray-300 mb-4">
            We implement appropriate security measures to protect your personal information 
            against unauthorized access, alteration, disclosure, or destruction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Contact Us</h2>
          <p className="text-gray-300">
            If you have any questions about this Privacy Policy, please contact us at 
            support@salestracker.com
          </p>
        </section>
      </div>
    </div>
  );
};

export default PrivacyPolicyScreen;
