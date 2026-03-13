# SoccerMatch - Product Requirements Document

## Original Problem Statement
Build a web platform called "SoccerMatch" that connects football (soccer) players with clubs, agents and universities around the world.

### User Types
- **Players**: Create profiles, upload videos/CV, browse and apply to opportunities
- **Clubs**: Create profiles, post opportunities, view player applications, save favorites
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
  - `strip_player_private_info()` removes email from player responses
  - `strip_club_private_info()` removes email from club responses
  - Admin can still see all user data
- [x] **Chat Request System**:
  - Club requests chat → Player & Admin notified
  - Player accepts → Admin creates chat room
  - Player rejects → Admin & Club notified
  - New endpoints: POST /api/chat-requests, GET /api/chat-requests/my, PUT /api/chat-requests/{id}/respond
  - Admin endpoint: GET /api/admin/chat-requests
- [x] **UI Updates**:
  - PlayerDetailView: Removed email display, added "Request Interview Chat" button
  - Player sidebar: Added "Chat Requests" navigation
  - Admin sidebar: Added "Chat Requests" navigation
  - New components: ChatRequests.js (player), AdminChatRequests.js (admin)

## Architecture

### Backend
- **Framework**: FastAPI with Motor (async MongoDB)
- **Auth**: JWT with bcrypt password hashing
- **Real-time**: Socket.IO (python-socketio)
- **Database**: MongoDB

### Frontend  
- **Framework**: React with React Router
- **Styling**: Tailwind CSS + Shadcn UI components
- **Real-time**: socket.io-client + simple-peer (WebRTC)

### Key Files
- `/app/backend/server.py` - Main API endpoints
- `/app/backend/chat_video_manager.py` - Chat/video session management
- `/app/backend/chat_requests.py` - Chat request models
- `/app/frontend/src/lib/api.js` - API client functions

## Database Collections
- `users` - Authentication data
- `players` - Player profiles
- `clubs` - Club profiles
- `opportunities` - Job postings
- `applications` - Player applications
- `favorites` - Club's favorite players
- `chat_rooms` - Chat room data
- `chat_requests` - Chat request records
- `notifications` - User notifications

## Credentials
- **Admin**: admin@soccermatch.com / admin123

## Future/Backlog Tasks (P2)
- [ ] Advanced matching algorithm (AI-based recommendations)
- [ ] Email notifications
- [ ] Mobile app version
- [ ] Analytics dashboard for clubs
- [ ] Multi-language support
