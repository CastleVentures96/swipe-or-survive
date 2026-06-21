export type FlagType = 'Green Flag' | 'Beige Flag' | 'Red Flag' | 'Block Immediately';

export interface Scenario {
  id: number;
  situation: string;
  correctAnswer: FlagType;
  feedback: string;
}

export const scenarios: Scenario[] = [
  {
    id: 1,
    situation:
      "On your second date, they remember exactly how you take your coffee — without asking.",
    correctAnswer: 'Green Flag',
    feedback:
      "Paying attention to the small stuff is a big deal. They're actually listening.",
  },
  {
    id: 2,
    situation:
      "After three dates, they casually start introducing you to their friends like it's the most natural thing in the world.",
    correctAnswer: 'Green Flag',
    feedback:
      "They're not hiding you. Integration into their social life is a massive green flag.",
  },
  {
    id: 3,
    situation:
      "They tip 30% at restaurants, quietly, without needing you to notice or comment on it.",
    correctAnswer: 'Green Flag',
    feedback:
      "How someone treats service staff reveals everything about their character. This one passes.",
  },
  {
    id: 4,
    situation:
      "They casually mention 'my therapist says...' while having a perfectly healthy, normal conversation.",
    correctAnswer: 'Green Flag',
    feedback:
      "Actively working on themselves AND able to talk about it without drama? Genuinely rare.",
  },
  {
    id: 5,
    situation:
      "They text 'good morning' every single day without fail — not needy, just consistent.",
    correctAnswer: 'Green Flag',
    feedback: "Consistency is a love language. This one has it in spades.",
  },
  {
    id: 6,
    situation:
      "Three weeks ago you offhandedly mentioned your favourite childhood movie. They've tracked it down and watched it tonight — just to understand you better.",
    correctAnswer: 'Green Flag',
    feedback:
      "They were listening the whole time. That is rare and wonderful. Do not let them go.",
  },
  {
    id: 7,
    situation:
      "Before ordering food, they ask if you'd be happy with what they're choosing — not as a courtesy, but because they genuinely care.",
    correctAnswer: 'Green Flag',
    feedback:
      "Thoughtful AND they understand sharing dishes. Absolute top-tier partner behaviour.",
  },
  {
    id: 8,
    situation:
      "After the first date, they Venmo request you for exactly half of the appetiser you never actually ate.",
    correctAnswer: 'Beige Flag',
    feedback:
      "Financially careful or deeply petty? The jury is still out. Watch this space very closely.",
  },
  {
    id: 9,
    situation:
      "They say they love your dog but have never once asked the dog's name — and you have mentioned the dog six times.",
    correctAnswer: 'Beige Flag',
    feedback:
      "They love the concept of your dog. The actual dog remains a stranger to them.",
  },
  {
    id: 10,
    situation:
      "Their bedroom features a curated collection of real mounted insects, beautifully lit, with hand-written name plaques.",
    correctAnswer: 'Beige Flag',
    feedback: "Niche aesthetic. Not illegal. Not a dealbreaker. Probably fine. Maybe.",
  },
  {
    id: 11,
    situation:
      "They have very strong opinions about the correct way to load a dishwasher — and are not shy about expressing them.",
    correctAnswer: 'Beige Flag',
    feedback:
      "Just wait until you find out how they feel about the toilet paper roll direction.",
  },
  {
    id: 12,
    situation:
      "Their Instagram is 80% tasteful but absolutely relentless thirst traps. Of themselves.",
    correctAnswer: 'Beige Flag',
    feedback:
      "Self-confidence is genuinely attractive. THIS level of it requires a conversation.",
  },
  {
    id: 13,
    situation:
      "They give a completely fake name at Starbucks 'to avoid awkward small talk with the barista'.",
    correctAnswer: 'Beige Flag',
    feedback:
      "Adorably antisocial OR professionally mysterious. Honestly, could genuinely be either.",
  },
  {
    id: 14,
    situation:
      "They still use the email address they made in Year 9. It involves a nickname, the number 69, and their birth year.",
    correctAnswer: 'Beige Flag',
    feedback:
      "Some things never get updated. Like their email. And probably their emotional coping mechanisms.",
  },
  {
    id: 15,
    situation:
      "Their car is absolutely immaculate on the outside. Inside: 200+ crumpled fast food receipts going back to 2019.",
    correctAnswer: 'Beige Flag',
    feedback:
      "They contain multitudes. One of those multitudes is 43 Maccas runs. This calendar year.",
  },
  {
    id: 16,
    situation:
      "You send a heartfelt 3-paragraph message sharing something meaningful about your day. They reply: 'K'.",
    correctAnswer: 'Red Flag',
    feedback:
      "That single letter cost you 400 words of emotional labour. That is not okay.",
  },
  {
    id: 17,
    situation:
      "They still have their ex's Netflix profile on their account. They use it every single night.",
    correctAnswer: 'Red Flag',
    feedback:
      "That is not a streaming service. That is a digital shrine. A memorial to the unfinished past.",
  },
  {
    id: 18,
    situation:
      "Their phone 'always dies' at the exact moment you try to call them. Every time. Without exception.",
    correctAnswer: 'Red Flag',
    feedback:
      "The consistency is almost impressive. What a remarkable coincidence. Every. Single. Time.",
  },
  {
    id: 19,
    situation:
      "On the very first date they say 'I'm not like other people' — and then do not elaborate at all.",
    correctAnswer: 'Red Flag',
    feedback:
      "They are exactly like other people. But with significantly less self-awareness about it.",
  },
  {
    id: 20,
    situation:
      "They cancel plans last minute — but always have a completely believable, utterly reasonable excuse.",
    correctAnswer: 'Red Flag',
    feedback:
      "The word 'always' is doing a very large amount of heavy lifting in that sentence.",
  },
  {
    id: 21,
    situation:
      "When asked about their ex, they say 'total psycho' and immediately change the subject.",
    correctAnswer: 'Red Flag',
    feedback:
      "In every breakup story, the so-called 'psycho' has their own version of events.",
  },
  {
    id: 22,
    situation:
      "While showing you a photo on their phone, you catch a glimpse of a folder labelled 'situationships 2024'.",
    correctAnswer: 'Red Flag',
    feedback:
      "Not a player — they have an organised filing system. That is somehow so much worse.",
  },
  {
    id: 23,
    situation:
      "You're borrowing their phone and accidentally see a folder simply labelled 'Backup Options'. It has 12 contacts inside.",
    correctAnswer: 'Block Immediately',
    feedback: "You were not meant to see that. You cannot unsee that. BLOCK. NOW.",
  },
  {
    id: 24,
    situation:
      "They text 'we need to talk' at 9am. Then completely vanish for 6 hours. No calls. No texts. Nothing.",
    correctAnswer: 'Block Immediately',
    feedback:
      "This is not a relationship. This is psychological warfare. Exit the building immediately.",
  },
  {
    id: 25,
    situation:
      "On your second date, they have already named your future children — and have strong opinions about school districts.",
    correctAnswer: 'Block Immediately',
    feedback:
      "You hadn't even decided if you wanted a third date. Put down your drink and run.",
  },
];
