/**
 * Preset social media messy copy-pastes for demonstration and instant trial
 */

export interface PresetPaste {
  id: string;
  platform: "TikTok" | "YouTube" | "Instagram" | "X" | "Facebook";
  title: string;
  content: string;
}

export const PRESETS: PresetPaste[] = [
  {
    id: "tiktok-messy",
    platform: "TikTok",
    title: "TikTok Messy Paste",
    content: `JohnDoe
this beat is insane 🔥
Like
Reply
2h

mary22
bro dropped heat 💀😭
Reply
1d

@producervisuals
Nah the bass on this is absolutely criminal
Like
Reply
3 weeks ago

rap_leakz
I need this on spotify immediately!
Like
Reply
1yr
`
  },
  {
    id: "youtube-chat",
    platform: "YouTube",
    title: "YouTube Copied Comments",
    content: `@Alex_Producer_Beats
yesterday
This changes everything. Pls drop the audio file or a WAV loop!
👍 142  👎  Reply
  
@synth_vibe99
4 days ago (edited)
Nah bro actually cooked. The chorus goes crazy hard
👍 12  👎  Reply

@creative_charlie
1 week ago
the chord progression in the second half of the track is celestial ✨
👍 8  👎  Reply
`
  },
  {
    id: "instagram-feed",
    platform: "Instagram",
    title: "Instagram Post Comments",
    content: `its_just_kyle
Bro this is a masterpiece 😭
3d  Reply  See translation

beatsBYdan
Wait, did you sample modular synth on this?
3d  42 likes  Reply  See translation

vibe_architect
This song is perfect for a Late Night driving playlist
2d  5 likes  Reply  See translation
`
  },
  {
    id: "x-replies",
    platform: "X",
    title: "X (Twitter) Reply Feed",
    content: `Alex Smith
@alex_smith_dev
·
2h
Love the new design! The transitions are so smooth.
Replying to @commentflow
233 views
1 reply

Sarah Johnson
@sarah_codes
·
May 24
Wait, is this built using React? Looks super snappy!
12
14
154
2.3K Views
`
  },
  {
    id: "facebook-comments",
    platform: "Facebook",
    title: "Facebook Post Comments",
    content: `Jane Doe
This song is an absolute masterpiece. I've listened to it on repeat all day!
Like
Reply
Share
1h

Johnathan Taylor
This is incredibly creative! Can't wait to see what you build next.
Like  ·  Reply  ·  Share  ·  12m
`
  }
];
