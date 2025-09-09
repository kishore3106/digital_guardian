

import React from 'react';
// fix: Use existing URLSafetyReport type instead of non-existent SafetyReportData
import type { URLSafetyReport } from '../types';
import { SafetyLevel } from '../types';
import { SafeIcon, WarningIcon, DangerousIcon, UnknownIcon } from './icons/StatusIcons';

interface SafetyReportProps {
  report: URLSafetyReport;
  url: string;
}

const reportConfig = {
  [SafetyLevel.SAFE]: {
    Icon: SafeIcon,
    title: "This URL appears to be Safe",
    cardClass: "bg-green-500/10 border-green-500/30",
    textClass: "text-green-400",
  },
  [SafetyLevel.SUSPICIOUS]: {
    Icon: WarningIcon,
    title: "This URL is Suspicious",
    cardClass: "bg-yellow-500/10 border-yellow-500/30",
    textClass: "text-yellow-400",
  },
  [SafetyLevel.DANGEROUS]: {
    Icon: DangerousIcon,
    title: "This URL is Dangerous",
    cardClass: "bg-red-500/10 border-red-500/30",
    textClass: "text-red-400",
  },
  [SafetyLevel.UNKNOWN]: {
    Icon: UnknownIcon,
    title: "URL Safety is Unknown",
    cardClass: "bg-gray-500/10 border-gray-500/30",
    textClass: "text-gray-400",
  },
};

export const SafetyReport: React.FC<SafetyReportProps> = ({ report, url }) => {
  const config = reportConfig[report.safetyLevel] || reportConfig[SafetyLevel.UNKNOWN];

  return (
    <div className={`p-6 rounded-xl border animate-fade-in ${config.cardClass}`}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <div className={`p-2 rounded-full ${config.cardClass}`}>
            <config.Icon className={`w-8 h-8 ${config.textClass}`} />
        </div>
        <div>
            <h2 className={`text-2xl font-bold ${config.textClass}`}>{config.title}</h2>
            <p className="text-gray-400 break-all font-mono text-sm">{url}</p>
        </div>
      </div>
      
      <div className="bg-gray-800/40 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-lg text-white mb-2">AI Summary</h3>
        <p className="text-gray-300">{report.summary}</p>
      </div>

      <div>
        <h3 className="font-semibold text-xl text-white mb-4 border-b border-gray-700 pb-2">
          {report.threats && report.threats.length > 0
            ? '🚨 Potential Threats Detected'
            : '✅ No Potential Threats Found'}
        </h3>
        {report.threats && report.threats.length > 0 ? (
          <div className="space-y-4">
            {report.threats.map((threat, index) => (
              <div key={index} className="bg-gray-800/60 p-4 rounded-lg border border-gray-700">
                <h4 className="font-bold text-lg text-yellow-300">{threat.type}</h4>
                <p className="mt-2 text-gray-300">{threat.description}</p>
              </div>
            ))}
          </div>
        ) : (
           <div className="bg-gray-800/60 p-4 rounded-lg border border-gray-700">
              <p className="text-gray-300">Our analysis did not find any specific threats like phishing, malware, or scams associated with this URL. This is a good sign, but always remain cautious.</p>
          </div>
        )}
      </div>
    </div>
  );
};
