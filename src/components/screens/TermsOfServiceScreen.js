import React from 'react';
import { FileText } from 'lucide-react';

const TermsOfServiceScreen = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-gray-800 rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-white mb-4 flex items-center">
          <FileText className="w-8 h-8 mr-3 text-amber-500" />
          Terms of Service
        </h1>
        <p className="text-gray-300 text-sm">Last updated: January 2024</p>
      </div>

      <div className="bg-gray-800 rounded-lg p-6 space-y-6">
        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Acceptance of Terms</h2>
          <p className="text-gray-300 mb-4">
            By accessing and using this service, you accept and agree to be bound by the 
            terms and provision of this agreement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Use License</h2>
          <p className="text-gray-300 mb-4">
            Permission is granted to temporarily download one copy of the materials on 
            Sales Tracker for personal, non-commercial transitory viewing only.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Disclaimer</h2>
          <p className="text-gray-300 mb-4">
            The materials on Sales Tracker are provided on an 'as is' basis. Sales Tracker 
            makes no warranties, expressed or implied, and hereby disclaims and negates all 
            other warranties including, without limitation, implied warranties or conditions 
            of merchantability, fitness for a particular purpose, or non-infringement of 
            intellectual property or other violation of rights.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold text-white mb-3">Limitations</h2>
          <p className="text-gray-300 mb-4">
            In no event shall Sales Tracker or its suppliers be liable for any damages 
            (including, without limitation, damages for loss of data or profit, or due to 
            business interruption) arising out of the use or inability to use the materials 
            on Sales Tracker, even if Sales Tracker or a Sales Tracker authorized representative 
            has been notified orally or in writing of the possibility of such damage.
          </p>
        </section>
      </div>
    </div>
  );
};

export default TermsOfServiceScreen;
