import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import type { CommunityStats, ActiveAlert } from '../types';

const StatCard: React.FC<{ value: string; label: string }> = ({ value, label }) => (
    <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 text-center shadow-sm">
        <p className="text-2xl sm:text-3xl font-bold text-purple-accent">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
);

const AlertItem: React.FC<{ title: string; affected: string; level: 'HIGH' | 'CRITICAL' | 'MEDIUM' }> = ({ title, affected, level }) => {
    const { t } = useLanguage();
    const levelStyles = {
        HIGH: 'bg-orange-500/10 text-orange-500',
        CRITICAL: 'bg-red-500/10 text-red-500',
        MEDIUM: 'bg-yellow-500/10 text-yellow-500'
    };
    return (
        <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg flex flex-col sm:flex-row justify-between sm:items-center gap-2 animate-slide-up-fade-in-fast">
            <div>
                <p className="font-semibold text-gray-800 dark:text-white">{title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{affected} {t('threats.affected')}</p>
            </div>
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${levelStyles[level]} self-start sm:self-center`}>{level}</span>
        </div>
    );
};

interface ThreatsCommunityProps {
    communityStats: CommunityStats;
    activeAlerts: ActiveAlert[];
}

const ThreatsCommunity: React.FC<ThreatsCommunityProps> = ({ communityStats, activeAlerts }) => {
    const { t } = useLanguage();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!title.trim() || !description.trim()) {
            setError(t('threats.form_error'));
            return;
        }
        setError('');
        setIsSubmitted(true);
        setTitle('');
        setDescription('');
    };

  return (
    <div className="space-y-8 animate-fade-in">
        <div className="bg-gradient-to-r from-purple-accent to-blue-accent p-6 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center shadow-lg gap-4">
            <div>
                <h2 className="text-xl sm:text-2xl font-bold text-white">{t('threats.title')}</h2>
                <p className="text-purple-100">{t('threats.subtitle')}</p>
            </div>
            <span className="bg-white/20 text-white text-sm font-semibold px-3 py-1 rounded-full flex-shrink-0">{t('threats.verified')}</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard value={communityStats.activeUsers.toLocaleString()} label={t('threats.active_users')} />
            <StatCard value={communityStats.reportsThisMonth.toLocaleString()} label={t('threats.reports_month')} />
            <StatCard value={communityStats.activePhishingSites.toLocaleString()} label={t('threats.phishing_sites')} />
            <StatCard value={`${communityStats.communityAccuracy.toFixed(1)}%`} label={t('threats.community_accuracy')} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{t('threats.active_alerts')}</h3>
                <div className="space-y-3">
                    {activeAlerts.map(alert => (
                        <AlertItem key={alert.id} title={alert.title} affected={alert.affected} level={alert.level}/>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{t('threats.community_center')}</h3>
                {isSubmitted ? (
                     <div className="flex flex-col items-center justify-center text-center p-6 bg-green-900/50 rounded-lg animate-fade-in min-h-[280px]">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        <h4 className="text-lg sm:text-xl font-bold mt-4 text-white">{t('threats.submission_success_title')}</h4>
                        <p className="text-gray-300 mt-1">{t('threats.submission_success_desc')}</p>
                        <button 
                            onClick={() => setIsSubmitted(false)}
                            className="mt-6 py-3 px-6 bg-purple-accent text-white font-semibold rounded-lg hover:bg-purple-light transition-colors"
                        >
                            {t('threats.submit_another')}
                        </button>
                    </div>
                ) : (
                    <>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('threats.community_subtitle')}</p>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input 
                                type="text" 
                                placeholder={t('threats.form_title')} 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-accent"
                            />
                            <textarea 
                                placeholder={t('threats.form_description')} 
                                rows={3} 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full bg-gray-100 dark:bg-gray-800 p-3 rounded-lg border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-accent"
                            ></textarea>
                            {error && <p className="text-sm text-red-400 -mt-2">{error}</p>}
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button type="submit" className="flex-1 py-3 bg-purple-accent text-white font-semibold rounded-lg hover:bg-purple-light transition-colors">{t('threats.submit_report')}</button>
                                <button type="button" className="flex-1 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors">{t('threats.browse_reports')}</button>
                            </div>
                        </form>
                    </>
                )}
            </div>
        </div>
    </div>
  );
};

export default ThreatsCommunity;