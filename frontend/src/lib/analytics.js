const push = (event, params = {}) => {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
};

const fbq = (...args) => {
  if (typeof window.fbq === 'function') window.fbq(...args);
};

export const trackLogin = (userRole) =>
  push('login_success', { user_role: userRole });

export const trackRegistration = (orgType) => {
  push('registration_complete', { org_type: orgType });
  fbq('track', 'CompleteRegistration', { content_name: orgType });
};

export const trackChatRequest = (playerName) => {
  push('chat_request_sent', { event_label: playerName });
  fbq('track', 'Lead', { content_name: playerName });
};

export const trackOpportunityPosted = (orgType) =>
  push('opportunity_posted', { org_type: orgType });

export const trackPlayerProfileViewed = (playerId, playerName) => {
  push('player_profile_viewed', { player_id: playerId, event_label: playerName });
  fbq('track', 'ViewContent', { content_ids: [playerId], content_name: playerName, content_type: 'player' });
};

export const trackBeginCheckout = (plan, orgType) => {
  push('begin_checkout', { org_type: orgType, event_label: plan });
  fbq('track', 'InitiateCheckout', { content_name: plan, content_category: orgType });
};

export const trackPurchase = (plan, orgType, value) => {
  push('purchase', { org_type: orgType, event_label: plan, value });
  fbq('track', 'Purchase', { value, currency: 'USD', content_name: plan, content_category: orgType });
};
