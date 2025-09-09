// Full implementation of App.tsx to resolve module and rendering errors.
import React, { useState, useEffect } from 'react';
import type { Page, URLSafetyReport, ImageAnalysisReport, VideoAnalysisReport, ScanHistoryItem, Stats, ScanSettings, FeedItem, CommunityStats, ActiveAlert, FamilyMember, FamilyAlert, FamilyMemberStatus, PdfAnalysisReport } from './types';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RealTimeScanning from './pages/RealTimeScanning';
import Scanner from './pages/Scanner';
import Assistant from './pages/Assistant';
import ThreatsCommunity from './pages/ThreatsCommunity';
import Family from './pages/Family';

const App: React.FC = () => {
    const [theme, setTheme] = useState<'light' | 'dark'>(() => {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    });
    const [currentPage, setCurrentPage] = useState<Page>('Dashboard');

    // Scanner state
    const [url, setUrl] = useState('');
    const [urlReport, setUrlReport] = useState<URLSafetyReport | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageReport, setImageReport] = useState<ImageAnalysisReport | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [videoReport, setVideoReport] = useState<VideoAnalysisReport | null>(null);
    const [pdfPreview, setPdfPreview] = useState<string | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfReport, setPdfReport] = useState<PdfAnalysisReport | null>(null);
    const [scanHistory, setScanHistory] = useState<ScanHistoryItem[]>([]);

    const addScanToHistory = (item: ScanHistoryItem) => {
        setScanHistory(prev => [item, ...prev.slice(0, 9)]); // Keep last 10 items
    };

    // Real-Time Scanning state
    const [isProtectionActive, setIsProtectionActive] = useState(true);
    const [stats, setStats] = useState<Stats>({
        messages: { scanned: 1420, blocked: 23 },
        images: { scanned: 890, flagged: 12 },
        videos: { scanned: 340, deepfakes: 5 },
    });
    const [scanSettings, setScanSettings] = useState<ScanSettings>({
        messages: true,
        images: true,
        videos: false,
    });
    const [feedItems, setFeedItems] = useState<FeedItem[]>([
        { id: 1, status: 'safe', type: 'message', content: 'Your package is on its way!', source: 'Amazon', time: '1m ago' },
        { id: 2, status: 'suspicious', type: 'image', content: 'Image from unknown contact', source: 'WhatsApp', time: '3m ago' },
        { id: 3, status: 'dangerous', type: 'message', content: 'Click here to claim your prize!', source: 'SMS', time: '5m ago' },
    ]);

    // Threats & Community State
    const [communityStats, setCommunityStats] = useState<CommunityStats>({
        activeUsers: 89234,
        reportsThisMonth: 24567,
        activePhishingSites: 1247,
        communityAccuracy: 97.3,
    });
    const [activeAlerts, setActiveAlerts] = useState<ActiveAlert[]>([
        { id: 1, title: 'Banking phishing campaign', affected: '12k+', level: 'HIGH' },
        { id: 2, title: 'WhatsApp investment scam', affected: '5.6k', level: 'CRITICAL' },
        { id: 3, title: 'Celebrity deepfakes', affected: '890', level: 'MEDIUM' },
    ]);
    
    // Family State
    const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([
        { id: 1, name: 'You', isYou: true, device: 'This Device', status: 'Protected' },
        { id: 2, name: 'Alice', device: 'iPhone 15', status: 'Protected' },
        { id: 3, name: 'Bob', device: 'Galaxy S23', status: 'At Risk' },
        { id: 4, name: 'Charlie', device: 'Windows PC', status: 'Needs Attention' },
    ]);
    const [familyAlerts, setFamilyAlerts] = useState<FamilyAlert[]>([
        { id: 1, titleKey: 'family.alert1_title', memberName: 'Bob', time: '15 mins ago' },
        { id: 2, titleKey: 'family.alert2_title', memberName: 'Charlie', time: '1 hour ago' },
        { id: 3, titleKey: 'family.alert3_title', memberName: 'Bob', time: '3 hours ago' },
    ]);

    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === 'dark');
    }, [theme]);

    // Real-time protection simulation
    useEffect(() => {
        if (!isProtectionActive) return;

        const interval = setInterval(() => {
            const randomType = (['message', 'image', 'video'] as const)[Math.floor(Math.random() * 3)];
            const randomStatus = (['safe', 'safe', 'safe', 'suspicious', 'dangerous'] as const)[Math.floor(Math.random() * 5)];
            
            setStats(prev => {
                const newStats = { ...prev };
                if (randomType === 'message') newStats.messages.scanned++;
                if (randomType === 'image') newStats.images.scanned++;
                if (randomType === 'video') newStats.videos.scanned++;

                if (randomStatus === 'dangerous') newStats.messages.blocked++;
                if (randomStatus === 'suspicious' && randomType === 'image') newStats.images.flagged++;
                if (randomStatus === 'suspicious' && randomType === 'video') newStats.videos.deepfakes++;

                return newStats;
            });

            setFeedItems(prev => {
                const newId = Math.max(...prev.map(i => i.id), 0) + 1;
                const newItem: FeedItem = {
                    id: newId,
                    status: randomStatus,
                    type: randomType,
                    content: `New ${randomType} detected and scanned.`,
                    source: 'System',
                    time: 'Just now'
                };
                return [newItem, ...prev.slice(0, 15)];
            });

        }, 5000);

        return () => clearInterval(interval);
    }, [isProtectionActive]);

    // Community stats & alerts simulation
    useEffect(() => {
        const statsInterval = setInterval(() => {
            setCommunityStats(prev => ({
                // Fluctuate active users slightly up or down to simulate logins/logouts
                activeUsers: prev.activeUsers + Math.floor((Math.random() - 0.45) * 8),
                // Increase reports by a more varied random amount
                reportsThisMonth: prev.reportsThisMonth + Math.floor(Math.random() * 5) + 1,
                // Phishing sites can be discovered (increase) or taken down (decrease)
                activePhishingSites: Math.max(1000, prev.activePhishingSites + Math.floor((Math.random() - 0.5) * 4)),
                // Accuracy fluctuates slightly
                communityAccuracy: Math.min(99.8, Math.max(96.0, prev.communityAccuracy + (Math.random() - 0.48) * 0.1))
            }));
        }, 2500);

        const newAlertTemplates: Omit<ActiveAlert, 'id' | 'affected'>[] = [
            { title: 'New crypto wallet drainer links', level: 'CRITICAL' },
            { title: 'Fake tech support pop-ups', level: 'MEDIUM' },
            { title: 'Social media account takeover scheme', level: 'HIGH' },
            { title: 'Malicious browser extension detected', level: 'HIGH' },
            { title: 'Package delivery text scam', level: 'MEDIUM' },
        ];
        
        const alertInterval = setInterval(() => {
            const template = newAlertTemplates[Math.floor(Math.random() * newAlertTemplates.length)];
            const newAlert: ActiveAlert = {
                id: Date.now(),
                ...template,
                affected: `${(Math.random() * 10).toFixed(1)}k`
            };
            setActiveAlerts(prev => [newAlert, ...prev.slice(0, 4)]);
        }, 15000);

        return () => {
            clearInterval(statsInterval);
            clearInterval(alertInterval);
        };
    }, []);

    // Family simulation
    useEffect(() => {
        const alertTemplates: { titleKey: string; status: FamilyMemberStatus }[] = [
            { titleKey: 'family.alert1_title', status: 'At Risk' },
            { titleKey: 'family.alert2_title', status: 'At Risk' },
            { titleKey: 'family.alert3_title', status: 'Needs Attention' },
        ];
    
        const interval = setInterval(() => {
            const eligibleMembers = familyMembers.filter(m => !m.isYou);
            if (eligibleMembers.length === 0) return;
    
            const randomMember = eligibleMembers[Math.floor(Math.random() * eligibleMembers.length)];
            const randomAlert = alertTemplates[Math.floor(Math.random() * alertTemplates.length)];
    
            const newAlert: FamilyAlert = {
                id: Date.now(),
                titleKey: randomAlert.titleKey,
                memberName: randomMember.name,
                time: 'Just now',
            };
    
            setFamilyMembers(prevMembers =>
                prevMembers.map(member =>
                    member.id === randomMember.id ? { ...member, status: randomAlert.status } : member
                )
            );
    
            setFamilyAlerts(prevAlerts => [newAlert, ...prevAlerts.slice(0, 4)]);
    
        }, 20000);
    
        return () => clearInterval(interval);
    }, [familyMembers]);
    
    const currentUserDevice = familyMembers.find(m => m.isYou)?.device || 'Current Device';

    return (
        <Layout
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            theme={theme}
            setTheme={setTheme}
            deviceName={currentUserDevice}
        >
            <div style={{ display: currentPage === 'Dashboard' ? 'block' : 'none' }}>
                <Dashboard stats={stats} />
            </div>
            <div style={{ display: currentPage === 'Real-Time Scanning' ? 'block' : 'none' }}>
                <RealTimeScanning 
                    isProtectionActive={isProtectionActive}
                    setIsProtectionActive={setIsProtectionActive}
                    stats={stats}
                    scanSettings={scanSettings}
                    setScanSettings={setScanSettings}
                    feedItems={feedItems}
                />
            </div>
            <div style={{ display: currentPage === 'Scanner' ? 'block' : 'none' }}>
                <Scanner
                    url={url} setUrl={setUrl}
                    urlReport={urlReport} setUrlReport={setUrlReport}
                    imagePreview={imagePreview} setImagePreview={setImagePreview}
                    imageReport={imageReport} setImageReport={setImageReport}
                    videoPreview={videoPreview} setVideoPreview={setVideoPreview}
                    videoReport={videoReport} setVideoReport={setVideoReport}
                    pdfPreview={pdfPreview} setPdfPreview={setPdfPreview}
                    pdfFile={pdfFile} setPdfFile={setPdfFile}
                    pdfReport={pdfReport} setPdfReport={setPdfReport}
                    scanHistory={scanHistory} addScanToHistory={addScanToHistory}
                />
            </div>
            <div style={{ display: currentPage === 'Assistant' ? 'block' : 'none' }}>
                <Assistant />
            </div>
            <div style={{ display: currentPage === 'Threats & Community' ? 'block' : 'none' }}>
                <ThreatsCommunity communityStats={communityStats} activeAlerts={activeAlerts} />
            </div>
            <div style={{ display: currentPage === 'Family' ? 'block' : 'none' }}>
                <Family familyMembers={familyMembers} familyAlerts={familyAlerts} />
            </div>
        </Layout>
    );
};

export default App;