// Full implementation of types.ts to provide all necessary type definitions.

export enum SafetyLevel {
  SAFE = 'SAFE',
  SUSPICIOUS = 'SUSPICIOUS',
  DANGEROUS = 'DANGEROUS',
  UNKNOWN = 'UNKNOWN',
}

export interface Threat {
  type: string;
  description: string;
}

export interface URLSafetyReport {
  safetyLevel: SafetyLevel;
  summary: string;
  threats: Threat[];
  trustScore: number;
  keyPoints: string[];
}

export interface ImageVisualCue {
    description: string;
    area: [number, number, number, number]; // [topLeftX, topLeftY, width, height] in percentages
}

export interface VideoVisualCue {
    description: string;
    timestamp: number; // in seconds
    area: [number, number, number, number];
}

export interface PdfVisualCue {
    description: string;
    page: number;
    area: [number, number, number, number];
}


export interface ImageAnalysisReport {
    summary: string;
    deepfakeConfidence: number;
    aiGeneratedConfidence: number;
    manipulationSigns: string[];
    trustScore: number;
    keyPoints: string[];
    visualCues: ImageVisualCue[];
}

export interface VideoAnalysisReport {
    summary: string;
    deepfakeConfidence: number;
    manipulationSigns: string[];
    trustScore: number;
    keyPoints: string[];
    audioAnalysisSummary: string;
    temporalInconsistencies: string[];
    visualCues: VideoVisualCue[];
}

export interface PdfAnalysisReport {
    summary: string;
    trustScore: number;
    detectedLinks: { url: string; risk: 'High' | 'Medium' | 'Low' | 'Unknown' }[];
    malwareIndicators: string[];
    socialEngineeringTactics: string[];
    visualCues: PdfVisualCue[];
    keyPoints: string[];
}


export interface GroundingChunk {
    // FIX: Made 'web' property optional to match the @google/genai library's GroundingChunk type, resolving a type error in Assistant.tsx.
    web?: {
        uri?: string;
        title?: string;
    }
}

export interface ChatMessage {
    role: 'user' | 'model';
    parts: { text: string }[];
    image?: string; // base64 preview for UI
    video?: string; // base64 preview for UI
    pdf?: string; // filename for UI
    sources?: GroundingChunk[];
}

export type Page = 'Dashboard' | 'Real-Time Scanning' | 'Scanner' | 'Assistant' | 'Threats & Community' | 'Family';

export interface RecentActivity {
    id: number;
    type: 'Phishing' | 'Malware' | 'Scam' | 'Safe';
    content: string;
    time: string;
    user: string;
}

export interface Stats {
    messages: { scanned: number; blocked: number };
    images: { scanned: number; flagged: number };
    videos: { scanned: number; deepfakes: number };
}

export type ScanHistoryItem = 
    | { type: 'url'; url: string; report: URLSafetyReport; id: number }
    | { type: 'image'; preview: string; report: ImageAnalysisReport; id: number }
    | { type: 'video'; preview: string; report: VideoAnalysisReport; id: number }
    | { type: 'pdf'; filename: string; report: PdfAnalysisReport; id: number; data: string };

export interface FeedItem {
    id: number;
    status: 'safe' | 'suspicious' | 'dangerous';
    type: 'message' | 'image' | 'video';
    content: string;
    source: string;
    time: string;
}

export interface ScanSettings {
    messages: boolean;
    images: boolean;
    videos: boolean;
}

export interface CommunityStats {
    activeUsers: number;
    reportsThisMonth: number;
    activePhishingSites: number;
    communityAccuracy: number;
}

export interface ActiveAlert {
    id: number;
    title: string;
    affected: string;
    level: 'HIGH' | 'CRITICAL' | 'MEDIUM';
}

export type FamilyMemberStatus = 'Protected' | 'At Risk' | 'Needs Attention';

export interface FamilyMember {
    id: number;
    name: string;
    isYou?: boolean;
    device: string;
    status: FamilyMemberStatus;
}

export interface FamilyAlert {
    id: number;
    titleKey: string;
    memberName: string;
    time: string;
}