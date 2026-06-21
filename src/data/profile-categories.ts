export type ProfileCategory =
  | 'Gym'
  | 'Gamer'
  | 'Tradie'
  | 'Teacher'
  | 'Nurse'
  | 'Influencer'
  | 'Entrepreneur'
  | 'FIFO'
  | 'Traveller'
  | 'Spiritual'
  | 'Fitness'
  | 'Creative'
  | 'Corporate'
  | 'Crypto'
  | 'Outdoors';

export interface CategoryMeta {
  emoji: string;
  plural: string;
}

export const CATEGORY_META: Record<ProfileCategory, CategoryMeta> = {
  Gym:          { emoji: '💪', plural: 'Gym Bros' },
  Gamer:        { emoji: '🎮', plural: 'Gamers' },
  Tradie:       { emoji: '🔧', plural: 'Tradies' },
  Teacher:      { emoji: '📚', plural: 'Teachers' },
  Nurse:        { emoji: '💉', plural: 'Nurses' },
  Influencer:   { emoji: '📸', plural: 'Influencers' },
  Entrepreneur: { emoji: '🚀', plural: 'Entrepreneurs' },
  FIFO:         { emoji: '⛏️', plural: 'FIFO Workers' },
  Traveller:    { emoji: '✈️', plural: 'Travellers' },
  Spiritual:    { emoji: '🔮', plural: 'Spiritual Types' },
  Fitness:      { emoji: '🏃', plural: 'Fitness Fanatics' },
  Creative:     { emoji: '🎨', plural: 'Creatives' },
  Corporate:    { emoji: '💼', plural: 'Corporate Types' },
  Crypto:       { emoji: '🪙', plural: 'Crypto Bros' },
  Outdoors:     { emoji: '🌿', plural: 'Outdoorsy Types' },
};

// Gym (6): obsessed with the gym as primary identity
// Gamer (5): gaming-first lifestyle
// Tradie (8): trade-based or skilled-labour work
// Teacher (7): educators and academic roles
// Nurse (8): healthcare and clinical roles
// Influencer (7): content-first personality
// Entrepreneur (5): founder/hustle archetypes
// FIFO (4): genuinely away for weeks at a time
// Traveller (5): nomadic or travel-first identity
// Spiritual (8): astrology, energy, wellness-as-identity
// Fitness (6): health-oriented without gym obsession
// Creative (10): arts, design, media, food
// Corporate (11): office / professional services careers
// Crypto (4): web3, NFTs, coins-as-personality
// Outdoors (6): nature, animals, active outdoor life

export const profileCategories: Record<number, ProfileCategory> = {
  // ─── Reject profiles 1–30 ─────────────────────────────────────────────────
  1:  'Crypto',       // Brad – sold house for coins
  2:  'Influencer',   // Taylah – content creator
  3:  'FIFO',         // Davo – 28/7 miner
  4:  'Spiritual',    // Kezza – Scorpio, cuts cords
  5:  'Gym',          // Thommo – body fat % opener
  6:  'Corporate',    // Bec – marketing manager, hot & cold
  7:  'Creative',     // Lachie – barista/musician
  8:  'Corporate',    // Rhys – corporate lawyer, "thick skin"
  9:  'Influencer',   // Brooke – wellness influencer
  10: 'Traveller',    // Jayden – parent-funded gap year
  11: 'Crypto',       // Corey – failed ventures + NFT collection
  12: 'Influencer',   // Scoey – DJ/promoter
  13: 'Gamer',        // Cooper – IT WFH homebody
  14: 'Traveller',    // Blake – surf instructor, 12 relationships
  15: 'Gym',          // Ethan – gym owner, ended relationships over missed days
  16: 'Corporate',    // Chelsea – real estate, "thick skin"
  17: 'Tradie',       // Tezza – sparkie with gambling problem
  18: 'FIFO',         // Kirra – at sea 3–6 weeks at a time
  19: 'Fitness',      // Mia – dog trainer, 4 dogs in the bed
  20: 'Corporate',    // Harrison – investment banker, 90h weeks
  21: 'Spiritual',    // Alicia – cuts cords, tarot
  22: 'Gamer',        // Dylan – apprentice plumber, mum does washing, Xbox all weekend
  23: 'Entrepreneur', // Sophie M – MLM network marketer
  24: 'Creative',     // Tiana – tattoo artist, ex as business partner
  25: 'Gym',          // Nathan – fitness model/PT, 300 DMs
  26: 'Creative',     // Greta – sommelier, bottle a day
  27: 'Creative',     // Zara – investigative journalist, wrote about dates
  28: 'Crypto',       // Tyler – NFT artist, behind on rent
  29: 'Influencer',   // Lacey – beautician, wants to be treated like a queen
  30: 'Entrepreneur', // Renee – business coach, investor/partner combo

  // ─── Date profiles 31–50 ──────────────────────────────────────────────────
  31: 'Nurse',        // Emma – ICU nurse, stress-bakes
  32: 'Teacher',      // Liam – history teacher, home at 3pm
  33: 'Creative',     // Sarah – graphic designer, acted on ex's feedback
  34: 'Fitness',      // Jake – physio, catches issues early
  35: 'Fitness',      // Zoe – vet, genuinely curious
  36: 'Spiritual',    // Ben – landscape architect, proactive therapy
  37: 'Corporate',    // Chloe – accountant, present and available
  38: 'Outdoors',     // Tom – wildlife biologist
  39: 'Teacher',      // Ava – librarian/author, perfectly reliable
  40: 'Tradie',       // Riley – civil engineer, talks about feelings
  41: 'Nurse',        // Sophia – speech pathologist, pasta
  42: 'Teacher',      // Marcus – PE teacher, snacks in the car
  43: 'Nurse',        // Hannah – OT, Gerald the dog
  44: 'Nurse',        // Chris – paramedic, calm in every crisis
  45: 'Creative',     // Olivia – architect, fought for 6pm finish
  46: 'Corporate',    // Noah – software engineer, says "I need space" instead of ghosting
  47: 'Spiritual',    // Isla – environmental scientist, 2 years therapy
  48: 'Creative',     // Finn – head chef, structured days off
  49: 'Teacher',      // Grace – kindy teacher, no games no ghosting
  50: 'Tradie',       // James – carpenter, did self-work post-divorce

  // ─── Reject profiles 51–70 ────────────────────────────────────────────────
  51: 'Outdoors',     // Skye – horses > everything
  52: 'Gamer',        // Brayden – QA tester, 6 nights committed
  53: 'Spiritual',    // Crystal – energy healer, spirit guides cleared the app
  54: 'Crypto',       // Chad – web3 founder, portfolio down 87%
  55: 'Corporate',    // Penny – admin officer, 47 texts
  56: 'Influencer',   // Maverick – personal brand coach, you are content
  57: 'Traveller',    // Ash – no address in 19 months
  58: 'Tradie',       // Darren – plumber, never been wrong
  59: 'Traveller',    // Montana – travel content creator, Christmas if cheap
  60: 'Gym',          // Kyle – scales food at restaurants
  61: 'Entrepreneur', // Sienna – 7-figure Zoom pitch
  62: 'Corporate',    // Todd – sales manager, Karen gets two mentions
  63: 'Outdoors',     // Bridie – vet nurse/equestrian, Duchess owns the schedule
  64: 'Spiritual',    // Luca – yoga teacher, good vibes vanisher
  65: 'FIFO',         // Macca – 5-on-2-off, effectively single
  66: 'Gym',          // Brittany – holistic health coach, will challenge your meds
  67: 'Entrepreneur', // Rhett – 4 TEDx talks, 5 failed companies
  68: 'Influencer',   // Jade – "very attentive", will know your schedule
  69: 'Influencer',   // Angus – alpha podcaster, pre-cast your role
  70: 'Corporate',    // Narelle – pessimist-as-authenticity

  // ─── Date profiles 71–100 ─────────────────────────────────────────────────
  71: 'Tradie',       // Declan – electrician, home by 5, uses his words
  72: 'Creative',     // Priya – UX designer, gives AND receives feedback
  73: 'Tradie',       // Patrick – sous chef, done by 3pm
  74: 'Fitness',      // Maya – marine biologist, lab-based, replies within the hour
  75: 'Gamer',        // Eli – software developer, scheduled gaming with hard stops
  76: 'Teacher',      // Claudia – horse-riding teacher who actually comes home
  77: 'Gym',          // Max – PT & youth worker, will never comment on your food
  78: 'Entrepreneur', // Sasha – ethical clothing founder, Sundays off
  79: 'FIFO',         // Ryan – 3-on-3-off, has made it work before
  80: 'Nurse',        // Lexi – paediatric nurse, asks instead of assumes
  81: 'Teacher',      // Jamie – primary teacher, remembers your mum's name
  82: 'Traveller',    // Caitlin – flight attendant with a real home base
  83: 'Tradie',       // Archer – carpenter who started therapy
  84: 'Fitness',      // Beth – pilates instructor, never imposes her wellness
  85: 'Gamer',        // Connor – IT support, scheduled gaming, had the hard conversation
  86: 'Spiritual',    // Yuki – illustrator, journals anxiety instead of sharing it
  87: 'Corporate',    // Dan – project manager, single dad transparent
  88: 'Spiritual',    // Nina – yoga teacher without the manipulation
  89: 'Corporate',    // Henry – financial analyst, 6% crypto like an adult
  90: 'Fitness',      // Amy – dietitian, chicken parmy is her favourite meal
  91: 'Outdoors',     // Jack – sheep farmer, never gone quiet in an argument
  92: 'Outdoors',     // Freya – environmental consultant, still flies and knows it
  93: 'Outdoors',     // Mitch – landscaper, did the therapy, checked with his exes
  94: 'Nurse',        // Jess D – ED nurse, asks for support directly
  95: 'Creative',     // Oliver – wine educator, 3 glasses a week, tracks it
  96: 'Tradie',       // Stella – bakery owner, said no to growth
  97: 'Teacher',      // Tom A – drama teacher, zero actual drama
  98: 'Nurse',        // Diana – dentist, will actively choose you
  99: 'Creative',     // Lee – archivist, introvert who communicates
  100: 'Nurse',       // Sam – paramedic & SES volunteer, decent pasta
};
