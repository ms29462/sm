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
  getClubApplications: () => axios.get(`${API}/club/applications`, { headers: getAuthHeaders() }),
  updateApplicationStatus: (id, status) => axios.put(`${API}/applications/${id}/status`, { status }, { headers: getAuthHeaders() }),
  getPlayers: (filters) => axios.get(`${API}/players`, { params: filters, headers: getAuthHeaders() }),
  getRecommendedPlayers: () => axios.get(`${API}/players/recommended`, { headers: getAuthHeaders() }),
  addFavorite: (playerId) => axios.post(`${API}/favorites`, { player_id: playerId }, { headers: getAuthHeaders() }),
  getFavorites: () => axios.get(`${API}/favorites`, { headers: getAuthHeaders() }),
  removeFavorite: (playerId) => axios.delete(`${API}/favorites/${playerId}`, { headers: getAuthHeaders() }),

  // Admin
  getAdminStats: () => axios.get(`${API}/admin/stats`, { headers: getAuthHeaders() }),
  getAllPlayers: () => axios.get(`${API}/admin/players`, { headers: getAuthHeaders() }),
  getAllClubs: () => axios.get(`${API}/admin/clubs`, { headers: getAuthHeaders() }),
  approvePlayer: (userId, approved) => axios.put(`${API}/admin/players/${userId}/approve`, { user_id: userId, approved }, { headers: getAuthHeaders() }),
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
};