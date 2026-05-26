import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Check, 
  Music, 
  MessageSquare, 
  Layers, 
  Sliders, 
  Mail, 
  CheckCircle,
  Copy
} from 'lucide-react';
import { parseRawComments, CleanOptions, PlatformType } from '../parser';
import { PRESETS } from '../presets';
import logoPng from '../../logo.png';
import { BackgroundFlow } from './BackgroundFlow';

interface LandingPageProps {
  onLaunchApp: () => void;
}

export function LandingPage({ onLaunchApp }: LandingPageProps) {
  // Demo State
  const [demoInput, setDemoInput] = useState<string>(PRESETS[0].content);
  const [demoPlatform, setDemoPlatform] = useState<PlatformType>(PRESETS[0].platform);
  const [demoOutput, setDemoOutput] = useState<string>(
    parseRawComments(PRESETS[0].content, {
      keepEmojis: true,
      removeDuplicates: true,
      aggressiveClean: false,
      preserveSlang: true
    }, PRESETS[0].platform).map(c => c.text).join('\n\n')
  );
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PRESETS[0].id);
  const [isDemoCleaning, setIsDemoCleaning] = useState<boolean>(false);
  const [copiedDemoOutput, setCopiedDemoOutput] = useState<boolean>(false);

  // Waitlist State
  const [email, setEmail] = useState<string>("");
  const [waitlistSuccess, setWaitlistSuccess] = useState<boolean>(false);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);
  const [isWaitlistSubmitting, setIsWaitlistSubmitting] = useState<boolean>(false);

  // Demo Clean options
  const [demoOptions] = useState<CleanOptions>({
    keepEmojis: true,
    removeDuplicates: true,
    aggressiveClean: false,
    preserveSlang: true
  });

  const handleDemoPresetSelect = (presetId: string) => {
    const preset = PRESETS.find(p => p.id === presetId);
    if (preset) {
      setDemoInput(preset.content);
      setSelectedPresetId(presetId);
      setDemoPlatform(preset.platform);
      const cleaned = parseRawComments(preset.content, demoOptions, preset.platform);
      setDemoOutput(cleaned.map(c => c.text).join('\n\n'));
    }
  };

  const handleDemoClean = () => {
    setIsDemoCleaning(true);
    setTimeout(() => {
      const cleaned = parseRawComments(demoInput, demoOptions, demoPlatform);
      setDemoOutput(cleaned.map(c => c.text).join('\n\n'));
      setIsDemoCleaning(false);
    }, 300);
  };

  const copyDemoOutput = () => {
    if (!demoOutput) return;
    navigator.clipboard.writeText(demoOutput);
    setCopiedDemoOutput(true);
    setTimeout(() => setCopiedDemoOutput(false), 2000);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) return;

    setIsWaitlistSubmitting(true);
    setWaitlistError(null);
    setWaitlistSuccess(false);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const result = await response.json();

      if (response.ok) {
        setWaitlistSuccess(true);
        setEmail("");
        setTimeout(() => setWaitlistSuccess(false), 5000);
      } else {
        setWaitlistError(result.error || 'Failed to join waitlist.');
      }
    } catch (err) {
      setWaitlistError('Could not connect to the database server.');
    } finally {
      setIsWaitlistSubmitting(false);
    }
  };

  // Helper to scroll to element
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-[#E4E4E7] font-sans antialiased overflow-x-hidden relative isolate selection:bg-[#FF4E00]/30 selection:text-white">
      
      {/* DYNAMIC MOVING BACKGROUND */}
      <BackgroundFlow />

      {/* HEADER / NAVIGATION */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#070709]/75 border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Logo brand */}
          <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src={logoPng} className="w-8 h-8 object-contain transition-transform group-hover:scale-105" alt="CommentFlow Logo" />
            <div>
              <span className="text-lg font-black text-white tracking-tighter italic">
                COMMENT<span className="text-[#FF4E00] not-italic">FLOW</span>
              </span>
              <span className="block text-[8px] uppercase tracking-widest text-zinc-500 font-bold -mt-1">
                Comment Cleaner & Card Studio
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-8 text-xs uppercase tracking-wider font-semibold text-zinc-400">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer">Features</button>
            <button onClick={() => scrollToSection('demo')} className="hover:text-white transition-colors cursor-pointer">Live Demo</button>
            <button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors cursor-pointer">How It Works</button>
            <button onClick={() => scrollToSection('roadmap')} className="hover:text-white transition-colors cursor-pointer">Roadmap</button>
          </nav>

          {/* Right Button */}
          <button 
            onClick={onLaunchApp}
            className="glow-btn-primary px-5 py-2.5 bg-gradient-to-r from-[#FF4E00] to-[#FFAA00] text-black font-extrabold text-xs rounded-xl shadow-lg shadow-[#FF4E00]/15 hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            Launch Studio
          </button>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative pt-16 md:pt-28 pb-20 z-10">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          
          {/* Badge */}
          <div 
            className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-inner opacity-0 animate-fade-in-up"
            style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF4E00]"></span>
            <span className="text-[10px] sm:text-xs font-semibold text-zinc-300">
              Built for content creators, songwriters, and editors
            </span>
          </div>

          {/* Main Headline */}
          <div 
            className="space-y-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '200ms', animationFillMode: 'forwards' }}
          >
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-[0.95] max-w-4xl mx-auto">
              Turn social comments into <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF4E00] to-[#FFAA00] animate-text-glow font-extrabold">clean lyrics</span> & social posts.
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2 text-zinc-400 font-semibold text-xs sm:text-sm">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#FF4E00]" /> Clean the comments. Create the vibe.</span>
              <span className="hidden sm:inline text-zinc-700">•</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-[#FF4E00]" /> From messy comments to AI-ready lyrics.</span>
            </div>
          </div>

          {/* Description */}
          <p 
            className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed opacity-0 animate-fade-in-up"
            style={{ animationDelay: '300ms', animationFillMode: 'forwards' }}
          >
            Paste comments from TikTok or YouTube. CommentFlow automatically strips usernames, timestamps, likes, and reply noise, leaving only clean text formatted for AI songwriters or custom cards.
          </p>

          {/* Buttons */}
          <div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 opacity-0 animate-fade-in-up"
            style={{ animationDelay: '400ms', animationFillMode: 'forwards' }}
          >
            <button 
              onClick={onLaunchApp}
              className="glow-btn-primary w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-[#FF4E00] to-[#FFAA00] text-black font-black text-sm rounded-2xl shadow-xl shadow-[#FF4E00]/20 flex items-center justify-center space-x-2.5 hover:scale-[1.02] active:scale-[0.98] hover:shadow-[#FF4E00]/30 cursor-pointer"
            >
              <span>Try the workflow</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button 
              onClick={() => scrollToSection('roadmap')}
              className="w-full sm:w-auto px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold text-sm rounded-2xl transition-all cursor-pointer"
            >
              Explore roadmap
            </button>
          </div>

          {/* Product Dashboard Visual Preview */}
          <div 
            className="pt-20 max-w-4xl mx-auto relative group opacity-0 animate-fade-in-up animate-float-heavy"
            style={{ animationDelay: '550ms', animationFillMode: 'forwards' }}
          >
            {/* Glow backing */}
            <div className="absolute -inset-1 bg-gradient-to-tr from-[#FF4E00] to-[#FFAA00] rounded-[2.5rem] blur-2xl opacity-15 animate-pulse-glow-heavy pointer-events-none" />
            
            {/* Visual Frame */}
            <div className="relative rounded-[2rem] border-2 border-white/5 overflow-hidden shadow-2xl bg-[#0C0C0E] p-4 sm:p-6">
              
              {/* Fake OS Dots & Tab bar */}
              <div className="flex items-center justify-between pb-4 border-b border-white/5">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-800" />
                  <span className="text-[10px] text-zinc-500 font-mono pl-4">commentflow.app</span>
                </div>
              </div>

              {/* Mock App layout grid */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-4 text-left">
                {/* Sidebar mock */}
                <div className="md:col-span-3 space-y-2 hidden md:block">
                  <div className="h-8 bg-[#FF4E00]/10 border border-[#FF4E00]/20 rounded-lg flex items-center px-3 text-[11px] font-bold text-[#FF4E00]">
                    1. Clean & Extract
                  </div>
                  <div className="h-8 bg-white/5 rounded-lg flex items-center px-3 text-[11px] font-semibold text-zinc-500 hover:text-zinc-350">
                    2. Visual Card Studio
                  </div>
                  <div className="pt-4 space-y-2">
                    <div className="h-2 w-16 bg-zinc-800 rounded" />
                    <div className="h-10 bg-zinc-900/60 rounded-xl border border-white/5 p-2 space-y-1">
                      <div className="h-1.5 w-12 bg-zinc-800 rounded" />
                      <div className="h-1 w-8 bg-[#FF4E00]/40 rounded" />
                    </div>
                  </div>
                </div>

                {/* Content mock */}
                <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Left Column - Input block */}
                  <div className="bg-[#121215]/80 rounded-2xl p-4 border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Raw Input</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-bold uppercase">Uncleaned Feed</span>
                    </div>
                    <div className="font-mono text-[9px] text-zinc-500 space-y-1.5 leading-relaxed bg-[#070709] p-3 rounded-xl min-h-[140px]">
                      <p className="text-zinc-300">user_name_99</p>
                      <p className="text-[#FF4E00]">this beat is insane 🔥</p>
                      <p className="opacity-40">Reply  Like  3h</p>
                      <p className="text-zinc-300">creative_vibe</p>
                      <p className="text-[#FF4E00]">nah bro cooked here 💀😭</p>
                      <p className="opacity-40">Reply  Like  1d</p>
                    </div>
                  </div>

                  {/* Right Column - Output block */}
                  <div className="bg-white rounded-2xl p-4 border border-zinc-200 text-zinc-900 space-y-3 shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-[#FF4E00] to-[#FFAA00]" />
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Formatted Output</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-bold uppercase">2 Clean Lines</span>
                    </div>
                    <div className="font-mono text-[10px] font-bold text-zinc-800 space-y-2 bg-zinc-50 p-3 rounded-xl min-h-[140px] leading-relaxed">
                      <p className="border-b border-zinc-200/50 pb-1">this beat is insane 🔥</p>
                      <p className="border-b border-zinc-200/50 pb-1">nah bro cooked here 💀😭</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* DEMO SECTION */}
      <section id="demo" className="relative py-24 border-y border-white/5 bg-[#09090c]/50 z-10">
        <div className="max-w-5xl mx-auto px-6">
          
          {/* Section Header */}
          <div className="text-center space-y-3 mb-16">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Try the live comment cleaner.
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 max-w-xl mx-auto font-medium">
              Paste comments or use a preset below to see how CommentFlow instantly cleans up platform clutter.
            </p>
          </div>

          {/* Interactive Demo Layout */}
          <div className="bg-[#0e0e11] rounded-[2rem] border border-white/5 p-4 sm:p-6 space-y-6 shadow-2xl relative">
            
            {/* Presets Select header */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
              <span className="text-xs font-bold text-zinc-300">Select a preset to test:</span>
              <div className="flex flex-wrap items-center justify-center gap-1.5 bg-black/45 p-1 rounded-xl border border-white/5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleDemoPresetSelect(p.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedPresetId === p.id 
                        ? "bg-[#FF4E00] text-white shadow"
                        : "text-zinc-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {p.platform}
                  </button>
                ))}
              </div>
            </div>

            {/* Input / Action / Output columns */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              
              {/* Left Column: Raw Input */}
              <div className="lg:col-span-5 flex flex-col space-y-2">
                <label className="text-xs font-bold text-zinc-450 uppercase tracking-wider pl-1">
                  Raw Copied Comments
                </label>
                <textarea
                  className="w-full h-64 p-4 border border-white/10 rounded-2xl bg-[#070709] font-mono text-xs focus:ring-1 focus:ring-[#FF4E00] focus:border-transparent outline-none leading-relaxed resize-none text-zinc-200"
                  value={demoInput}
                  onChange={(e) => {
                    setDemoInput(e.target.value);
                    setSelectedPresetId("");
                  }}
                  placeholder="Paste messy comments here..."
                />
              </div>

              {/* Middle Column: Action trigger */}
              <div className="lg:col-span-2 flex flex-row lg:flex-col items-center justify-center gap-3">
                <div className="hidden lg:block h-12 w-[1px] bg-gradient-to-b from-white/5 to-[#FF4E00]/30" />
                <button
                  onClick={handleDemoClean}
                  disabled={!demoInput.trim()}
                  className={`glow-btn-primary px-6 py-4 lg:py-6 rounded-2xl font-black text-xs uppercase tracking-wider flex flex-row lg:flex-col items-center justify-center gap-2.5 transition-all self-stretch flex-1 lg:flex-initial cursor-pointer ${
                    demoInput.trim() 
                      ? "bg-[#FF4E00] text-white hover:bg-[#ff5d12] shadow-lg shadow-[#FF4E00]/15" 
                      : "bg-white/5 text-zinc-650 border border-white/5 cursor-not-allowed"
                  }`}
                >
                  <Sparkles className={`w-5 h-5 ${isDemoCleaning ? "animate-spin" : ""}`} />
                  <span className="hidden sm:inline">{isDemoCleaning ? "Cleaning..." : "Clean Comments"}</span>
                </button>
                <div className="hidden lg:block h-12 w-[1px] bg-gradient-to-t from-white/5 to-[#FF4E00]/30" />
              </div>

              {/* Right Column: Clean Output */}
              <div className="lg:col-span-5 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-zinc-450 uppercase tracking-wider pl-1">
                    Clean Output
                  </label>
                  {demoOutput && (
                    <button 
                      onClick={copyDemoOutput}
                      className={`text-[10px] font-black uppercase tracking-wider flex items-center space-x-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/5 hover:bg-white/10 hover:text-white transition-colors cursor-pointer ${
                        copiedDemoOutput ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" : "text-zinc-400"
                      }`}
                    >
                      {copiedDemoOutput ? (
                        <>
                          <Check className="w-3 h-3" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Output</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                <textarea
                  readOnly
                  className="w-full h-64 p-4 border border-zinc-800 rounded-2xl bg-[#09090b] font-mono text-xs text-zinc-300 outline-none leading-relaxed resize-none font-bold shadow-inner"
                  value={demoOutput}
                  placeholder="Clean lines will appear here..."
                />
              </div>

            </div>

            {/* Note */}
            <div className="bg-[#FF4E00]/5 border border-[#FF4E00]/15 rounded-2xl p-4 flex items-start gap-3">
              <span className="p-1 rounded bg-[#FF4E00]/10 text-[#FF4E00] text-xs mt-0.5 border border-[#FF4E00]/10">🔒</span>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Paste text from any post. CommentFlow runs locally in your browser so your data never leaves your computer.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="relative py-24 z-10">
        <div className="max-w-5xl mx-auto px-6">
          
          {/* Section Header */}
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Designed for speed.
            </h2>
            <p className="text-base text-zinc-400 max-w-2xl mx-auto font-medium leading-relaxed">
              No bloating. Just a clean, fast pipeline to turn raw comment feeds into structured inputs for cards and songwriting.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                icon: <MessageSquare className="w-5 h-5 text-black" />,
                title: "Platform Scrubbing",
                desc: "Filters out reply buttons, like counts, timestamps, and usernames automatically."
              },
              {
                icon: <Music className="w-5 h-5 text-black" />,
                title: "AI-Ready Formatting",
                desc: "Formats clean line-by-line inputs optimized for song lyrics generators like Suno and Udio."
              },
              {
                icon: <Layers className="w-5 h-5 text-black" />,
                title: "Graphic Cards",
                desc: "Turn comments into beautiful social media cards for TikTok edits, reels, and shorts."
              },
              {
                icon: <Sliders className="w-5 h-5 text-black" />,
                title: "Flexible Themes",
                desc: "Easily modify design details including fonts, background gradients, custom avatars, and drop shadows."
              }
            ].map((f, i) => (
              <div 
                key={i} 
                className="glow-card bg-[#0e0e11]/85 border border-white/5 rounded-3xl p-8 flex flex-col space-y-4 hover:bg-[#121215]/85 group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF4E00]/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#FF4E00] to-[#FFAA00] flex items-center justify-center shadow-lg shadow-[#FF4E00]/10 transition-transform group-hover:scale-105">
                  {f.icon}
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white tracking-tight">{f.title}</h3>
                  <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section id="how-it-works" className="relative py-24 border-t border-white/5 bg-[#09090c]/40 z-10">
        <div className="max-w-5xl mx-auto px-6">
          
          {/* Section Header */}
          <div className="text-center space-y-3 mb-20">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              How it works.
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto font-medium">
              Copy-paste, refine styling, and download results in under a minute.
            </p>
          </div>

          {/* Stepper Steps (4 steps grid) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            {[
              {
                step: "01",
                title: "Paste Raw Text",
                desc: "Paste raw text copies from TikTok or YouTube."
              },
              {
                step: "02",
                title: "Scrub UI Noise",
                desc: "CommentFlow instantly filters out UI noise and metadata."
              },
              {
                step: "03",
                title: "Export Lyrics",
                desc: "Copy clean text lines directly to AI songwriters."
              },
              {
                step: "04",
                title: "Design Cards",
                desc: "Design custom graphic cards for your social feed."
              }
            ].map((step, i) => (
              <div key={i} className="bg-[#121215]/50 border border-white/5 rounded-3xl p-6 relative flex flex-col space-y-4 hover:border-white/10 transition-colors">
                
                <div className="text-[10px] font-mono font-black text-[#FF4E00] bg-[#FF4E00]/10 border border-[#FF4E00]/20 rounded-md px-2 py-0.5 self-start">
                  STEP {step.step}
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-base font-bold text-white tracking-tight">{step.title}</h4>
                  <p className="text-xs text-zinc-400 font-medium leading-relaxed">{step.desc}</p>
                </div>

                {i < 3 && (
                  <div className="hidden lg:block absolute top-1/2 -right-4 -translate-y-1/2 z-20 text-zinc-700 font-extrabold text-lg select-none">
                    →
                  </div>
                )}
              </div>
            ))}

          </div>

        </div>
      </section>

      {/* WHY PEOPLE WILL USE IT SECTION */}
      <section className="relative py-24 z-10">
        <div className="max-w-5xl mx-auto px-6">
          
          <div className="bg-gradient-to-tr from-[#121215] to-[#16161c] border border-white/5 rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden">
            <div className="absolute -top-32 -right-32 w-80 h-80 rounded-full bg-[#FF4E00]/10 blur-3xl pointer-events-none" />
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
              {/* Left Column: Heading */}
              <div className="lg:col-span-5 space-y-4">
                <div className="w-10 h-10 rounded-xl bg-[#FF4E00]/10 border border-[#FF4E00]/25 flex items-center justify-center text-[#FF4E00] shadow-inner">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                  Save hours of editing.
                </h3>
                <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                  Manually editing copied comments is tedious. CommentFlow formats comments instantly, letting you focus on the creative side.
                </p>
              </div>

              {/* Right Column: Benefits Checklist */}
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  "Cleaner inputs for AI song generators",
                  "Faster content creation",
                  "No manual cleanup needed",
                  "Perfect for TikTok content workflows",
                  "Built for creators and editors",
                  "Saves time on repetitive tasks"
                ].map((benefit, i) => (
                  <div key={i} className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center space-x-3 hover:border-[#FF4E00]/20 transition-all">
                    <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#FF4E00] to-[#FFAA00] flex items-center justify-center text-black shrink-0">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                    <span className="text-xs sm:text-sm font-semibold text-zinc-200">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ROADMAP SECTION */}
      <section id="roadmap" className="relative py-24 border-t border-white/5 bg-[#09090c]/50 z-10">
        <div className="max-w-5xl mx-auto px-6">
          
          {/* Section Header */}
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              What we're building next.
            </h2>
            <p className="text-base text-zinc-400 max-w-2xl mx-auto font-medium">
              A direct path from simple text formatting to complete creative production.
            </p>
          </div>

          {/* Roadmap Grid (Phases 1-4) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative">
            {[
              {
                phase: "Phase 1",
                title: "Text Cleaning Engine",
                status: "Live",
                items: ["Paste comments", "Remove social media noise", "Copy clean output", "Export text"],
                gradient: "from-[#FF4E00] to-[#FF6E00]"
              },
              {
                phase: "Phase 2",
                title: "Visual Card Creator",
                status: "Live",
                items: ["Custom comment visuals", "Theme system", "Avatar options", "Batch export"],
                gradient: "from-[#FF7E00] to-[#FFAA00]"
              },
              {
                phase: "Phase 3",
                title: "AI Prompting & Lyrics",
                status: "In Progress",
                items: ["AI prompt generation", "AI lyric enhancement", "Music generation integration", "Smart creative suggestions"],
                gradient: "from-[#FFAA00] to-[#FFC837]"
              },
              {
                phase: "Phase 4",
                title: "Video Automation",
                status: "Planned",
                items: ["Auto video generation", "TikTok auto-rebuilder", "Subtitle animations", "Comment-to-video workflow"],
                gradient: "from-zinc-650 to-zinc-450"
              }
            ].map((p, i) => (
              <div 
                key={i} 
                className="glow-card bg-[#0e0e11]/85 border border-white/5 rounded-3xl p-6 flex flex-col justify-between space-y-6 relative overflow-hidden group transition-colors"
              >
                <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${p.gradient}`} />
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs font-mono font-bold">
                    <span className="text-zinc-500">{p.phase}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                      p.status === 'Live'
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : p.status === 'In Progress'
                          ? "bg-[#FF4E00]/10 text-[#FF4E00] border border-[#FF4E00]/20"
                          : "bg-zinc-800 text-zinc-500 border border-zinc-700/50"
                    }`}>
                      {p.status}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {p.title}
                  </h3>

                  <ul className="space-y-2">
                    {p.items.map((item, ii) => (
                      <li key={ii} className="flex items-center space-x-2 text-xs sm:text-sm text-zinc-400 font-medium">
                        <span className="w-1 h-1 rounded-full bg-[#FF4E00]/60 shrink-0" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* FUTURE MUSIC GENERATION SECTION */}
      <section id="future-tools" className="relative py-24 z-10 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content text */}
            <div className="lg:col-span-6 space-y-6">
              <div className="w-10 h-10 rounded-xl bg-[#FF4E00]/10 border border-[#FF4E00]/25 flex items-center justify-center text-[#FF4E00]">
                <Music className="w-5 h-5" />
              </div>
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#FF4E00] uppercase tracking-wider block font-mono">Future Integrations</span>
                <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none">
                  Ready for AI songwriting.
                </h2>
              </div>
              <p className="text-sm sm:text-base text-zinc-400 leading-relaxed font-medium">
                Copying formatted text directly matches the rhythm patterns needed by Suno and Udio. Future integrations will send comments directly with a single click.
              </p>
            </div>

            {/* Right Visual diagrams representation */}
            <div className="lg:col-span-6 relative flex items-center justify-center py-6">
              
              <div className="absolute w-72 h-72 rounded-full bg-[#FF4E00]/10 blur-3xl pointer-events-none" />

              {/* Connected pipeline graphic cards */}
              <div className="w-full max-w-sm space-y-4 z-10 relative">
                
                {/* Node 1 */}
                <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[#FF4E00] text-xs font-mono font-bold">
                      💬
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white leading-none">Raw Comments</span>
                      <span className="text-[10px] text-zinc-500 font-medium">TikTok feed copy</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-semibold font-mono">Step 1</span>
                </div>

                {/* Link line 1 */}
                <div className="flex justify-center -my-2 text-[#FF4E00] relative h-8 select-none">
                  <div className="w-[1.5px] h-full bg-zinc-800 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-transparent via-[#FF4E00] to-transparent animate-flow-line" />
                  </div>
                </div>

                {/* Node 2 */}
                <div className="bg-[#141418] border border-[#FF4E00]/25 rounded-2xl p-4 flex items-center justify-between shadow-xl relative">
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#FF4E00]/30 to-transparent" />
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-[#FF4E00]/15 flex items-center justify-center text-[#FF4E00] text-xs font-mono font-bold">
                      ⚡
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-[#FF4E00] leading-none">CommentFlow</span>
                      <span className="text-[10px] text-zinc-400 font-medium">Clean formatting</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-[#FF4E00] font-black font-mono">Scrubbed</span>
                </div>

                {/* Link line 2 */}
                <div className="flex justify-center -my-2 text-[#FF4E00] relative h-8 select-none">
                  <div className="w-[1.5px] h-full bg-zinc-800 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-transparent via-[#FF4E00] to-transparent animate-flow-line" />
                  </div>
                </div>

                {/* Node 3 */}
                <div className="bg-[#121215] border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-[#FFAA00] text-xs font-mono font-bold">
                      🎵
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-white leading-none">AI Song Generators</span>
                      <span className="text-[10px] text-zinc-500 font-medium">Audio output</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-zinc-500 font-semibold font-mono">Generate</span>
                </div>

              </div>

            </div>

          </div>
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="relative py-24 z-10 overflow-hidden">
        
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] rounded-t-full bg-[radial-gradient(circle_at_bottom,rgba(255,78,0,0.1),transparent_60%)] blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto px-6 text-center space-y-8 relative z-10">
          
          <div className="space-y-4">
            <h2 className="text-3xl sm:text-6xl font-black text-white tracking-tight">
              Get started today.
            </h2>
            <p className="text-sm sm:text-base text-zinc-400 max-w-md mx-auto font-medium">
              Simplify your content workflow. Clean comments and generate shareable assets in seconds.
            </p>
          </div>

          {/* Email input waitlist form */}
          <form onSubmit={handleWaitlistSubmit} className="max-w-md mx-auto relative flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                required
                disabled={isWaitlistSubmitting}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full py-4 pl-12 pr-4 bg-[#0e0e11] border border-white/10 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#FF4E00] focus:border-transparent text-white disabled:opacity-50"
              />
            </div>
            <button
              type="submit"
              disabled={isWaitlistSubmitting}
              className="px-6 py-4 bg-gradient-to-r from-[#FF4E00] to-[#FFAA00] text-black font-black text-xs rounded-2xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWaitlistSubmitting ? "Joining..." : "Join the waitlist"}
            </button>
          </form>

          {/* Success Dialog */}
          {waitlistSuccess && (
            <div className="max-w-md mx-auto p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold rounded-2xl">
              🎉 Success! You have been added to our database waitlist.
            </div>
          )}

          {/* Error Dialog */}
          {waitlistError && (
            <div className="max-w-md mx-auto p-4 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-2xl">
              ⚠️ {waitlistError}
            </div>
          )}

          {/* Navigation redirect button */}
          <div className="flex items-center justify-center space-x-2 pt-2 text-xs font-bold text-zinc-500">
            <span>Or try the live client studio:</span>
            <button 
              onClick={onLaunchApp}
              className="text-[#FF4E00] hover:text-[#ff5d12] underline transition-colors cursor-pointer"
            >
              Explore workspace tools →
            </button>
          </div>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="relative bg-[#050507] border-t border-white/5 py-12 z-10 text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
          
          {/* Tagline Left Info */}
          <div className="md:col-span-5 space-y-3 text-left">
            <div className="flex items-center space-x-2">
              <img src={logoPng} className="w-7 h-7 object-contain" alt="CommentFlow Logo" />
              <span className="text-base font-extrabold text-white tracking-tighter italic">
                COMMENT<span className="text-[#FF4E00] not-italic">FLOW</span>
              </span>
            </div>
            <p className="text-zinc-400 font-medium">
              CommentFlow — Clean comments, styled assets.
            </p>
          </div>

          {/* Links Middle Right */}
          <div className="md:col-span-7 flex flex-wrap gap-x-8 gap-y-4 md:justify-end text-zinc-400 font-semibold">
            <button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors cursor-pointer text-left">Features</button>
            <button onClick={() => scrollToSection('roadmap')} className="hover:text-white transition-colors cursor-pointer text-left">Roadmap</button>
            <button onClick={() => scrollToSection('demo')} className="hover:text-white transition-colors cursor-pointer text-left">Demo</button>
            <a href="mailto:support@commentflow.app" className="hover:text-white transition-colors">Contact</a>
          </div>

        </div>

        {/* copyright sub-bar */}
        <div className="max-w-7xl mx-auto px-6 pt-8 mt-8 border-t border-white/5 text-center flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-650">
          <p>© {new Date().getFullYear()} CommentFlow Studio. All rights reserved.</p>
          <p className="font-mono text-[10px]">Runs entirely in your browser.</p>
        </div>
      </footer>

    </div>
  );
}
