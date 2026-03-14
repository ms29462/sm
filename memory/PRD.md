# SoccerMatch - Product Requirements Document

## Original Problem Statement
Build a web platform called "SoccerMatch" that connects football (soccer) players with clubs, agents and universities around the world.

### User Types
- **Players**: Create profiles, upload videos/CV, browse and apply to opportunities
- **Clubs**: Create profiles, post opportunities, view player applications, save favorites
- **Federations**: National team scouting, manage team groups (Senior, U23, U20, etc.), track eligible players
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
- **Note**: YouTube video download may fail due to platform restrictions. Direct video URLs (.mp4) work best.

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
- `opportunities` - Job postings (includes league_level)
- `applications` - Player applications
- `favorites` - Club's favorite players
- `federation_favorites` - Federation's scouting list
- `federation_teams` - Federation team groups (Senior, U23, etc.)
- `federation_team_players` - Players assigned to federation teams
- `match_archive` - Player's past match videos
- `match_calendar` - Player's upcoming matches
- `chat_rooms` - Chat room data
- `chat_requests` - Chat request records
- `notifications` - User notifications
- `benchmark_data` - AI matching benchmark data

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

## Credentials
- **Admin**: admin@soccermatch.com / admin123
- **Test Federation**: test.federation@soccermatch.com / test123

## Future/Backlog Tasks (P1)
- [ ] Clean up demo test data (duplicate Real Madrid matches)

## Future/Backlog Tasks (P2)
- [ ] Email notifications for chat requests and applications
- [ ] Mobile app version
- [ ] Analytics dashboard for clubs
- [ ] Multi-language support
- [ ] Automated benchmark data refresh (cron job)
