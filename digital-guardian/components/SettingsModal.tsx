import React from 'react';
import { useLanguage } from '../context/LanguageContext';

interface ScanSettings {
    messages: boolean;
    images: boolean;
    videos: boolean;
}

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    settings: ScanSettings;
    onSettingsChange: (newSettings: ScanSettings) => void;
}

const ToggleSwitch: React.FC<{ label: string; description: string; isEnabled: boolean; onToggle: () => void; }> = ({ label, description, isEnabled, onToggle }) => {
    return (
        <div className="flex items-start justify-between py-4 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
            <div className="pr-4">
                <p className="font-semibold text-gray-800 dark:text-white">{label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <button
                role="switch"
                aria-checked={isEnabled}
                onClick={onToggle}
                className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors flex-shrink-0 ${isEnabled ? 'bg-purple-accent' : 'bg-gray-300 dark:bg-gray-600'}`}
            >
                <span
                    className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`}
                />
            </button>
        </div>
    );
};


const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingsChange }) => {
    const { t } = useLanguage();

    if (!isOpen) return null;

    const handleToggle = (key: keyof ScanSettings) => {
        onSettingsChange({ ...settings, [key]: !settings[key] });
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div 
                className="bg-white dark:bg-gray-900 w-full max-w-lg m-4 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-6 animate-slide-up-fade-in-fast"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">{t('realtime.settings.title')}</h2>
                
                <div className="space-y-2">
                    <ToggleSwitch
                        label={t('realtime.settings.block_messages_label')}
                        description={t('realtime.settings.block_messages_desc')}
                        isEnabled={settings.messages}
                        onToggle={() => handleToggle('messages')}
                    />
                    <ToggleSwitch
                        label={t('realtime.settings.scan_images_label')}
                        description={t('realtime.settings.scan_images_desc')}
                        isEnabled={settings.images}
                        onToggle={() => handleToggle('images')}
                    />
                     <ToggleSwitch
                        label={t('realtime.settings.analyze_videos_label')}
                        description={t('realtime.settings.analyze_videos_desc')}
                        isEnabled={settings.videos}
                        onToggle={() => handleToggle('videos')}
                    />
                </div>

                <div className="mt-6 text-right">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-purple-accent text-white font-semibold rounded-lg hover:bg-purple-light focus:outline-none focus:ring-2 focus:ring-purple-accent transition-colors"
                    >
                        {t('realtime.settings.done_button')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
