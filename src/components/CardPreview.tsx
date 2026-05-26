import React from 'react';
import { Heart, ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Check } from 'lucide-react';
import { CommentItem } from '../parser';

export interface CardStyleOptions {
  theme: "tiktok" | "youtube" | "minimal-dark" | "neon" | "clean-white" | "artistic-brutalist";
  fontFamily: "font-sans" | "font-space" | "font-outfit" | "font-mono" | "font-serif";
  fontSize: "text-xs" | "text-sm" | "text-base" | "text-lg" | "text-xl";
  align: "text-left" | "text-center" | "text-right";
  rounded: "rounded-none" | "rounded-sm" | "rounded-md" | "rounded-lg" | "rounded-xl" | "rounded-2xl" | "rounded-[2rem]";
  shadow: "shadow-none" | "shadow-sm" | "shadow-md" | "shadow-lg" | "shadow-xl" | "shadow-2xl";
  bgType: "solid" | "gradient" | "image" | "transparent";
  solidBg: string;
  gradientBg: string; // custom gradient class
  bgImage: string | null;
  customAvatar: string | null;
  customUsername: string; // global override if any
  customHandle: string; // global override if any
  showTimestamp: boolean;
  showStatusIcons: boolean;
  aspectRatio?: "1:1" | "9:16" | "16:9";
}

interface CardPreviewProps {
  comment: CommentItem;
  options: CardStyleOptions;
  cardNumber?: number;
}

export const THEME_GRADIENTS = [
  { name: "Artistic Flair", value: "bg-gradient-to-tr from-[#FF4E00] to-[#FFAA00]" },
  { name: "Ocean Breeze", value: "bg-gradient-to-tr from-cyan-400 to-blue-500" },
  { name: "Sunset Vibe", value: "bg-gradient-to-tr from-orange-400 via-pink-500 to-purple-600" },
  { name: "Lime Zing", value: "bg-gradient-to-tr from-green-300 via-emerald-400 to-teal-500" },
  { name: "Neon Matrix", value: "bg-gradient-to-tr from-violet-600 via-rose-500 to-amber-400" },
  { name: "Cyberpunk Glow", value: "bg-gradient-to-tr from-purple-900 via-fuchsia-800 to-pink-500" },
  { name: "Elegance Charcoal", value: "bg-gradient-to-tr from-gray-700 via-slate-800 to-gray-900" },
  { name: "Fresh Mint", value: "bg-gradient-to-br from-[#121212] to-[#1A1A1A] text-white" },
];

export const CardPreview: React.FC<CardPreviewProps> = ({ comment, options, cardNumber }) => {
  const {
    theme,
    fontFamily,
    fontSize,
    align,
    rounded,
    shadow,
    bgType,
    solidBg,
    gradientBg,
    bgImage,
    customAvatar,
    customUsername,
    customHandle,
    showTimestamp,
    showStatusIcons,
  } = options;

  // Use either custom override or parsed metadata
  const activeUsername = customUsername.trim() !== "" ? customUsername : comment.username;
  const activeHandle = customHandle.trim() !== "" ? customHandle : comment.handle;
  const initials = activeUsername ? activeUsername.slice(0, 2).toUpperCase() : "CF";

  // Select card background styles
  let containerBgStyle = "";
  let containerStyleMap: React.CSSProperties = {};

  if (bgType === "solid") {
    containerStyleMap = { backgroundColor: solidBg };
  } else if (bgType === "gradient") {
    containerBgStyle = gradientBg;
  } else if (bgType === "image" && bgImage) {
    containerStyleMap = { 
      backgroundImage: `url(${bgImage})`, 
      backgroundSize: "cover", 
      backgroundPosition: "center" 
    };
  } else if (bgType === "transparent") {
    containerBgStyle = "bg-transparent border border-dashed border-gray-300 dark:border-gray-700";
  }

  // Define inner card style (social theme preset overlays)
  let cardBgStyle = "";
  let textPrimaryColor = "text-gray-900";
  let textSecondaryColor = "text-gray-500";
  const iconColor = "text-gray-400";
  let innerBorder = "";

  if (theme === "tiktok") {
    cardBgStyle = "bg-[#121212] text-white";
    textPrimaryColor = "text-white";
    textSecondaryColor = "text-gray-400";
    innerBorder = "border-b border-[#222222]";
  } else if (theme === "youtube") {
    cardBgStyle = "bg-white text-black border border-gray-100";
    textPrimaryColor = "text-gray-900";
    textSecondaryColor = "text-gray-500";
  } else if (theme === "minimal-dark") {
    cardBgStyle = "bg-[#0c0c0e] text-[#e4e4e7] border border-[#212124]";
    textPrimaryColor = "text-[#f4f4f5]";
    textSecondaryColor = "text-[#a1a1aa]";
  } else if (theme === "neon") {
    cardBgStyle = "bg-[#020205] text-white border border-[#3b82f6] shadow-[0_0_15px_rgba(59,130,246,0.3)]";
    textPrimaryColor = "text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-purple-300 to-pink-300 font-semibold";
    textSecondaryColor = "text-amber-400 font-mono";
  } else if (theme === "artistic-brutalist") {
    cardBgStyle = "bg-black text-[#E0E0E0] border-2 border-[#FF4E00] shadow-[4px_4px_0px_0px_rgba(255,78,0,0.5)]";
    textPrimaryColor = "text-white";
    textSecondaryColor = "text-white/50";
  } else {
    // clean-white
    cardBgStyle = "bg-[#ffffff] text-slate-800 border border-slate-100";
    textPrimaryColor = "text-slate-900";
    textSecondaryColor = "text-slate-400";
  }

  // Responsive font size mapping to scale down text on mobile
  const fontSizeMap: Record<string, string> = {
    "text-xs": "text-[9px] sm:text-xs",
    "text-sm": "text-[10px] sm:text-sm",
    "text-base": "text-xs sm:text-base",
    "text-lg": "text-sm sm:text-lg",
    "text-xl": "text-base sm:text-xl"
  };
  const activeFontSize = fontSizeMap[fontSize] || fontSize;

  const ratio = options.aspectRatio || "16:9";
  let ratioClass = "aspect-auto sm:aspect-video min-h-[260px] sm:min-h-[280px] md:min-h-[320px]";

  if (ratio === "1:1") {
    ratioClass = "aspect-auto sm:aspect-square min-h-[260px] sm:min-h-[340px] md:min-h-[380px]";
  } else if (ratio === "9:16") {
    ratioClass = "aspect-auto sm:aspect-[9/16] min-h-[260px] sm:min-h-[480px] md:min-h-[540px]";
  }

  return (
    <div 
      className={`relative w-full flex items-center justify-center p-4 sm:p-8 transition-all overflow-hidden ${ratioClass} ${rounded} ${shadow} ${containerBgStyle}`}
      style={containerStyleMap}
    >
      {/* Visual background overlay blur decor in Neon Theme */}
      {theme === "neon" && (
        <div className="absolute top-0 left-0 w-full h-full bg-radial-gradient/20 pointer-events-none" />
      )}

      {/* Actual Exportable Card */}
      <div className={`w-full max-w-md p-4 sm:p-5 rounded-xl flex flex-col justify-between transition-colors ${cardBgStyle} shadow-lg relative`}>
        
        {/* TikTok Left Accent Dot Style */}
        {theme === "tiktok" && (
          <div className="absolute -left-1 top-4 w-1.5 h-6 bg-[#25f4ee] rounded-r" />
        )}
        
        {/* Card Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            {/* Avatar block */}
            {customAvatar ? (
              <img 
                src={customAvatar} 
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-gray-100/50" 
                alt="user avatar"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div 
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-white font-medium text-xs sm:text-sm select-none ${
                  theme === "artistic-brutalist" ? "bg-gradient-to-tr from-[#FF4E00] to-[#FFAA00] text-black font-extrabold" : ""
                }`} 
                style={theme === "artistic-brutalist" ? {} : { backgroundColor: comment.avatarColor }}
              >
                {initials}
              </div>
            )}

            <div>
              <div className="flex items-center space-x-1">
                <span className={`text-xs sm:text-sm font-semibold tracking-tight ${textPrimaryColor}`}>
                  {activeUsername}
                </span>
                {/* Simulated Verification badge for premium feel */}
                {(theme === "tiktok" || theme === "youtube" || theme === "artistic-brutalist") && (
                  <span className={`inline-flex items-center justify-center w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full ${
                    theme === "artistic-brutalist" ? "bg-[#FF4E00]" : "bg-blue-500"
                  }`}>
                    <Check className={`w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-[3] ${theme === "artistic-brutalist" ? "text-black" : "text-white"}`} />
                  </span>
                )}
              </div>
              <span className={`text-[10px] sm:text-xs block ${textSecondaryColor}`}>
                {activeHandle}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            {/* Simulated Badge */}
            {cardNumber !== undefined && (
              <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-500/10 font-mono font-bold">
                #{cardNumber}
              </span>
            )}
            <MoreHorizontal className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 cursor-pointer" />
          </div>
        </div>

        {/* Comment Text Line */}
        <div className="my-2 sm:my-3 flex-1 flex flex-col justify-center">
          <p className={`${fontFamily} ${activeFontSize} ${align} leading-relaxed break-words font-medium whitespace-pre-wrap ${
            theme === "neon" ? "text-[#f8fafc]" : textPrimaryColor
          }`}>
            {comment.text}
          </p>
        </div>

        {/* Card Footer (Simulated Interaction Panel) */}
        {showStatusIcons && (
          <div className="flex items-center justify-between mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-gray-400/10 text-[10px] sm:text-xs text-gray-400">
            <div className="flex items-center space-x-3.5 sm:space-x-4">
              <button className={`flex items-center space-x-1.5 transition-colors ${
                theme === "artistic-brutalist" ? "text-[#FF4E00] hover:text-[#FFAA00]" : "hover:text-rose-500"
              }`}>
                <Heart className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                  theme === "tiktok" ? "fill-rose-500 text-rose-500" : ""
                } ${
                  theme === "artistic-brutalist" ? "fill-[#FF4E00] text-[#FF4E00]" : ""
                }`} />
                <span>{comment.likesCount}</span>
              </button>

              <button className="flex items-center space-x-1.5 hover:text-blue-500 transition-colors">
                <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Share</span>
              </button>
            </div>

            {showTimestamp && (
              <span className={`text-[9px] sm:text-[10px] uppercase tracking-wider font-semibold ${textSecondaryColor}`}>
                {comment.timeAgo} ago
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
