import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { URLSafetyReport, ImageAnalysisReport, VideoAnalysisReport, ScanHistoryItem, ImageVisualCue, VideoVisualCue, PdfAnalysisReport, PdfVisualCue } from '../types';
import { analyzeUrl, analyzeImage, analyzeVideo, analyzePdf } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';
import * as pdfjsLib from 'pdfjs-dist';

import { URLInputForm } from '../components/URLInputForm';
import { SafetyReport } from '../components/SafetyReport';
import Loading from '../components/Loading';
import { UploadIcon, LinkIcon, HistoryIcon, AssistantIcon, VideoIcon, PdfIcon, ZoomInIcon, ZoomOutIcon, FitToWidthIcon } from '../components/icons';

// Setup for PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://aistudiocdn.com/pdfjs-dist@^4.5.136/build/pdf.worker.mjs`;

interface ScannerProps {
  url: string;
  setUrl: (url: string) => void;
  urlReport: URLSafetyReport | null;
  setUrlReport: (report: URLSafetyReport | null) => void;
  imagePreview: string | null;
  setImagePreview: (preview: string | null) => void;
  imageReport: ImageAnalysisReport | null;
  setImageReport: (report: ImageAnalysisReport | null) => void;
  videoPreview: string | null;
  setVideoPreview: (preview: string | null) => void;
  videoReport: VideoAnalysisReport | null;
  setVideoReport: (report: VideoAnalysisReport | null) => void;
  pdfPreview: string | null;
  setPdfPreview: (preview: string | null) => void;
  pdfFile: File | null;
  setPdfFile: (file: File | null) => void;
  pdfReport: PdfAnalysisReport | null;
  setPdfReport: (report: PdfAnalysisReport | null) => void;
  scanHistory: ScanHistoryItem[];
  addScanToHistory: (item: ScanHistoryItem) => void;
}

const cueColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

const VisualCueMarker: React.FC<{ cue: ImageVisualCue | VideoVisualCue, index: number }> = ({ cue, index }) => {
    const color = cueColors[index % cueColors.length];
    return (
        <div
            className="absolute transition-all duration-300 pointer-events-none rounded-full"
            style={{
                left: `${cue.area[0]}%`,
                top: `${cue.area[1]}%`,
                width: `${cue.area[2]}%`,
                height: `${cue.area[3]}%`,
                backgroundColor: color + '33', // Semi-transparent fill
                border: `2px solid ${color}`,
                boxShadow: `0 0 15px ${color}`,
            }}
        >
             <div 
                className="absolute top-0 left-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                style={{ backgroundColor: color }}
            >
                {index + 1}
            </div>
        </div>
    );
};

const ImageAnalysisReportDisplay: React.FC<{ report: ImageAnalysisReport, imagePreview: string | null, rigor: 'standard' | 'deep', t: (key: string, options?: any) => string }> = ({ report, imagePreview, rigor, t }) => {
    const [hoveredCueIndex, setHoveredCueIndex] = useState<number | null>(null);

    return (
        <div className="p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-fade-in shadow-sm max-h-[85vh] flex flex-col">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 flex-shrink-0">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">{t('scanner.analysis_report')}</h2>
                 {rigor === 'deep' && (
                    <div className="flex items-center gap-2 bg-purple-accent/10 text-purple-accent text-xs font-bold px-3 py-1.5 rounded-full" title="This image was analyzed by multiple specialized AI models for higher accuracy.">
                        <AssistantIcon className="w-4 h-4" />
                        Multi-Model Analysis
                    </div>
                )}
            </div>
            
            <div className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0">
                <div className="relative lg:w-[55%] flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-gray-950 rounded-lg overflow-hidden">
                    {imagePreview && <img src={imagePreview} alt="Analyzed" className="max-w-full max-h-full object-contain" />}
                    {report.visualCues.map((cue, index) => (
                       <VisualCueMarker key={index} cue={cue} index={index} />
                    ))}
                </div>

                <div className="lg:w-[45%] flex flex-col space-y-4 overflow-y-auto pr-2 pb-2">
                    <div className="bg-gray-100 dark:bg-gray-800/60 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">AI Summary</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">{report.summary}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-center">
                        <div className="bg-gray-100 dark:bg-gray-800/60 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('scanner.authenticity_score')}</p>
                            <p className="text-lg sm:text-xl font-bold text-green-400">{report.trustScore}%</p>
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800/60 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">AI Generated</p>
                            <p className="text-lg sm:text-xl font-bold text-yellow-400">{report.aiGeneratedConfidence.toFixed(0)}%</p>
                        </div>
                    </div>

                    {report.manipulationSigns.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Manipulation Signs</h4>
                            <div className="flex flex-wrap gap-2">
                                {report.manipulationSigns.map((sign, i) => (
                                    <span key={i} className="bg-yellow-500/10 text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full">{sign}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {report.visualCues.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">{t('scanner.visual_cues_title')}</h4>
                            <ul className="space-y-2">
                                {report.visualCues.map((cue, i) => {
                                  const color = cueColors[i % cueColors.length];
                                  return (
                                    <li 
                                        key={i} 
                                        className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/60 p-3 rounded-md transition-all duration-300"
                                        style={{ borderLeft: `4px solid ${color}`}}
                                        onMouseEnter={() => setHoveredCueIndex(i)}
                                        onMouseLeave={() => setHoveredCueIndex(null)}
                                    >
                                        <span className="font-bold mr-2" style={{color}}>{t('scanner.cue_label', {index: i+1})}:</span>
                                        {cue.description}
                                    </li>
                                  )
                                })}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const VideoAnalysisReportDisplay: React.FC<{ report: VideoAnalysisReport, videoPreview: string | null }> = ({ report, videoPreview }) => {
    const [activeCue, setActiveCue] = useState<VideoVisualCue | null>(null);
    const videoPlayerRef = useRef<HTMLVideoElement>(null);
    const cueTimeoutRef = useRef<number | null>(null);

    const handleCueClick = (cue: VideoVisualCue) => {
        if (videoPlayerRef.current) {
            const video = videoPlayerRef.current;

            if (cueTimeoutRef.current) {
                clearTimeout(cueTimeoutRef.current);
            }

            video.pause();
            video.currentTime = cue.timestamp;
            setActiveCue(cue);

            // After a 1-second pause on the highlighted frame, resume playback and hide the cue.
            cueTimeoutRef.current = window.setTimeout(() => {
                if (videoPlayerRef.current) {
                    videoPlayerRef.current.play();
                }
                setActiveCue(null);
            }, 1000);
        }
    };

    return (
    <div className="p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-fade-in shadow-sm max-h-[85vh] flex flex-col">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 flex-shrink-0">Video Analysis Report</h2>
         <div className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0">
            <div className="relative lg:w-[55%] flex-shrink-0 flex items-center justify-center bg-black rounded-lg overflow-hidden">
                <video ref={videoPlayerRef} src={videoPreview || ''} controls className="w-full h-auto max-h-full object-contain rounded-lg" />
                {activeCue && <VisualCueMarker cue={activeCue} index={0} />}
            </div>
            <div className="lg:w-[45%] flex flex-col space-y-4 overflow-y-auto pr-2 pb-2">
                <div className="bg-gray-100 dark:bg-gray-800/60 p-4 rounded-lg flex-shrink-0">
                    <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">AI Summary</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">{report.summary}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-center flex-shrink-0">
                    <div className="bg-gray-100 dark:bg-gray-800/60 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Authenticity Score</p>
                        <p className="text-lg sm:text-xl font-bold text-green-400">{report.trustScore}%</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800/60 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Deepfake Confidence</p>
                        <p className="text-lg sm:text-xl font-bold text-red-400">{report.deepfakeConfidence.toFixed(0)}%</p>
                    </div>
                </div>
                 {report.visualCues.length > 0 && (
                    <div className="flex flex-col min-h-0">
                        <h4 className="font-semibold text-gray-800 dark:text-white mb-2 flex-shrink-0">Visual Cues Found</h4>
                        <div className="space-y-2">
                            {report.visualCues.map((cue, i) => (
                                <button key={i} onClick={() => handleCueClick(cue)} className="w-full text-left bg-gray-100 dark:bg-gray-800/60 p-3 rounded-md hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors">
                                    <p className="text-sm font-semibold" style={{color: cueColors[i % cueColors.length]}}>@{cue.timestamp.toFixed(1)}s: {cue.description}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    </div>
    )
};

const PdfVisualCueMarker: React.FC<{ cue: PdfVisualCue, index: number, isActive: boolean }> = ({ cue, index, isActive }) => {
    const color = cueColors[index % cueColors.length];
    return (
        <div
            className={`absolute transition-all duration-300 pointer-events-none rounded-lg border-2`}
            style={{
                left: `${cue.area[0]}%`,
                top: `${cue.area[1]}%`,
                width: `${cue.area[2]}%`,
                height: `${cue.area[3]}%`,
                borderColor: color,
                backgroundColor: color + '22', // Semi-transparent fill for better visibility
                boxShadow: isActive ? `0 0 15px ${color}` : 'none',
            }}
        >
             <div 
                className="absolute top-0 left-0 w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2"
                style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }} // Added glow to number
            >
                {index + 1}
            </div>
        </div>
    );
};

interface PdfAnalysisReportDisplayProps {
    report: PdfAnalysisReport;
    pdfFile: File;
    t: (key: string, options?: any) => string;
}

const PdfAnalysisReportDisplay: React.FC<PdfAnalysisReportDisplayProps> = ({ report, pdfFile, t }) => {
    const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
    const [renderedPages, setRenderedPages] = useState<number[]>([]);
    const [activeCueIndex, setActiveCueIndex] = useState<number | null>(null);
    const viewerRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

    const [currentPage, setCurrentPage] = useState(1);
    const [currentScale, setCurrentScale] = useState(1);
    const [fitScale, setFitScale] = useState(1);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!pdfFile) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            if (!e.target?.result) return;
            const loadingTask = pdfjsLib.getDocument({ data: e.target.result as ArrayBuffer });
            const doc = await loadingTask.promise;
            setPdfDoc(doc);
            pageRefs.current = Array.from({ length: doc.numPages });
        };
        reader.readAsArrayBuffer(pdfFile);
    }, [pdfFile]);

    const renderPage = useCallback(async (pageNum: number) => {
        if (!pdfDoc || renderedPages.includes(pageNum) || !isReady) return;

        try {
            const page = await pdfDoc.getPage(pageNum);
            const viewport = page.getViewport({ scale: currentScale });
            const canvas = document.getElementById(`pdf-canvas-${pageNum}`) as HTMLCanvasElement;
            if (!canvas) return;
            
            const context = canvas.getContext('2d');
            if (!context) return;
            
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            // FIX: Added the 'canvas' property to the render parameters to satisfy the type definition, as required by the compiler error.
            await page.render({ canvas, canvasContext: context, viewport }).promise;
            setRenderedPages(prev => [...prev, pageNum]);
        } catch (error) {
            console.error(`Failed to render page ${pageNum}:`, error);
        }
    }, [pdfDoc, renderedPages, currentScale, isReady]);

    useEffect(() => {
        const viewer = viewerRef.current;
        if (!viewer || !pdfDoc) return;

        const resizeObserver = new ResizeObserver(async (entries) => {
            if (!entries || entries.length === 0) return;
            const entry = entries[0];
            const page = await pdfDoc.getPage(1);
            const paddingX = 32; // Corresponds to p-4 on the viewer
            const availableWidth = entry.contentRect.width - paddingX;
            
            const viewport = page.getViewport({ scale: 1 });
            const isRotated = viewport.rotation === 90 || viewport.rotation === 270;
            const pdfPageWidth = isRotated ? viewport.height : viewport.width;
            const newFitScale = availableWidth / pdfPageWidth;

            setFitScale(newFitScale);

            // "Autotap" fit-to-width on initial load, but don't override user zoom on subsequent resizes.
            if (!isReady) {
                setCurrentScale(newFitScale);
                setIsReady(true);
                setRenderedPages([]);
            }
        });

        resizeObserver.observe(viewer);
        return () => resizeObserver.disconnect();
    }, [pdfDoc, isReady]);

    useEffect(() => {
        if (!pdfDoc || !isReady) return;

        const observers: IntersectionObserver[] = [];
        pageRefs.current.forEach((pageEl, index) => {
            if (pageEl) {
                const pageNum = index + 1;
                const observer = new IntersectionObserver(([entry]) => {
                    if (entry.isIntersecting) {
                        renderPage(pageNum);
                        if (entry.intersectionRatio > 0.5) {
                            setCurrentPage(pageNum);
                        }
                    }
                }, { root: viewerRef.current, threshold: [0.1, 0.5] });
                observer.observe(pageEl);
                observers.push(observer);
            }
        });

        return () => observers.forEach(o => o.disconnect());
    }, [pdfDoc, isReady, renderPage]);

    const handleCueClick = (cue: PdfVisualCue, index: number) => {
        setActiveCueIndex(index);
        const pageElement = pageRefs.current[cue.page - 1];
        if (pageElement) {
            pageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    };
    
    const handleScaleChange = (newScale: number) => {
        setCurrentScale(newScale);
        setRenderedPages([]); // Force re-render of pages on zoom change
    };

    const numPages = pdfDoc?.numPages || 0;

    return (
        <div className="p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-fade-in shadow-sm max-h-[85vh] flex flex-col">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white mb-4 flex-shrink-0">PDF Analysis Report</h2>
            <div className="flex-grow flex flex-col lg:flex-row gap-6 min-h-0">
                <div className="lg:w-[55%] flex-shrink-0 bg-gray-100 dark:bg-gray-950 rounded-lg flex flex-col overflow-hidden">
                    <div className="flex-shrink-0 flex items-center justify-between p-2 border-b border-gray-300 dark:border-gray-700 bg-gray-200/50 dark:bg-gray-800/50 backdrop-blur-sm z-10">
                        <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 px-2">
                            {numPages > 0 ? `${currentPage} / ${numPages}` : 'Loading...'}
                        </span>
                        <div className="flex items-center gap-1">
                            <button onClick={() => handleScaleChange(currentScale * 0.8)} className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10" title="Zoom Out"><ZoomOutIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleScaleChange(fitScale)} className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10" title="Fit to Width"><FitToWidthIcon className="w-5 h-5"/></button>
                            <button onClick={() => handleScaleChange(currentScale * 1.2)} className="p-2 rounded-md hover:bg-black/10 dark:hover:bg-white/10" title="Zoom In"><ZoomInIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                    <div ref={viewerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                        {isReady ? Array.from(new Array(numPages), (el, index) => {
                            const pageNum = index + 1;
                            return (
                                <div id={`page-container-${pageNum}`} key={`page_${pageNum}`} ref={el => { pageRefs.current[index] = el }} className="relative shadow-lg mx-auto" style={{width: 'fit-content'}}>
                                    <canvas id={`pdf-canvas-${pageNum}`} />
                                    {report.visualCues.filter(c => c.page === pageNum).map((cue) => {
                                        const cueIndex = report.visualCues.indexOf(cue);
                                        return <PdfVisualCueMarker key={cueIndex} cue={cue} index={cueIndex} isActive={activeCueIndex === cueIndex} />
                                    })}
                                </div>
                            )
                        }) : <Loading text="Loading PDF Preview..." />}
                    </div>
                </div>
                <div className="lg:w-[45%] flex flex-col space-y-4 overflow-y-auto pr-2 pb-2">
                    <div className="bg-gray-100 dark:bg-gray-800/60 p-4 rounded-lg">
                        <h3 className="font-semibold text-lg text-gray-800 dark:text-white mb-2">AI Summary</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">{report.summary}</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800/60 p-3 rounded-lg text-center">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Document Trust Score</p>
                        <p className="text-lg sm:text-xl font-bold text-green-400">{report.trustScore}%</p>
                    </div>
                    {report.visualCues.length > 0 && (
                        <div>
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Visual Cues Found</h4>
                             <ul className="space-y-2">
                                {report.visualCues.map((cue, i) => (
                                    <li key={i} onClick={() => handleCueClick(cue, i)} onMouseEnter={() => setActiveCueIndex(i)} onMouseLeave={() => setActiveCueIndex(null)} className="text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800/60 p-3 rounded-md transition-all duration-300 cursor-pointer" style={{ borderLeft: `4px solid ${cueColors[i % cueColors.length]}`}}>
                                        <span className="font-bold mr-2" style={{color: cueColors[i % cueColors.length]}}>
                                            {t('scanner.cue_page', { page: cue.page })}:
                                        </span>
                                        {cue.description}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {report.detectedLinks.length > 0 && (
                        <div className="bg-gray-100 dark:bg-gray-800/60 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Detected Links</h4>
                            <ul className="space-y-1 text-sm">
                                {report.detectedLinks.map((link, i) => {
                                    const riskColor = link.risk === 'High' ? 'text-red-400' : link.risk === 'Medium' ? 'text-yellow-400' : 'text-gray-400';
                                    return <li key={i} className="font-mono text-gray-300 truncate"><span className={`font-bold mr-2 ${riskColor}`}>[{link.risk}]</span> {link.url}</li>
                                })}
                            </ul>
                        </div>
                    )}
                    {report.socialEngineeringTactics && report.socialEngineeringTactics.length > 0 && (
                        <div className="bg-gray-100 dark:bg-gray-800/60 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Social Engineering Tactics</h4>
                            <div className="flex flex-wrap gap-2">
                                {report.socialEngineeringTactics.map((tactic, i) => (
                                    <span key={i} className="bg-orange-500/10 text-orange-400 text-xs font-medium px-2.5 py-1 rounded-full">{tactic}</span>
                                ))}
                            </div>
                        </div>
                    )}
                    {report.malwareIndicators.length > 0 && (
                        <div className="bg-gray-100 dark:bg-gray-800/60 p-4 rounded-lg">
                            <h4 className="font-semibold text-gray-800 dark:text-white mb-2">Potential Malware Indicators</h4>
                            <div className="flex flex-wrap gap-2">
                                {report.malwareIndicators.map((sign, i) => (
                                    <span key={i} className="bg-yellow-500/10 text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full">{sign}</span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const Scanner: React.FC<ScannerProps> = ({
  url, setUrl, urlReport, setUrlReport,
  imagePreview, setImagePreview, imageReport, setImageReport,
  videoPreview, setVideoPreview, videoReport, setVideoReport,
  pdfPreview, setPdfPreview, pdfReport, setPdfReport, pdfFile, setPdfFile,
  scanHistory, addScanToHistory
}) => {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<'url' | 'image' | 'video' | 'pdf'>('url');
  const [isLoadingUrl, setIsLoadingUrl] = useState(false);
  const [errorUrl, setErrorUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [errorImage, setErrorImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [analysisRigor, setAnalysisRigor] = useState<'standard' | 'deep'>('standard');
  const [isLoadingVideo, setIsLoadingVideo] = useState(false);
  const [errorVideo, setErrorVideo] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [errorPdf, setErrorPdf] = useState<string | null>(null);
  
  const isInitialMount = useRef(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  const clearAllReports = () => {
    setUrlReport(null);
    setImageReport(null);
    setVideoReport(null);
    setPdfReport(null);
  }

  const ImageUploader = () => (
      <div 
          className="flex flex-col items-center justify-center p-6 sm:p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-purple-accent hover:bg-gray-200/50 dark:hover:bg-gray-800/40 transition-colors"
          onClick={() => fileInputRef.current?.click()}
      >
          <UploadIcon className="w-12 h-12 text-gray-500 mb-2"/>
          <p className="text-lg font-semibold text-gray-800 dark:text-white">{t('scanner.upload_image')}</p>
          <p className="text-sm text-gray-500">{t('scanner.file_types')}</p>
      </div>
  );

  const VideoUploader = () => (
      <div 
          className="flex flex-col items-center justify-center p-6 sm:p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-purple-accent hover:bg-gray-200/50 dark:hover:bg-gray-800/40 transition-colors"
          onClick={() => videoInputRef.current?.click()}
      >
          <VideoIcon className="w-12 h-12 text-gray-500 mb-2"/>
          <p className="text-lg font-semibold text-gray-800 dark:text-white">Upload Video to Scan</p>
          <p className="text-sm text-gray-500">MP4, WEBM, MOV (Max 50MB)</p>
      </div>
  );

  const PdfUploader = () => (
      <div 
          className="flex flex-col items-center justify-center p-6 sm:p-10 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl cursor-pointer hover:border-purple-accent hover:bg-gray-200/50 dark:hover:bg-gray-800/40 transition-colors"
          onClick={() => pdfInputRef.current?.click()}
      >
          <PdfIcon className="w-12 h-12 text-gray-500 mb-2"/>
          <p className="text-lg font-semibold text-gray-800 dark:text-white">Upload PDF to Scan</p>
          <p className="text-sm text-gray-500">PDF (Max 10MB)</p>
      </div>
  );
  
  const extractFramesFromVideo = (videoFile: File, numFrames: number, onProgress: (progress: number) => void): Promise<{ frames: string[], duration: number }> => {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const frames: string[] = [];

        video.preload = 'metadata';
        video.src = URL.createObjectURL(videoFile);
        
        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const duration = video.duration;
            const interval = duration / numFrames;
            let currentTime = 0;
            let framesCaptured = 0;

            video.onseeked = () => {
                if (!ctx) return reject('Canvas context not available');
                ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
                frames.push(canvas.toDataURL('image/jpeg').split(',')[1]);
                framesCaptured++;
                onProgress(framesCaptured / numFrames);

                if (framesCaptured < numFrames) {
                    currentTime += interval;
                    video.currentTime = Math.min(currentTime, duration);
                } else {
                    URL.revokeObjectURL(video.src);
                    resolve({ frames, duration });
                }
            };
            
            video.currentTime = 0;
        };

        video.onerror = (err) => {
            reject(`Error loading video: ${err}`);
        };
    });
  };

  useEffect(() => {
    if (isInitialMount.current) {
        isInitialMount.current = false;
        return;
    }

    const reTranslateReport = async () => {
        if (activeTab === 'url' && urlReport && url) {
            setIsLoadingUrl(true);
            setErrorUrl(null);
            try {
                const report = await analyzeUrl(url, language);
                setUrlReport(report);
            } catch (err: any) {
                setErrorUrl('Failed to re-translate report.');
                setUrlReport(null);
            } finally {
                setIsLoadingUrl(false);
            }
        } else if (activeTab === 'image' && imageReport && imageFile && imagePreview) {
            setIsLoadingImage(true);
            setLoadingMessage(t('scanner.translating'));
            setErrorImage(null);
            try {
                const base64Data = imagePreview.split(',')[1];
                const report = await analyzeImage(base64Data, imageFile.type, language, analysisRigor, setLoadingMessage);
                setImageReport(report);
            } catch (err: any) {
                setErrorImage('Failed to re-translate report.');
                setImageReport(null);
            } finally {
                setIsLoadingImage(false);
                setLoadingMessage('');
            }
        } else if (activeTab === 'video' && videoReport && videoFile) {
            setIsLoadingVideo(true);
            setLoadingMessage(t('scanner.translating'));
            setErrorVideo(null);
            try {
                const { frames, duration } = await extractFramesFromVideo(videoFile, 8, (progress) => {
                    setLoadingMessage(`Extracting frames... ${(progress * 100).toFixed(0)}%`);
                });
                const report = await analyzeVideo(frames, duration, setLoadingMessage, language);
                setVideoReport(report);
            } catch (err: any) {
                setErrorVideo('Failed to re-translate report.');
                setVideoReport(null);
            } finally {
                setIsLoadingVideo(false);
                setLoadingMessage('');
            }
        } else if (activeTab === 'pdf' && pdfReport && pdfFile) {
            setIsLoadingPdf(true);
            setLoadingMessage(t('scanner.translating'));
            setErrorPdf(null);
            const reader = new FileReader();
            reader.readAsDataURL(pdfFile);
            reader.onloadend = async () => {
                try {
                    const base64Data = (reader.result as string).split(',')[1];
                    const report = await analyzePdf(base64Data, language, setLoadingMessage);
                    setPdfReport(report);
                } catch (err: any) {
                    setErrorPdf('Failed to re-translate report.');
                    setPdfReport(null);
                } finally {
                    setIsLoadingPdf(false);
                    setLoadingMessage('');
                }
            };
            reader.onerror = () => {
                setErrorPdf("Failed to read the PDF file for re-translation.");
                setIsLoadingPdf(false);
                setLoadingMessage('');
            };
        }
    };

    reTranslateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);


  const handleUrlSubmit = async (submittedUrl: string) => {
    if (!submittedUrl) return;
    setIsLoadingUrl(true);
    setErrorUrl(null);
    clearAllReports();
    setUrl(submittedUrl);
    window.scrollTo(0, 0);

    try {
      const report = await analyzeUrl(submittedUrl, language);
      setUrlReport(report);
      addScanToHistory({ type: 'url', url: submittedUrl, report, id: Date.now() });
    } catch (err: any) {
      setErrorUrl(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoadingUrl(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setErrorImage("File is too large. Please select an image under 4MB.");
        return;
      }
      setErrorImage(null);
      clearAllReports();
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageAnalyze = async () => {
    if (!imageFile || !imagePreview) return;
    setIsLoadingImage(true);
    setLoadingMessage('Preparing for analysis...');
    setErrorImage(null);
    clearAllReports();

    try {
      const base64Data = imagePreview.split(',')[1];
      const report = await analyzeImage(base64Data, imageFile.type, language, analysisRigor, (message) => {
          setLoadingMessage(message);
      });
      setImageReport(report);
      addScanToHistory({ type: 'image', preview: imagePreview, report, id: Date.now() });
    } catch (err: any) {
      setErrorImage(err.message || 'An unexpected error occurred.');
    } finally {
      setIsLoadingImage(false);
      setLoadingMessage('');
    }
  };

   const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { // 50MB limit for videos
        setErrorVideo("File is too large. Please select a video under 50MB.");
        return;
      }
      setErrorVideo(null);
      clearAllReports();
      setVideoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleVideoAnalyze = async () => {
    if (!videoFile || !videoPreview) return;
    setIsLoadingVideo(true);
    setLoadingMessage('Preparing video for analysis...');
    setErrorVideo(null);
    clearAllReports();

    try {
        const { frames, duration } = await extractFramesFromVideo(videoFile, 8, (progress) => {
             setLoadingMessage(`Extracting frames... ${(progress * 100).toFixed(0)}%`);
        });

        setLoadingMessage(`Analyzing ${frames.length} frames...`);
        const report = await analyzeVideo(frames, duration, (message) => {
            setLoadingMessage(message);
        }, language);

        setVideoReport(report);
        addScanToHistory({ type: 'video', preview: videoPreview, report, id: Date.now() });
    } catch (err: any) {
        setErrorVideo(err.message || 'An unexpected error occurred.');
    } finally {
        setIsLoadingVideo(false);
        setLoadingMessage('');
    }
  };

  const handlePdfFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for PDFs
        setErrorPdf("File is too large. Please select a PDF under 10MB.");
        return;
      }
      setErrorPdf(null);
      clearAllReports();
      setPdfFile(file);
      setPdfPreview(file.name); // For PDF, just show the name
    }
  };

  const handlePdfAnalyze = async () => {
    if (!pdfFile) return;
    setIsLoadingPdf(true);
    setLoadingMessage('Preparing PDF for analysis...');
    setErrorPdf(null);
    clearAllReports();

    const reader = new FileReader();
    reader.readAsDataURL(pdfFile);
    
    reader.onloadend = async () => {
        try {
            const base64DataWithMime = reader.result as string;
            const base64Data = base64DataWithMime.split(',')[1];
            
            const report = await analyzePdf(base64Data, language, (message) => {
                setLoadingMessage(message);
            });
            
            setPdfReport(report);
            addScanToHistory({ type: 'pdf', filename: pdfFile.name, report, id: Date.now(), data: base64DataWithMime });
        } catch (err: any) {
            setErrorPdf(err.message || 'An unexpected error occurred during analysis.');
        } finally {
            setIsLoadingPdf(false);
            setLoadingMessage('');
        }
    };
    
    reader.onerror = () => {
        setErrorPdf("Failed to read the PDF file.");
        setIsLoadingPdf(false);
        setLoadingMessage('');
    };
  };

  const handleHistoryClick = (item: ScanHistoryItem) => {
    window.scrollTo(0, 0);

    // Reset all states
    setErrorUrl(null); setIsLoadingUrl(false);
    setErrorImage(null); setIsLoadingImage(false);
    setErrorVideo(null); setIsLoadingVideo(false);
    setErrorPdf(null); setIsLoadingPdf(false);
    setUrl(''); setUrlReport(null);
    setImagePreview(null); setImageReport(null); setImageFile(null);
    setVideoPreview(null); setVideoReport(null); setVideoFile(null);
    setPdfPreview(null); setPdfReport(null); setPdfFile(null);
    setLoadingMessage('');
    
    setActiveTab(item.type);

    if (item.type === 'url') {
        setUrl(item.url);
        setUrlReport(item.report);
    } else if (item.type === 'image') {
        setImagePreview(item.preview);
        setImageReport(item.report);
    } else if (item.type === 'video') {
        setVideoPreview(item.preview);
        setVideoReport(item.report);
    } else if (item.type === 'pdf') {
        setPdfPreview(item.filename);
        setPdfReport(item.report);
        if ('data' in item && item.data) {
            fetch(item.data)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], item.filename, { type: 'application/pdf' });
                    setPdfFile(file);
                })
                .catch(err => {
                    console.error("Error creating file from history data:", err);
                    setErrorPdf("Could not load PDF preview from history.");
                });
        }
    }
  };
    
    const renderUrlScanner = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{t('scanner.url_title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl mx-auto">{t('scanner.url_subtitle')}</p>
            </div>
            <URLInputForm url={url} setUrl={setUrl} onSubmit={handleUrlSubmit} isLoading={isLoadingUrl} />
            {isLoadingUrl && <Loading text={t('scanner.url_loading')} />}
            {errorUrl && <p className="text-red-400 text-center">{errorUrl}</p>}
            {urlReport && <SafetyReport report={urlReport} url={url} />}
        </div>
    );

    const renderImageScanner = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">{t('scanner.image_title')}</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl mx-auto">{t('scanner.image_subtitle')}</p>
            </div>

            {(() => {
                if (isLoadingImage) {
                    return <Loading text={loadingMessage || t('scanner.image_loading')} />;
                }
                if (errorImage) {
                    return <p className="text-red-400 text-center">{errorImage}</p>;
                }
                if (imageReport && imagePreview) {
                    return (
                        <div className="space-y-8">
                            <ImageAnalysisReportDisplay report={imageReport} imagePreview={imagePreview} rigor={analysisRigor} t={t} />
                            <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-700"></div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Scan Another Image</h2>
                            </div>
                            <ImageUploader />
                        </div>
                    );
                }
                if (imagePreview) {
                    return (
                        <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
                            <img src={imagePreview} alt="upload preview" className="max-h-80 rounded-lg mx-auto" />
                            <div className="mt-4 flex flex-col items-center gap-4">
                                <div className="flex items-center justify-center gap-2">
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('scanner.analysis_level')}:</span>
                                    <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-md">
                                        <button
                                            onClick={() => setAnalysisRigor('standard')}
                                            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${analysisRigor === 'standard' ? 'bg-purple-accent text-white' : 'text-gray-600 dark:text-gray-300'}`}
                                        >
                                            {t('scanner.rigor_standard')}
                                        </button>
                                        <button
                                            onClick={() => setAnalysisRigor('deep')}
                                            className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${analysisRigor === 'deep' ? 'bg-purple-accent text-white' : 'text-gray-600 dark:text-gray-300'}`}
                                        >
                                            {t('scanner.rigor_deep')}
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-4 justify-center">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isLoadingImage}
                                        className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50"
                                    >
                                        Change Image
                                    </button>
                                    <button 
                                        onClick={handleImageAnalyze}
                                        disabled={isLoadingImage || !imageFile}
                                        className="px-6 py-2 bg-purple-accent text-white font-semibold rounded-lg hover:bg-purple-light disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
                                    >
                                        {t('scanner.analyze_image')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                }
                return <ImageUploader />;
            })()}
            
            <input type="file" accept="image/png, image/jpeg, image/webp" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
        </div>
    );
    
    const renderVideoScanner = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">AI Video Scanner</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl mx-auto">Detect deepfakes and manipulated video content.</p>
            </div>

            {(() => {
                if (isLoadingVideo) {
                    return <Loading text={loadingMessage || 'AI is analyzing the video...'} />;
                }
                if (errorVideo) {
                    return <p className="text-red-400 text-center">{errorVideo}</p>;
                }
                if (videoReport && videoPreview) {
                    return (
                        <div className="space-y-8">
                            <VideoAnalysisReportDisplay report={videoReport} videoPreview={videoPreview} />
                            <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-700"></div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Scan Another Video</h2>
                            </div>
                            <VideoUploader />
                        </div>
                    );
                }
                if (videoPreview) {
                    return (
                        <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800">
                           <video src={videoPreview} controls className="w-full max-h-80 rounded-lg object-contain" />
                           <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
                               <button 
                                   onClick={() => videoInputRef.current?.click()}
                                   disabled={isLoadingVideo}
                                   className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50"
                               >
                                   Change Video
                               </button>
                               <button 
                                   onClick={handleVideoAnalyze}
                                   disabled={isLoadingVideo || !videoFile}
                                   className="px-6 py-2 bg-purple-accent text-white font-semibold rounded-lg hover:bg-purple-light disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center gap-2"
                               >
                                   {isLoadingVideo ? 'Analyzing Video...' : 'Analyze Video'}
                               </button>
                           </div>
                       </div>
                    );
                }
                return <VideoUploader />;
            })()}

            <input type="file" accept="video/mp4, video/webm, video/quicktime" ref={videoInputRef} onChange={handleVideoFileChange} className="hidden" />
        </div>
    );
    
    const renderPdfScanner = () => (
        <div className="space-y-6">
            <div className="text-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">AI PDF Scanner</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl mx-auto">Analyze documents for malicious links and phishing attempts.</p>
            </div>

            {(() => {
                if (isLoadingPdf) {
                    return <Loading text={loadingMessage || 'AI is analyzing the PDF...'} />;
                }
                if (errorPdf) {
                    return <p className="text-red-400 text-center">{errorPdf}</p>;
                }
                if (pdfReport && pdfFile) {
                    return (
                        <div className="space-y-8">
                            <PdfAnalysisReportDisplay report={pdfReport} pdfFile={pdfFile} t={t} />
                            <div className="border-t-2 border-dashed border-gray-300 dark:border-gray-700"></div>
                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Scan Another PDF</h2>
                            </div>
                            <PdfUploader />
                        </div>
                    );
                }
                if (pdfPreview) {
                    return (
                        <div className="p-4 bg-gray-100 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-800 text-center">
                            <PdfIcon className="w-20 h-20 text-purple-accent mx-auto" />
                            <p className="font-semibold mt-2">{pdfPreview}</p>
                            <div className="mt-4 flex flex-col sm:flex-row gap-4 justify-center">
                                <button 
                                    onClick={() => pdfInputRef.current?.click()}
                                    disabled={isLoadingPdf}
                                    className="px-6 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 disabled:opacity-50"
                                >
                                    Change PDF
                                </button>
                                <button 
                                    onClick={handlePdfAnalyze}
                                    disabled={isLoadingPdf || !pdfFile}
                                    className="px-6 py-2 bg-purple-accent text-white font-semibold rounded-lg hover:bg-purple-light disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    Analyze PDF
                                </button>
                            </div>
                        </div>
                    );
                }
                return <PdfUploader />;
            })()}

            <input type="file" accept="application/pdf" ref={pdfInputRef} onChange={handlePdfFileChange} className="hidden" />
        </div>
    );

    const renderHistoryItemContent = (item: ScanHistoryItem) => {
        if (item.type === 'url') {
            const colorClass = 
                item.report.safetyLevel === 'SAFE' ? 'text-green-400' :
                item.report.safetyLevel === 'DANGEROUS' ? 'text-red-400' : 'text-yellow-400';
            return (
                <div className="min-w-0 flex items-center gap-3">
                    <LinkIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    <div>
                        <p className="font-semibold truncate text-gray-800 dark:text-white" title={item.url}>{item.url}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(item.id).toLocaleString()} - 
                            <span className={`font-bold ml-1 ${colorClass}`}>
                                {item.report.safetyLevel}
                            </span>
                        </p>
                    </div>
                </div>
            )
        } else if (item.type === 'image') {
            const colorClass = 
                item.report.trustScore > 75 ? 'text-green-400' :
                item.report.trustScore < 40 ? 'text-red-400' : 'text-yellow-400';
            return (
                <>
                    <div className="flex-grow min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white">{t('scanner.image_scan')}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(item.id).toLocaleString()} - 
                            <span className={`font-bold ml-1 ${colorClass}`}>
                                {item.report.trustScore}% {t('scanner.authenticity_score')}
                            </span>
                        </p>
                    </div>
                    <img src={item.preview} alt="history item" className="w-12 h-12 object-cover rounded-md flex-shrink-0" />
                </>
            )
        } else if (item.type === 'video') {
             const colorClass = 
                item.report.trustScore > 75 ? 'text-green-400' :
                item.report.trustScore < 40 ? 'text-red-400' : 'text-yellow-400';
            return (
                 <>
                    <div className="flex-grow min-w-0">
                        <p className="font-semibold text-gray-800 dark:text-white">Video Scan</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(item.id).toLocaleString()} - 
                            <span className={`font-bold ml-1 ${colorClass}`}>
                                {item.report.trustScore}% Authenticity
                            </span>
                        </p>
                    </div>
                    <div className="w-12 h-12 bg-black rounded-md flex items-center justify-center flex-shrink-0">
                        <VideoIcon className="w-6 h-6 text-white" />
                    </div>
                </>
            )
        } else { // PDF
            const colorClass = 
                item.report.trustScore > 75 ? 'text-green-400' :
                item.report.trustScore < 40 ? 'text-red-400' : 'text-yellow-400';
            return (
                 <>
                    <div className="flex-grow min-w-0 flex items-center gap-3">
                         <PdfIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                        <div>
                            <p className="font-semibold text-gray-800 dark:text-white truncate" title={item.filename}>{item.filename}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(item.id).toLocaleString()} - 
                                <span className={`font-bold ml-1 ${colorClass}`}>
                                    {item.report.trustScore}% Trust Score
                                </span>
                            </p>
                        </div>
                    </div>
                </>
            )
        }
    }
  
    return (
        <div className="animate-fade-in space-y-8">
            <div className="flex flex-wrap justify-center gap-1 p-1 bg-gray-200 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('url')}
                    className={`px-4 sm:px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'url' ? 'bg-purple-accent text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-900/60'}`}
                >
                    <LinkIcon className="w-5 h-5" />
                    URL
                </button>
                <button
                    onClick={() => setActiveTab('image')}
                    className={`px-4 sm:px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'image' ? 'bg-purple-accent text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-900/60'}`}
                >
                    <UploadIcon className="w-5 h-5" />
                    Image
                </button>
                <button
                    onClick={() => setActiveTab('video')}
                    className={`px-4 sm:px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'video' ? 'bg-purple-accent text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-900/60'}`}
                >
                    <VideoIcon className="w-5 h-5" />
                    Video
                </button>
                 <button
                    onClick={() => setActiveTab('pdf')}
                    className={`px-4 sm:px-6 py-2.5 text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 ${activeTab === 'pdf' ? 'bg-purple-accent text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-900/60'}`}
                >
                    <PdfIcon className="w-5 h-5" />
                    PDF
                </button>
            </div>

            {activeTab === 'url' && (
                <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Quick Test Samples</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onClick={() => handleUrlSubmit('https://www.google.com')} className="text-left p-3 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"><LinkIcon className="w-5 h-5 text-green-500"/><div><p className="font-semibold">Genuine URL</p><p className="text-xs text-gray-500">google.com</p></div></button>
                        <button onClick={() => handleUrlSubmit('http://unsecured-login-portal.com/')} className="text-left p-3 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"><LinkIcon className="w-5 h-5 text-yellow-500"/><div><p className="font-semibold">Unsecured URL</p><p className="text-xs text-gray-500">unsecured-login...</p></div></button>
                        <button onClick={() => handleUrlSubmit('https://your-bank-update-required.info/')} className="text-left p-3 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"><LinkIcon className="w-5 h-5 text-red-500"/><div><p className="font-semibold">Phishing URL</p><p className="text-xs text-gray-500">your-bank-update...</p></div></button>
                    </div>
                </div>
            )}
            
            <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 lg:p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm min-h-[400px]">
                {activeTab === 'url' ? renderUrlScanner() : activeTab === 'image' ? renderImageScanner() : activeTab === 'video' ? renderVideoScanner() : renderPdfScanner()}
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 sm:p-6 lg:p-8 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <HistoryIcon className="w-6 h-6 text-purple-accent"/>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{t('scanner.history_title')}</h2>
                </div>
                {scanHistory.length === 0 ? (
                    <p className="text-center text-gray-500 py-8 bg-gray-100 dark:bg-gray-800/50 rounded-lg">{t('scanner.history_empty')}</p>
                ) : (
                    <div className="space-y-2">
                        {scanHistory.map(item => (
                            <button key={item.id} onClick={() => handleHistoryClick(item)} className="w-full text-left p-3 bg-gray-100 dark:bg-gray-800/50 hover:bg-gray-200 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center justify-between gap-4">
                                {renderHistoryItemContent(item)}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Scanner;