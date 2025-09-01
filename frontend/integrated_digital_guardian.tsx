import React, { useEffect, useMemo, useState } from 'react';
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Globe,
  Eye,
  Users,
  TrendingUp,
  Bot,
  Scan,
  Image,
  Video,
  Send,
  ExternalLink,
  Clock,
  X,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const sampleLine = [
  { name: '00:00', scanned: 120 },
  { name: '02:00', scanned: 220 },
  { name: '04:00', scanned: 430 },
  { name: '06:00', scanned: 320 },
  { name: '08:00', scanned: 760 },
  { name: '10:00', scanned: 980 },
  { name: '12:00', scanned: 1543 }
];

const samplePie = [
  { name: 'Banking Phishing', value: 35 },
  { name: 'Investment Scams', value: 24 },
  { name: 'Fake News', value: 18 },
  { name: 'Deepfakes', value: 15 },
  { name: 'Govt Frauds', value: 8 }
];

const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#8b5cf6', '#3b82f6'];

// URL analysis patterns
const SUSPICIOUS_PATTERNS = {
  phishing: [
    /secure.*bank/i,
    /verify.*account/i,
    /update.*payment/i,
    /suspend.*account/i,
    /confirm.*identity/i,
    /urgent.*action/i,
    /click.*here.*now/i,
    /limited.*time/i
  ],
  malware: [
    /download.*exe/i,
    /install.*software/i,
    /free.*antivirus/i,
    /system.*infected/i,
    /speed.*up.*pc/i
  ],
  scam: [
    /winner.*prize/i,
    /congratulations.*won/i,
    /claim.*reward/i,
    /special.*offer/i,
    /act.*now/i,
    /limited.*offer/i
  ]
};

const DOMAIN_BLACKLIST = [
  'phishing-test.com',
  'fake-bank.net',
  'suspicious-site.org',
  'malware-host.ru',
  'scam-site.tk'
];

const LEGITIMATE_DOMAINS = [
  'google.com',
  'microsoft.com',
  'amazon.com',
  'facebook.com',
  'twitter.com',
  'linkedin.com',
  'github.com',
  'stackoverflow.com',
  'wikipedia.org',
  'youtube.com'
];

export default function DigitalGuardianIntegrated() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [incomingNotifications, setIncomingNotifications] = useState([]);
  const [realTimeProtection, setRealTimeProtection] = useState(true);
  const [scanResults, setScanResults] = useState([]);
  const [isScanning, setIsScanning] = useState(false);
  const [chatHistory, setChatHistory] = useState([
    { role: 'bot', text: "Hi — I'm your AI Security Assistant. Upload content or ask about a suspicious item." }
  ]);
  const [chatMessage, setChatMessage] = useState('');
  const [apiMode, setApiMode] = useState('local');
  const [urlToScan, setUrlToScan] = useState('');
  const [urlScanResult, setUrlScanResult] = useState(null);
  const [urlScanHistory, setUrlScanHistory] = useState([]);

  useEffect(() => {
    if (!realTimeProtection) return;
    const id = setInterval(() => {
      if (Math.random() > 0.6) {
        const sample = {
          id: Date.now() + Math.random(),
          app: 'WhatsApp',
          sender: 'Unknown',
          type: ['message', 'image', 'video'][Math.floor(Math.random() * 3)],
          content: ['Urgent: verify your UPI', 'Shared image: govt-scheme.png', 'Watch this celebrity video'][Math.floor(Math.random() * 3)],
          timestamp: new Date()
        };
        setIncomingNotifications(p => [sample, ...p].slice(0, 20));
      }
    }, 9000);
    return () => clearInterval(id);
  }, [realTimeProtection]);

  const stats = useMemo(() => ({ blocked: 127, scanned: 1543, familyProtected: 4, accuracy: 94.7 }), []);

  // Enhanced URL Analysis Function
  async function analyzeURL(url) {
    setIsScanning(true);
    setUrlScanResult(null);

    try {
      // Normalize URL
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      const path = urlObj.pathname.toLowerCase();
      const fullUrl = url.toLowerCase();

      let riskScore = 0;
      let threats = [];
      let riskLevel = 'low';
      let details = [];

      // 1. Domain Analysis
      if (DOMAIN_BLACKLIST.includes(domain)) {
        riskScore += 90;
        threats.push('Known malicious domain');
        details.push('Domain is on security blacklist');
      }

      if (LEGITIMATE_DOMAINS.includes(domain.replace('www.', ''))) {
        riskScore -= 20;
        details.push('Legitimate domain detected');
      }

      // 2. Suspicious patterns in URL
      Object.entries(SUSPICIOUS_PATTERNS).forEach(([category, patterns]) => {
        patterns.forEach(pattern => {
          if (pattern.test(fullUrl) || pattern.test(path)) {
            riskScore += 25;
            threats.push(`${category.charAt(0).toUpperCase() + category.slice(1)} indicators`);
            details.push(`Suspicious ${category} pattern detected`);
          }
        });
      });

      // 3. Domain characteristics
      if (domain.includes('-') && domain.split('-').length > 3) {
        riskScore += 15;
        details.push('Excessive hyphens in domain');
      }

      if (/\d{4,}/.test(domain)) {
        riskScore += 10;
        details.push('Unusual numbers in domain');
      }

      // 4. TLD Analysis
      const tld = domain.split('.').pop();
      const suspiciousTlds = ['tk', 'ml', 'ga', 'cf', 'ru', 'cn'];
      if (suspiciousTlds.includes(tld)) {
        riskScore += 20;
        details.push('High-risk top-level domain');
      }

      // 5. URL length and structure
      if (url.length > 150) {
        riskScore += 15;
        details.push('Unusually long URL');
      }

      if ((url.match(/\//g) || []).length > 10) {
        riskScore += 10;
        details.push('Deep directory structure');
      }

      // 6. Check for URL shorteners
      const shorteners = ['bit.ly', 'tinyurl.com', 't.co', 'goo.gl', 'ow.ly'];
      if (shorteners.some(s => domain.includes(s))) {
        riskScore += 30;
        threats.push('URL shortener detected');
        details.push('Shortened URLs can hide malicious destinations');
      }

      // 7. Typosquatting detection
      const legitVariations = LEGITIMATE_DOMAINS.map(d => d.replace(/[aeiou]/g, ''));
      const domainNoVowels = domain.replace(/[aeiou]/g, '');
      if (legitVariations.some(v => domainNoVowels.includes(v) && domain !== v)) {
        riskScore += 40;
        threats.push('Potential typosquatting');
        details.push('Domain may be impersonating legitimate site');
      }

      // Determine risk level
      if (riskScore >= 70) {
        riskLevel = 'high';
      } else if (riskScore >= 30) {
        riskLevel = 'medium';
      } else {
        riskLevel = 'low';
      }

      // Simulate network check delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      const result = {
        url: url,
        domain: domain,
        riskLevel: riskLevel,
        riskScore: Math.min(riskScore, 100),
        threats: [...new Set(threats)],
        details: details,
        timestamp: new Date(),
        safe: riskLevel === 'low'
      };

      setUrlScanResult(result);
      setUrlScanHistory(prev => [result, ...prev].slice(0, 50));

      const scanResult = {
        id: Date.now(),
        type: 'url',
        timestamp: new Date().toLocaleTimeString(),
        result: result.safe ? 'safe' : 'threat',
        confidence: 100 - result.riskScore,
        details: result.threats.join(', ') || 'Clean'
      };
      setScanResults(prev => [scanResult, ...prev].slice(0, 8));

    } catch (error) {
      const errorResult = {
        url: url,
        domain: 'Invalid',
        riskLevel: 'high',
        riskScore: 100,
        threats: ['Invalid URL format'],
        details: ['URL could not be parsed - may be malicious'],
        timestamp: new Date(),
        safe: false
      };
      setUrlScanResult(errorResult);
    } finally {
      setIsScanning(false);
    }
  }

  async function handleChatSubmit(e) {
    e?.preventDefault();
    if (!chatMessage.trim()) return;
    const userMsg = { role: 'user', text: chatMessage };
    setChatHistory(h => [...h, userMsg]);
    setChatMessage('');
    
    const urlRegex = /(https?:\/\/[^\s]+|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    const urls = chatMessage.match(urlRegex);
    if (urls && urls.length > 0) {
      setChatHistory(h => [...h, { role: 'bot', text: `I found a URL in your message. Let me analyze it for you: ${urls[0]}` }]);
      await analyzeURL(urls[0]);
      return;
    }
    
    const reply = generateLocalReply(chatMessage);
    setTimeout(() => setChatHistory(h => [...h, { role: 'bot', text: reply }]), 500);
  }

  function generateLocalReply(msg) {
    const m = msg.toLowerCase();
    if (m.includes('sbi') || m.includes('bank')) return '🚨 PHISHING INDICATOR: Message looks like banking phishing. Do not click links.';
    if (m.includes('whatsapp') || m.includes('forward')) return '⚠️ Likely misinformation. Check trusted news sources and community reports.';
    if (m.includes('deepfake') || m.includes('video')) return '🎭 Possible deepfake indicators: audio/video inconsistencies and watermarking patterns.';
    if (m.includes('url') || m.includes('link') || m.includes('website')) return '🔗 Paste the URL and I can analyze it for suspicious patterns and known threats.';
    return '🤖 I can analyze links, images or provide steps to verify suspicious content. Upload or paste what you want checked.';
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50">
      <header className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-lg bg-gradient-to-r from-indigo-600 to-sky-500 text-white">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Digital Guardian</h1>
              <div className="text-xs text-gray-500">AI-assisted Threat Detection • Community Intelligence</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-sm bg-green-50 text-green-700 px-3 py-1 rounded-full">🛡️ Protected</div>
            <div className="text-sm bg-gray-50 px-3 py-1 rounded-full">Community: 89k</div>
          </div>
        </div>
      </header>

      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-6">
            {[
              { id: 'dashboard', name: 'Dashboard', icon: TrendingUp }, 
              { id: 'real-time', name: 'Live', icon: Shield }, 
              { id: 'scanner', name: 'Scanner', icon: Scan }, 
              { id: 'ai-assistant', name: 'Assistant', icon: Bot }, 
              { id: 'threats', name: 'Threats & Community', icon: AlertTriangle }
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id)} className={`py-3 px-2 border-b-2 ${activeTab === t.id ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                <t.icon className="w-4 h-4 inline mr-2" />{t.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">Threats Blocked</div>
                    <div className="text-3xl font-bold text-red-600">{stats.blocked}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg"><Shield className="w-6 h-6 text-red-500" /></div>
                </div>
                <div className="text-xs text-gray-400 mt-2">↗ 23% from yesterday</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">Content Scanned</div>
                    <div className="text-3xl font-bold text-blue-600">{stats.scanned.toLocaleString()}</div>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg"><Eye className="w-6 h-6 text-blue-600" /></div>
                </div>
                <div className="text-xs text-gray-400 mt-2">Realtime insights</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">Family Protected</div>
                    <div className="text-3xl font-bold text-green-600">{stats.familyProtected}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg"><Users className="w-6 h-6 text-green-600" /></div>
                </div>
                <div className="text-xs text-gray-400 mt-2">Profiles monitored</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-500">AI Accuracy</div>
                    <div className="text-3xl font-bold text-purple-600">{stats.accuracy}%</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded-lg"><Bot className="w-6 h-6 text-purple-600" /></div>
                </div>
                <div className="text-xs text-gray-400 mt-2">Continuously improving</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm col-span-2">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <div className="text-lg font-semibold">Traffic & Scans</div>
                    <div className="text-sm text-gray-500">Hourly trend of scanned content</div>
                  </div>
                </div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sampleLine}>
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="scanned" stroke="#3b82f6" strokeWidth={3} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="text-lg font-semibold mb-2">Threat Mix</div>
                <div style={{ height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={samplePie} dataKey="value" outerRadius={80} innerRadius={40} startAngle={90} endAngle={-270}>
                        {samplePie.map((entry, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'real-time' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-green-500 to-sky-600 p-6 rounded-xl text-white flex items-center justify-between">
              <div>
                <div className="text-xl font-semibold">Real-Time Protection</div>
                <div className="text-sm opacity-90">Monitoring incoming notifications and media</div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${realTimeProtection ? 'bg-green-300 animate-pulse' : 'bg-red-300'}`}></div>
                <div className="font-medium">{realTimeProtection ? 'ACTIVE' : 'DISABLED'}</div>
                <button onClick={() => setRealTimeProtection(p => !p)} className={`px-3 py-2 rounded-lg ${realTimeProtection ? 'bg-red-600 text-white' : 'bg-white'}`}>
                  {realTimeProtection ? 'Disable' : 'Enable'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-4"><MessageSquare className="w-6 h-6 text-green-600" /><div className="font-medium">Messages</div></div>
                <div className="text-sm text-gray-600">Scanned Today: 247</div>
                <div className="text-sm text-red-600 mt-2">Threats Blocked: 12</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-4"><Image className="w-6 h-6 text-blue-600" /><div className="font-medium">Images</div></div>
                <div className="text-sm text-gray-600">Analyzed: 89</div>
                <div className="text-sm text-orange-600 mt-2">Flagged: 6</div>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-3 mb-4"><Video className="w-6 h-6 text-purple-600" /><div className="font-medium">Videos</div></div>
                <div className="text-sm text-gray-600">Processed: 34</div>
                <div className="text-sm text-red-600 mt-2">Deepfakes: 3</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="font-medium">Live Notification Feed</div>
                <div className="text-xs text-gray-500">Auto-analyzed</div>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {incomingNotifications.length === 0 ? (
                  <div className="p-6 text-gray-400 text-center">No notifications yet</div>
                ) : (
                  <div className="divide-y">
                    {incomingNotifications.map(n => (
                      <div key={n.id} className="p-3 flex gap-3 items-start hover:bg-gray-50">
                        <div className="p-2 bg-gray-100 rounded-lg"><MessageSquare className="w-5 h-5" /></div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{n.app}</div>
                          <div className="text-xs text-gray-500">{n.content}</div>
                        </div>
                        <div className="text-xs text-gray-400">{new Date(n.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'scanner' && (
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl mb-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-lg font-semibold flex items-center gap-2">
                      <Globe className="w-5 h-5 text-blue-600" />
                      URL Security Scanner
                    </div>
                    <div className="text-sm text-gray-600">Advanced threat detection for suspicious links</div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={urlToScan}
                      onChange={(e) => setUrlToScan(e.target.value)}
                      placeholder="Enter URL to scan (e.g., https://suspicious-site.com)"
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyPress={(e) => e.key === 'Enter' && urlToScan && !isScanning && analyzeURL(urlToScan)}
                    />
                    <button
                      onClick={() => urlToScan && !isScanning && analyzeURL(urlToScan)}
                      disabled={!urlToScan || isScanning}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isScanning ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                          Scanning...
                        </>
                      ) : (
                        <>
                          <Scan className="w-4 h-4" />
                          Scan URL
                        </>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <div className="text-xs text-gray-500 mr-2">Quick test:</div>
                    {[
                      'phishing-test.com',
                      'secure-bank-verify.tk',
                      'google.com',
                      'bit.ly/suspicious'
                    ].map(url => (
                      <button
                        key={url}
                        onClick={() => setUrlToScan(url)}
                        className="text-xs px-3 py-1 bg-white border border-gray-200 rounded-full hover:bg-gray-50"
                      >
                        {url}
                      </button>
                    ))}
                  </div>
                </div>

                {urlScanResult && (
                  <div className="mt-6 bg-white p-4 rounded-lg border">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          urlScanResult.riskLevel === 'high' ? 'bg-red-100' :
                          urlScanResult.riskLevel === 'medium' ? 'bg-orange-100' : 'bg-green-100'
                        }`}>
                          {urlScanResult.riskLevel === 'high' ? 
                            <AlertTriangle className="w-5 h-5 text-red-600" /> :
                            urlScanResult.riskLevel === 'medium' ?
                            <AlertTriangle className="w-5 h-5 text-orange-600" /> :
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          }
                        </div>
                        <div>
                          <div className="font-semibold">
                            {urlScanResult.safe ? 'Safe to Visit' : 'Potential Threat Detected'}
                          </div>
                          <div className="text-sm text-gray-500">
                            Risk Score: {urlScanResult.riskScore}/100 • {urlScanResult.domain}
                          </div>
                        </div>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        urlScanResult.riskLevel === 'high' ? 'bg-red-100 text-red-800' :
                        urlScanResult.riskLevel === 'medium' ? 'bg-orange-100 text-orange-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {urlScanResult.riskLevel.toUpperCase()} RISK
                      </div>
                    </div>

                    {urlScanResult.threats.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2 text-red-600">Threats Detected:</div>
                        <div className="space-y-1">
                          {urlScanResult.threats.map((threat, idx) => (
                            <div key={idx} className="text-sm bg-red-50 text-red-700 px-3 py-1 rounded">
                              • {threat}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {urlScanResult.details.length > 0 && (
                      <div className="mb-4">
                        <div className="text-sm font-medium mb-2">Analysis Details:</div>
                        <div className="space-y-1">
                          {urlScanResult.details.map((detail, idx) => (
                            <div key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                              <Info className="w-3 h-3 text-gray-400" />
                              {detail}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-500 pt-3 border-t">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {urlScanResult.timestamp.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <ExternalLink className="w-3 h-3" />
                        <span className="break-all">{urlScanResult.url}</span>
                      </div>
                    </div>
                  </div>
                )}

                {urlScanHistory.length > 0 && (
                  <div className="mt-6">
                    <div className="text-sm font-medium mb-3">Recent URL Scans</div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {urlScanHistory.slice(0, 10).map((scan, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-white rounded border text-sm">
                          <div className="flex items-center gap-3">
                            <div className={`p-1 rounded ${
                              scan.riskLevel === 'high' ? 'bg-red-100' :
                              scan.riskLevel === 'medium' ? 'bg-orange-100' : 'bg-green-100'
                            }`}>
                              {scan.safe ? 
                                <CheckCircle className="w-3 h-3 text-green-600" /> : 
                                <AlertTriangle className="w-3 h-3 text-red-600" />
                              }
                            </div>
                            <div>
                              <div className="font-medium truncate max-w-xs">{scan.domain}</div>
                              <div className="text-xs text-gray-500">{scan.threats.join(', ') || 'Clean'}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400">
                            {scan.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="text-sm">Recent Scan Results</div>
                  <div className="text-xs text-gray-500">Confidence shown</div>
                </div>
                <div className="mt-3 space-y-2">
                  {scanResults.length === 0 ? (
                    <div className="text-sm text-gray-400">No scans yet</div>
                  ) : (
                    scanResults.map(r => (
                      <div key={r.id} className="flex items-center justify-between p-2 bg-white rounded">
                        <div className="flex items-center gap-3">
                          <div className={r.result === 'threat' ? 'text-red-500' : 'text-green-500'}>
                            {r.result === 'threat' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          </div>
                          <div className="text-sm">
                            <div>{r.type} · {r.timestamp}</div>
                            <div className="text-xs text-gray-500">{r.details}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500">{r.confidence}%</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ai-assistant' && (
          <div className="bg-white p-4 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded bg-indigo-100"><Bot className="w-5 h-5 text-indigo-600" /></div>
              <div className="font-medium">AI Security Assistant</div>
            </div>
            <div className="h-72 overflow-y-auto p-4 bg-gray-50 rounded mb-3">
              {chatHistory.map((c, i) => (
                <div key={i} className={`mb-3 flex ${c.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-3 rounded-lg max-w-md ${c.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800'}`}>
                    {c.text}
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={handleChatSubmit} className="flex gap-3">
              <input 
                value={chatMessage} 
                onChange={e => setChatMessage(e.target.value)} 
                placeholder="Ask about a URL, message or image..." 
                className="flex-1 px-4 py-2 border rounded-lg" 
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg">
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="mt-3 text-xs text-gray-500 flex items-center gap-3">
              <div>Mode</div>
              <select value={apiMode} onChange={e => setApiMode(e.target.value)} className="px-2 py-1 border rounded">
                <option value="local">Local (demo)</option>
                <option value="openai">OpenAI (needs key)</option>
                <option value="hf">HuggingFace (needs key)</option>
              </select>
              <div className="text-xs text-gray-400">Local mode provides fast on-device guidance; cloud modes call your configured API for stronger detection.</div>
            </div>
          </div>
        )}

        {activeTab === 'threats' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white p-6 rounded-xl">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-lg font-semibold">Threats & Community</div>
                  <div className="text-sm opacity-90">Reports, verifications and regional hotspots contributed by the community</div>
                </div>
                <div className="text-sm">Community Verified · Live</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-4 rounded shadow-sm text-center">
                <div className="text-2xl font-bold text-indigo-600">89,234</div>
                <div className="text-sm text-gray-500">Active Users</div>
              </div>
              <div className="bg-white p-4 rounded shadow-sm text-center">
                <div className="text-2xl font-bold text-green-600">24,567</div>
                <div className="text-sm text-gray-500">Reports This Month</div>
              </div>
              <div className="bg-white p-4 rounded shadow-sm text-center">
                <div className="text-2xl font-bold text-rose-600">1,247</div>
                <div className="text-sm text-gray-500">Active Phishing Sites</div>
              </div>
              <div className="bg-white p-4 rounded shadow-sm text-center">
                <div className="text-2xl font-bold text-purple-600">97.3%</div>
                <div className="text-sm text-gray-500">Community Accuracy</div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white p-4 rounded shadow-sm">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-medium">Active Alerts</div>
                  <div className="text-xs text-gray-400">Prioritized</div>
                </div>
                <div className="space-y-3">
                  {[
                    { title: 'Banking phishing campaign', impact: 'HIGH', affected: '12k+' }, 
                    { title: 'WhatsApp investment scam', impact: 'CRITICAL', affected: '5.6k' }, 
                    { title: 'Celebrity deepfakes', impact: 'MEDIUM', affected: '890' }
                  ].map((a, i) => (
                    <div key={i} className="p-3 border rounded hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{a.title}</div>
                          <div className="text-xs text-gray-500">{a.affected} affected</div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs ${
                          a.impact === 'CRITICAL' ? 'bg-red-200 text-red-800' : 
                          a.impact === 'HIGH' ? 'bg-orange-200 text-orange-800' : 
                          'bg-yellow-200 text-yellow-800'
                        }`}>
                          {a.impact}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-4 rounded shadow-sm">
                <div className="font-medium mb-3">Community Center</div>
                <div className="text-sm text-gray-500 mb-3">Report an incident or verify a community submission</div>
                <div className="space-y-2">
                  <input placeholder="Title" className="w-full px-3 py-2 border rounded" />
                  <textarea placeholder="Describe suspicious content" className="w-full px-3 py-2 border rounded" rows={4}></textarea>
                  <div className="flex gap-2">
                    <button className="px-3 py-2 bg-indigo-600 text-white rounded">Submit Report</button>
                    <button className="px-3 py-2 bg-gray-100 rounded">Browse Reports</button>
                  </div>
                </div>
                <div className="text-xs text-gray-400 mt-3">Reports are triaged by community moderators and AI filters.</div>
              </div>
            </div>

            <div className="bg-white p-4 rounded shadow-sm">
              <div className="font-medium mb-2">Regional Hotspots</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { city: 'Mumbai', count: 1247 }, 
                  { city: 'Delhi', count: 1089 }, 
                  { city: 'Bangalore', count: 892 }, 
                  { city: 'Chennai', count: 654 }
                ].map((c, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded flex justify-between">
                    <div>{c.city}</div>
                    <div className="font-semibold">{c.count}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}