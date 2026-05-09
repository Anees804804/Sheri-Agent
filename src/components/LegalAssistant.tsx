import React, { useState, useRef, useEffect } from 'react';
import { Mic, Scan, Search, Copy, Check, Shield, FileText, ArrowRight, Loader2, Info, X, Camera, Image, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI, Type } from "@google/genai";
import { cn } from '@/src/lib/utils';
import { LegalAnalysis } from '@/src/types';

// Extend Window interface for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function LegalAssistant() {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<LegalAnalysis | null>(null);
  const [isAnalyzed, setIsAnalyzed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Hardware States
  const [isListening, setIsListening] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  
  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US'; // Default, but it handles mixed speech reasonably well

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setQuery(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Please allow microphone access in browser settings');
        }
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start recognition:', err);
      }
    }
  };

  const startCamera = async () => {
    setIsCameraModalOpen(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      alert('Please allow camera access in browser settings');
      setIsCameraModalOpen(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsCameraModalOpen(false);
  };

  const captureFrame = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg');
        // Placeholder for OCR implementation
        setQuery("Scan Result: [Captured Document Text Placeholder]");
        stopCamera();
      }
    }
  };

  const handleReset = () => {
    setQuery('');
    setResult(null);
    setIsAnalyzed(false);
    setError(null);
    setIsListening(false);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
  };

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setQuery(`[Document Attached: ${file.name}] ready for analysis`);
    }
  };

  const handleAnalyze = async () => {
    const cleanQuery = query.trim();
    if (!cleanQuery) return;

    setIsLoading(true);
    setResult(null);
    setIsAnalyzed(false);
    setError(null);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `User input is text-only: "${cleanQuery}". Provide the legal analysis in the required JSON format immediately.`,
        config: {
          systemInstruction: `You are "Shehri-Agent", an AI Legal Assistant for citizens of Pakistan.
Your role is to understand user problems in Urdu, Sindhi, or English and provide a structured JSON response.

BEHAVIOR RULES:
- Act like a practical legal advisor, not a generic chatbot.
- Focus on real-world solutions.
- Do NOT use complex legal jargon.
- Do NOT mention specific law sections unless 100% certain.
- Never hallucinate laws or false information.

LANGUAGE RULES:
- Legal Guidance → Simple Urdu (REHNAMAI)
- Complaint → Professional English

OUTPUT FORMAT (STRICT JSON ONLY):
{
  "category": "Classification type (telecom, banking, electricity, theft, fraud, online_shopping, harassment, general)",
  "legal_guidance_urdu": "Simple Urdu guidance here",
  "formal_complaint": {
    "subject": "Clear professional subject line",
    "body": "Formal complaint body in English"
  },
  "suggested_authority": "Mapping: telecom->PTA, banking->Banking Mohtasib, electricity->NEPRA, theft->Police (FIR), fraud->FIA Cyber Crime, online_shopping->Consumer Protection, harassment->Police/FIA",
  "next_steps": [
    "Step 1...",
    "Step 2...",
    "Step 3..."
  ]
}`,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              legal_guidance_urdu: { type: Type.STRING },
              formal_complaint: {
                type: Type.OBJECT,
                properties: {
                  subject: { type: Type.STRING },
                  body: { type: Type.STRING }
                },
                required: ["subject", "body"]
              },
              suggested_authority: { type: Type.STRING },
              next_steps: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["category", "legal_guidance_urdu", "formal_complaint", "suggested_authority", "next_steps"]
          }
        },
      });

      let responseText = response.text || '';
      
      // Robust JSON Parsing: Strip backticks/markdown if present
      const jsonMatch = responseText.match(/```json\s?([\s\S]*?)\s?```/) || responseText.match(/```\s?([\s\S]*?)\s?```/);
      const sanitizedText = jsonMatch ? jsonMatch[1].trim() : responseText.trim();
      
      let data: LegalAnalysis;
      try {
        data = JSON.parse(sanitizedText);
      } catch (parseError) {
        console.warn('JSON parsing failed, using fallback wrapper:', parseError);
        // Fallback Mechanism
        data = {
          category: 'general',
          legal_guidance_urdu: 'Hum aapki darkhwast ka processing mukammal nahi kar sakay. Baraye meharbani dobara koshish karein ya apna masla wazahat se likhein.',
          formal_complaint: {
            subject: 'Legal Situation Analysis',
            body: sanitizedText || responseText || 'Error processing request.'
          },
          suggested_authority: 'General Legal Aid',
          next_steps: ['Please try rephrasing your concern.', 'Contact a legal expert if the issue persists.']
        };
      }

      setResult(data);
      setIsAnalyzed(true);
      
      // Scroll to results after a short delay for animation
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } catch (err: any) {
      console.error('Error analyzing query:', err);
      setError(err?.message || 'An unexpected error occurred while analyzing your legal situation.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!result) return;
    const text = `Subject: ${result.formal_complaint.subject}\n\n${result.formal_complaint.body}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-12">
      {/* Centered Input Area */}
      <section className="flex flex-col items-center justify-center text-center space-y-8 pt-12 md:pt-20">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            How can I <span className="text-gradient">help you</span> today?
          </h2>
          <p className="text-slate-400 text-lg max-w-xl mx-auto">
            Share your problem in English, Urdu, or Sindhi. Get instant legal guidance and ready-to-use complaint drafts.
          </p>
        </div>

        <div className="w-full max-w-4xl relative group">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />
          
          <div className="absolute -top-12 right-0">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 transition-all border border-white/5 active:scale-95"
              title="Clear All"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Reset</span>
            </button>
          </div>

          <div className="relative glass rounded-2xl p-2 pl-6 flex flex-col md:flex-row items-stretch gap-2 transition-all duration-300 shadow-cyan">
            <div className="flex-1 flex items-center min-h-[60px]">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
                placeholder={isListening ? "Listening... (Bolna shuru karein)" : "Apna masla likhein... (Urdu / English / Sindhi)"}
                className={cn(
                  "bg-transparent border-none focus:ring-0 text-lg w-full text-slate-100 placeholder:text-slate-500 urdu-font",
                  isListening && "text-cyan-400 font-medium"
                )}
              />
            </div>
            <div className="flex items-center gap-2 p-1 pt-2 md:pt-0">
              <button 
                onClick={toggleListening}
                className={cn(
                  "p-3 rounded-xl glass transition-all duration-300 relative overflow-hidden",
                  isListening ? "text-white bg-cyan-500/20 shadow-[0_0_15px_rgba(34,211,238,0.4)]" : "text-cyan-400 hover:bg-white/10"
                )} 
                title="Voice Input"
              >
                <Mic className={cn("w-5 h-5 z-10 relative", isListening && "animate-pulse")} />
                {isListening && (
                  <motion.div 
                    layoutId="pulse"
                    className="absolute inset-0 bg-cyan-400/20"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </button>
              <button 
                onClick={startCamera}
                className="p-3 rounded-xl glass hover:bg-white/10 text-purple-400 transition-colors" 
                title="Scan Document"
              >
                <Scan className="w-5 h-5" />
              </button>
              <button 
                onClick={triggerFilePicker}
                className="p-3 rounded-xl glass hover:bg-white/10 text-indigo-400 transition-colors" 
                title="Upload Image"
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                onClick={handleAnalyze}
                disabled={isLoading || !query.trim()}
                className={cn(
                  "flex items-center justify-center gap-2 px-8 py-3 rounded-xl font-bold transition-all duration-300 shadow-lg tracking-widest text-sm",
                  query.trim() 
                    ? "accent-gradient text-white hover:scale-[1.02] active:scale-[0.98]" 
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                )}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>ANALYZE</>}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Camera Modal Overlay */}
      <AnimatePresence>
        {isCameraModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0f172a]/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="glass rounded-3xl overflow-hidden w-full max-w-2xl relative shadow-2xl border border-white/10 shadow-purple-500/10"
            >
              <div className="p-4 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2 text-purple-400">
                  <Scan className="w-5 h-5" />
                  <span className="font-bold uppercase tracking-wider text-sm">Document Scanner</span>
                </div>
                <button onClick={stopCamera} className="p-2 rounded-full hover:bg-white/5 text-slate-400">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="relative aspect-video bg-black flex items-center justify-center">
                <video 
                  ref={videoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-contain"
                />
                
                {/* Scanner Framework UI */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="w-4/5 h-4/5 border-2 border-white/20 rounded-2xl relative">
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-purple-500 rounded-tl-xl" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-purple-500 rounded-tr-xl" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-purple-500 rounded-bl-xl" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-purple-500 rounded-br-xl" />
                    
                    {/* Animated Scanning Line */}
                    <motion.div 
                      className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-purple-500 to-transparent blur-sm"
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 flex items-center justify-center gap-4">
                <button 
                  onClick={captureFrame}
                  className="px-10 py-4 rounded-2xl accent-gradient text-white font-bold tracking-widest flex items-center gap-3 shadow-lg shadow-purple-500/20 active:scale-95 transition-transform"
                >
                  <Camera className="w-5 h-5" />
                  CAPTURE DOCUMENT
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="flex flex-col items-center justify-center py-10 space-y-4"
          >
            <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-cyan-400 text-xs font-semibold tracking-wider uppercase">Analyzing your legal situation...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full max-w-2xl mx-auto p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
          >
            <Info className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-bold text-sm uppercase tracking-wider mb-1">Analysis Error</p>
              <p className="text-slate-300 text-sm leading-relaxed">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="p-1 hover:bg-white/5 rounded-lg text-slate-500">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Section */}
      <AnimatePresence>
        {isAnalyzed && result && (
          <motion.section 
            ref={scrollRef}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-12"
          >
            {/* Guidance Card (Urdu) */}
            <div className="glass rounded-2xl p-6 border-l-4 border-blue-500 card-hover flex flex-col h-[400px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <h3 className="font-bold text-blue-400">Aap ke liye rehnumai</h3>
              </div>
              <div className="flex-1 overflow-y-auto pr-2">
                <p className="urdu-font text-xl md:text-2xl leading-relaxed text-slate-100" dir="rtl">
                  {result.legal_guidance_urdu}
                </p>
              </div>
            </div>

            {/* Complaint Card */}
            <div className="bg-slate-50 rounded-2xl p-6 shadow-2xl flex flex-col h-[400px] border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <FileText className="w-5 h-5 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-slate-900">Formal Complaint Draft</h3>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className="text-[10px] bg-slate-200 px-2 py-1 rounded font-bold text-slate-600 hover:bg-slate-300"
                >
                  {copied ? 'COPIED' : 'COPY'}
                </button>
              </div>
              <div className="flex-1 bg-slate-100 rounded-xl p-4 font-mono text-xs text-slate-700 leading-relaxed overflow-y-auto">
                <div className="urdu-font text-slate-900">
                  <div className="border-b border-slate-200 pb-2 mb-4">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Subject</span>
                    <h4 className="text-sm font-bold text-slate-800">{result.formal_complaint.subject}</h4>
                  </div>
                  <div className="prose prose-slate prose-sm max-w-none">
                    <ReactMarkdown>{result.formal_complaint.body}</ReactMarkdown>
                  </div>
                </div>
              </div>
            </div>

            {/* Next Steps Card */}
            <div className="glass rounded-2xl p-6 border-l-4 border-emerald-500 card-hover flex flex-col h-[400px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <h3 className="font-bold text-emerald-400">Next Steps</h3>
              </div>
              <ul className="space-y-4 overflow-y-auto pr-2">
                {result.next_steps.map((step, idx) => (
                  <li key={idx} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 text-xs font-bold shrink-0">{idx + 1}</div>
                    <p className="text-sm text-slate-300">{step}</p>
                  </li>
                ))}
                <li className="pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-4 h-4 text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">Suggested Authority</span>
                  </div>
                  <h5 className="text-lg font-bold text-white mb-2">{result.suggested_authority}</h5>
                  <button className="w-full py-3 rounded-xl accent-gradient text-white text-xs font-bold tracking-widest">VISIT OFFICIAL SITE</button>
                </li>
              </ul>
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
