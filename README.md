DevSpot Hackathon Bot - Project Documentation

Tech Stack
Frontend

Next.js 14: App Router, TypeScript
Clerk: Client-side authentication and user management

Backend/Database

Supabase: PostgreSQL database with RLS policies and triggers
Clerk: Authentication and user management with webhooks
Langchain: AI conversation flow management with memory persistence
Claude AI: Large language model integration with structured output
Zod: TypeScript-first schema validation for data extraction

Deployment

VPS: Next.js hosting with edge functions
Clerk Dashboard: Authentication management

S3 Integration: Move image storage to AWS S3
Payment Integration: x402 payment processing for bounties

Project Structure
devspot-hackathon-bot/
├── src/
│   ├── app/
│   │   ├── globals.css              # Global styles with DevSpot theme + glassmorphism
│   │   ├── layout.tsx               # Root layout with Clerk provider
│   │   ├── page.tsx                 # Main chat interface with streaming
│   │   ├── hackathons/
│   │   │   ├── page.tsx            # Hackathons listing with responsive grid
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Individual hackathon details
│   │   ├── draft/
│   │   │   └── [id]/
│   │   │       └── page.tsx        # Draft hackathon preview
│   │   ├── api/
│   │   │   ├── conversations/
│   │   │   │   ├── route.ts        # Conversation CRUD operations
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts    # Individual conversation updates
│   │   │   ├── chat/
│   │   │   │   └── route.ts        # Smart AI chat with data extraction
│   │   │   ├── hackathons/
│   │   │   │   ├── route.ts        # List user's hackathons
│   │   │   │   └── [id]/
│   │   │   │       └── route.ts    # Individual hackathon with challenges
│   │   │   └── webhooks/
│   │   │       └── clerk/
│   │   │           └── route.ts    # Clerk user synchronization
│   │   └── middleware.ts           # Clerk auth middleware
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx          # Navigation with search functionality
│   │   │   └── Sidebar.tsx         # Navigation menu with active states
│   │   ├── chat/
│   │   │   ├── MessageBubble.tsx   # Chat messages with streaming support
│   │   │   └── ChatInput.tsx       # Enhanced input with loading states
│   │   └── ui/
│   │       ├── ActionButton.tsx    # Reusable button component
│   │       └── ModelCard.tsx       # Mode selection cards
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts          # Browser Supabase client
│   │   │   ├── server.ts          # Server Supabase client
│   │   │   └── admin.ts           # Admin client (service role)
│   │   ├── conversation-memory.ts  # Persistent memory management
│   │   ├── data-extraction-utils.ts # Smart AI data extraction
│   │   ├── InstanceCache.ts       # Caching for AI instances
│   │   └── constants.ts           # App constants and configurations
│   └── types/
│       └── database.ts            # TypeScript database types
├── public/
│   └── assets/
│       └── images/                # DevSpot logos and assets
├── .env.local                     # Environment variables
├── tailwind.config.js             # Tailwind with glassmorphism utilities
└── next.config.js                 # Next.js configuration

Database Schema
Users Table
sqlusers (
  id UUID PRIMARY KEY,
  clerk_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('platform_owner', 'technology_owner', 'participant')),
  onboarding_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
)
Hackathons Table (Updated)
sqlhackathons (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  organization TEXT,
  registration_date TIMESTAMP,
  hacking_start TIMESTAMP,
  submission_deadline TIMESTAMP,
  format TEXT CHECK (format IN ('virtual', 'in_person', 'hybrid')),
  target_audience TEXT,
  event_size INTEGER,
  total_budget INTEGER,
  budget_currency TEXT DEFAULT 'USDC',
  status TEXT CHECK (status IN ('draft', 'published', 'active', 'completed')),
  challenges_count INTEGER DEFAULT 0,
  logo TEXT,                        # Base64 or URL storage
  banner TEXT,                # Base64 or URL storage
  creator_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)
Challenges Table (Updated)
sql challenges (
  id UUID PRIMARY KEY,
  hackathon_id UUID REFERENCES hackathons(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  prize_amount INTEGER DEFAULT 0,
  judging_criteria TEXT[] DEFAULT '{}',    # Array of criteria strings
  sponsors TEXT[] DEFAULT '{}',            # Array of sponsor names
  resources TEXT[] DEFAULT '{}',           # Array of resource links
  created_at TIMESTAMP DEFAULT NOW()
)
Conversations Table (Enhanced)
sql conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  hackathon_id UUID REFERENCES hackathons(id),
  current_step TEXT NOT NULL,
  conversation_data JSONB DEFAULT '{}',    # Stores chat history and extracted data
  method TEXT CHECK (method IN ('ai')),   # Removed manual method
  message_count INTEGER DEFAULT 0,
  last_message_at TIMESTAMP DEFAULT NOW(),
  last_updated TIMESTAMP DEFAULT NOW()
)



API Routes
POST /api/chat
Advanced AI chat with data extraction and streaming
json{
  "message": "I want to create a $25,000 AI hackathon",
  "conversationId": "uuid",
  "mode": "hackathon",
  "stream": true
}
Response (Streaming):
javascriptdata: {"type": "content", "content": "Great! Let's create...", "conversationId": "uuid"}
data: {"type": "complete", "progress": 60, "extractedData": {...}}
data: [DONE]
GET /api/hackathons
List user's hackathons with pagination
json{
  "hackathons": [
    {
      "id": "uuid",
      "title": "AI Innovation Challenge",
      "status": "published",
      "challenges_count": 3,
      "total_budget": 50000,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
GET /api/hackathons/[id]
Individual hackathon with challenges and combined resources
json{
  "hackathon": { "id": "uuid", "title": "...", ... },
  "challenges": [
    {
      "id": "uuid",
      "title": "Backend Challenge",
      "judging_criteria": ["Innovation", "Technical Execution"],
      "prize_amount": 10000
    }
  ],
  "combinedSponsors": ["TechCorp", "DataCo"],
  "combinedResources": ["AWS Credits", "API Access"]
}
Smart Data Extraction
Hackathon Data Schema
typescriptconst HackathonDataSchema = z.object({
  title: z.string().optional(),
  organization: z.string().optional(),
  registration_date: z.string().optional(),
  hacking_start: z.string().optional(),
  submission_deadline: z.string().optional(),
  format: z.enum(['virtual', 'in_person', 'hybrid']).optional(),
  total_budget: z.number().min(20000).optional(),
  challenges_count: z.number().default(0)
});
Challenge Data Schema
typescriptconst ChallengeDataSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  prize_amount: z.number().optional(),
  judging_criteria: z.array(z.string()).min(4).optional(),
  sponsors: z.array(z.string()).optional(),
  resources: z.array(z.string()).optional()
});


Conversation Flow
1. Hackathon Creation Phase
Basic Info → Timeline → Logistics → Budget → Challenge Count
2. Challenge Creation Phase
Challenge 1: Title → Details → Criteria → Optional Fields
Challenge 2: Title → Details → Criteria → Optional Fields
...
Minimum 2 challenges required
3. Review & Publish Phase
Review All Data → Validation → Publish/Save as Draft
Validation Rules
Business Logic

Minimum Budget: $20,000 USDC total bounty
Minimum Challenges: 2 challenges per hackathon
Judging Criteria: Minimum 4 criteria per challenge
Date Validation: Registration < Hacking < Submission
Image Size: Max 1.5MB for logos, 2MB for banners

Default Judging Criteria
javascript[
  "Innovation / Creativity",
  "Technical Execution", 
  "User Experience (UX)",
  "Impact / Usefulness",
  "Completeness / Functionality",
  "Presentation / Demo Quality",
  "Scalability / Future Potential",
  "Relevance to Theme / Challenge",
  "Use of Sponsor Tech / APIs",
  "Team Collaboration"
]
Installation & Setup
Prerequisites
bashNode.js 18+
npm or yarn
Supabase account
Clerk account
Google AI API key
Installation
bash# Clone repository
git clone <repository-url>
cd devspot-hackathon-bot

# Install dependencies
npm install

# Environment setup
cp .env.example .env.local
# Fill in your API keys and database URLs

# Run database migrations
# Execute SQL files in /database/migrations/

# Start development server
npm run dev
Required Dependencies
bashnpm install next@14 react@18 typescript
npm install @clerk/nextjs @supabase/supabase-js @supabase/ssr
npm install lucide-react clsx tailwind-merge
npm install langchain @langchain/google-genai
npm install zod


