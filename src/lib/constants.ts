// src/lib/constants.ts

export const DEVSPOT_COLORS = {
  // Main backgrounds
  DARK: '#14141a',
  DARK_LIGHT: '#1c1c22',
  
  // Blue accents
  BLUE_PRIMARY: '#3b82f6',
  BLUE_HOVER: '#2563eb',
  BLUE_LIGHT: '#60a5fa',
  
  // Text colors
  TEXT_PRIMARY: '#ffffff',
  TEXT_SECONDARY: '#d1d5db', 
  TEXT_MUTED: '#9ca3af',
  
  // Border colors
  BORDER_PRIMARY: '#4b5563',
  BORDER_LIGHT: '#374151',
  
  // Status colors
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
} as const;

export const DEVSPOT_ASSETS = {
  LOGO_URL: 'https://devspot.app/_next/image?url=%2Fdevspot_logo.png&w=256&q=100',
  BETA_LOGO_URL: 'https://devspot.app/beta.svg',
} as const;

export const CONVERSATION_STEPS = {
  WELCOME: 'welcome',
  MODE_SELECTION: 'mode_selection',
  METHOD_SELECTION: 'method_selection',
  BASIC_INFO: 'basic_info',
  CHALLENGE_CREATION: 'challenge_creation', 
  PRIZE_SETUP: 'prize_setup',
  PAYMENT: 'payment',
  DRAFT_PREVIEW: 'draft_preview',
} as const;

export const USER_ROLES = {
  PLATFORM_OWNER: 'platform_owner',
  TECHNOLOGY_OWNER: 'technology_owner',
  PARTICIPANT: 'participant',
} as const;

export const CHAT_MODES = {
  EXPLORE: 'explore',
  HACKATHON_CREATION: 'hackathon_creation',
  PROFILE_CREATION: 'profile_creation',
} as const;

export const CREATION_METHODS = {
  AI: 'ai',
  MANUAL: 'manual',
} as const;

export const JUDGING_CRITERIA = [
  'Innovation / Creativity',
  'Technical Execution', 
  'User Experience (UX)',
  'Impact / Usefulness',
  'Completeness / Functionality',
  'Presentation / Demo Quality',
  'Scalability / Future Potential',
  'Relevance to Theme / Challenge',
  'Use of Sponsor Tech / APIs',
  'Team Collaboration',
];

export const HACKATHON_FORMATS = [
  'virtual',
  'in_person', 
  'hybrid',
] as const;

export const SAMPLE_BOUNTIES = [
  {
    title: "AI Agent for Climate Action",
    prize: 5000,
    sponsor: "Filecoin Foundation",
    judging_criteria: ["Innovation", "Impact", "Technical Execution", "UX"],
    resources: ["https://filecoin.io/sdk", "https://docs.filecoin.io"]
  },
  {
    title: "ZK Identity Verifier",
    prize: 10000,
    sponsor: "Polygon Labs", 
    judging_criteria: ["Scalability", "Use of Sponsor Tech", "Completeness", "Demo Quality"],
    resources: ["https://zkdocs.dev"]
  },
  {
    title: "Composable Treasury Tools",
    prize: 7500,
    sponsor: "Glitter Protocol",
    judging_criteria: ["Theme Fit", "Functionality", "Team Collaboration", "Innovation"],
    resources: ["https://glitter.xyz/docs"]
  }
] as const;
export const HACKATHON_STEPS = [
  'What is the title of the hackathon?',
  'What is the organization of the hackathon?',
  'registration_date',
  'hacking_start',
  'submission_deadline',
  'total_budget (DEFAULT 20k minimum)',
  'How many challenges would you like to create?']

export const CHALLENGE_CREATION_STEPS = [
  'title',
  'description',
  'prizes',
  'sponsor',
  'judging criteria',
  'resources'
]