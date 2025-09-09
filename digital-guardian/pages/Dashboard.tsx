import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { ThreatsIcon, ScannerIcon, FamilyIcon, AssistantIcon } from '../components/icons';
import type { RecentActivity, Stats } from '../types';

const StatCard: React.FC<{ title: string; value: string; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm hover:border-purple-accent/50 transition-all duration-300 transform hover:-translate-y-1">
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
            </div>
            <div className="bg-purple-accent/10 p-3 rounded-lg text-purple-accent">
                {icon}
            </div>
        </div>
    </div>
);

const SimpleBarChart: React.FC<{ title: string; data: { label: string; value: number }[]; isAnimated: boolean; }> = ({ title, data, isAnimated }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const { t } = useLanguage();

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm h-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{title}</h3>
            <div className="h-64 flex items-end justify-around gap-2">
                {data.map((item, index) => (
                    <div key={item.label} className="flex-1 flex flex-col items-center justify-end h-full group">
                         <div className="relative w-full h-full flex items-end justify-center">
                             <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
                                <div className="bg-gray-800 dark:bg-black text-white text-xs font-bold px-2 py-1 rounded-md shadow-lg relative">
                                    {item.value.toLocaleString()}
                                    <div className="absolute w-2 h-2 bg-gray-800 dark:bg-black transform rotate-45 -bottom-1 left-1/2 -translate-x-1/2"></div>
                                </div>
                            </div>
                            <div 
                                className="w-4/5 bg-gradient-to-t from-purple-accent to-purple-light rounded-t-md transition-all ease-out group-hover:opacity-100 opacity-80"
                                style={{ 
                                    height: isAnimated ? `${(item.value / maxValue) * 100}%` : '0%',
                                    transitionDuration: '1s',
                                    transitionDelay: `${index * 100}ms`
                                }}
                            >
                            </div>
                        </div>
                        <p className="text-xs text-center mt-2 text-gray-500 dark:text-gray-400">{item.label}</p>
                    </div>
                ))}
            </div>
             <p className="text-center text-xs text-gray-400 mt-2">{t('dashboard.time')}</p>
        </div>
    );
};

const SvgDonutChart: React.FC<{ title: string; data: { label: string; value: number; color: string }[]; isAnimated: boolean; }> = ({ title, data, isAnimated }) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    let cumulativePercent = 0;
    
    const hoveredData = hoveredIndex !== null ? data[hoveredIndex] : null;

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm h-full">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{title}</h3>
            <div className="flex flex-col md:flex-row items-center justify-center gap-6" onMouseLeave={() => setHoveredIndex(null)}>
                <div className="relative w-40 h-40">
                    <svg viewBox="0 0 100 100" className="transform -rotate-90">
                        {data.map((item, index) => {
                            const percent = (item.value / total) * 100;
                            const offset = (cumulativePercent / 100) * circumference;
                            cumulativePercent += percent;
                            
                            return (
                                <circle
                                    key={index}
                                    r={radius}
                                    cx="50"
                                    cy="50"
                                    fill="transparent"
                                    stroke={item.color}
                                    strokeWidth="10"
                                    strokeDasharray={circumference}
                                    strokeDashoffset={isAnimated ? circumference - (percent/100 * circumference) : circumference}
                                    transform={`rotate(${(offset / circumference) * 360} 50 50)`}
                                    className="cursor-pointer"
                                    style={{
                                        transition: 'stroke-dashoffset 1s ease-out, opacity 0.3s, transform 0.3s',
                                        transitionDelay: isAnimated ? `${200 + index * 150}ms` : '0ms',
                                        transformOrigin: '50% 50%',
                                        transform: hoveredIndex === index ? 'scale(1.05)' : 'scale(1)',
                                        opacity: hoveredIndex !== null && hoveredIndex !== index ? 0.3 : 1,
                                    }}
                                    onMouseEnter={() => setHoveredIndex(index)}
                                />
                            );
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
                        {hoveredData ? (
                            <>
                                <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white transition-all duration-200">
                                    {((hoveredData.value / total) * 100).toFixed(0)}%
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400 transition-all duration-200 truncate">{hoveredData.label}</span>
                            </>
                        ) : (
                            <>
                                <span className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{total}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">Total</span>
                            </>
                        )}
                    </div>
                </div>
                <div className="flex-1 w-full md:w-auto space-y-2 text-sm justify-between">
                    {data.map((item, index) => (
                        <div 
                            key={item.label} 
                            onMouseEnter={() => setHoveredIndex(index)}
                            className={`flex items-center justify-between gap-2 transition-all ease-out duration-300 cursor-pointer ${isAnimated ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'} ${hoveredIndex !== null && hoveredIndex !== index ? 'opacity-50' : 'opacity-100'}`}
                            style={{ transitionDelay: `${400 + index * 100}ms` }}
                        >
                           <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: item.color }} />
                                <span className="text-gray-600 dark:text-gray-300">{item.label}</span>
                           </div>
                            <span className="font-semibold text-gray-800 dark:text-white">
                                {((item.value / total) * 100).toFixed(0)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const RecentActivityTable: React.FC = () => {
    const activities: RecentActivity[] = [
        { id: 1, type: 'Phishing', content: 'Link blocked from SMS', time: '2m ago', user: 'Alice' },
        { id: 2, type: 'Malware', content: 'Suspicious file deleted', time: '15m ago', user: 'You' },
        { id: 3, type: 'Safe', content: 'URL scan passed', time: '45m ago', user: 'Bob' },
        { id: 4, type: 'Scam', content: 'WhatsApp message flagged', time: '1h ago', user: 'You' },
    ];
    
    const typeStyles = {
        Phishing: { icon: '🚨', bg: 'bg-red-500/10', text: 'text-red-400' },
        Malware: { icon: '🐞', bg: 'bg-orange-500/10', text: 'text-orange-400' },
        Scam: { icon: '💬', bg: 'bg-yellow-500/10', text: 'text-yellow-400' },
        Safe: { icon: '✅', bg: 'bg-green-500/10', text: 'text-green-400' },
    };

    return (
        <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Recent Activity</h3>
            <div className="mt-4 space-y-4">
                {activities.map(activity => (
                     <div key={activity.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
                        <div className="flex items-center gap-4">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${typeStyles[activity.type].bg} flex-shrink-0`}>
                               <span className="text-lg">{typeStyles[activity.type].icon}</span>
                            </div>
                            <div>
                                <p className="font-semibold text-gray-800 dark:text-white">{activity.content}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    <span className={`font-medium ${typeStyles[activity.type].text}`}>{activity.type}</span> detected for {activity.user}
                                </p>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 dark:text-gray-500 whitespace-nowrap sm:text-right w-full sm:w-auto mt-2 sm:mt-0 pl-14 sm:pl-0">{activity.time}</p>
                     </div>
                ))}
            </div>
        </div>
    );
};


const Dashboard: React.FC<{ stats: Stats }> = ({ stats }) => {
    const { t } = useLanguage();
    const [isAnimated, setIsAnimated] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsAnimated(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const totalThreatsBlocked = stats.messages.blocked + stats.images.flagged + stats.videos.deepfakes;
    const totalContentScanned = stats.messages.scanned + stats.images.scanned + stats.videos.scanned;
    const aiAccuracy = totalContentScanned > 0 ? (((totalContentScanned - totalThreatsBlocked) / totalContentScanned) * 100).toFixed(1) + '%' : '100.0%';
    
    const scanData = [
        { label: '00:00', value: 120 }, { label: '04:00', value: 200 },
        { label: '08:00', value: 800 }, { label: '12:00', value: 1500 },
        { label: '16:00', value: 1100 }, { label: '20:00', value: 600 },
    ];

    const threatData = [
        { label: 'Phishing', value: 45, color: '#ef4444' },
        { label: 'Malware', value: 25, color: '#f97316' },
        { label: 'Scams', value: 20, color: '#eab308' },
        { label: 'Other', value: 10, color: '#8250df' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title={t('dashboard.threats_blocked')} value={totalThreatsBlocked.toLocaleString()} icon={<ThreatsIcon className="w-6 h-6" />} />
                <StatCard title={t('dashboard.content_scanned')} value={totalContentScanned.toLocaleString()} icon={<ScannerIcon className="w-6 h-6" />} />
                <StatCard title={t('dashboard.family_protected')} value="4/4" icon={<FamilyIcon className="w-6 h-6" />} />
                <StatCard title={t('dashboard.ai_accuracy')} value={aiAccuracy} icon={<AssistantIcon className="w-6 h-6" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-3">
                    <SimpleBarChart title={t('dashboard.traffic_scans')} data={scanData} isAnimated={isAnimated} />
                </div>
                <div className="lg:col-span-2">
                    <SvgDonutChart title={t('dashboard.threat_mix')} data={threatData} isAnimated={isAnimated} />
                </div>
            </div>

            <RecentActivityTable />
        </div>
    );
};

export default Dashboard;