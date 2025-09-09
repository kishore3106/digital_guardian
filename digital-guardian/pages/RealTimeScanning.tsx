import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { SettingsIcon } from '../components/icons';
import { SafeIcon, WarningIcon, DangerousIcon } from '../components/icons/StatusIcons';
import SettingsModal from '../components/SettingsModal';
import type { Stats, FeedItem, ScanSettings } from '../types';

interface RealTimeScanningProps {
    isProtectionActive: boolean;
    setIsProtectionActive: (isActive: boolean) => void;
    stats: Stats;
    scanSettings: ScanSettings;
    setScanSettings: (settings: ScanSettings) => void;
    feedItems: FeedItem[];
}

const RealTimeScanning: React.FC<RealTimeScanningProps> = ({
    isProtectionActive,
    setIsProtectionActive,
    stats,
    scanSettings,
    setScanSettings,
    feedItems
}) => {
    const { t } = useLanguage();
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    
    useEffect(() => {
        // This effect triggers the pulse animation on the stat cards
        if (feedItems.length > 0 && feedItems[0].time === 'Just now') {
            const lastItemType = feedItems[0].type;
            setLastUpdated(lastItemType);
            const timer = setTimeout(() => setLastUpdated(null), 700);
            return () => clearTimeout(timer);
        }
    }, [feedItems]);


    const statusIcons = {
        safe: <SafeIcon className="w-5 h-5 text-green-500" />,
        suspicious: <WarningIcon className="w-5 h-5 text-yellow-500" />,
        dangerous: <DangerousIcon className="w-5 h-5 text-red-500" />,
    };

    const typeLabels = {
        message: 'Message',
        image: 'Image',
        video: 'Video',
    };

    const totalThreats = stats.messages.blocked + stats.images.flagged + stats.videos.deepfakes;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">{t('realtime.title')}</h2>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">
                        {isProtectionActive ? t('realtime.subtitle_active') : t('realtime.subtitle_disabled')}
                    </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                     <span className={`px-3 py-1 text-sm font-semibold rounded-full ${isProtectionActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                        {isProtectionActive ? t('realtime.active') : t('realtime.disabled')}
                    </span>
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="p-2.5 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors"
                        aria-label="Open settings"
                    >
                        <SettingsIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => setIsProtectionActive(!isProtectionActive)}
                        className={`px-4 py-2 font-semibold rounded-lg transition-colors text-sm sm:text-base ${isProtectionActive ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                    >
                        {isProtectionActive ? t('realtime.disable_button') : t('realtime.enable_button')}
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                    title={t('realtime.messages')} 
                    value={stats.messages.scanned.toLocaleString()} 
                    subValue={stats.messages.blocked.toLocaleString()} 
                    subLabel={t('dashboard.threats_blocked')} 
                    isUpdating={lastUpdated === 'message'}
                />
                <StatCard 
                    title={t('realtime.images')} 
                    value={stats.images.scanned.toLocaleString()} 
                    subValue={stats.images.flagged.toLocaleString()} 
                    subLabel={t('realtime.flagged')} 
                    isUpdating={lastUpdated === 'image'}
                />
                <StatCard 
                    title={t('realtime.videos')} 
                    value={stats.videos.scanned.toLocaleString()} 
                    subValue={stats.videos.deepfakes.toLocaleString()} 
                    subLabel={t('realtime.deepfakes')} 
                    isUpdating={lastUpdated === 'video'}
                />
                <StatCard 
                    title={t('realtime.analysis_summary')} 
                    value={totalThreats.toLocaleString()} 
                    subValue="" 
                    subLabel={t('realtime.threats_blocked')} 
                    bigValue={true} 
                    isUpdating={lastUpdated !== null}
                />
            </div>

            {/* Live Feed */}
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">{t('realtime.feed_title')}</h3>
                {!isProtectionActive ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        <p>{t('realtime.feed_paused')}</p>
                    </div>
                ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {feedItems.map(item => (
                            <div key={item.id} className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-lg flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 animate-slide-up-fade-in-fast">
                                <div className="flex items-center gap-4 w-full">
                                    <div className="p-2 bg-white/50 dark:bg-gray-900/50 rounded-full flex-shrink-0">
                                        {statusIcons[item.status]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 dark:text-white truncate" title={item.content}>
                                            {item.content}
                                        </p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            <span className={`font-medium text-xs px-1.5 py-0.5 rounded-md mr-2 ${ {message: 'bg-blue-500/10 text-blue-500', image: 'bg-purple-500/10 text-purple-500', video: 'bg-pink-500/10 text-pink-500'}[item.type] }`}>
                                                {typeLabels[item.type]}
                                            </span>
                                            from {item.source}
                                        </p>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap self-end sm:self-center">{item.time}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
             <SettingsModal 
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                settings={scanSettings}
                onSettingsChange={setScanSettings}
            />
        </div>
    );
};


const StatCard: React.FC<{title: string, value: string, subValue: string, subLabel: string, bigValue?: boolean, isUpdating?: boolean}> = ({title, value, subValue, subLabel, bigValue, isUpdating}) => {
    if(bigValue) {
        return (
             <div className={`bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col items-center justify-center text-center transition-colors duration-300 ${isUpdating ? 'animate-pulse-bg' : ''}`}>
                 <p className="text-3xl sm:text-5xl font-bold text-red-500">{value}</p>
                 <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2">{subLabel}</p>
            </div>
        )
    }
    return (
        <div className={`bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-300 ${isUpdating ? 'animate-pulse-bg' : ''}`}>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mt-1">{value}</p>
            <p className="text-sm text-red-500 font-semibold mt-2">{subValue} {subLabel}</p>
        </div>
    );
};


export default RealTimeScanning;