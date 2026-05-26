import React, { useState, useEffect, useRef } from 'react';
import * as htmlToImage from 'html-to-image';
import { 
  Sparkles, 
  Trash2, 
  Copy, 
  Download, 
  Layout, 
  User, 
  Image as ImageIcon, 
  Sliders, 
  RefreshCw, 
  Check, 
  Heart, 
  Music, 
  Menu, 
  MessageSquare, 
  Upload, 
  FileText,
  AlertCircle,
  ToggleLeft,
  ChevronRight,
  Eye,
  Settings,
  Flame,
  X,
  Plus,
  Mail
} from 'lucide-react';

import { parseRawComments, CommentItem, CleanOptions, generateRandomUser, PlatformType } from './parser';
import { PRESETS } from './presets';
import { CardPreview, CardStyleOptions, THEME_GRADIENTS } from './components/CardPreview';
import { LandingPage } from './components/LandingPage';
import { BackgroundFlow } from './components/BackgroundFlow';
import logoPng from '../logo.png';

export default function App() {
  // Path-based routing state switcher: landing page, workspace app, or admin database panel
  const [currentView, setCurrentView] = useState<"landing" | "app" | "admin">(() => {
    if (window.location.pathname === "/studio") return "app";
    if (window.location.pathname === "/db-admin") return "admin";
    return "landing";
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname;
      if (path === "/studio") {
        setCurrentView("app");
      } else if (path === "/db-admin") {
        setCurrentView("admin");
      } else {
        setCurrentView("landing");
      }
    };
    window.addEventListener("popstate", handleLocationChange);
    return () => window.removeEventListener("popstate", handleLocationChange);
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new Event("popstate"));
  };

  // Swaps manifest dynamically so that the admin page can be installed separately
  useEffect(() => {
    const manifestEl = document.querySelector('link[rel="manifest"]');
    if (manifestEl) {
      if (currentView === "admin") {
        manifestEl.setAttribute("href", "/manifest-admin.json");
      } else {
        manifestEl.setAttribute("href", "/manifest.json");
      }
    }
  }, [currentView]);

  // Input State
  const [rawInput, setRawInput] = useState<string>("");
  const [cleanedComments, setCleanedComments] = useState<CommentItem[]>([]);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [platform, setPlatform] = useState<PlatformType>("Generic");
  
  // Cleaning Settings (MVP Engine)
  const [cleanOptions, setCleanOptions] = useState<CleanOptions>({
    keepEmojis: true,
    removeDuplicates: true,
    aggressiveClean: false,
    preserveSlang: true
  });

  // Card Global Customization State (V2 Aesthetics)
  const [cardOptions, setCardOptions] = useState<CardStyleOptions>({
    theme: "clean-white",
    fontFamily: "font-sans",
    fontSize: "text-base",
    align: "text-left",
    rounded: "rounded-xl",
    shadow: "shadow-md",
    bgType: "gradient",
    solidBg: "#e2f89c",
    gradientBg: "bg-gradient-to-tr from-cyan-400 to-blue-500",
    bgImage: null,
    customAvatar: null,
    customUsername: "",
    customHandle: "",
    showTimestamp: true,
    showStatusIcons: true,
    aspectRatio: "16:9"
  });

  // UI Local States
  const [copiedLyrics, setCopiedLyrics] = useState<boolean>(false);
  const [copiedSingleCardId, setCopiedSingleCardId] = useState<string | null>(null);
  const [exportProgress, setExportProgress] = useState<{current: number; total: number} | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  
  // Tabs/Panels Layout
  const [activeTab, setActiveTab] = useState<"cleaner" | "cards">("cleaner");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  const [waitlistEmails, setWaitlistEmails] = useState<{ email: string; timestamp: string }[]>([]);
  const [adminFetchError, setAdminFetchError] = useState<string | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState<boolean>(false);

  const fetchWaitlistEmails = async () => {
    setIsAdminLoading(true);
    setAdminFetchError(null);
    try {
      const response = await fetch('http://localhost:5000/api/waitlist');
      if (response.ok) {
        const data = await response.json();
        setWaitlistEmails(data);
      } else {
        setAdminFetchError('Failed to fetch waitlist database.');
      }
    } catch (err) {
      setAdminFetchError('Could not connect to the database server. Ensure node server.js is running.');
    } finally {
      setIsAdminLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === 'admin') {
      fetchWaitlistEmails();
    }
  }, [currentView]);

  const exportWaitlistEmailsFile = () => {
    if (waitlistEmails.length === 0) return;
    const content = waitlistEmails.map(item => item.email).join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `commentflow_waitlist_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Individual card customization edits mapping
  // We keep a local state of overrides for comments if the user edits them directly!
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  // Trigger auto-parse when typing or changing settings
  const handleCleanAction = () => {
    setIsCleaning(true);
    // Simulate slight organic delay of engine processing for visual satisfaction
    setTimeout(() => {
      const results = parseRawComments(rawInput, cleanOptions, platform);
      setCleanedComments(results);
      setIsCleaning(false);
    }, 450);
  };

  // Preset quick insert
  const loadPreset = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      setRawInput(preset.content);
      setSelectedPresetId(presetId);
      setPlatform(preset.platform);
      // Auto process the preset with current options
      const results = parseRawComments(preset.content, cleanOptions, preset.platform);
      setCleanedComments(results);
    }
  };

  // Quick Clear State
  const clearAll = () => {
    setRawInput("");
    setCleanedComments([]);
    setSelectedPresetId(null);
    setPlatform("Generic");
  };

  // Generate continuous lyric-ready text lines (NO usernames, NO numbers)
  const getCleanedLyricsText = (): string => {
    return cleanedComments.map(c => c.text).join("\n\n");
  };

  // Copy lyrics to clipboard
  const copyLyricsToClipboard = () => {
    const text = getCleanedLyricsText();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedLyrics(true);
    setTimeout(() => setCopiedLyrics(false), 2000);
  };

  // Download pure TXT output
  const downloadLyricsAsTxt = () => {
    const text = getCleanedLyricsText();
    if (!text) return;
    const element = document.createElement("a");
    const file = new Blob([text], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "commentflow_ai_ready_lyrics.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Single card download helper
  const downloadSingleCard = async (commentId: string, index: number) => {
    const cardElement = document.getElementById(`comment-card-container-${commentId}`);
    if (!cardElement) return;

    setCopiedSingleCardId(commentId);
    try {
      // Small timeout to allow state updates
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await htmlToImage.toPng(cardElement, {
        quality: 1,
        pixelRatio: 2, // High DPI rendering
        backgroundColor: "transparent",
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.download = `commentflow_card_${index + 1}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Card render error:", error);
    } finally {
      setCopiedSingleCardId(null);
    }
  };

  // Batch Export PNG Cards sequentially
  const downloadAllCardsBatch = async () => {
    if (cleanedComments.length === 0) return;
    setExportProgress({ current: 0, total: cleanedComments.length });

    for (let i = 0; i < cleanedComments.length; i++) {
      const comment = cleanedComments[i];
      const cardElement = document.getElementById(`comment-card-container-${comment.id}`);
      if (cardElement) {
        setExportProgress({ current: i + 1, total: cleanedComments.length });
        try {
          // Pause slightly to avoid freezing the tab
          await new Promise(r => setTimeout(r, 300));
          const dataUrl = await htmlToImage.toPng(cardElement, {
            quality: 0.95,
            pixelRatio: 2,
            backgroundColor: "transparent"
          });
          const link = document.createElement('a');
          link.download = `commentflow_card_batch_${i + 1}.png`;
          link.href = dataUrl;
          link.click();
        } catch (err) {
          console.error(`Failed to export card index ${i}`, err);
        }
      }
    }

    // Success fade
    setTimeout(() => {
      setExportProgress(null);
    }, 1500);
  };

  // Update specific single comment properties (inline edits)
  const updateSingleCommentText = (id: string, newText: string) => {
    setCleanedComments(prev => prev.map(c => c.id === id ? { ...c, text: newText } : c));
  };

  const updateSingleCommentUser = (id: string, fields: Partial<Pick<CommentItem, "username" | "handle">>) => {
    setCleanedComments(prev => prev.map(c => c.id === id ? { ...c, ...fields } : c));
  };

  // Custom visual background image upload
  const handleBgImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCardOptions(prev => ({
            ...prev,
            bgType: "image",
            bgImage: e.target!.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Global visual profile avatar upload
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          setCardOptions(prev => ({
            ...prev,
            customAvatar: e.target!.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Randomize initials color or re-hash usernames
  const rerollMetadata = () => {
    setCleanedComments(prev => prev.map(c => {
      const user = generateRandomUser();
      return { 
        ...c, 
        username: user.username,
        handle: user.handle,
        avatarColor: user.avatarColor 
      };
    }));
  };

  // Parse instantly if presets exist
  useEffect(() => {
    if (PRESETS.length > 0) {
      loadPreset(PRESETS[0].id);
    }
  }, []);

  if (currentView === "landing") {
    return <LandingPage onLaunchApp={() => navigateTo("/studio")} />;
  }

  if (currentView === "admin") {
    return (
      <div className="min-h-screen bg-[#09090B] text-[#E4E4E7] font-outfit p-4 sm:p-8 flex flex-col items-center justify-center relative overflow-hidden antialiased">
        <BackgroundFlow />
        
        {/* Main Admin Card */}
        <div className="relative w-full max-w-4xl bg-[#121215]/95 backdrop-blur-md rounded-[2.25rem] p-6 sm:p-8 border border-white/10 shadow-2xl z-10 space-y-6 animate-fade-in-up">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div>
              <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigateTo("/")}>
                <img src={logoPng} className="w-8 h-8 object-contain" alt="CommentFlow Logo" />
                <h1 className="text-xl font-black text-white tracking-tighter italic">
                  COMMENT<span className="text-[#FF4E00] not-italic">FLOW</span>
                  <span className="text-[10px] font-mono font-bold text-[#FF4E00] uppercase tracking-widest ml-3 bg-[#FF4E00]/10 border border-[#FF4E00]/20 px-2 py-1 rounded">
                    Admin Portal
                  </span>
                </h1>
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight mt-4 flex items-center space-x-2">
                <span>Waitlist Database Logs</span>
                <span className="text-xs bg-[#FF4E00]/10 text-[#FF4E00] border border-[#FF4E00]/20 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  {waitlistEmails.length} Records
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-1">Real-time signup logs stored locally in emails.json database file</p>
            </div>
            <div className="flex flex-wrap gap-3 w-full sm:w-auto justify-end">
              <button
                onClick={fetchWaitlistEmails}
                disabled={isAdminLoading}
                className="flex-grow sm:flex-grow-0 px-5 py-2.5 bg-white/5 border border-white/5 hover:border-[#FF4E00]/30 hover:bg-white/10 text-white font-bold text-xs rounded-full transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAdminLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={exportWaitlistEmailsFile}
                disabled={waitlistEmails.length === 0}
                className="flex-grow sm:flex-grow-0 px-5 py-2.5 bg-white/5 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-white font-bold text-xs rounded-full transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                title="Export waitlist emails to a TXT file"
              >
                <Download className="w-3.5 h-3.5 text-emerald-450" />
                <span>Export (.TXT)</span>
              </button>
              <button
                onClick={() => navigateTo("/studio")}
                className="flex-grow sm:flex-grow-0 px-5 py-2.5 bg-[#FF4E00] hover:bg-[#ff5d12] text-white font-bold text-xs rounded-full shadow-lg shadow-[#FF4E00]/20 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <span>Go to Studio</span>
              </button>
            </div>
          </div>

          {adminFetchError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs font-bold rounded-2xl">
              ⚠️ {adminFetchError}
            </div>
          )}

          {isAdminLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <RefreshCw className="w-10 h-10 animate-spin text-[#FF4E00]" />
              <p className="text-xs text-slate-500 font-semibold">Reading local database...</p>
            </div>
          ) : waitlistEmails.length === 0 ? (
            <div className="text-center py-20 space-y-2 opacity-50">
              <span className="text-4xl">📧</span>
              <h4 className="text-sm font-bold text-white">Waitlist database is empty</h4>
              <p className="text-xs text-slate-450 font-medium">Join from the landing page waitlist form to add records.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-black/40 max-h-[50vh] overflow-y-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 bg-[#121215] z-10">
                  <tr className="border-b border-white/5 bg-white/5 text-slate-400 uppercase font-mono font-bold">
                    <th className="p-4">#</th>
                    <th className="p-4">Email Address</th>
                    <th className="p-4">Registered On</th>
                  </tr>
                </thead>
                <tbody>
                  {waitlistEmails.map((item, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors font-medium">
                      <td className="p-4 text-slate-500 font-mono">{idx + 1}</td>
                      <td className="p-4 text-white font-semibold">{item.email}</td>
                      <td className="p-4 text-slate-400 font-mono">
                        {new Date(item.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090B] text-[#E4E4E7] font-outfit p-0 m-0 flex flex-col lg:flex-row antialiased">
      
      {/* MOBILE HEADER */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-[72px] bg-[#0C0C0E] border-b border-white/5 px-6 flex items-center justify-between z-50 select-none">
        <div 
          onClick={() => {
            setIsMobileMenuOpen(false);
            navigateTo("/");
          }}
          className="flex items-center space-x-3 cursor-pointer"
        >
          <img src={logoPng} className="w-7 h-7 object-contain" alt="CommentFlow Logo" />
          <div>
            <h1 className="text-base font-black text-white tracking-tighter italic leading-none">
              COMMENT<span className="text-[#FF4E00] not-italic">FLOW</span>
            </h1>
            <span className="block text-[8px] uppercase tracking-widest text-[#FF4E00] font-bold mt-0.5">
              Creator Cleanroom
            </span>
          </div>
        </div>

        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-slate-300 hover:text-white active:scale-95 transition-all outline-none"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* MOBILE MENU DRAWER OVERLAY */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed top-[72px] left-0 right-0 bottom-0 bg-[#09090B]/95 backdrop-blur-lg z-45 flex flex-col justify-between p-6 border-b border-white/5 overflow-y-auto select-none">
          <div className="flex flex-col space-y-6">
            <div className="space-y-2">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-3 pl-3">
                Workspace Menu
              </p>
              
              <button 
                onClick={() => {
                  setActiveTab("cleaner");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-5 py-3 rounded-full text-sm font-semibold transition-all ${
                  activeTab === "cleaner" 
                    ? "bg-[#FF4E00] text-white shadow-lg shadow-[#FF4E00]/20" 
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <Layout className="w-4 h-4" />
                <span>1. Clean & Extract</span>
              </button>

              <button 
                onClick={() => {
                  setActiveTab("cards");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center space-x-3 px-5 py-3 rounded-full text-sm font-semibold transition-all ${
                  activeTab === "cards" 
                    ? "bg-[#FF4E00] text-white shadow-lg shadow-[#FF4E00]/20" 
                    : "bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>2. Visual Card Studio</span>
              </button>



              <button 
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  navigateTo("/");
                }}
                className="w-full flex items-center space-x-3 px-5 py-3 rounded-full text-sm font-semibold transition-all bg-white/5 text-slate-400 hover:text-white pt-3 border-t border-white/5"
              >
                <span className="text-slate-500">←</span>
                <span>Back to Home</span>
              </button>
            </div>

            {/* Metrics inside Mobile Drawer */}
            <div className="bg-[#121215] rounded-[2rem] p-5 border border-white/5 space-y-3.5 shadow-xl">
              <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest pl-2">
                Studio Metrics
              </h4>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center space-x-3 bg-black/40 p-2.5 rounded-full border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-[#FF4E00] flex items-center justify-center text-black font-extrabold text-xs shrink-0">
                    {cleanedComments.length}
                  </div>
                  <div className="text-[10px] leading-tight font-semibold text-slate-400">
                    <span className="block text-white font-extrabold text-[11px]">Total Lines</span>
                    Cleaned Comments
                  </div>
                </div>
                <div className="flex items-center space-x-3 bg-black/40 p-2.5 rounded-full border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[#FF4E00] font-extrabold text-xs shrink-0">
                    {cleanedComments.length > 0 ? getCleanedLyricsText().split(/\s+/).filter(Boolean).length : 0}
                  </div>
                  <div className="text-[10px] leading-tight font-semibold text-slate-400">
                    <span className="block text-white font-extrabold text-[11px]">Word Count</span>
                    Extracted Words
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 mt-6">
            <div className="flex items-center space-x-3 bg-white/5 p-2.5 px-4 rounded-full border border-white/5">
              <div className="w-2 h-2 rounded-full bg-emerald-450 animate-pulse shrink-0" />
              <div className="text-[11px]">
                <span className="font-semibold text-slate-350 block">Status: Cleanroom (PWA Active)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESKTOP SIDEBAR NAVIGATION (visible on lg screens) */}
      <div className="hidden lg:flex w-72 bg-[#0C0C0E] text-[#E0E0E0] p-6 flex-col justify-between border-r border-white/5 shrink-0">
        <div className="flex flex-col space-y-8">
          {/* Logo Brand */}
          <div 
            onClick={() => navigateTo("/")}
            className="flex items-center space-x-3 py-2 border-b border-white/5 cursor-pointer hover:opacity-95 transition-opacity"
            title="Go to Landing Page"
          >
            <img src={logoPng} className="w-8 h-8 object-contain" alt="CommentFlow Logo" />
            <div>
              <h1 className="text-xl font-black text-white tracking-tighter italic">
                COMMENT<span className="text-[#FF4E00] not-italic">FLOW</span>
              </h1>
              <p className="text-[10px] uppercase tracking-widest text-[#FF4E00] font-bold">
                Creator Cleanroom
              </p>
            </div>
          </div>

          {/* Nav Links */}
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-3 pl-3">
              Core Workspace
            </p>
            <button 
              onClick={() => setActiveTab("cleaner")}
              className={`w-full flex items-center space-x-3 px-5 py-3 rounded-full text-sm font-semibold transition-all ${
                activeTab === "cleaner" 
                  ? "bg-[#FF4E00] text-white shadow-lg shadow-[#FF4E00]/20" 
                  : "hover:bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Layout className="w-4 h-4" />
              <span>1. Clean & Extract</span>
            </button>

            <button 
              onClick={() => setActiveTab("cards")}
              className={`w-full flex items-center space-x-3 px-5 py-3 rounded-full text-sm font-semibold transition-all ${
                activeTab === "cards" 
                  ? "bg-[#FF4E00] text-white shadow-lg shadow-[#FF4E00]/20" 
                  : "hover:bg-white/5 text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>2. Visual Card Studio</span>
            </button>



            <button 
              onClick={() => navigateTo("/")}
              className="w-full flex items-center space-x-3 px-5 py-3 rounded-full text-sm font-semibold transition-all hover:bg-white/5 text-slate-400 hover:text-white border-t border-white/5 pt-4 mt-2"
            >
              <span className="text-slate-500">←</span>
              <span>Back to Home</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="bg-[#121215] rounded-[2.25rem] p-5 border border-white/5 space-y-4 shadow-xl">
            <h4 className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest pl-2">
              Studio Metrics
            </h4>
            <div className="flex flex-col space-y-3">
              <div className="flex items-center space-x-3.5 bg-black/40 p-2.5 rounded-full border border-white/5">
                <div className="w-12 h-12 rounded-full bg-[#FF4E00] flex items-center justify-center text-black font-extrabold text-sm shadow-md shadow-[#FF4E00]/15 shrink-0">
                  {cleanedComments.length}
                </div>
                <div className="text-[11px] leading-tight font-semibold text-slate-400">
                  <span className="block text-white font-extrabold text-xs">Total Lines</span>
                  Cleaned Comments
                </div>
              </div>
              <div className="flex items-center space-x-3.5 bg-black/40 p-2.5 rounded-full border border-white/5">
                <div className="w-12 h-12 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center text-[#FF4E00] font-extrabold text-sm shrink-0">
                  {cleanedComments.length > 0 ? getCleanedLyricsText().split(/\s+/).filter(Boolean).length : 0}
                </div>
                <div className="text-[11px] leading-tight font-semibold text-slate-400">
                  <span className="block text-white font-extrabold text-xs">Word Count</span>
                  Extracted Words
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-6 border-t border-white/5 mt-6 lg:mt-0">
          <div className="flex items-center space-x-3 bg-white/5 p-3 px-5 rounded-full border border-white/5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-slate-300 block">Status: Cleanroom (PWA Active)</span>
              <span className="text-[10px] text-slate-500">Fully Client-Side</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-600 font-mono mt-3 text-center">
            CommentFlow v1.0.2
          </p>
        </div>
      </div>

      {/* RIGHT WORKSPACE CANVASES */}
      <div className="flex-1 flex flex-col lg:h-screen lg:overflow-y-auto max-w-7xl mx-auto w-full p-4 sm:p-8 pt-24 lg:pt-8">
        
        {/* Dynamic Head Banner */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="bg-[#FF4E00]/10 text-[#FF4E00] border border-[#FF4E00]/20 font-bold text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Comment Cleaner
              </span>
              <span className="text-xs text-slate-400 font-medium">Transforming social feeds into styled quote cards</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight mt-2">
              Comment<span className="text-[#FF4E00]">Flow</span> Studio.
            </h2>
          </div>

          {/* Quick Clear & Action bar */}
          <div className="flex items-center space-x-3 mt-4 md:mt-0">
            <button 
              onClick={clearAll}
              className="px-5 py-2.5 bg-white/5 border border-white/5 hover:border-[#FF4E00]/30 hover:bg-white/10 text-white font-bold text-xs rounded-full transition-all flex items-center space-x-2 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-[#FF4E00]" />
              <span>Clear Board</span>
            </button>
            <button
              onClick={rerollMetadata}
              className="px-5 py-2.5 bg-white/5 border border-white/5 hover:border-[#FF4E00]/30 hover:bg-white/10 text-white font-bold text-xs rounded-full transition-all flex items-center space-x-2 cursor-pointer"
              title="Re-randomize placeholder usernames and initials colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#FF4E00]" />
              <span>Mix Avatars</span>
            </button>
          </div>
        </div>        {/* Tab-driven layout content inside a gorgeous soft-background grid */}
        {activeTab === "cleaner" ? (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            
            {/* COLUMN 1 (Raw inputs & Presets - 7 Span Cols) */}
            <div className="xl:col-span-7 space-y-6">
              <div className="bg-[#121215] rounded-[2.25rem] p-6 border border-white/5 flex flex-col space-y-4 shadow-xl">
                
                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#FF4E00]/10 flex items-center justify-center text-[#FF4E00] border border-[#FF4E00]/20 shadow-inner">
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Paste Raw Messy Comments</h3>
                      <p className="text-[11px] text-slate-400">Direct clipboard copies</p>
                    </div>
                  </div>

                  {/* Preset quick test templates */}
                  <div className="flex flex-wrap items-center justify-center gap-1 bg-[#09090B] p-1 rounded-full border border-white/5">
                    {PRESETS.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => loadPreset(p.id)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                          selectedPresetId === p.id 
                            ? "bg-[#FF4E00] text-white shadow-md font-black"
                            : "text-slate-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {p.platform}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Main Raw Pasting Field */}
                <div className="relative">
                  <textarea
                    className="w-full h-80 p-5 border border-white/5 rounded-[1.75rem] bg-[#09090B] font-mono text-xs focus:ring-1 focus:ring-[#FF4E00] focus:border-[#FF4E00] transition-all outline-none leading-relaxed resize-none text-slate-100"
                    placeholder="Example: paste raw TikTok, YouTube, or Instagram copies directly here... 
                    
mary42
bro actually cooked with this track 🔥
Reply  Like  3h
"
                    value={rawInput}
                    onChange={(e) => {
                      setRawInput(e.target.value);
                      setSelectedPresetId(null);
                    }}
                  />
                  
                  {rawInput.trim() === "" && (
                    <div className="absolute inset-5 pointer-events-none flex flex-col items-center justify-center opacity-40 text-center space-y-2 mt-12">
                      <FileText className="w-10 h-10 text-slate-500" />
                      <p className="text-xs font-semibold text-slate-400">Clipboard Paste Zone</p>
                      <p className="text-[11px] text-slate-400 max-w-xs leading-relaxed">
                        Copy visual comments on your phone/pc and dump them right here. The engine strips likes, shares, times and usernames automatically.
                      </p>
                    </div>
                  )}
                </div>

                {/* Platform Selector Row */}
                <div className="bg-[#09090B] p-4 rounded-[1.75rem] border border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="space-y-1 self-start">
                    <h5 className="text-xs font-bold text-white flex items-center space-x-1">
                      <Layout className="w-3.5 h-3.5 text-[#FF4E00]" />
                      <span>Platform Parser Mode</span>
                    </h5>
                    <p className="text-[11px] text-slate-400">Tailors regex filters to platform layouts</p>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as PlatformType)}
                      className="text-xs font-semibold bg-[#121215] border border-white/5 text-white px-4 py-2.5 rounded-full outline-none focus:ring-1 focus:ring-[#FF4E00]"
                    >
                      <option value="Generic">Generic / Auto-Detect</option>
                      <option value="TikTok">TikTok</option>
                      <option value="YouTube">YouTube</option>
                      <option value="Instagram">Instagram</option>
                      <option value="X">X (Twitter)</option>
                      <option value="Facebook">Facebook</option>
                    </select>
                  </div>
                </div>

                {/* Micro Toggles Controls Container */}
                <div className="bg-[#09090B] p-4 rounded-[1.75rem] border border-white/5 flex flex-col md:flex-row gap-4 justify-between">
                  <div className="space-y-1">
                    <h5 className="text-xs font-bold text-white flex items-center space-x-1">
                      <Sliders className="w-3.5 h-3.5 text-[#FF4E00]" />
                      <span>Smart Cleaning Presets</span>
                    </h5>
                    <p className="text-[11px] text-slate-400">Fine-tune the parsing regex loops</p>
                  </div>
                  
                  {/* Option toggles */}
                  <div className="flex flex-wrap gap-4 items-center">
                    
                    {/* Keep Emojis Toggle */}
                    <div className="flex items-center space-x-2 text-xs font-semibold select-none text-slate-300">
                      <span>Keep Emojis</span>
                      <button
                        type="button"
                        onClick={() => setCleanOptions(prev => ({ ...prev, keepEmojis: !prev.keepEmojis }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-[#FF4E00] ${
                          cleanOptions.keepEmojis ? 'bg-[#FF4E00]' : 'bg-zinc-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            cleanOptions.keepEmojis ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* De-Duplicate Toggle */}
                    <div className="flex items-center space-x-2 text-xs font-semibold select-none text-slate-300">
                      <span>De-Duplicate</span>
                      <button
                        type="button"
                        onClick={() => setCleanOptions(prev => ({ ...prev, removeDuplicates: !prev.removeDuplicates }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-[#FF4E00] ${
                          cleanOptions.removeDuplicates ? 'bg-[#FF4E00]' : 'bg-zinc-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            cleanOptions.removeDuplicates ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Aggressive Clean Toggle */}
                    <div className="flex items-center space-x-2 text-xs font-semibold select-none text-slate-300" title="Remove hashtags, mentions, double-punctuation">
                      <span>Aggressive Clean</span>
                      <button
                        type="button"
                        onClick={() => setCleanOptions(prev => ({ ...prev, aggressiveClean: !prev.aggressiveClean }))}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-[#FF4E00] ${
                          cleanOptions.aggressiveClean ? 'bg-[#FF4E00]' : 'bg-zinc-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            cleanOptions.aggressiveClean ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                  </div>
                </div>

                {/* Extraction Action Button */}
                <button
                  type="button"
                  onClick={handleCleanAction}
                  disabled={rawInput.trim() === ""}
                  className={`w-full py-4 rounded-full font-black text-sm tracking-tight flex items-center justify-center space-x-3 transition-all ${
                    rawInput.trim() === "" 
                      ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5" 
                      : isCleaning
                        ? "bg-gradient-to-r from-[#FF4E00] via-[#FFAA00] to-[#FF4E00] bg-[length:200%_auto] animate-[shimmer_1.5s_linear_infinite] shadow-[0_0_30px_rgba(255,78,0,0.5)] scale-[0.98] text-white cursor-wait"
                        : "bg-[#FF4E00] hover:bg-[#ff5d12] text-white shadow-lg shadow-[#FF4E00]/25 hover:scale-[1.01] active:scale-[0.99] cursor-pointer glow-btn-primary"
                  }`}
                >
                  {isCleaning && <RefreshCw className="w-4 h-4 animate-spin text-white" />}
                  <span>{isCleaning ? "Cleaning platform noise..." : "Clean Raw Comments"}</span>
                </button>

              </div>
            </div>

             {/* COLUMN 2 (AI-Ready Lyrics Panel - 5 Span Cols) */}
            <div className="xl:col-span-5 space-y-6">
              <div className="bg-[#121215] border border-white/5 rounded-[2.25rem] p-6 text-zinc-100 shadow-xl flex flex-col space-y-4 relative overflow-hidden">
                
                {/* Visual Accent glow line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#FF4E00] to-[#FFAA00]" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-10 h-10 rounded-full bg-[#FF4E00]/10 flex items-center justify-center text-[#FF4E00] border border-[#FF4E00]/20 shadow-inner">
                      <Music className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">AI-Ready Output</h3>
                      <p className="text-[11px] text-slate-400">Preserved flow, line-by-line</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-extrabold text-[#FF4E00] bg-[#FF4E00]/10 border border-[#FF4E00]/20 px-3 py-1 rounded-full font-mono">
                    {cleanedComments.length} Lines
                  </span>
                </div>

                {/* Processed Lyric Box */}
                <div className="relative">
                  <textarea
                    readOnly
                    className="w-full h-80 p-5 border border-white/5 rounded-[1.75rem] bg-[#09090B] font-mono text-xs focus:ring-1 focus:ring-[#FF4E00] focus:border-transparent outline-none leading-relaxed text-zinc-300 resize-none font-bold shadow-inner"
                    value={getCleanedLyricsText()}
                    placeholder="Clean extracted output ready for Suno, Udio, loops or storytelling generators..."
                  />

                  {cleanedComments.length === 0 && (
                    <div className="absolute inset-5 pointer-events-none flex flex-col items-center justify-center opacity-70 text-center space-y-2 mt-12">
                      <AlertCircle className="w-8 h-8 text-[#FF4E00]" />
                      <p className="text-xs font-bold text-white">Ready for clean lines</p>
                      <p className="text-[10px] text-zinc-500 max-w-xs leading-relaxed font-medium">
                        Extracted text lines will appear clean here with zero metadata usernames or timestamps.
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions Row */}
                <div className="grid grid-cols-2 gap-3" id="lyric-actions">
                  <button
                    type="button"
                    onClick={copyLyricsToClipboard}
                    disabled={cleanedComments.length === 0}
                    className={`py-3 rounded-full text-xs font-black flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                      cleanedComments.length === 0 
                        ? "bg-[#161619] text-zinc-650 cursor-not-allowed border border-white/5" 
                        : copiedLyrics 
                          ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/10" 
                          : "bg-zinc-900 border border-white/5 hover:bg-zinc-800 text-white"
                    }`}
                  >
                    {copiedLyrics ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#FF4E00]" />
                        <span>Copy Output</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={downloadLyricsAsTxt}
                    disabled={cleanedComments.length === 0}
                    className={`py-3 rounded-full text-xs font-black flex items-center justify-center space-x-2 transition-all glow-btn-primary cursor-pointer ${
                      cleanedComments.length === 0 
                        ? "bg-[#161619] text-zinc-650 cursor-not-allowed border border-white/5" 
                        : "bg-[#FF4E00] text-black shadow-md shadow-[#FF4E00]/10 font-extrabold"
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download TXT</span>
                  </button>
                </div>
              </div>

              {/* Informative Tip Box */}
              <div className="bg-[#121215] border border-[#FF4E00]/25 rounded-[2rem] p-5 flex items-start space-x-3 text-slate-300">
                <div className="p-1 rounded bg-[#FF4E00]/10 shrink-0 text-[#FF4E00] border border-[#FF4E00]/20">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[#FF4E00]">Why Feed Clean Comment Lines to Music AI?</p>
                  <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                    Udio, Suno and vocal engines thrive on organic human comments because they carry authentic slang, spacing, and emojis, forming natural emotional rhythm. Giving them scrubbed lines produces authentic tracks without spelling metadata or confusing platform buttons.
                  </p>
                </div>
              </div>
            </div>

            {/* QUICK LINK TO CARDS STEP */}
            {cleanedComments.length > 0 && (
              <div className="xl:col-span-12">
                <div className="bg-[#FF4E00]/10 border border-[#FF4E00]/20 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between text-white gap-4 mt-2">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl animate-bounce">🎨</span>
                    <div>
                      <h4 className="text-base font-bold text-[#FF4E00]">Comments Extracted and Structured Successfully</h4>
                      <p className="text-xs text-slate-300">You can now preview visual social media quote cards and style screenshots.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveTab("cards")}
                    className="px-6 py-3 bg-[#FF4E00] hover:bg-[#ff5d12] text-[#fff] font-black text-xs rounded-full transition-all shadow-md flex items-center space-x-2 shrink-0 self-stretch sm:self-auto justify-center cursor-pointer"
                  >
                    <span>Proceed to Card Creator</span>
                    <ChevronRight className="w-4 h-4 stroke-[3]" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Visual Card Generator Panel Flow */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
              
              {/* STYLING CONFIG SIDEBAR - 4 Span Cols */}
              <div className="xl:col-span-4 space-y-6">
                <div className="bg-[#121215] rounded-[2.25rem] p-6 border border-white/5 space-y-6 shadow-xl">
                  
                  {/* Panel Title */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/5">
                    <div className="flex items-center space-x-2">
                      <Sliders className="w-4 h-4 text-[#FF4E00] bg-black p-0.5 rounded border border-white/5" />
                      <h4 className="font-bold text-sm text-white uppercase tracking-wider">Style Configuration</h4>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono">Preset V2</span>
                  </div>

                  {/* Themes Config */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-300 block uppercase tracking-wider">
                      Card Interface Presets
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: "clean-white", label: "Clean White" },
                        { id: "minimal-dark", label: "Minimal Dark" },
                        { id: "tiktok", label: "TikTok Dark" },
                        { id: "youtube", label: "YouTube Light" },
                        { id: "neon", label: "Neon Glow" },
                        { id: "artistic-brutalist", label: "Artistic Brutalist" },
                      ].map((t) => (
                        <button
                          key={t.id}
                          onClick={() => setCardOptions(prev => ({ ...prev, theme: t.id as any }))}
                          className={`px-3 py-2.5 text-[11px] font-bold text-left rounded-full border transition-all cursor-pointer ${
                            cardOptions.theme === t.id 
                              ? "bg-[#FF4E00] text-white border-[#FF4E00] shadow-md shadow-[#FF4E00]/10" 
                              : "bg-[#09090B] border-white/5 text-slate-400 hover:bg-white/5"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Typography Control */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-300 block uppercase tracking-wider">
                      Typography Select
                    </label>
                    <select
                      value={cardOptions.fontFamily}
                      onChange={(e) => setCardOptions(prev => ({ ...prev, fontFamily: e.target.value as any }))}
                      className="w-full text-xs font-semibold bg-[#09090B] border border-white/5 text-white px-4 py-2.5 rounded-full outline-none focus:ring-1 focus:ring-[#FF4E00]"
                    >
                      <option value="font-sans">Inter (Modern Sans)</option>
                      <option value="font-space">Space Grotesk (Tech Heading)</option>
                      <option value="font-outfit">Outfit (Sleek Geometric)</option>
                      <option value="font-mono">JetBrains Mono (Codes / Data)</option>
                      <option value="font-serif">Playfair Display (Serif Elegance)</option>
                    </select>
                  </div>

                  {/* Size and Position Controls */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-300 block uppercase tracking-wider">
                        Text Size
                      </label>
                      <select
                        value={cardOptions.fontSize}
                        onChange={(e) => setCardOptions(prev => ({ ...prev, fontSize: e.target.value as any }))}
                        className="w-full text-xs font-semibold bg-[#09090B] border border-white/5 text-white px-4 py-2.5 rounded-full outline-none focus:ring-1 focus:ring-[#FF4E00]"
                      >
                        <option value="text-xs">Extra Small (xs)</option>
                        <option value="text-sm">Small (sm)</option>
                        <option value="text-base">Base Standard</option>
                        <option value="text-lg">Large (lg)</option>
                        <option value="text-xl">Extra Large (xl)</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-extrabold text-slate-300 block uppercase tracking-wider">
                        Alignment
                      </label>
                      <select
                        value={cardOptions.align}
                        onChange={(e) => setCardOptions(prev => ({ ...prev, align: e.target.value as any }))}
                        className="w-full text-xs font-semibold bg-[#09090B] border border-white/5 text-white px-4 py-2.5 rounded-full outline-none focus:ring-1 focus:ring-[#FF4E00]"
                      >
                        <option value="text-left">Left Align</option>
                        <option value="text-center">Centered</option>
                        <option value="text-right">Right Align</option>
                      </select>
                    </div>
                  </div>

                  {/* Card Aspect Ratio Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-extrabold text-slate-300 block uppercase tracking-wider">
                      Card Aspect Ratio
                    </label>
                    <select
                      value={cardOptions.aspectRatio}
                      onChange={(e) => setCardOptions(prev => ({ ...prev, aspectRatio: e.target.value as any }))}
                      className="w-full text-xs font-semibold bg-[#09090B] border border-white/5 text-white px-4 py-2.5 rounded-full outline-none focus:ring-1 focus:ring-[#FF4E00]"
                    >
                      <option value="16:9">Landscape (16:9)</option>
                      <option value="1:1">Square Post (1:1)</option>
                      <option value="9:16">Portrait/Stories (9:16)</option>
                    </select>
                  </div>

                  {/* Background Styling Panel */}
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <label className="text-xs font-extrabold text-slate-300 block uppercase tracking-wider">
                      Wallpaper/Outer Canvas
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: "gradient", label: "Gradient" },
                        { id: "solid", label: "Solid Color" },
                        { id: "image", label: "Upload Image" },
                        { id: "transparent", label: "None/Alpha" },
                      ].map((bgT) => (
                        <button
                          key={bgT.id}
                          type="button"
                          onClick={() => setCardOptions(prev => ({ ...prev, bgType: bgT.id as any }))}
                          className={`py-2 text-[10px] font-bold rounded-full border text-center transition-all cursor-pointer ${
                            cardOptions.bgType === bgT.id 
                              ? "bg-[#FF4E00] text-white border-[#FF4E00]" 
                              : "bg-[#09090B] border-white/5 text-slate-400 hover:bg-white/5"
                          }`}
                        >
                          {bgT.label}
                        </button>
                      ))}
                    </div>

                    {/* Conditional Background Options */}
                    {cardOptions.bgType === "gradient" && (
                      <div className="space-y-2 pt-2">
                        <span className="text-[10px] text-slate-500 block font-semibold uppercase font-mono">Choose Preset Palette</span>
                        <div className="grid grid-cols-4 gap-1.5 max-h-40 overflow-y-auto">
                           {THEME_GRADIENTS.map((g, gi) => (
                            <button
                              key={gi}
                              onClick={() => setCardOptions(prev => ({ ...prev, gradientBg: g.value }))}
                              className={`h-8 rounded-md transition-all ${g.value} relative border cursor-pointer ${
                                cardOptions.gradientBg === g.value ? "ring-2 ring-[#FF4E00] scale-105" : "border-white/5"
                              }`}
                              title={g.name}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {cardOptions.bgType === "solid" && (
                      <div className="flex items-center space-x-2 pt-2">
                        <input
                          type="color"
                          value={cardOptions.solidBg}
                          onChange={(e) => setCardOptions(prev => ({ ...prev, solidBg: e.target.value }))}
                          className="w-10 h-10 rounded-full cursor-pointer bg-transparent border-0"
                        />
                        <div className="text-xs">
                          <span className="font-semibold block text-white">Select Custom Hex</span>
                          <span className="font-mono text-slate-500 uppercase">{cardOptions.solidBg}</span>
                        </div>
                      </div>
                    )}

                    {cardOptions.bgType === "image" && (
                      <div className="pt-2">
                        <label className="w-full flex flex-col items-center px-4 py-3 bg-[#09090B] text-slate-300 rounded-[1.75rem] border border-dashed border-white/5 hover:bg-white/5 cursor-pointer transition-all">
                          <Upload className="w-5 h-5 text-slate-500 mb-1" />
                          <span className="text-[11px] font-bold">Select high-res wallpaper</span>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={handleBgImageUpload} 
                          />
                        </label>
                        {cardOptions.bgImage && (
                          <div className="flex items-center space-x-2 mt-2">
                            <img src={cardOptions.bgImage} className="w-10 h-10 object-cover rounded-full" alt="thumbnail" />
                            <span className="text-xs text-slate-500">Wallpaper active</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Username Overrides */}
                  <div className="space-y-3 pt-3 border-t border-white/5">
                    <label className="text-xs font-extrabold text-slate-300 block uppercase tracking-wider">
                      Author Info Overrides (Global)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase font-mono">Mock Username</span>
                        <input
                          type="text"
                          value={cardOptions.customUsername}
                          onChange={(e) => setCardOptions(prev => ({ ...prev, customUsername: e.target.value }))}
                          placeholder="Leave blank for random"
                          className="w-full text-xs font-semibold px-4 py-2.5 bg-[#09090B] border border-white/5 text-white rounded-full outline-none focus:ring-1 focus:ring-[#FF4E00]"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] text-slate-400 font-semibold block uppercase font-mono">Mock @Handle</span>
                        <input
                          type="text"
                          value={cardOptions.customHandle}
                          onChange={(e) => setCardOptions(prev => ({ ...prev, customHandle: e.target.value }))}
                          placeholder="@handle"
                          className="w-full text-xs font-semibold px-4 py-2.5 bg-[#09090B] border border-white/5 text-white rounded-full outline-none focus:ring-1 focus:ring-[#FF4E00]"
                        />
                      </div>
                    </div>

                    {/* Shared Creator Profile Logo upload */}
                    <div className="space-y-1 mt-2">
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase font-mono">Custom Global Avatar</span>
                      <label className="w-full flex items-center justify-between px-4 py-2.5 bg-[#09090B] border border-white/5 rounded-full hover:bg-white/5 cursor-pointer transition-all text-xs text-slate-300">
                        <span className="font-semibold">Upload picture...</span>
                        <Upload className="w-4 h-4 text-slate-500" />
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={handleAvatarUpload} 
                        />
                      </label>
                      {cardOptions.customAvatar && (
                        <div className="flex items-center justify-between mt-2 p-1.5 bg-black/40 rounded-full border border-white/5 px-4">
                          <div className="flex items-center space-x-2">
                            <img src={cardOptions.customAvatar} className="w-6 h-6 object-cover rounded-full" alt="avatar" />
                            <span className="text-[11px] text-slate-400 font-mono">Custom avatar active</span>
                          </div>
                          <button 
                            onClick={() => setCardOptions(prev => ({ ...prev, customAvatar: null }))}
                            className="text-xs text-rose-500 hover:underline font-bold cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Extras / Show toggles */}
                  <div className="space-y-2 pt-3 border-t border-white/5">
                    <label className="text-xs font-extrabold text-slate-300 block uppercase tracking-wider">
                      Card Visibilities
                    </label>
                    <div className="flex flex-col space-y-2">
                      <label className="flex items-center justify-between text-xs text-slate-300 font-bold cursor-pointer py-1">
                        <span>Show Likes/Share Panel</span>
                        <input
                          type="checkbox"
                          checked={cardOptions.showStatusIcons}
                          onChange={(e) => setCardOptions(prev => ({ ...prev, showStatusIcons: e.target.checked }))}
                          className="rounded-full border-white/10 text-[#FF4E00] bg-black focus:ring-[#FF4E00] w-4 h-4"
                        />
                      </label>

                      <label className="flex items-center justify-between text-xs text-slate-300 font-bold cursor-pointer py-1">
                        <span>Show Simulated Timestamp</span>
                        <input
                          type="checkbox"
                          checked={cardOptions.showTimestamp}
                          onChange={(e) => setCardOptions(prev => ({ ...prev, showTimestamp: e.target.checked }))}
                          className="rounded-full border-white/10 text-[#FF4E00] bg-black focus:ring-[#FF4E00] w-4 h-4"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Corner Customizers */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase font-mono">Rounded Layout</span>
                      <select
                        value={cardOptions.rounded}
                        onChange={(e) => setCardOptions(prev => ({ ...prev, rounded: e.target.value as any }))}
                        className="w-full text-xs font-semibold bg-[#09090B] border border-white/5 text-white px-4 py-2.5 rounded-full outline-none focus:ring-1 focus:ring-[#FF4E00]"
                      >
                        <option value="rounded-none">Square (none)</option>
                        <option value="rounded-sm">Sharp (sm)</option>
                        <option value="rounded-md">Medium (md)</option>
                        <option value="rounded-lg">Large (lg)</option>
                        <option value="rounded-xl">Extra Large (xl)</option>
                        <option value="rounded-[2rem]">High Curved ([2rem])</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 block font-semibold uppercase font-mono">Shadow Intensity</span>
                      <select
                        value={cardOptions.shadow}
                        onChange={(e) => setCardOptions(prev => ({ ...prev, shadow: e.target.value as any }))}
                        className="w-full text-xs font-semibold bg-[#09090B] border border-white/5 text-white px-4 py-2.5 rounded-full outline-none focus:ring-1 focus:ring-[#FF4E00]"
                      >
                        <option value="shadow-none">No Drop Shadow</option>
                        <option value="shadow-sm">Subtle Soft</option>
                        <option value="shadow-md">Medium Slate</option>
                        <option value="shadow-lg">Elevated Deck</option>
                        <option value="shadow-xl">Dark Immersive</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* CARD PREVIEW COLUMN & EDITORS - 8 Span Cols */}
              <div className="xl:col-span-8 space-y-6">
                
                {/* Batch Download / Export Controls */}
                <div className="bg-[#121215] rounded-[2.25rem] p-6 border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
                  <div>
                    <h3 className="text-base font-black text-white tracking-tight">Active Canvas Preview</h3>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono">Custom layout rendering with active themes.</p>
                  </div>
                  {/* Batch Action */}
                  <div className="flex items-center space-x-2 shrink-0">
                    <button
                      onClick={downloadAllCardsBatch}
                      disabled={cleanedComments.length === 0}
                      className={`px-6 py-3.5 rounded-full text-xs font-black transition-all flex items-center space-x-2 cursor-pointer ${
                        cleanedComments.length === 0 
                          ? "bg-white/5 text-slate-500 cursor-not-allowed border border-white/5" 
                          : "bg-[#FF4E00] hover:bg-[#ff5d12] text-white shadow-lg shadow-[#FF4E00]/20 hover:scale-[1.01] active:scale-[0.99]"
                      }`}
                    >
                      <Download className="w-4 h-4 text-white" />
                      <span>{exportProgress ? `Exporting card ${exportProgress.current}/${exportProgress.total}...` : "Batch Export All Cards"}</span>
                    </button>
                  </div>
                </div>

                {/* Progress Overlay bar (satisfying UI) */}
                {exportProgress && (
                  <div className="bg-[#121215] border border-white/5 text-white rounded-full p-4 px-6 flex items-center space-x-4 shadow-xl">
                    <div className="w-5 h-5 rounded-full bg-[#FF4E00] flex items-center justify-center text-xs animate-bounce text-white">
                      ⚡
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs font-mono font-semibold mb-1">
                        <span>Executing Batch Serial Export Queue...</span>
                        <span>{exportProgress.current} / {exportProgress.total} Complete</span>
                      </div>
                      <div className="w-full bg-black/60 h-2 rounded-full overflow-hidden border border-white/5">
                        <div 
                          className="bg-gradient-to-r from-[#FF4E00] to-yellow-400 h-full transition-all duration-300"
                          style={{ width: `${(exportProgress.current / exportProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Feed of Live Cards */}
                {cleanedComments.length === 0 ? (
                  <div className="bg-[#121215] rounded-[2.25rem] p-12 text-center border border-dashed border-white/5 flex flex-col items-center justify-center space-y-4">
                    <div className="text-4xl text-[#FF4E00] bg-[#FF4E00]/10 p-4 rounded-full border border-[#FF4E00]/20">🏜️</div>
                    <p className="text-sm font-bold text-white">No Structured Comment Cards Yet</p>
                    <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                      Return to the "Clean & Extract" tab, paste copied TikTok lines, run the scrub engine, and they will populate as beautiful visual files here.
                    </p>
                    <button
                      onClick={() => setActiveTab("cleaner")}
                      className="px-5 py-2.5 bg-[#FF4E00] hover:bg-[#ff5d12] text-white shadow-md font-bold text-xs rounded-full cursor-pointer"
                    >
                      Retrieve Cleaner Workspace
                    </button>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {cleanedComments.map((comment, i) => (
                      <div 
                        key={comment.id}
                        className="bg-[#121215] rounded-[2.25rem] p-5 border border-white/5 flex flex-col space-y-4 relative group shadow-xl"
                      >
                        {/* Title bar of item */}
                        <div className="flex items-center justify-between pb-3 border-b border-white/5">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-full bg-black/40 border border-white/5 flex items-center justify-center text-[10px] font-mono font-bold text-[#FF4E00]">
                              {i + 1}
                            </span>
                            <span className="text-xs font-extrabold text-slate-300">Card Metadata Spec</span>
                          </div>

                          {/* Quick single controls */}
                          <div className="flex items-center space-x-1">
                            <button
                              onClick={() => setEditingCardId(editingCardId === comment.id ? null : comment.id)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-bold transition-all flex items-center space-x-1 cursor-pointer ${
                                editingCardId === comment.id 
                                  ? "bg-[#FF4E00]/10 border border-[#FF4E00]/25 text-[#FF4E00]"
                                  : "text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5"
                              }`}
                            >
                              <Settings className="w-3 h-3" />
                              <span>{editingCardId === comment.id ? "Minimize Edit" : "Configure Card"}</span>
                            </button>

                            <button
                              onClick={() => downloadSingleCard(comment.id, i)}
                              disabled={copiedSingleCardId === comment.id}
                              className="px-3 py-1.5 bg-white/5 border border-white/5 hover:bg-[#FF4E00] text-slate-300 hover:text-white rounded-full text-[10px] font-extrabold transition-all flex items-center space-x-1 cursor-pointer"
                            >
                              {copiedSingleCardId === comment.id ? (
                                <>
                                  <div className="w-2.5 h-2.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  <span>Saving...</span>
                                </>
                              ) : (
                                <>
                                  <Download className="w-3 h-3" />
                                  <span>Download PNG</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Expandable Specific Metadata Editor */}
                        {editingCardId === comment.id && (
                          <div className="bg-[#09090B] p-5 rounded-[1.75rem] space-y-4 shrink-0 text-xs border border-white/5">
                            <div className="flex items-center justify-between pb-2 border-b border-white/5">
                              <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px] font-mono">Surgical Card Override Controls</span>
                              <button onClick={() => setEditingCardId(null)} className="cursor-pointer">
                                <X className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Modify Comment Line</span>
                                <input
                                  type="text"
                                  value={comment.text}
                                  onChange={(e) => updateSingleCommentText(comment.id, e.target.value)}
                                  className="w-full px-4 py-2 bg-[#09090B] border border-white/5 text-white rounded-full outline-none font-medium focus:ring-1 focus:ring-[#FF4E00]"
                                />
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Author Display User</span>
                                <input
                                  type="text"
                                  value={comment.username}
                                  onChange={(e) => updateSingleCommentUser(comment.id, { username: e.target.value })}
                                  className="w-full px-4 py-2 bg-[#09090B] border border-white/5 text-white rounded-full outline-none font-medium focus:ring-1 focus:ring-[#FF4E00]"
                                />
                              </div>

                              <div className="space-y-1">
                                <span className="text-[10px] font-bold text-slate-500 block uppercase font-mono">Author Handle Indicator</span>
                                <input
                                  type="text"
                                  value={comment.handle}
                                  onChange={(e) => updateSingleCommentUser(comment.id, { handle: e.target.value })}
                                  className="w-full px-4 py-2 bg-[#09090B] border border-white/5 text-white rounded-full outline-none font-medium focus:ring-1 focus:ring-[#FF4E00]"
                                />
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Interactive Dynamic Card Frame */}
                        <div 
                          className="overflow-hidden rounded-[1.75rem] relative"
                          style={{ contentVisibility: "auto" }}
                        >
                          {/* Inner wrapper selected by HTML-to-image selector */}
                          <div id={`comment-card-container-${comment.id}`} className="min-w-[420px] select-none bg-transparent">
                            <CardPreview 
                              comment={comment} 
                              options={cardOptions} 
                              cardNumber={i + 1}
                            />
                          </div>
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}
