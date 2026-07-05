import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const api = {
  // Auth
  register: (data) => axios.post(`${API}/auth/register`, data),
  login: (data) => axios.post(`${API}/auth/login`, data),
  adminLogin: (data) => axios.post(`${API}/auth/admin/login`, data),

  // Player
  getPlayerProfile: () => axios.get(`${API}/player/profile`, { headers: getAuthHeaders() }),
  updatePlayerProfile: (data) => axios.put(`${API}/player/profile`, data, { headers: getAuthHeaders() }),
  getOpportunities: () => axios.get(`${API}/opportunities`, { headers: getAuthHeaders() }),
  getRecommendedOpportunities: () => axios.get(`${API}/opportunities/recommended`, { headers: getAuthHeaders() }),
  createApplication: (data) => axios.post(`${API}/applications`, data, { headers: getAuthHeaders() }),
  getMyApplications: () => axios.get(`${API}/applications/my`, { headers: getAuthHeaders() }),

  // Club
  getClubProfile: () => axios.get(`${API}/club/profile`, { headers: getAuthHeaders() }),
  updateClubProfile: (data) => axios.put(`${API}/club/profile`, data, { headers: getAuthHeaders() }),
  createOpportunity: (data) => axios.post(`${API}/opportunities`, data, { headers: getAuthHeaders() }),
  getClubOpportunities: () => axios.get(`${API}/club/opportunities`, { headers: getAuthHeaders() }),
  deleteOpportunity: (id) => axios.delete(`${API}/opportunities/${id}`, { headers: getAuthHeaders() }),
  getAllColleges: () => axios.get(`${API}/admin/colleges`, { headers: getAuthHeaders() }),
  approveCollege: (userId, data) => axios.put(`${API}/admin/colleges/${userId}/approve`, data, { headers: getAuthHeaders() }),
  updateOpportunity: (id, data) => axios.put(`${API}/opportunities/${id}`, data, { headers: getAuthHeaders() }),
  updateOpportunityStatus: (id, status) => axios.put(`${API}/opportunities/${id}/status`, { status }, { headers: getAuthHeaders() }),
  getClubApplications: () => axios.get(`${API}/club/applications`, { headers: getAuthHeaders() }),
  updateApplicationStatus: (id, status) => axios.put(`${API}/applications/${id}/status`, { status }, { headers: getAuthHeaders() }),
  getPlayers: (filters) => axios.get(`${API}/players`, { params: filters, headers: getAuthHeaders() }),
  getPlayerDetail: (playerId) => axios.get(`${API}/players/${playerId}`, { headers: getAuthHeaders() }),
  getRecommendedPlayers: () => axios.get(`${API}/players/recommended-list`, { headers: getAuthHeaders() }),
  addFavorite: (playerId) => axios.post(`${API}/favorites`, { player_id: playerId }, { headers: getAuthHeaders() }),
  getFavorites: () => axios.get(`${API}/favorites`, { headers: getAuthHeaders() }),
  removeFavorite: (playerId) => axios.delete(`${API}/favorites/${playerId}`, { headers: getAuthHeaders() }),

  // Admin
  getAdminStats: () => axios.get(`${API}/admin/stats`, { headers: getAuthHeaders() }),
  getAllPlayers: () => axios.get(`${API}/admin/players`, { headers: getAuthHeaders() }),
  getAllClubs: () => axios.get(`${API}/admin/clubs`, { headers: getAuthHeaders() }),
  approvePlayer: (userId, approved) => axios.put(`${API}/admin/players/${userId}/approve`, { user_id: userId, approved }, { headers: getAuthHeaders() }),
  verifyPlayer: (userId, verified) => axios.put(`${API}/admin/players/${userId}/verify?verified=${verified}`, {}, { headers: getAuthHeaders() }),
  approveClub: (userId, approved) => axios.put(`${API}/admin/clubs/${userId}/approve`, { user_id: userId, approved }, { headers: getAuthHeaders() }),
  deleteUser: (userId) => axios.delete(`${API}/admin/users/${userId}`, { headers: getAuthHeaders() }),
  getAllOpportunities: () => axios.get(`${API}/admin/opportunities`, { headers: getAuthHeaders() }),
  deleteOpportunityAdmin: (id) => axios.delete(`${API}/admin/opportunities/${id}`, { headers: getAuthHeaders() }),

  // Chat & Video - Admin
  createChatRoom: (playerId, clubId) => axios.post(`${API}/admin/chat/create?player_id=${playerId}&club_id=${clubId}`, {}, { headers: getAuthHeaders() }),
  getAdminChatRooms: () => axios.get(`${API}/admin/chat/rooms`, { headers: getAuthHeaders() }),
  getChatRoomMessages: (roomId) => axios.get(`${API}/admin/chat/rooms/${roomId}/messages`, { headers: getAuthHeaders() }),
  deleteChatRoom: (roomId) => axios.delete(`${API}/admin/chat/rooms/${roomId}`, { headers: getAuthHeaders() }),
  createVideoSession: (playerId, clubId) => axios.post(`${API}/admin/video/create?player_id=${playerId}&club_id=${clubId}`, {}, { headers: getAuthHeaders() }),
  getAdminVideoSessions: () => axios.get(`${API}/admin/video/sessions`, { headers: getAuthHeaders() }),
  getVideoSessionDetails: (sessionId) => axios.get(`${API}/admin/video/sessions/${sessionId}`, { headers: getAuthHeaders() }),
  deleteVideoSession: (sessionId) => axios.delete(`${API}/admin/video/sessions/${sessionId}`, { headers: getAuthHeaders() }),

  // Chat & Video - Player/Club
  getMyChats: () => axios.get(`${API}/my-chats`, { headers: getAuthHeaders() }),
  getMyVideos: () => axios.get(`${API}/my-videos`, { headers: getAuthHeaders() }),

  // Chat Requests
  requestChat: (playerId, message) => axios.post(`${API}/chat-requests`, { player_id: playerId, message }, { headers: getAuthHeaders() }),
  getMyChatRequests: () => axios.get(`${API}/chat-requests/my`, { headers: getAuthHeaders() }),
  respondToChatRequest: (requestId, status) => axios.put(`${API}/chat-requests/${requestId}/respond`, { status }, { headers: getAuthHeaders() }),
  getAdminChatRequests: () => axios.get(`${API}/admin/chat-requests`, { headers: getAuthHeaders() }),

  // Notifications
  getNotifications: () => axios.get(`${API}/notifications`, { headers: getAuthHeaders() }),
  markNotificationRead: (notificationId) => axios.put(`${API}/notifications/${notificationId}/read`, {}, { headers: getAuthHeaders() }),
  getUnreadCount: () => axios.get(`${API}/notifications/unread-count`, { headers: getAuthHeaders() }),

  // Player Matching
  getAvailableLeagues: () => axios.get(`${API}/available-leagues`, { headers: getAuthHeaders() }),
  getPlayerMatchScores: () => axios.get(`${API}/player/match-scores`, { headers: getAuthHeaders() }),
  getMatchScore: (opportunityId) => axios.get(`${API}/player/match-score/${opportunityId}`, { headers: getAuthHeaders() }),
  
  // Admin - Benchmark
  generateBenchmark: () => axios.post(`${API}/admin/generate-benchmark`, {}, { headers: getAuthHeaders() }),
  getBenchmarkStatus: () => axios.get(`${API}/admin/benchmark-status`, { headers: getAuthHeaders() }),
  getBenchmarkGenerationStatus: () => axios.get(`${API}/admin/benchmark-generation-status`, { headers: getAuthHeaders() }),

  // Admin - Federations
  getAllFederations: () => axios.get(`${API}/admin/federations`, { headers: getAuthHeaders() }),
  approveFederation: (userId, approved) => axios.put(`${API}/admin/federations/${userId}/approve`, { user_id: userId, approved }, { headers: getAuthHeaders() }),

  // Federation
  getFederationProfile: () => axios.get(`${API}/federation/profile`, { headers: getAuthHeaders() }),
  updateFederationProfile: (data) => axios.put(`${API}/federation/profile`, data, { headers: getAuthHeaders() }),
  getFederationPlayers: (filters) => axios.get(`${API}/federation/players`, { params: filters, headers: getAuthHeaders() }),
  getRecommendedPlayersForFederation: () => axios.get(`${API}/federation/recommended-players`, { headers: getAuthHeaders() }),
  addFederationFavorite: (playerId) => axios.post(`${API}/federation/favorites`, { player_id: playerId }, { headers: getAuthHeaders() }),
  getFederationFavorites: () => axios.get(`${API}/federation/favorites`, { headers: getAuthHeaders() }),
  removeFederationFavorite: (playerId) => axios.delete(`${API}/federation/favorites/${playerId}`, { headers: getAuthHeaders() }),
  
  // Federation Teams
  getFederationTeams: () => axios.get(`${API}/federation/teams`, { headers: getAuthHeaders() }),
  createFederationTeam: (data) => axios.post(`${API}/federation/teams`, data, { headers: getAuthHeaders() }),
  deleteFederationTeam: (teamId) => axios.delete(`${API}/federation/teams/${teamId}`, { headers: getAuthHeaders() }),
  getFederationTeamPlayers: (teamId) => axios.get(`${API}/federation/teams/${teamId}/players`, { headers: getAuthHeaders() }),
  addPlayerToFederationTeam: (teamId, playerId, notes) => axios.post(`${API}/federation/teams/${teamId}/players`, { player_id: playerId, notes }, { headers: getAuthHeaders() }),
  removePlayerFromFederationTeam: (teamId, playerId) => axios.delete(`${API}/federation/teams/${teamId}/players/${playerId}`, { headers: getAuthHeaders() }),

  // Match Archive (Player)
  getPlayerMatchArchive: () => axios.get(`${API}/player/match-archive`, { headers: getAuthHeaders() }),
  addMatchToArchive: (data) => axios.post(`${API}/player/match-archive`, data, { headers: getAuthHeaders() }),
  deleteMatchFromArchive: (matchId) => axios.delete(`${API}/player/match-archive/${matchId}`, { headers: getAuthHeaders() }),
  getPlayerMatchArchivePublic: (playerId) => axios.get(`${API}/players/${playerId}/match-archive`, { headers: getAuthHeaders() }),

  // Match Calendar (Player)
  getPlayerMatchCalendar: () => axios.get(`${API}/player/match-calendar`, { headers: getAuthHeaders() }),
  addMatchToCalendar: (data) => axios.post(`${API}/player/match-calendar`, data, { headers: getAuthHeaders() }),
  deleteMatchFromCalendar: (matchId) => axios.delete(`${API}/player/match-calendar/${matchId}`, { headers: getAuthHeaders() }),
  getPlayerMatchCalendarPublic: (playerId) => axios.get(`${API}/players/${playerId}/match-calendar`, { headers: getAuthHeaders() }),

  
  // Masterclass
  getMasterclassCategories: () => axios.get(`${API}/masterclass/categories`),
  getMasterclasses: (params) => axios.get(`${API}/masterclass`, { params }),
  getMasterclass: (id) => axios.get(`${API}/masterclass/${id}`),
  getUserBookmarks: () => axios.get(`${API}/masterclass/user/bookmarks`, { headers: getAuthHeaders() }),
  bookmarkMasterclass: (id) => axios.post(`${API}/masterclass/${id}/bookmark`, {}, { headers: getAuthHeaders() }),
  removeBookmark: (id) => axios.delete(`${API}/masterclass/${id}/bookmark`, { headers: getAuthHeaders() }),
  getMasterclassComments: (id) => axios.get(`${API}/masterclass/${id}/comments`),
  addMasterclassComment: (id, content) => axios.post(`${API}/masterclass/${id}/comments`, { content }, { headers: getAuthHeaders() }),
  deleteMasterclassComment: (masterclassId, commentId) => axios.delete(`${API}/masterclass/${masterclassId}/comments/${commentId}`, { headers: getAuthHeaders() }),

  // Admin Masterclass
  getAllMasterclassesAdmin: () => axios.get(`${API}/admin/masterclass`, { headers: getAuthHeaders() }),
  createMasterclass: (data) => axios.post(`${API}/admin/masterclass`, data, { headers: getAuthHeaders() }),
  updateMasterclass: (id, data) => axios.put(`${API}/admin/masterclass/${id}`, data, { headers: getAuthHeaders() }),
  deleteMasterclass: (id) => axios.delete(`${API}/admin/masterclass/${id}`, { headers: getAuthHeaders() }),

  // College
  getCollegeProfile: () => axios.get(`${API}/college/profile`, { headers: getAuthHeaders() }),
  updateCollegeProfile: (data) => axios.put(`${API}/college/profile`, data, { headers: getAuthHeaders() }),
  getCollegePlayers: (filters) => axios.get(`${API}/college/players`, { params: filters, headers: getAuthHeaders() }),

  // Agent
  getAgentProfile: () => axios.get(`${API}/agent/profile`, { headers: getAuthHeaders() }),
  updateAgentProfile: (data) => axios.put(`${API}/agent/profile`, data, { headers: getAuthHeaders() }),
  getAgentPlayers: (filters) => axios.get(`${API}/agent/players`, { params: filters, headers: getAuthHeaders() }),
  getAgentPlayerDetail: (playerId) => axios.get(`${API}/agent/player/${playerId}`, { headers: getAuthHeaders() }),
  addAgentFavorite: (playerId) => axios.post(`${API}/agent/favorites`, { player_id: playerId }, { headers: getAuthHeaders() }),
  getAgentFavorites: () => axios.get(`${API}/agent/favorites`, { headers: getAuthHeaders() }),
  removeAgentFavorite: (playerId) => axios.delete(`${API}/agent/favorites/${playerId}`, { headers: getAuthHeaders() }),
  getAgentOpportunities: () => axios.get(`${API}/agent/opportunities`, { headers: getAuthHeaders() }),

  // Specialist
  getSpecialistProfile: () => axios.get(`${API}/specialist/profile`, { headers: getAuthHeaders() }),
  updateSpecialistProfile: (data) => axios.put(`${API}/specialist/profile`, data, { headers: getAuthHeaders() }),
  getSpecialistPlayers: (filters) => axios.get(`${API}/specialist/players`, { params: filters, headers: getAuthHeaders() }),
  getSpecialistPlayerDetail: (playerId) => axios.get(`${API}/specialist/player/${playerId}`, { headers: getAuthHeaders() }),
  addSpecialistFavorite: (playerId) => axios.post(`${API}/specialist/favorites`, { player_id: playerId }, { headers: getAuthHeaders() }),
  getSpecialistFavorites: () => axios.get(`${API}/specialist/favorites`, { headers: getAuthHeaders() }),
  removeSpecialistFavorite: (playerId) => axios.delete(`${API}/specialist/favorites/${playerId}`, { headers: getAuthHeaders() }),
  getSpecialistTypes: () => axios.get(`${API}/specialist/types`),

  // Admin Agents
  getAllAgents: () => axios.get(`${API}/admin/agents`, { headers: getAuthHeaders() }),
  approveAgent: (userId, approved) => axios.put(`${API}/admin/agents/${userId}/approve`, { user_id: userId, approved }, { headers: getAuthHeaders() }),
  verifyAgent: (userId, verified) => axios.put(`${API}/admin/agents/${userId}/verify?verified=${verified}`, {}, { headers: getAuthHeaders() }),

  // Admin Specialists
  getAllSpecialists: () => axios.get(`${API}/admin/specialists`, { headers: getAuthHeaders() }),
  approveSpecialist: (userId, approved) => axios.put(`${API}/admin/specialists/${userId}/approve`, { user_id: userId, approved }, { headers: getAuthHeaders() }),
  verifySpecialist: (userId, verified) => axios.put(`${API}/admin/specialists/${userId}/verify?verified=${verified}`, {}, { headers: getAuthHeaders() }),



  // Scouting Notes
  createScoutingNote: (data) => axios.post(`${API}/scouting/notes`, data, { headers: getAuthHeaders() }),
  getScoutingNotes: (playerId) => axios.get(`${API}/scouting/notes/${playerId}`, { headers: getAuthHeaders() }),
  updateScoutingNote: (noteId, data) => axios.put(`${API}/scouting/notes/${noteId}`, data, { headers: getAuthHeaders() }),
  deleteScoutingNote: (noteId) => axios.delete(`${API}/scouting/notes/${noteId}`, { headers: getAuthHeaders() }),

  // Post Mortems
  createPostMortem: (data) => axios.post(`${API}/scouting/post-mortems`, data, { headers: getAuthHeaders() }),
  getPostMortems: (playerId) => axios.get(`${API}/scouting/post-mortems/${playerId}`, { headers: getAuthHeaders() }),
  deletePostMortem: (pmId) => axios.delete(`${API}/scouting/post-mortems/${pmId}`, { headers: getAuthHeaders() }),
  updatePostMortem: (pmId, data) => axios.put(`${API}/scouting/post-mortems/${pmId}`, data, { headers: getAuthHeaders() }),

  // Player Tracking
  trackPlayer: (playerId) => axios.post(`${API}/scouting/track/${playerId}`, {}, { headers: getAuthHeaders() }),
  untrackPlayer: (playerId) => axios.delete(`${API}/scouting/track/${playerId}`, { headers: getAuthHeaders() }),
  getTrackedPlayers: () => axios.get(`${API}/scouting/tracked`, { headers: getAuthHeaders() }),

  // Scouting Groups
  createScoutingGroup: (data) => axios.post(`${API}/scouting/groups`, data, { headers: getAuthHeaders() }),
  getScoutingGroups: () => axios.get(`${API}/scouting/groups`, { headers: getAuthHeaders() }),
  joinScoutingGroup: (token) => axios.get(`${API}/scouting/groups/join/${token}`, { headers: getAuthHeaders() }),
  deleteScoutingGroup: (groupId) => axios.delete(`${API}/scouting/groups/${groupId}`, { headers: getAuthHeaders() }),
  groupTrackPlayer: (groupId, playerId) => axios.post(`${API}/scouting/groups/${groupId}/track/${playerId}`, {}, { headers: getAuthHeaders() }),
  getGroupMessages: (groupId) => axios.get(`${API}/scouting/groups/${groupId}/messages`, { headers: getAuthHeaders() }),
  sendGroupMessage: (groupId, data) => axios.post(`${API}/scouting/groups/${groupId}/messages`, data, { headers: getAuthHeaders() }),

  // Recruitment Pipeline
  getPipeline: () => axios.get(`${API}/pipeline`, { headers: getAuthHeaders() }),
  addToPipeline: (data) => axios.post(`${API}/pipeline`, data, { headers: getAuthHeaders() }),
  updatePipelinePlayer: (id, data) => axios.put(`${API}/pipeline/${id}`, data, { headers: getAuthHeaders() }),
  removeFromPipeline: (id) => axios.delete(`${API}/pipeline/${id}`, { headers: getAuthHeaders() }),
  addPipelineNote: (id, data) => axios.post(`${API}/pipeline/${id}/notes`, data, { headers: getAuthHeaders() }),
  getPipelineStages: () => axios.get(`${API}/pipeline/stages`, { headers: getAuthHeaders() }),

  // Trial Invitations
  sendTrialInvitation: (data) => axios.post(`${API}/trial-invitation`, data, { headers: getAuthHeaders() }),
  getMyTrialInvitations: () => axios.get(`${API}/trial-invitations/my`, { headers: getAuthHeaders() }),
  respondToTrial: (id, data) => axios.put(`${API}/trial-invitations/${id}/respond`, data, { headers: getAuthHeaders() }),

  // Badge & Verification
  getPlayerVerificationAdmin: (userId) => axios.get(`${API}/admin/players/${userId}/verification`, { headers: getAuthHeaders() }),
  toggleVerification: (userId, data) => axios.put(`${API}/admin/players/${userId}/verify`, data, { headers: getAuthHeaders() }),
  updateBadge: (userId, data) => axios.put(`${API}/admin/players/${userId}/badges`, data, { headers: getAuthHeaders() }),
  updateQuality: (userId, data) => axios.put(`${API}/admin/players/${userId}/quality`, data, { headers: getAuthHeaders() }),
  addAdminNote: (userId, data) => axios.post(`${API}/admin/players/${userId}/notes`, data, { headers: getAuthHeaders() }),
  getMyVerification: () => axios.get(`${API}/player/verification`, { headers: getAuthHeaders() }),
  getPlayerVerification: (playerId) => axios.get(`${API}/players/${playerId}/verification`, { headers: getAuthHeaders() }),

  // News Feed
  getNewsFeed: () => axios.get(`${API}/news`, { headers: getAuthHeaders() }),
  getAdminNews: () => axios.get(`${API}/admin/news`, { headers: getAuthHeaders() }),
  createNewsPost: (data) => axios.post(`${API}/admin/news`, data, { headers: getAuthHeaders() }),
  deleteNewsPost: (id) => axios.delete(`${API}/admin/news/${id}`, { headers: getAuthHeaders() }),
  togglePinNews: (id) => axios.put(`${API}/admin/news/${id}/pin`, {}, { headers: getAuthHeaders() }),
  updateNewsPost: (id, data) => axios.put(`${API}/admin/news/${id}`, data, { headers: getAuthHeaders() }),
  uploadNewsImage: (formData) => axios.post(`${API}/admin/news/upload-image`, formData, { headers: { ...getAuthHeaders(), 'Content-Type': 'multipart/form-data' } }),

  // ============ PLAYER EVALUATION SYSTEM ============
  // Analyst Profile
  getAnalystProfile: () => axios.get(`${API}/analyst/profile`, { headers: getAuthHeaders() }),
  updateAnalystProfile: (data) => axios.put(`${API}/analyst/profile`, data, { headers: getAuthHeaders() }),
  getAnalystStats: () => axios.get(`${API}/analyst/stats`, { headers: getAuthHeaders() }),
  getAnalystEvaluations: () => axios.get(`${API}/analyst/evaluations`, { headers: getAuthHeaders() }),
  // Evaluation Metadata
  getArchetypes: () => axios.get(`${API}/evaluation/archetypes`, { headers: getAuthHeaders() }),
  getMetrics: () => axios.get(`${API}/evaluation/metrics`, { headers: getAuthHeaders() }),
  getPlayersForEvaluation: () => axios.get(`${API}/evaluation/players`, { headers: getAuthHeaders() }),
  // Evaluations CRUD
  createEvaluation: (data) => axios.post(`${API}/evaluation/create`, data, { headers: getAuthHeaders() }),
  getEvaluation: (id) => axios.get(`${API}/evaluation/${id}`, { headers: getAuthHeaders() }),
  updateEvaluation: (id, data) => axios.put(`${API}/evaluation/${id}`, data, { headers: getAuthHeaders() }),
  deleteEvaluation: (id) => axios.delete(`${API}/evaluation/${id}`, { headers: getAuthHeaders() }),
  exportEvaluationPDF: (id) => axios.get(`${API}/evaluation/${id}/export-pdf`, { headers: getAuthHeaders(), responseType: 'blob' }),
  // Player Evaluations (for all roles)
  getPlayerEvaluations: (playerId) => axios.get(`${API}/player/${playerId}/evaluations`, { headers: getAuthHeaders() }),
  getPlayerDashboard: (playerId) => axios.get(`${API}/player/${playerId}/dashboard`, { headers: getAuthHeaders() }),
  requestChatDeletion: (requestId) => axios.post(`${API}/chat-requests/${requestId}/deletion-request`, {}, { headers: getAuthHeaders() }),

  getProfileCompletion: () => axios.get(`${API}/player/completion`, { headers: getAuthHeaders() }),
  getMyPermissions: () => axios.get(`${API}/my-permissions`, { headers: getAuthHeaders() }),
  getMyCredits: () => axios.get(`${API}/player/credits`, { headers: getAuthHeaders() }),
  getCreditPacks: () => axios.get(`${API}/player/credits/packs`, { headers: getAuthHeaders() }),
  claimReward: (reward_type) => axios.post(`${API}/player/credits/claim-reward`, { reward_type }, { headers: getAuthHeaders() }),
  adminAdjustCredits: (data) => axios.post(`${API}/admin/credits/adjust`, data, { headers: getAuthHeaders() }),
  getAdminPlayerCredits: (userId) => axios.get(`${API}/admin/player-credits/${userId}`, { headers: getAuthHeaders() }),
  adminRefundCredits: (applicationId) => axios.post(`${API}/admin/credits/refund/${applicationId}`, {}, { headers: getAuthHeaders() }),
  createCheckout: (pack_id) => axios.post(`${API}/stripe/create-checkout`, { pack_id }, { headers: getAuthHeaders() }),
  createPremiumCheckout: () => axios.post(`${API}/stripe/create-premium-checkout`, {}, { headers: getAuthHeaders() }),
  getClubSubscriptionStatus: () => axios.get(`${API}/club/subscription-status`, { headers: getAuthHeaders() }),
  createClubCheckout: (plan_id) => axios.post(`${API}/stripe/create-club-checkout`, { plan_id }, { headers: getAuthHeaders() }),
  adminUpdateClubSubscription: (clubId, data) => axios.put(`${API}/admin/clubs/${clubId}/subscription`, data, { headers: getAuthHeaders() }),
  getAgentSubscriptionStatus: () => axios.get(`${API}/agent/subscription-status`, { headers: getAuthHeaders() }),
  createAgentCheckout: () => axios.post(`${API}/stripe/create-agent-checkout`, {}, { headers: getAuthHeaders() }),
  adminUpdateAgentSubscription: (agentId, data) => axios.put(`${API}/admin/agents/${agentId}/subscription`, data, { headers: getAuthHeaders() }),
  getCollegeSubscriptionStatus: () => axios.get(`${API}/college/subscription-status`, { headers: getAuthHeaders() }),
  createCollegeCheckout: () => axios.post(`${API}/stripe/create-college-checkout`, {}, { headers: getAuthHeaders() }),
  adminUpdateCollegeSubscription: (id, data) => axios.put(`${API}/admin/colleges/${id}/subscription`, data, { headers: getAuthHeaders() }),
  getSpecialistSubscriptionStatus: () => axios.get(`${API}/specialist/subscription-status`, { headers: getAuthHeaders() }),
  createSpecialistCheckout: () => axios.post(`${API}/stripe/create-specialist-checkout`, {}, { headers: getAuthHeaders() }),
  adminUpdateSpecialistSubscription: (id, data) => axios.put(`${API}/admin/specialists/${id}/subscription`, data, { headers: getAuthHeaders() }),
  adminDeleteChatRequest: (id) => axios.delete(`${API}/admin/chat-requests/${id}`, { headers: getAuthHeaders() }),
  createReport: (data) => axios.post(`${API}/reports`, data, { headers: getAuthHeaders() }),
  getAllReports: () => axios.get(`${API}/admin/reports`, { headers: getAuthHeaders() }),
  updateReport: (id, data) => axios.put(`${API}/admin/reports/${id}`, data, { headers: getAuthHeaders() }),
  updateAccountStatus: (userId, data) => axios.put(`${API}/admin/users/${userId}/account-status`, data, { headers: getAuthHeaders() }),
  requestAccountDeletion: (data) => axios.post(`${API}/account/request-deletion`, data, { headers: getAuthHeaders() }),
  getDeletionStatus: () => axios.get(`${API}/account/deletion-status`, { headers: getAuthHeaders() }),
  cancelDeletionRequest: () => axios.delete(`${API}/account/deletion-request`, { headers: getAuthHeaders() }),
  getAllDeletionRequests: () => axios.get(`${API}/admin/account-deletion-requests`, { headers: getAuthHeaders() }),
  approveDeletionRequest: (id) => axios.post(`${API}/admin/account-deletion-requests/${id}/approve`, {}, { headers: getAuthHeaders() }),
  dismissDeletionRequest: (id) => axios.post(`${API}/admin/account-deletion-requests/${id}/dismiss`, {}, { headers: getAuthHeaders() }),
  getFederationAccessStatus: () => axios.get(`${API}/federation/access-status`, { headers: getAuthHeaders() }),
  adminUpdateFederationAccess: (id, data) => axios.put(`${API}/admin/federations/${id}/access`, data, { headers: getAuthHeaders() }),
  getPlayerAnalytics: () => axios.get(`${API}/player/analytics`, { headers: getAuthHeaders() }),
  getOpportunityDetail: (id) => axios.get(`${API}/opportunities/${id}/detail`, { headers: getAuthHeaders() }),
  getOrgOpportunityAnalytics: () => axios.get(`${API}/club/opportunities/analytics`, { headers: getAuthHeaders() }),
  requestClubDeletion: (data) => axios.post(`${API}/club/request-deletion`, data, { headers: getAuthHeaders() }),
  getClubDeletionStatus: () => axios.get(`${API}/club/deletion-status`, { headers: getAuthHeaders() }),
  cancelClubDeletionRequest: () => axios.delete(`${API}/club/deletion-request`, { headers: getAuthHeaders() }),
  getMinorStatus: () => axios.get(`${API}/player/minor-status`, { headers: getAuthHeaders() }),
  adminUpdateParentalConsent: (playerId, data) => axios.put(`${API}/admin/players/${playerId}/parental-consent`, data, { headers: getAuthHeaders() }),
  sendVerificationEmail: () => axios.post(`${API}/player/send-verification-email`, {}, { headers: getAuthHeaders() }),
  getMySubscription: () => axios.get(`${API}/subscription/my`, { headers: getAuthHeaders() }),
  getSubscriptionPlans: () => axios.get(`${API}/subscription/plans`, { headers: getAuthHeaders() }),
  assignSubscription: (data) => axios.post(`${API}/subscription/assign`, data, { headers: getAuthHeaders() }),
  cancelSubscription: (data) => axios.post(`${API}/subscription/cancel`, data, { headers: getAuthHeaders() }),
  getAllSubscriptions: () => axios.get(`${API}/admin/subscriptions`, { headers: getAuthHeaders() }),
  getAdminOpportunities: () => axios.get(`${API}/admin/opportunities`, { headers: getAuthHeaders() }),
  updateAdminOpportunity: (id, data) => axios.put(`${API}/admin/opportunities/${id}`, data, { headers: getAuthHeaders() }),
  approveOpportunity: (id, data) => axios.post(`${API}/admin/opportunities/${id}/approve`, data, { headers: getAuthHeaders() }),
  rejectOpportunity: (id, data) => axios.post(`${API}/admin/opportunities/${id}/reject`, data, { headers: getAuthHeaders() }),
  requestOpportunityChanges: (id, data) => axios.post(`${API}/admin/opportunities/${id}/request-changes`, data, { headers: getAuthHeaders() }),
  deleteClub: (clubId) => axios.delete(`${API}/admin/clubs/${clubId}`, { headers: getAuthHeaders() }),
  updateAnalyst: (analystId, data) => axios.put(`${API}/admin/analysts/${analystId}`, data, { headers: getAuthHeaders() }),
  inviteAnalyst: (data) => axios.post(`${API}/admin/invite-analyst`, data, { headers: getAuthHeaders() }),
  activateAnalyst: (token, password) => axios.post(`${API}/analyst/activate/${token}`, { password }),
  deleteAnalyst: (analystId) => axios.delete(`${API}/admin/analysts/${analystId}`, { headers: getAuthHeaders() }),
  getAdminClubApplications: () => axios.get(`${API}/admin/club-applications`, { headers: getAuthHeaders() }),
  updateClubApplication: (clubId, data) => axios.put(`${API}/admin/club-applications/${clubId}`, data, { headers: getAuthHeaders() }),

  // Agent Representation
  getMyAgentRepresentation: () => axios.get(`${API}/player/agent-representation`, { headers: getAuthHeaders() }),
  updateMyAgentRepresentation: (data) => axios.put(`${API}/player/agent-representation`, data, { headers: getAuthHeaders() }),
  getPlayerAgentRepresentation: (playerId) => axios.get(`${API}/players/${playerId}/agent-representation`, { headers: getAuthHeaders() }),
  adminUpdateAgentRepresentation: (userId, data) => axios.put(`${API}/admin/players/${userId}/agent-representation`, data, { headers: getAuthHeaders() }),

  // Duplicate Detection
  getDuplicateProfiles: () => axios.get(`${API}/admin/duplicates`, { headers: getAuthHeaders() }),
  handleDuplicateAction: (id, data) => axios.post(`${API}/admin/duplicates/${id}/action`, data, { headers: getAuthHeaders() }),
  getDuplicateAction: (id) => axios.get(`${API}/admin/duplicates/${id}/action`, { headers: getAuthHeaders() }),

  // Admin Analysts
  getAllAnalysts: () => axios.get(`${API}/admin/analysts`, { headers: getAuthHeaders() }),
  approveAnalyst: (userId, approved) => axios.put(`${API}/admin/analysts/${userId}/approve?approved=${approved}`, {}, { headers: getAuthHeaders() }),
  verifyAnalyst: (userId, verified) => axios.put(`${API}/admin/analysts/${userId}/verify?verified=${verified}`, {}, { headers: getAuthHeaders() }),
  deleteAnalyst: (userId) => axios.delete(`${API}/admin/analysts/${userId}`, { headers: getAuthHeaders() }),
};