// Full implementation of Assistant.tsx to resolve module and rendering errors.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Chat } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { startChat } from '../services/geminiService';
import { useLanguage } from '../context/LanguageContext';
import { PaperclipIcon, SendIcon, AssistantIcon, CloseIcon, PdfIcon } from '../components/icons';
import type { ChatMessage, GroundingChunk } from '../types';

const Assistant: React.FC = () => {
    const { t, language } = useLanguage();
    const [chatSession, setChatSession] = useState<Chat | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mode, setMode] = useState<'Detailed' | 'Concise'>('Detailed');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [videoFile, setVideoFile] = useState<File | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setMessages([{
            role: 'model',
            parts: [{ text: t('assistant.welcome') }],
        }]);
    }, [t]);
    
    useEffect(() => {
        const session = startChat(language, mode);
        setChatSession(session);
    }, [language, mode]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);
    
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto'; // Reset height to shrink if text is deleted
            const scrollHeight = textarea.scrollHeight;
            const maxHeight = 100; // Corresponds to maxHeight in inline style

            textarea.style.height = `${scrollHeight}px`;

            // Hide scrollbar unless content exceeds maxHeight
            if (scrollHeight > maxHeight) {
                textarea.style.overflowY = 'auto';
            } else {
                textarea.style.overflowY = 'hidden';
            }
        }
    }, [input]);

    const resetInputs = () => {
        setInput('');
        setImagePreview(null);
        setImageFile(null);
        setVideoPreview(null);
        setVideoFile(null);
        setPdfFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSendMessage = useCallback(async () => {
        if ((!input.trim() && !imageFile && !videoFile && !pdfFile) || !chatSession || isLoading) return;

        const userMessageText = input.trim();
        const userImagePreview = imagePreview;
        const userVideoPreview = videoPreview;
        const userPdfName = pdfFile?.name;

        resetInputs();
        setIsLoading(true);

        const userMessage: ChatMessage = {
            role: 'user',
            parts: [{ text: userMessageText }],
            image: userImagePreview || undefined,
            video: userVideoPreview || undefined,
            pdf: userPdfName || undefined,
        };
        setMessages(prev => [...prev, userMessage]);
        
        // Add placeholder for model response
        setMessages(prev => [...prev, { role: 'model', parts: [{ text: '' }] }]);

        try {
            const messageParts: (({ text: string; } | { inlineData: { data: string; mimeType: string; }; }))[] = [];
            
            if (imageFile && userImagePreview) {
                const base64Data = userImagePreview.split(',')[1];
                messageParts.push({ inlineData: { data: base64Data, mimeType: imageFile.type } });
            } else if (videoFile && userVideoPreview) {
                const base64Data = userVideoPreview.split(',')[1];
                messageParts.push({ inlineData: { data: base64Data, mimeType: videoFile.type } });
            } else if (pdfFile) {
                 const reader = new FileReader();
                 reader.readAsDataURL(pdfFile);
                 await new Promise<void>((resolve, reject) => {
                    reader.onloadend = () => {
                        const base64Data = (reader.result as string).split(',')[1];
                        messageParts.push({ inlineData: { data: base64Data, mimeType: pdfFile.type } });
                        resolve();
                    };
                    reader.onerror = reject;
                 });
            }

            if (userMessageText) {
                messageParts.push({ text: userMessageText });
            }

            // FIX: Correctly pass the `messageParts` array as the `message` property.
            const stream = await chatSession.sendMessageStream({ message: messageParts });
            
            let accumulatedText = '';
            let groundingChunks: GroundingChunk[] = [];
            
            for await (const chunk of stream) {
                accumulatedText += chunk.text;
                const newGroundingMetadata = chunk.candidates?.[0]?.groundingMetadata;
                if (newGroundingMetadata?.groundingChunks) {
                    groundingChunks = [...newGroundingMetadata.groundingChunks];
                }
                
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage.role === 'model') {
                        lastMessage.parts = [{ text: accumulatedText }];
                        lastMessage.sources = groundingChunks.length > 0 ? (groundingChunks as GroundingChunk[]) : undefined;
                    }
                    return newMessages;
                });
            }

        } catch (error) {
            console.error("Error sending message:", error);
            setMessages(prev => {
                const newMessages = [...prev];
                const lastMessage = newMessages[newMessages.length - 1];
                if (lastMessage.role === 'model') {
                    lastMessage.parts = [{ text: t('assistant.error') }];
                }
                return newMessages;
            });
        } finally {
            setIsLoading(false);
        }
    }, [input, imageFile, imagePreview, videoFile, videoPreview, pdfFile, chatSession, isLoading, t]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        resetInputs(); // Clear previous selections

        if (file.type.startsWith('image/')) {
            if (file.size > 4 * 1024 * 1024) return; // 4MB limit
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        } else if (file.type.startsWith('video/')) {
            if (file.size > 50 * 1024 * 1024) return; // 50MB limit
            setVideoFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setVideoPreview(reader.result as string);
            reader.readAsDataURL(file);
        } else if (file.type === 'application/pdf') {
            if (file.size > 10 * 1024 * 1024) return; // 10MB limit
            setPdfFile(file);
        }
    };
    
    const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.kind === 'file') {
                const file = item.getAsFile();
                if (file) {
                    e.preventDefault();
                    resetInputs();
                    
                    if (file.type.startsWith('image/')) {
                         if (file.size > 4 * 1024 * 1024) return;
                         setImageFile(file);
                         const reader = new FileReader();
                         reader.onloadend = () => setImagePreview(reader.result as string);
                         reader.readAsDataURL(file);
                         return;
                    } else if (file.type.startsWith('video/')) {
                        if (file.size > 50 * 1024 * 1024) return;
                        setVideoFile(file);
                        const reader = new FileReader();
                        reader.onloadend = () => setVideoPreview(reader.result as string);
                        reader.readAsDataURL(file);
                        return;
                    } else if (file.type === 'application/pdf') {
                        if (file.size > 10 * 1024 * 1024) return;
                        setPdfFile(file);
                        return;
                    }
                }
            }
        }
    }, []);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };
    
    const mediaPreview = imagePreview ? (
        <div className="absolute bottom-12 left-0 p-1 bg-white dark:bg-gray-900 rounded-lg shadow-md">
            <img src={imagePreview} alt="preview" className="h-20 w-20 object-cover rounded" />
            <button onClick={resetInputs} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-0.5">
                <CloseIcon className="w-4 h-4" />
            </button>
        </div>
    ) : videoPreview ? (
         <div className="absolute bottom-12 left-0 p-1 bg-white dark:bg-gray-900 rounded-lg shadow-md">
            <video src={videoPreview} muted className="h-20 w-20 object-cover rounded" />
            <button onClick={resetInputs} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-0.5">
                <CloseIcon className="w-4 h-4" />
            </button>
        </div>
    ) : pdfFile ? (
        <div className="absolute bottom-12 left-0 p-2 bg-white dark:bg-gray-900 rounded-lg shadow-md flex items-center gap-2">
            <PdfIcon className="w-8 h-8 text-purple-accent" />
            <span className="text-sm text-gray-600 dark:text-gray-300 max-w-xs truncate">{pdfFile.name}</span>
            <button onClick={resetInputs} className="absolute -top-2 -right-2 bg-gray-700 text-white rounded-full p-0.5">
                <CloseIcon className="w-4 h-4" />
            </button>
        </div>
    ) : null;


    return (
        <div className="flex flex-col h-[calc(100vh-120px)] bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm animate-fade-in">
            <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
                <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t('assistant.title')}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t('assistant.subtitle')}</p>
                </div>
                <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-md">
                    <button onClick={() => setMode('Concise')} className={`px-3 py-1 text-xs font-semibold rounded ${mode === 'Concise' ? 'bg-purple-accent text-white' : 'text-gray-600 dark:text-gray-300'}`}>Concise</button>
                    <button onClick={() => setMode('Detailed')} className={`px-3 py-1 text-xs font-semibold rounded ${mode === 'Detailed' ? 'bg-purple-accent text-white' : 'text-gray-600 dark:text-gray-300'}`}>Detailed</button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-gray-600' : 'bg-purple-accent'}`}>
                            {msg.role === 'user' ? <span className="text-white font-bold text-sm">U</span> : <AssistantIcon className="w-5 h-5 text-white" />}
                        </div>
                        <div className={`p-4 rounded-xl max-w-xl break-words ${msg.role === 'user' ? 'bg-gray-200 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'}`}>
                            {msg.image && <img src={msg.image} alt="user upload" className="rounded-lg mb-2 max-h-48" />}
                            {msg.video && <video src={msg.video} controls className="rounded-lg mb-2 max-h-48" />}
                            {msg.pdf && <div className="flex items-center gap-2 p-2 bg-gray-200 dark:bg-gray-600 rounded-md mb-2"><PdfIcon className="w-6 h-6 text-purple-accent" /><span className="text-sm truncate">{msg.pdf}</span></div>}
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{msg.parts[0].text}</ReactMarkdown>
                            </div>
                            {msg.sources && msg.sources.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-300 dark:border-gray-600">
                                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">{t('assistant.sources')}</h4>
                                    <div className="space-y-2">
                                        {/* fix: Filter out sources that do not have a URI to avoid rendering broken links. */}
                                        {msg.sources.filter(source => source.web?.uri).map((source, i) => (
                                            <a key={i} href={source.web!.uri} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline block truncate">
                                                {source.web!.title || source.web!.uri}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3 flex-row">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-purple-accent">
                            <AssistantIcon className="w-5 h-5 text-white" />
                        </div>
                        <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-purple-accent rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-purple-accent rounded-full animate-pulse delay-150"></div>
                                <div className="w-2 h-2 bg-purple-accent rounded-full animate-pulse delay-300"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-800">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-2 flex items-end gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="p-2.5 text-gray-500 hover:text-purple-accent hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <PaperclipIcon className="w-5 h-5" />
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*,application/pdf" className="hidden" />
                    
                    <div className="flex-1 relative">
                        {mediaPreview}
                        {!input && !imagePreview && !videoPreview && !pdfFile && (
                            <div className="absolute inset-0 p-2 text-gray-500 pointer-events-none overflow-hidden text-ellipsis whitespace-nowrap">
                                {t('assistant.placeholder')}
                            </div>
                        )}
                        <textarea
                            ref={textareaRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            onPaste={handlePaste}
                            placeholder=""
                            rows={1}
                            className="w-full bg-transparent p-2 text-gray-800 dark:text-white resize-none focus:outline-none"
                            style={{maxHeight: '100px', overflowY: 'hidden'}}
                        />
                    </div>

                    <button onClick={handleSendMessage} disabled={isLoading || (!input.trim() && !imageFile && !videoFile && !pdfFile)} className="p-2.5 bg-purple-accent text-white rounded-lg hover:bg-purple-light disabled:bg-gray-500 transition-colors">
                        <SendIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Assistant;
