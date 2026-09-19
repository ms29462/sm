const push = (event, params = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
};

export const trackLogin = (userRole) =>
  push('login_success', { user_role: userRole });

export const trackRegistration = (orgType) =>
  push('registration_complete', { org_type: orgType });

export const trackChatRequest = (playerName) =>
  push('chat_request_sent', { event_label: playerName });

export const trackOpportunityPosted = (orgType) =>
  push('opportunity_posted', { org_type: orgType });

export const trackPlayerProfileViewed = (playerId, playerName) =>
  push('player_profile_viewed', { player_id: playerId, event_label: playerName });

export const trackBeginCheckout = (plan, orgType) =>
  push('begin_checkout', { org_type: orgType, event_label: plan });

export const trackPurchase = (plan, orgType, value) =>
  push('purchase', { org_type: orgType, event_label: plan, value });
