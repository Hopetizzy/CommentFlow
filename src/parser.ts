/**
 * CommentFlow Parsing and Cleaning Engine
 */

export type PlatformType = "TikTok" | "YouTube" | "Instagram" | "X" | "Facebook" | "Generic";

export interface CommentItem {
  id: string;
  username: string;
  handle: string;
  text: string;
  avatarColor: string;
  likesCount: string;
  timeAgo: string;
}

export interface CleanOptions {
  keepEmojis: boolean;
  removeDuplicates: boolean;
  aggressiveClean: boolean;
  preserveSlang: boolean;
}

// Generates a random username if not parsed
const ADJECTIVES = ["Crispy", "Neon", "Slick", "Velvet", "Retro", "Cosmic", "Chill", "Hyper", "Golden", "Wavy", "Zen", "Muted"];
const NOUNS = ["Creator", "Vibe", "Beats", "Lover", "Stargazer", "Dreamer", "Nomad", "Pixel", "Echo", "Wave", "Shadow", "Soul"];
const AVATAR_COLORS = [
  "#ef4444", "#f97316", "#f59e0b", "#10b981", "#06b6d4", "#3b82f6", 
  "#6366f1", "#8b5cf6", "#d946ef", "#ec4899", "#14b8a6", "#84cc16"
];

export function generateRandomUser(): { username: string; handle: string; avatarColor: string } {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num = Math.floor(Math.random() * 900) + 100;
  const username = `${adj} ${noun}`;
  const handle = `@${adj.toLowerCase()}_${noun.toLowerCase()}${num}`;
  const avatarColor = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
  return { username, handle, avatarColor };
}

// Fast pre-compiled metadata regexes
const METADATA_PATTERNS = [
  // 1. Standalone numbers or simple abbreviations (e.g. 12, 14, 2.3K, 4.5M)
  /^\d+(?:\.\d+)?[KkMmB]?(?:\s*(?:likes?|views?|replys?|replies?|shares?|reposts?|retweets?|comments?))?$/i,
  
  // 2. Views/Replies/Likes/Reposts counts
  /\b\d+(?:\.\d+)?[KkMmB]?\s*(?:views?|replys?|replies?|likes?|shares?|reposts?|retweets?)\b/i,
  
  // 3. Likes/Reaction symbols (e.g. 👍 142, 👎, 42 likes)
  /^[👍👎]\s*\d*(?:\.\d+)?[KkMmB]?$/u,
  /^\d+\s*likes?$/i,
  
  // 4. Time Indicators (e.g., 2h, 3w, 1yr, 1yr ago, 3 weeks ago, Yesterday at 12:43 PM, May 24, 3-11)
  /^\d+[hdwmsy]$/i,
  /^\d+\s*y[er]s?\s*ago$/i, // e.g. 1yr ago, 1y ago
  /^\d+\s*(?:second|minute|hour|day|week|month|year)s?\s*ago/i,
  /^(?:yesterday|today)(?:\s+at\s+\d+:\d+(?:\s*[ap]m)?)?$/i,
  /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d+(?:\s*,\s*\d{4})?$/i, // e.g. May 24, May 24, 2024
  /^\d{1,4}-\d{1,2}(?:-\d{1,2})?$/, // e.g. 3-11, 2024-3-11, 12-25
  /^now$/i,
  /^\d+\s*(?:y|yr|yrs|year|years|d|day|days|h|hr|hrs|hour|hours|w|wk|wks|week|weeks|m|min|mins|minute|minutes|s|sec|secs|second|seconds)(?:\s*ago)?$/i,
  /^\d+\s*(?:d|day|days|y|yr|yrs|year|years|h|hr|hrs|hour|hours|w|wk|wks|week|weeks|m|min|mins|minute|minutes|s|sec|secs|second|seconds)?\s*(?:to|-)\s*\d+\s*(?:d|day|days|y|yr|yrs|year|years|h|hr|hrs|hour|hours|w|wk|wks|week|weeks|m|min|mins|minute|minutes|s|sec|secs|second|seconds)(?:\s*ago)?$/i,
  
  // 5. UI Elements & Actions
  /^(?:like|reply|share|more|hide|pin|pinned|follow|followed|creator|verified|see translation|translate|translated by google|view animation|avatar|user\s+avatar)$/i,
  /^(?:view|show)\s+(?:all\s+)?\d*\s*repl(y|ies)/i,
  /^replying\s+to\s+@\w+/i,
  /^\[?sticker\]?$/i,
  /^·$/
];

export function isMetadataLine(line: string): boolean {
  const clean = line.trim();
  if (!clean) return true;
  
  const normalized = clean.toLowerCase();

  // Facebook/Generic dot-separated lines (e.g., "Like  ·  Reply  ·  Share  ·  12m")
  if (normalized.includes("·")) {
    const parts = clean.split(/\s*·\s*/);
    const uiCount = parts.filter(p => isMetadataLine(p)).length;
    if (uiCount >= parts.length - 1) return true;
  }
  
  // Handles row of interaction counts like "👍 142  👎  Reply"
  if (normalized.includes("👍") || normalized.includes("👎")) {
    const parts = clean.split(/\s+/);
    const metadataCount = parts.filter(p => isMetadataLine(p) || p === "👍" || p === "👎").length;
    if (metadataCount >= parts.length) return true;
  }

  return METADATA_PATTERNS.some(regex => regex.test(clean));
}

// Core function to clean individual comment lines
export function cleanCommentLine(line: string, options: CleanOptions): string {
  let text = line.trim();
  
  // 1. Handle Emoji strip
  if (!options.keepEmojis) {
    // Regex for typical emojis
    text = text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F300}-\u{1F5FF}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F251}\u{2B50}\u{2600}-\u{26FF}\u{1F300}-\u{1F5FF}]/gu, "");
  }

  // 2. Aggressive cleaning (remove nested timestamps, handles, double hashtags, platform links)
  if (options.aggressiveClean) {
    // Remove usernames/handles embedded inside text
    text = text.replace(/@\w+\s?/g, "");
    // Remove hashtags
    text = text.replace(/#\w+\s?/g, "");
    // Remove extra generic punctuations like double periods/excess exclamation marks
    text = text.replace(/\!+/g, "!");
    text = text.replace(/\?+/g, "?");
    text = text.replace(/\s+/g, " ");
  }

  return text.trim();
}

/**
 * Robustly parses raw copied social comments text block into structured items based on the platform.
 */
export function parseRawComments(rawText: string, options: CleanOptions, platform: PlatformType = "Generic"): CommentItem[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  const comments: CommentItem[] = [];
  let currentIndex = 0;

  const isHandle = (l: string) => l.startsWith("@") && !l.includes(" ") && l.length > 1;

  if (platform === "TikTok") {
    while (currentIndex < lines.length) {
      const line = lines[currentIndex];
      if (isMetadataLine(line)) {
        currentIndex++;
        continue;
      }

      const nextLine = currentIndex + 1 < lines.length ? lines[currentIndex + 1] : null;
      if (nextLine && !isMetadataLine(nextLine) && !isHandle(line)) {
        const cleanText = cleanCommentLine(nextLine, options);
        if (cleanText) {
          const randUser = generateRandomUser();
          comments.push({
            id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            username: line,
            handle: `@${line.toLowerCase().replace(/\s+/g, "")}`,
            text: cleanText,
            avatarColor: randUser.avatarColor,
            likesCount: generateRandomLikes(),
            timeAgo: generateRandomTime()
          });
        }
        currentIndex += 2;
      } else {
        const cleanText = cleanCommentLine(line, options);
        if (cleanText) {
          const randUser = generateRandomUser();
          comments.push({
            id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            username: isHandle(line) ? line.substring(1) : randUser.username,
            handle: isHandle(line) ? line : randUser.handle,
            text: cleanText,
            avatarColor: randUser.avatarColor,
            likesCount: generateRandomLikes(),
            timeAgo: generateRandomTime()
          });
        }
        currentIndex++;
      }
    }
  } else if (platform === "YouTube") {
    while (currentIndex < lines.length) {
      const line = lines[currentIndex];
      if (isHandle(line)) {
        let timestamp = "";
        let commentText = "";
        let i = currentIndex + 1;
        
        if (i < lines.length && isMetadataLine(lines[i])) {
          timestamp = lines[i];
          i++;
        }
        
        if (i < lines.length && !isMetadataLine(lines[i]) && !isHandle(lines[i])) {
          commentText = lines[i];
          i++;
        }

        if (commentText) {
          const cleanText = cleanCommentLine(commentText, options);
          if (cleanText) {
            const randUser = generateRandomUser();
            const cleanHandleName = line.substring(1);
            comments.push({
              id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              username: cleanHandleName.charAt(0).toUpperCase() + cleanHandleName.slice(1),
              handle: line,
              text: cleanText,
              avatarColor: randUser.avatarColor,
              likesCount: generateRandomLikes(),
              timeAgo: timestamp ? timestamp.replace(/\s*\(edited\)/i, "") : generateRandomTime()
            });
          }
        }
        currentIndex = i;
      } else {
        if (!isMetadataLine(line)) {
          const cleanText = cleanCommentLine(line, options);
          if (cleanText) {
            const randUser = generateRandomUser();
            comments.push({
              id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              username: randUser.username,
              handle: randUser.handle,
              text: cleanText,
              avatarColor: randUser.avatarColor,
              likesCount: generateRandomLikes(),
              timeAgo: generateRandomTime()
            });
          }
        }
        currentIndex++;
      }
    }
  } else if (platform === "Instagram") {
    while (currentIndex < lines.length) {
      const line = lines[currentIndex];
      if (isMetadataLine(line)) {
        currentIndex++;
        continue;
      }

      const nextLine = currentIndex + 1 < lines.length ? lines[currentIndex + 1] : null;
      if (nextLine && !isMetadataLine(nextLine)) {
        const cleanText = cleanCommentLine(nextLine, options);
        if (cleanText) {
          const randUser = generateRandomUser();
          comments.push({
            id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            username: line,
            handle: `@${line.toLowerCase()}`,
            text: cleanText,
            avatarColor: randUser.avatarColor,
            likesCount: generateRandomLikes(),
            timeAgo: generateRandomTime()
          });
        }
        
        let i = currentIndex + 2;
        if (i < lines.length && isMetadataLine(lines[i])) {
          i++;
        }
        currentIndex = i;
      } else {
        const cleanText = cleanCommentLine(line, options);
        if (cleanText) {
          const randUser = generateRandomUser();
          comments.push({
            id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            username: randUser.username,
            handle: randUser.handle,
            text: cleanText,
            avatarColor: randUser.avatarColor,
            likesCount: generateRandomLikes(),
            timeAgo: generateRandomTime()
          });
        }
        currentIndex++;
      }
    }
  } else if (platform === "X") {
    while (currentIndex < lines.length) {
      const line = lines[currentIndex];
      const nextLine = currentIndex + 1 < lines.length ? lines[currentIndex + 1] : null;
      if (nextLine && isHandle(nextLine)) {
        const displayName = line;
        const handle = nextLine;
        
        let i = currentIndex + 2;
        if (i < lines.length && (lines[i] === "·" || isMetadataLine(lines[i]))) {
          i++;
        }
        
        let commentText = "";
        let timestamp = "";
        
        if (i < lines.length && isMetadataLine(lines[i])) {
          timestamp = lines[i];
          i++;
        }
        
        if (i < lines.length && !isMetadataLine(lines[i])) {
          commentText = lines[i];
          i++;
        }

        if (commentText) {
          const cleanText = cleanCommentLine(commentText, options);
          if (cleanText) {
            const randUser = generateRandomUser();
            comments.push({
              id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              username: displayName,
              handle: handle,
              text: cleanText,
              avatarColor: randUser.avatarColor,
              likesCount: generateRandomLikes(),
              timeAgo: timestamp || generateRandomTime()
            });
          }
        }
        
        while (i < lines.length) {
          const nextVal = lines[i];
          const isNextBlockStart = (i + 1 < lines.length && isHandle(lines[i + 1]));
          if (isNextBlockStart) {
            break;
          }
          if (isMetadataLine(nextVal) || isHandle(nextVal)) {
            i++;
          } else {
            break;
          }
        }
        currentIndex = i;
      } else {
        if (!isMetadataLine(line)) {
          const cleanText = cleanCommentLine(line, options);
          if (cleanText) {
            const randUser = generateRandomUser();
            comments.push({
              id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              username: randUser.username,
              handle: randUser.handle,
              text: cleanText,
              avatarColor: randUser.avatarColor,
              likesCount: generateRandomLikes(),
              timeAgo: generateRandomTime()
            });
          }
        }
        currentIndex++;
      }
    }
  } else if (platform === "Facebook") {
    while (currentIndex < lines.length) {
      const line = lines[currentIndex];
      if (isMetadataLine(line)) {
        currentIndex++;
        continue;
      }

      const nextLine = currentIndex + 1 < lines.length ? lines[currentIndex + 1] : null;
      if (nextLine && !isMetadataLine(nextLine)) {
        const cleanText = cleanCommentLine(nextLine, options);
        if (cleanText) {
          const randUser = generateRandomUser();
          comments.push({
            id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            username: line,
            handle: `@${line.toLowerCase().replace(/\s+/g, "")}`,
            text: cleanText,
            avatarColor: randUser.avatarColor,
            likesCount: generateRandomLikes(),
            timeAgo: generateRandomTime()
          });
        }
        
        let i = currentIndex + 2;
        while (i < lines.length && isMetadataLine(lines[i])) {
          i++;
        }
        currentIndex = i;
      } else {
        const cleanText = cleanCommentLine(line, options);
        if (cleanText) {
          const randUser = generateRandomUser();
          comments.push({
            id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            username: randUser.username,
            handle: randUser.handle,
            text: cleanText,
            avatarColor: randUser.avatarColor,
            likesCount: generateRandomLikes(),
            timeAgo: generateRandomTime()
          });
        }
        currentIndex++;
      }
    }
  } else {
    // Generic auto-detect logic
    while (currentIndex < lines.length) {
      const currentLine = lines[currentIndex];

      if (isMetadataLine(currentLine)) {
        currentIndex++;
        continue;
      }

      if (isHandle(currentLine)) {
        const handle = currentLine;
        const cleanHandleName = handle.substring(1);
        let commentTxt = "";
        let foundIndex = -1;

        for (let offset = 1; offset <= 3; offset++) {
          const nextIdx = currentIndex + offset;
          if (nextIdx >= lines.length) break;
          const nextLine = lines[nextIdx];
          
          if (isHandle(nextLine)) {
            break;
          }
          if (!isMetadataLine(nextLine)) {
            commentTxt = nextLine;
            foundIndex = nextIdx;
            break;
          }
        }

        if (commentTxt) {
          const cleanText = cleanCommentLine(commentTxt, options);
          if (cleanText) {
            const randUser = generateRandomUser();
            comments.push({
              id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              username: cleanHandleName.charAt(0).toUpperCase() + cleanHandleName.slice(1),
              handle: handle,
              text: cleanText,
              avatarColor: randUser.avatarColor,
              likesCount: generateRandomLikes(),
              timeAgo: generateRandomTime()
            });
          }
          currentIndex = foundIndex + 1;
          continue;
        }
      }

      if (currentIndex + 1 < lines.length) {
        const line1 = currentLine;
        const line2 = lines[currentIndex + 1];
        
        const line1IsShort = line1.length > 0 && line1.length < 25;
        const line2IsComment = !isMetadataLine(line2) && !isHandle(line2);
        
        let hasMetadataBelow = false;
        for (let offset = 2; offset <= 4; offset++) {
          const nextIdx = currentIndex + offset;
          if (nextIdx < lines.length) {
            if (isMetadataLine(lines[nextIdx])) {
              hasMetadataBelow = true;
              break;
            }
          }
        }

        if (line1IsShort && line2IsComment && hasMetadataBelow) {
          const cleanText = cleanCommentLine(line2, options);
          if (cleanText) {
            const randUser = generateRandomUser();
            comments.push({
              id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              username: line1,
              handle: `@${line1.toLowerCase().replace(/\s+/g, "")}`,
              text: cleanText,
              avatarColor: randUser.avatarColor,
              likesCount: generateRandomLikes(),
              timeAgo: generateRandomTime()
            });
          }
          currentIndex += 2;
          continue;
        }
      }

      const cleanText = cleanCommentLine(currentLine, options);
      if (cleanText) {
        const randUser = generateRandomUser();
        comments.push({
          id: `cmt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          username: randUser.username,
          handle: randUser.handle,
          text: cleanText,
          avatarColor: randUser.avatarColor,
          likesCount: generateRandomLikes(),
          timeAgo: generateRandomTime()
        });
      }

      currentIndex++;
    }
  }

  if (options.removeDuplicates) {
    const seen = new Set<string>();
    return comments.filter(item => {
      const normalized = item.text.toLowerCase().replace(/\s+/g, "");
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });
  }

  return comments;
}

function generateRandomLikes(): string {
  const num = Math.floor(Math.random() * 1500) + 1;
  if (num > 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

function generateRandomTime(): string {
  const val = Math.floor(Math.random() * 23) + 1;
  const unit = ["h", "d", "w"][Math.floor(Math.random() * 3)];
  return `${val}${unit}`;
}
