import React, { useState, useEffect, useRef, Fragment } from 'react';
import type { Page } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  DashboardIcon,
  LiveIcon,
  ScannerIcon,
  AssistantIcon,
  ThreatsIcon,
  FamilyIcon,
  SunIcon,
  MoonIcon,
  MenuIcon,
  CloseIcon,
  GlobeIcon,
  ChevronDownIcon,
  UserCircleIcon,
} from './icons';

interface LayoutProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  children: React.ReactNode;
  deviceName: string;
}

const navItems: { page: Page; icon: React.FC<{ className?: string }>; labelKey: string }[] = [
  { page: 'Dashboard', icon: DashboardIcon, labelKey: 'sidebar.dashboard' },
  { page: 'Real-Time Scanning', icon: LiveIcon, labelKey: 'sidebar.real-time_scanning' },
  { page: 'Scanner', icon: ScannerIcon, labelKey: 'sidebar.scanner' },
  { page: 'Assistant', icon: AssistantIcon, labelKey: 'sidebar.assistant' },
  { page: 'Threats & Community', icon: ThreatsIcon, labelKey: 'sidebar.threats_and_community' },
  { page: 'Family', icon: FamilyIcon, labelKey: 'header.family' },
];

const ProfileDropdown: React.FC<{ theme: 'light' | 'dark'; setTheme: (theme: 'light' | 'dark') => void; deviceName: string; }> = ({ theme, setTheme, deviceName }) => {
    const { language, setLanguage, t } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const languages = [
        { code: 'en', name: 'English' },
        { code: 'ta', name: 'Tamil' },
        { code: 'hi', name: 'Hindi' },
    ];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700/50 transition-colors"
            >
                <UserCircleIcon className="w-6 h-6" />
            </button>
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10 animate-fade-in">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                        <p className="text-sm font-semibold text-gray-800 dark:text-white">{t('family.you')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{deviceName}</p>
                    </div>
                    <div className="p-2">
                        {/* Language Selector */}
                        <div className="relative">
                             <div className="flex items-center justify-between p-2">
                                <span className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2"><GlobeIcon className="w-5 h-5"/> Language</span>
                            </div>
                            <div className="flex items-center justify-center p-1 bg-gray-100 dark:bg-gray-900 rounded-md">
                                {languages.map(lang => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code as 'en' | 'ta' | 'hi')}
                                        className={`flex-1 text-center text-xs font-semibold py-1 rounded transition-colors ${language === lang.code ? 'bg-purple-accent text-white' : 'text-gray-600 dark:text-gray-300'}`}
                                    >
                                        {lang.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Theme Toggle */}
                        <button
                            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                            className="w-full flex justify-between items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors mt-1"
                        >
                            <span className="text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                {theme === 'dark' ? <SunIcon className="w-5 h-5"/> : <MoonIcon className="w-5 h-5" />}
                                Theme
                            </span>
                             <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{theme === 'dark' ? 'Light' : 'Dark'}</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};


const SidebarContent: React.FC<{ currentPage: Page; setCurrentPage: (page: Page) => void; closeSidebar?: () => void }> = ({ currentPage, setCurrentPage, closeSidebar }) => {
    const { t } = useLanguage();

    const handleNav = (page: Page) => {
        setCurrentPage(page);
        if (closeSidebar) closeSidebar();
    }

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex items-center justify-center md:justify-start">
                <div className="flex items-center gap-2">
                    <svg className="w-8 h-8 text-purple-accent" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5-10-5-10 5z" />
                    </svg>
                    <h1 className="text-xl font-bold text-gray-800 dark:text-white hidden lg:block">Digital Guardian</h1>
                </div>
            </div>
            <nav className="flex-grow p-2 space-y-1">
                {navItems.map(item => (
                    <button
                        key={item.page}
                        onClick={() => handleNav(item.page)}
                        title={t(item.labelKey)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors justify-center md:justify-start ${currentPage === item.page
                                ? 'bg-purple-accent/10 text-purple-accent'
                                : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                    >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        <span className="hidden lg:inline">{t(item.labelKey)}</span>
                    </button>
                ))}
            </nav>
             <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                 <p className="text-xs text-center text-gray-500 dark:text-gray-400 hidden lg:block">{t('sidebar.tagline')}</p>
             </div>
        </div>
    );
};

const Layout: React.FC<LayoutProps> = ({ currentPage, setCurrentPage, theme, setTheme, children, deviceName }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-gray-100 dark:bg-gray-950 text-gray-800 dark:text-gray-200">
            {/* Desktop & Tablet Sidebar */}
            <aside className="hidden md:block flex-shrink-0 transition-all duration-300 ease-in-out lg:w-64 md:w-20">
                <SidebarContent currentPage={currentPage} setCurrentPage={setCurrentPage} />
            </aside>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
                <div className="md:hidden fixed inset-0 z-40" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-black/30" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
                    <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white dark:bg-gray-900">
                         <div className="absolute top-0 right-0 -mr-12 pt-2">
                             <button
                                type="button"
                                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className="sr-only">Close sidebar</span>
                                <CloseIcon className="h-6 w-6 text-white" aria-hidden="true" />
                            </button>
                         </div>
                        <SidebarContent currentPage={currentPage} setCurrentPage={setCurrentPage} closeSidebar={() => setSidebarOpen(false)} />
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                 <header className="flex justify-between items-center p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
                     <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-gray-500 dark:text-gray-400 md:hidden">
                         <MenuIcon className="w-6 h-6" />
                     </button>
                     <div className="flex-grow"></div>
                     <div className="flex items-center gap-2">
                         <ProfileDropdown theme={theme} setTheme={setTheme} deviceName={deviceName} />
                     </div>
                 </header>

                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout;