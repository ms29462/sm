# SoccerMatch - Product Requirements Document

## Original Problem Statement
Build a web platform called "SoccerMatch" that connects football (soccer) players with clubs, agents and universities around the world.

### User Types
- **Players**: Create profiles, upload videos/CV, browse and apply to opportunities
- **Clubs**: Create profiles, post opportunities, view player applications, save favorites
- **Federations**: National team scouting, manage team groups (Senior, U23, U20, etc.), track eligible players
- **Agents**: Represent players, search for talent, view club opportunities, manage watchlist
- **Specialists**: Physiotherapists, nutritionists, trainers - offer services to players
- **Admin**: Dashboard with stats, approve/verify users, manage content

### Core Requirements
- Modern sports tech design (dark theme, green accents)
- JWT-based authentication
- Responsive design for desktop and mobile

## What's Been Implemented

### Phase 1 - MVP (Completed)
- [x] User authentication (JWT-based)
- [x] Player profiles with athletic info, stats, video links, CV
- [x] Club profiles with country, league, logo
- [x] Opportunity posting and browsing
- [x] Application system with status tracking
- [x] Favorites system for clubs
- [x] Admin dashboard with stats
- [x] User approval workflow
- [x] Player verification badges

### Phase 2 - Communication (Completed)
- [x] Real-time chat (Socket.IO)
- [x] Video calls (WebRTC via simple-peer)
- [x] Admin-controlled chat room creation
- [x] Notification system

### Phase 3 - Privacy & Chat Requests (Completed - Dec 2025)
- [x] **Privacy Controls**: Email hidden from non-admin users
- [x] **Chat Request System**: Club requests → Player accepts/rejects → Admin creates chat

### Phase 4 - AI Matching & Transfermarkt Integration (Completed - Dec 2025)
- [x] **Transfermarkt Profile Link**: New field in player profile to link Transfermarkt page
- [x] **AI Matching Algorithm**: 
  - Analyzes player stats from Transfermarkt
  - Compares against league benchmarks (production score, market value, age, etc.)
  - Calculates fit score and level assessment for each opportunity
- [x] **Match Scores Display**:
  - Opportunity cards show match score badges (0-100)
  - Dedicated "Match Scores" page for players with detailed breakdown
  - Color-coded fit labels (Excellent/Strong/Possible/Borderline/Weak)
- [x] **League Selection for Opportunities**:
  - 15 leagues available: CPL, USL Championship, USL League One, Challenger Pro League, MLS, Premier League, La Liga, Bundesliga, Serie A, Ligue 1, League One, League Two, National League, Semi-Professional, Amateur
- [x] **Admin Benchmark Management**:
  - Benchmark status page shows if data exists
  - Generate benchmark button (scrapes Transfermarkt - takes 5-10 min)
  - Data includes player stats from CPL, USL Championship, USL League One, Challenger Pro League

### Phase 5 - Federation User Type (Completed - Dec 2025)
- [x] **Federation Registration**: New role option in registration flow
- [x] **Federation Dashboard**: 
  - Overview with stats (recommended players, scouting list, teams)
  - Pending approval notice
  - Country setup notification
- [x] **Federation Profile**: Name, country selection (filters recommended players), logo, description
- [x] **Player Search**: Filter by nationality, position, level, age range, name
- [x] **Recommended Players**: Auto-filters players matching federation's country
- [x] **Scouting List**: Save/track players of interest (favorites system)
- [x] **Team Groups Management**:
  - Create custom teams (Senior, U23, U20, U17, U15, etc.)
  - Create default teams with one click
  - Add/remove players from teams
  - View team rosters
- [x] **Player Detail View**: Full profile with "Add to Scouting" and "Add to Team" actions
- [x] **Match Archive & Calendar**: View player's past matches and upcoming fixtures
- [x] **Admin Federation Management**: Approve/revoke federations, view all federations
- [x] **Admin Stats Update**: Federation count shown on dashboard

### Phase 6 - Player Match Archive & Calendar (Completed - Dec 2025)
- [x] **Match Archive UI**: New section on player profile page
- [x] **Add Match Dialog**: Form to add full game video links with:
  - Video link (YouTube/Vimeo)
  - Match date
  - Opponent name
  - Competition level (Professional, Semi-Professional, Amateur, University/College, Youth Academy, National Team, Friendly/Exhibition)
  - Position played
  - Description/notes
- [x] **Match List**: Display all archived matches with WATCH and DELETE actions
- [x] **Public View**: Clubs and federations can view player match archive
- [x] **Match Calendar UI**: New section for upcoming matches
- [x] **Add Upcoming Match Dialog**: Form with:
  - Match date (required)
  - Kick-off time
  - Opponent (required)
  - Competition / League
  - Stadium
  - Location / City
- [x] **Calendar List**: Display upcoming matches with delete action
- [x] **Live Scouting**: Scouts can view player's upcoming games to plan visits
- [x] **Second Nationality Field**: Players can add a second nationality to be scouted by multiple federations

### Phase 7 - AI Video Analysis (Completed - Dec 2025)
- [x] **AI Video Analysis Page**: Dedicated page for players to analyze highlight videos
- [x] **Google Gemini Integration**: Uses Gemini AI for video understanding
- [x] **Automatic Analysis**: Triggers when player updates highlight video URL
- [x] **Comprehensive Metrics**:
  - Video Quality: Resolution, lighting, stability, clarity, audio
  - Player Assessment: Position detection, confidence level, playing style
  - Technical Skills: Ball control, passing, shooting, dribbling, first touch, heading
  - Physical Attributes: Pace, strength, stamina, agility
  - Tactical Awareness: Positioning, decision making, work rate
  - Key Moments: Goals, assists, skills, tackles with timestamps
  - Strengths & Areas for Improvement
  - Scout Summary & Similar Player Style
  - Recommended Level (Amateur/Semi-Pro/Professional/Elite)
- [x] **Analysis UI**: Beautiful results display with scores, badges, and progress bars
- [x] **Re-analyze Option**: Players can re-run analysis anytime
- [x] **Public Access**: Clubs and federations can view player video analysis
- [x] **Background Processing**: Analysis runs asynchronously with status polling

### Phase 8 - Video Upload Feature (Completed - Dec 2025)
- [x] **Direct Video Upload**: Upload videos directly instead of relying on YouTube/Vimeo URLs
- [x] **Player Upload**: Players can upload their own highlight videos
- [x] **Club/Federation Scout Upload**: Clubs and federations can upload and analyze player videos
- [x] **Scout Video Analysis Page**: Dedicated page for clubs/federations to manage uploaded analyses
- [x] **Upload Progress**: Real-time upload progress indicator
- [x] **File Validation**: Supports MP4, WebM, MOV, AVI (Max 100MB)
- [x] **Analysis History**: View all past uploaded video analyses
- [x] **Delete Functionality**: Remove uploaded analyses and video files
- [x] **Static File Serving**: Videos stored and served from backend

### Phase 9 - Masterclass Feature (Completed - March 2026)
- [x] **Masterclass Home Page**: Landing page with 5 categories, featured content, search functionality
- [x] **Categories**: Medical Recovery, Pro Masterclasses, College Tips, Fitness & Conditioning, Mental Performance
- [x] **Subcategories**: Each category has specialized topics (e.g., ACL Recovery, Goalkeeper skills, etc.)
- [x] **Difficulty Levels**: Beginner, Intermediate, Advanced with color-coded badges
- [x] **Masterclass Detail Page**: 
  - YouTube/Vimeo video embedding
  - Markdown content rendering
  - Author info with credentials
  - Duration, views, comments count
  - Tags display
- [x] **Bookmark System**: Players can save masterclasses for later viewing
- [x] **Saved Masterclasses Page**: View all bookmarked content
- [x] **Category Browsing**: Filter masterclasses by category, subcategory, and difficulty
- [x] **Search**: Search masterclasses by title, description, tags, or author
- [x] **Comments System**: Players can add comments/questions to masterclasses
- [x] **Admin Masterclass Management**:
  - Create new masterclasses with full form (title, description, category, subcategory, difficulty, duration, video URL, content, author info, tags)
  - Edit existing masterclasses
  - Delete masterclasses (also removes related bookmarks and comments)
  - Toggle featured status (featured items shown prominently on home page)
  - View all masterclasses including unpublished

### Phase 10 - Agent & Specialist User Types (Completed - March 2026)
- [x] **Agent Registration**: New user role with dedicated portal
- [x] **Specialist Registration**: New user role for physiotherapists, nutritionists, trainers, etc.
- [x] **Agent Profile Management**:
  - Agency name, license number, FIFA registration
  - Country, contact info, bio
  - Specializations (Youth Players, Professional Players, International Transfers, etc.)
  - Years experience, players represented, successful transfers
  - Website and LinkedIn links
- [x] **Specialist Profile Management**:
  - Specialist type (Physical Trainer, Physiotherapist, Nutritionist, Sports Psychologist, etc.)
  - Certifications (FIFA Diploma, UEFA Pro License, NSCA-CSCS, etc.)
  - Services offered (custom list)
  - Languages, availability, hourly rate
  - Current club affiliation
- [x] **Agent Features**:
  - Search players with filters (name, position, nationality, level)
  - Watchlist to track interesting players
  - View all club opportunities
  - Dashboard with stats (watchlist count, opportunities)
  - Player detail page with full profile
  - **Chat Request**: Request to connect with players
- [x] **Specialist Features**:
  - Search players with filters
  - Client list to track players
  - Dashboard with stats (clients, specialization)
  - Player detail page with physical/performance data
  - **Chat Request**: Offer services to players
- [x] **Admin Management**:
  - Agents page with approve/verify controls
  - Specialists page with approve/verify controls
  - Updated dashboard stats showing agents and specialists counts
  - Chat Requests page shows requester type badges (Club/Agent/Specialist)
- [x] **Chat/Video Access**: Both roles can use chat and video features

## Architecture

### Backend
- **Framework**: FastAPI with Motor (async MongoDB)
- **Auth**: JWT with bcrypt password hashing
- **Real-time**: Socket.IO (python-socketio)
- **Database**: MongoDB
- **Matching**: pandas, numpy, scikit-learn for player analysis

### Frontend  
- **Framework**: React with React Router
- **Styling**: Tailwind CSS + Shadcn UI components
- **Real-time**: socket.io-client + simple-peer (WebRTC)

### Key Files
- `/app/backend/server.py` - Main API endpoints
- `/app/backend/player_matching.py` - AI matching algorithm
- `/app/backend/chat_video_manager.py` - Chat/video session management
- `/app/frontend/src/lib/api.js` - API client functions

## Database Collections
- `users` - Authentication data
- `players` - Player profiles (includes transfermarkt_url, nationality_1/2/3)
- `clubs` - Club profiles
- `federations` - Federation profiles (name, country, approved status)
- `agents` - Agent profiles (agency, license, specializations)
- `specialists` - Specialist profiles (type, certifications, services)
- `opportunities` - Job postings (includes league_level)
- `applications` - Player applications
- `favorites` - Club's favorite players
- `federation_favorites` - Federation's scouting list
- `federation_teams` - Federation team groups (Senior, U23, etc.)
- `federation_team_players` - Players assigned to federation teams
- `agent_favorites` - Agent's player watchlist
- `specialist_favorites` - Specialist's client list
- `match_archive` - Player's past match videos
- `match_calendar` - Player's upcoming matches
- `chat_rooms` - Chat room data
- `chat_requests` - Chat request records
- `notifications` - User notifications
- `benchmark_data` - AI matching benchmark data
- `masterclasses` - Educational content with categories, video URLs, markdown content
- `masterclass_bookmarks` - User bookmarked masterclasses
- `masterclass_comments` - Comments on masterclasses
- `uploaded_video_analyses` - Video upload analysis records

## API Endpoints

### Player Matching
- `GET /api/available-leagues` - List of leagues for matching
- `GET /api/player/match-scores` - Get match scores for all opportunities
- `GET /api/player/match-score/{opportunity_id}` - Get match score for specific opportunity
- `GET /api/admin/benchmark-status` - Check benchmark data status
- `POST /api/admin/generate-benchmark` - Generate benchmark data (admin only)

### Federation Endpoints
- `GET /api/federation/profile` - Get federation profile
- `PUT /api/federation/profile` - Update federation profile
- `GET /api/federation/players` - Search players with filters
- `GET /api/federation/recommended-players` - Get players matching federation country
- `GET/POST/DELETE /api/federation/favorites` - Scouting list management
- `GET/POST/DELETE /api/federation/teams` - Team groups management
- `GET/POST/DELETE /api/federation/teams/{id}/players` - Team roster management
- `GET /api/admin/federations` - List all federations (admin)
- `PUT /api/admin/federations/{id}/approve` - Approve/revoke federation (admin)

### Match Archive & Calendar
- `GET/POST/DELETE /api/player/match-archive` - Player's match archive
- `GET/POST/DELETE /api/player/match-calendar` - Player's upcoming matches
- `GET /api/players/{id}/match-archive` - Public view (clubs/federations)
- `GET /api/players/{id}/match-calendar` - Public view (clubs/federations)

### Masterclass Endpoints
- `GET /api/masterclass/categories` - Get all categories and subcategories
- `GET /api/masterclass` - Get published masterclasses (with filters: category, subcategory, difficulty, search, featured)
- `GET /api/masterclass/{id}` - Get single masterclass detail
- `POST /api/masterclass/{id}/bookmark` - Bookmark a masterclass (player only)
- `DELETE /api/masterclass/{id}/bookmark` - Remove bookmark
- `GET /api/masterclass/user/bookmarks` - Get user's bookmarked masterclasses
- `GET /api/masterclass/{id}/comments` - Get comments for a masterclass
- `POST /api/masterclass/{id}/comments` - Add comment (authenticated users)
- `DELETE /api/masterclass/{id}/comments/{comment_id}` - Delete own comment
- `GET /api/admin/masterclass` - Get all masterclasses (admin only)
- `POST /api/admin/masterclass` - Create masterclass (admin only)
- `PUT /api/admin/masterclass/{id}` - Update masterclass (admin only)
- `DELETE /api/admin/masterclass/{id}` - Delete masterclass (admin only)

## Credentials
- **Admin**: admin@soccermatch.com / admin123
- **Test Federation**: test.federation@soccermatch.com / test123
- **Test Agent**: test.agent@soccermatch.com / test123
- **Test Specialist**: test.specialist@soccermatch.com / test123
- **Demo Player**: demo.player@soccermatch.com / demo123

### Phase 11 - Progressive Web App (PWA) (Completed - March 2026)
- [x] **PWA Configuration**:
  - manifest.json with app name, icons, colors, shortcuts
  - Service worker for offline caching and push notifications
  - App icons (72x72 to 512x512 PNG)
- [x] **Mobile-Optimized UI**:
  - Mobile header with hamburger menu
  - Bottom navigation bar for all user roles
  - Safe area handling for notched devices
  - Touch-optimized button sizes (44px minimum)
  - Smooth scrolling and pull-to-refresh support
- [x] **PWA Features**:
  - "Add to Home Screen" install prompt
  - Offline indicator banner
  - Network-first caching with fallback
  - Push notification support (ready for backend integration)
- [x] **Mobile Layouts Updated**:
  - PlayerLayout with bottom nav
  - ClubLayout with bottom nav
  - FederationLayout with bottom nav
  - AgentLayout with bottom nav
  - SpecialistLayout with bottom nav
  - AdminLayout with bottom nav
- [x] **PWA Context**:
  - Install prompt management
  - Online/offline status tracking
  - Service worker registration

## Future/Backlog Tasks (P1)
- [ ] Add UI for third nationality in player profile
- [ ] Clean up demo test data (duplicate Real Madrid matches)

## Future/Backlog Tasks (P2)
- [ ] Email notifications for chat requests and applications
- [ ] Mobile app version
- [ ] Analytics dashboard for clubs
- [ ] Multi-language support
- [ ] Automated benchmark data refresh (cron job)
- [ ] Cloud storage for video uploads (AWS S3/GCS)
