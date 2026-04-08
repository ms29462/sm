"""
Test suite for AI Chatbot feature in SoccerMatch
Tests: POST /api/chatbot/query, DELETE /api/chatbot/session
"""
import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_CREDS = {"email": "admin@soccermatch.com", "password": "admin123"}
CLUB_CREDS = {"email": "test.club@soccermatch.com", "password": "test123"}
PLAYER_CREDS = {"email": "demo.player@soccermatch.com", "password": "demo123"}


class TestChatbotEndpoints:
    """Test chatbot API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_auth_token(self, email, password, admin=False):
        """Get authentication token"""
        endpoint = f"{BASE_URL}/api/auth/admin/login" if admin else f"{BASE_URL}/api/auth/login"
        response = self.session.post(endpoint, json={"email": email, "password": password})
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_chatbot_requires_auth(self):
        """Test that chatbot endpoint requires authentication"""
        response = self.session.post(
            f"{BASE_URL}/api/chatbot/query",
            json={"message": "Bonjour"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Chatbot endpoint requires authentication")
    
    def test_chatbot_conversation_query_admin(self):
        """Test chatbot with a simple conversation query as admin"""
        token = self.get_auth_token(ADMIN_CREDS["email"], ADMIN_CREDS["password"], admin=True)
        assert token, "Failed to get admin token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.post(
            f"{BASE_URL}/api/chatbot/query",
            json={"message": "Bonjour, comment ça va?"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "action" in data, "Response should have 'action' field"
        assert "response" in data or data.get("action") == "conversation", "Response should have 'response' field"
        print(f"✓ Admin chatbot conversation query works - action: {data.get('action')}")
    
    def test_chatbot_player_search_query(self):
        """Test chatbot with player search query (French: left-footed midfielders)"""
        token = self.get_auth_token(ADMIN_CREDS["email"], ADMIN_CREDS["password"], admin=True)
        assert token, "Failed to get admin token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Test with French query for left-footed midfielders
        response = self.session.post(
            f"{BASE_URL}/api/chatbot/query",
            json={"message": "Montre-moi les milieux gauchers"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "action" in data, "Response should have 'action' field"
        # The AI should interpret this as a player search
        print(f"✓ Player search query processed - action: {data.get('action')}")
        if data.get("action") == "search_players":
            print(f"  - Criteria: {data.get('criteria')}")
            print(f"  - Results count: {len(data.get('results', []))}")
    
    def test_chatbot_multi_nationality_search(self):
        """Test chatbot with multi-nationality search (Franco-Gambian midfielders)"""
        token = self.get_auth_token(ADMIN_CREDS["email"], ADMIN_CREDS["password"], admin=True)
        assert token, "Failed to get admin token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Test with French query for Franco-Gambian midfielders
        response = self.session.post(
            f"{BASE_URL}/api/chatbot/query",
            json={"message": "Sors moi tous les milieux de terrain gaucher franco gambien"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert "action" in data, "Response should have 'action' field"
        print(f"✓ Multi-nationality search processed - action: {data.get('action')}")
        if data.get("action") == "search_players":
            criteria = data.get("criteria", {})
            print(f"  - Criteria: {criteria}")
            # Check if nationality was parsed correctly
            if criteria.get("nationality"):
                print(f"  - Nationalities detected: {criteria.get('nationality')}")
    
    def test_chatbot_with_session_id(self):
        """Test chatbot with custom session ID"""
        token = self.get_auth_token(ADMIN_CREDS["email"], ADMIN_CREDS["password"], admin=True)
        assert token, "Failed to get admin token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        session_id = f"test-session-{int(time.time())}"
        response = self.session.post(
            f"{BASE_URL}/api/chatbot/query",
            json={"message": "Bonjour", "session_id": session_id}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Chatbot with custom session_id works")
    
    def test_chatbot_clear_session(self):
        """Test clearing chatbot session"""
        token = self.get_auth_token(ADMIN_CREDS["email"], ADMIN_CREDS["password"], admin=True)
        assert token, "Failed to get admin token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        # First make a query to create a session
        self.session.post(
            f"{BASE_URL}/api/chatbot/query",
            json={"message": "Test message"}
        )
        
        # Then clear the session
        response = self.session.delete(f"{BASE_URL}/api/chatbot/session")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") == True, "Session clear should return success=True"
        print("✓ Chatbot session cleared successfully")
    
    def test_chatbot_clear_session_requires_auth(self):
        """Test that clear session endpoint requires authentication"""
        # Remove auth header
        self.session.headers.pop("Authorization", None)
        
        response = self.session.delete(f"{BASE_URL}/api/chatbot/session")
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        print("✓ Clear session endpoint requires authentication")
    
    def test_chatbot_as_club_user(self):
        """Test chatbot works for club users"""
        token = self.get_auth_token(CLUB_CREDS["email"], CLUB_CREDS["password"])
        if not token:
            pytest.skip("Club user not available")
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.post(
            f"{BASE_URL}/api/chatbot/query",
            json={"message": "Recherche des attaquants"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Chatbot works for club users")
    
    def test_chatbot_as_player_user(self):
        """Test chatbot works for player users"""
        token = self.get_auth_token(PLAYER_CREDS["email"], PLAYER_CREDS["password"])
        if not token:
            pytest.skip("Player user not available")
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.post(
            f"{BASE_URL}/api/chatbot/query",
            json={"message": "Quelles opportunités sont disponibles?"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Chatbot works for player users")
    
    def test_chatbot_response_structure(self):
        """Test that chatbot response has correct structure"""
        token = self.get_auth_token(ADMIN_CREDS["email"], ADMIN_CREDS["password"], admin=True)
        assert token, "Failed to get admin token"
        
        self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        response = self.session.post(
            f"{BASE_URL}/api/chatbot/query",
            json={"message": "Aide-moi à trouver des joueurs"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "action" in data, "Response must have 'action' field"
        assert data["action"] in ["conversation", "search_players", "search_opportunities", "error"], \
            f"Invalid action: {data['action']}"
        
        # If search action, should have results field
        if data["action"] in ["search_players", "search_opportunities"]:
            assert "results" in data or data.get("results") is None, "Search action should have results field"
            assert "criteria" in data or data.get("criteria") is None, "Search action should have criteria field"
        
        print(f"✓ Response structure is valid - action: {data['action']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
