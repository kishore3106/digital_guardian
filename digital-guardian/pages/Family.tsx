import React from 'react';
import { FamilyIcon } from '../components/icons';
import { useLanguage } from '../context/LanguageContext';
import type { FamilyMember, FamilyAlert as FamilyAlertType } from '../types';

const FamilyMemberCard = ({ name, device, status }) => {
    const { t } = useLanguage();
    const statusConfig = {
        Protected: { bg: 'bg-green-500/10', text: 'text-green-500', dot: 'bg-green-500' },
        'At Risk': { bg: 'bg-red-500/10', text: 'text-red-500', dot: 'bg-red-500' },
        'Needs Attention': { bg: 'bg-yellow-500/10', text: 'text-yellow-500', dot: 'bg-yellow-500' },
    };
    const config = statusConfig[status] || statusConfig['Needs Attention'];
    const translatedStatus = t(`family.status_${status.toLowerCase().replace(' ', '_')}`);

    return (
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-bold text-lg text-gray-800 dark:text-white">{name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{device}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center font-bold text-purple-accent">
                    {name.substring(0, 2).toUpperCase()}
                </div>
            </div>
            <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${config.bg} ${config.text}`}>
                <span className={`h-2 w-2 rounded-full ${config.dot}`}></span>
                {translatedStatus}
            </div>
        </div>
    );
};

const FamilyAlert = ({ title, member, time }) => (
    <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-lg flex justify-between items-center animate-slide-up-fade-in-fast">
        <div>
            <p className="font-semibold text-red-500">{title}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Detected on {member}'s device</p>
        </div>
        <span className="text-xs text-gray-400 dark:text-gray-500">{time}</span>
    </div>
);

interface FamilyProps {
    familyMembers: FamilyMember[];
    familyAlerts: FamilyAlertType[];
}

const Family: React.FC<FamilyProps> = ({ familyMembers, familyAlerts }) => {
    const { t } = useLanguage();

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {familyMembers.map(member => (
                    <FamilyMemberCard 
                        key={member.id} 
                        name={member.isYou ? t('family.you') : member.name}
                        device={member.isYou ? t('family.this_device') : member.device}
                        status={member.status}
                    />
                ))}
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">{t('family.recent_alerts')}</h3>
                <div className="space-y-3">
                    {familyAlerts.map((alert) => (
                        <FamilyAlert 
                            key={alert.id} 
                            title={t(alert.titleKey)} 
                            member={alert.memberName} 
                            time={alert.time} 
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Family;