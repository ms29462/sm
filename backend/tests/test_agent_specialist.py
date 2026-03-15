"""
Test Suite for Agent and Specialist Features
Tests: Registration, Login, Profile, Player Search, Watchlist/Clients, Opportunities, Admin Management
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
API = f"{BASE_URL}/api"

# Test credentials
ADMIN_CREDS = {"email": "admin@soccermatch.com", "password": "admin123"}
AGENT_CREDS = {"email": "test.agent@soccermatch.com", "password": "test123"}
SPECIALIST_CREDS = {"email": "test.specialist@soccermatch.com", "password": "test123"}
DEMO_PLAYER_CREDS = {"email": "demo.player@soccermatch.com", "password": "demo123"}

# New test users for registration tests
TEST_AGENT_EMAIL = f"test_agent_{uuid.uuid4().hex[:8]}@soccermatch.com"
TEST_SPECIALIST_EMAIL = f"test_specialist_{uuid.uuid4().hex[:8]}@soccermatch.com"


@pytest.fixture(scope="module")
def admin_token():
    """Get admin auth token"""
    response = requests.post(f"{API}/auth/admin/login", json=ADMIN_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin login failed")


@pytest.fixture(scope="module")
def agent_token():
    """Get agent auth token"""
    response = requests.post(f"{API}/auth/login", json=AGENT_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Agent login failed")


@pytest.fixture(scope="module")
def specialist_token():
    """Get specialist auth token"""
    response = requests.post(f"{API}/auth/login", json=SPECIALIST_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Specialist login failed")


@pytest.fixture(scope="module")
def player_token():
    """Get player auth token"""
    response = requests.post(f"{API}/auth/login", json=DEMO_PLAYER_CREDS)
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Player login failed")


def get_headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


# ==================== AGENT REGISTRATION TESTS ====================
class TestAgentRegistration:
    """Test Agent registration flow"""
    
    def test_register_agent_success(self):
        """Can register as agent role"""
        response = requests.post(f"{API}/auth/register", json={
            "email": TEST_AGENT_EMAIL,
            "password": "testpass123",
            "name": "Test Agent User",
            "role": "agent"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["role"] == "agent"
        assert "token" in data
        assert data["email"] == TEST_AGENT_EMAIL
        print(f"✓ Agent registration successful: {data['email']}")
    
    def test_agent_login_after_registration(self):
        """Newly registered agent can login"""
        response = requests.post(f"{API}/auth/login", json={
            "email": TEST_AGENT_EMAIL,
            "password": "testpass123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data["role"] == "agent"
        print("✓ Agent login after registration successful")


# ==================== SPECIALIST REGISTRATION TESTS ====================
class TestSpecialistRegistration:
    """Test Specialist registration flow"""
    
    def test_register_specialist_success(self):
        """Can register as specialist role"""
        response = requests.post(f"{API}/auth/register", json={
            "email": TEST_SPECIALIST_EMAIL,
            "password": "testpass123",
            "name": "Test Specialist User",
            "role": "specialist"
        })
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data["role"] == "specialist"
        assert "token" in data
        assert data["email"] == TEST_SPECIALIST_EMAIL
        print(f"✓ Specialist registration successful: {data['email']}")
    
    def test_specialist_login_after_registration(self):
        """Newly registered specialist can login"""
        response = requests.post(f"{API}/auth/login", json={
            "email": TEST_SPECIALIST_EMAIL,
            "password": "testpass123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data["role"] == "specialist"
        print("✓ Specialist login after registration successful")


# ==================== AGENT LOGIN TESTS ====================
class TestAgentLogin:
    """Test existing Agent login"""
    
    def test_agent_login_success(self):
        """Can login with agent credentials"""
        response = requests.post(f"{API}/auth/login", json=AGENT_CREDS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data["role"] == "agent"
        assert "token" in data
        assert "user_id" in data
        print(f"✓ Agent login successful: {data['email']}")
    
    def test_agent_login_invalid_password(self):
        """Invalid password returns 401"""
        response = requests.post(f"{API}/auth/login", json={
            "email": AGENT_CREDS["email"],
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        print("✓ Agent login with invalid password returns 401")


# ==================== SPECIALIST LOGIN TESTS ====================
class TestSpecialistLogin:
    """Test existing Specialist login"""
    
    def test_specialist_login_success(self):
        """Can login with specialist credentials"""
        response = requests.post(f"{API}/auth/login", json=SPECIALIST_CREDS)
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data["role"] == "specialist"
        assert "token" in data
        assert "user_id" in data
        print(f"✓ Specialist login successful: {data['email']}")


# ==================== AGENT PROFILE TESTS ====================
class TestAgentProfile:
    """Test Agent profile CRUD operations"""
    
    def test_get_agent_profile(self, agent_token):
        """Agent can view their profile"""
        response = requests.get(f"{API}/agent/profile", headers=get_headers(agent_token))
        assert response.status_code == 200, f"Profile fetch failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert "name" in data
        assert "approved" in data
        print(f"✓ Agent profile retrieved: {data.get('name')}")
    
    def test_update_agent_profile(self, agent_token):
        """Agent can update their profile"""
        update_data = {
            "agency_name": "Test Elite Sports Agency",
            "license_number": "FIFA-2026-TEST123",
            "country": "England",
            "specializations": ["Youth Players", "International Transfers"],
            "years_experience": 5,
            "bio": "Test bio for agent profile"
        }
        response = requests.put(f"{API}/agent/profile", json=update_data, headers=get_headers(agent_token))
        assert response.status_code == 200, f"Profile update failed: {response.text}"
        data = response.json()
        assert data["agency_name"] == "Test Elite Sports Agency"
        assert data["license_number"] == "FIFA-2026-TEST123"
        assert "Youth Players" in data["specializations"]
        print("✓ Agent profile updated successfully")
    
    def test_non_agent_cannot_access_agent_profile(self, player_token):
        """Non-agent role cannot access agent profile endpoint"""
        response = requests.get(f"{API}/agent/profile", headers=get_headers(player_token))
        assert response.status_code == 403
        print("✓ Non-agent cannot access agent profile (403)")


# ==================== SPECIALIST PROFILE TESTS ====================
class TestSpecialistProfile:
    """Test Specialist profile CRUD operations"""
    
    def test_get_specialist_profile(self, specialist_token):
        """Specialist can view their profile"""
        response = requests.get(f"{API}/specialist/profile", headers=get_headers(specialist_token))
        assert response.status_code == 200, f"Profile fetch failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert "name" in data
        assert "approved" in data
        print(f"✓ Specialist profile retrieved: {data.get('name')}")
    
    def test_update_specialist_profile(self, specialist_token):
        """Specialist can update their profile"""
        update_data = {
            "specialist_type": "Physiotherapist",
            "country": "England",
            "city": "London",
            "certifications": ["Licensed Physiotherapist", "First Aid/CPR"],
            "services_offered": ["ACL Rehabilitation", "Injury Prevention"],
            "languages": ["English", "Spanish"],
            "years_experience": 8,
            "hourly_rate": "$100-150/hour",
            "availability": "Full-time"
        }
        response = requests.put(f"{API}/specialist/profile", json=update_data, headers=get_headers(specialist_token))
        assert response.status_code == 200, f"Profile update failed: {response.text}"
        data = response.json()
        assert data["specialist_type"] == "Physiotherapist"
        assert "Licensed Physiotherapist" in data["certifications"]
        assert "ACL Rehabilitation" in data["services_offered"]
        print("✓ Specialist profile updated successfully")
    
    def test_non_specialist_cannot_access_specialist_profile(self, player_token):
        """Non-specialist role cannot access specialist profile endpoint"""
        response = requests.get(f"{API}/specialist/profile", headers=get_headers(player_token))
        assert response.status_code == 403
        print("✓ Non-specialist cannot access specialist profile (403)")


# ==================== SPECIALIST TYPES ENDPOINT TEST ====================
class TestSpecialistTypes:
    """Test specialist types endpoint"""
    
    def test_get_specialist_types(self):
        """Get available specialist types and certifications"""
        response = requests.get(f"{API}/specialist/types")
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert "types" in data
        assert "certifications" in data
        assert len(data["types"]) > 0
        assert "Physiotherapist" in data["types"]
        assert "Licensed Physiotherapist" in data["certifications"]
        print(f"✓ Specialist types retrieved: {len(data['types'])} types, {len(data['certifications'])} certifications")


# ==================== AGENT PLAYER SEARCH TESTS ====================
class TestAgentPlayerSearch:
    """Test Agent player search functionality"""
    
    def test_agent_search_players(self, agent_token):
        """Agent can search all players"""
        response = requests.get(f"{API}/agent/players", headers=get_headers(agent_token))
        assert response.status_code == 200, f"Search failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Agent player search returned {len(data)} players")
    
    def test_agent_search_players_with_filters(self, agent_token):
        """Agent can filter players"""
        response = requests.get(f"{API}/agent/players?position=Forward", headers=get_headers(agent_token))
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        # If results exist, verify filter worked
        for player in data:
            if player.get("position"):
                assert player["position"] == "Forward"
        print(f"✓ Agent filtered search returned {len(data)} players")
    
    def test_agent_search_requires_auth(self):
        """Player search requires authentication"""
        response = requests.get(f"{API}/agent/players")
        assert response.status_code in [401, 403]
        print("✓ Agent player search requires auth")


# ==================== SPECIALIST PLAYER SEARCH TESTS ====================
class TestSpecialistPlayerSearch:
    """Test Specialist player search functionality"""
    
    def test_specialist_search_players(self, specialist_token):
        """Specialist can search all players"""
        response = requests.get(f"{API}/specialist/players", headers=get_headers(specialist_token))
        assert response.status_code == 200, f"Search failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Specialist player search returned {len(data)} players")
    
    def test_specialist_search_players_with_filters(self, specialist_token):
        """Specialist can filter players"""
        response = requests.get(f"{API}/specialist/players?level=Professional", headers=get_headers(specialist_token))
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Specialist filtered search returned {len(data)} players")


# ==================== AGENT WATCHLIST TESTS ====================
class TestAgentWatchlist:
    """Test Agent watchlist (favorites) functionality"""
    
    stored_player_id = None
    
    def test_get_agent_watchlist(self, agent_token):
        """Agent can view their watchlist"""
        response = requests.get(f"{API}/agent/favorites", headers=get_headers(agent_token))
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Agent watchlist contains {len(data)} players")
    
    def test_add_player_to_watchlist(self, agent_token):
        """Agent can add player to watchlist"""
        # First get a player ID
        players_response = requests.get(f"{API}/agent/players", headers=get_headers(agent_token))
        if players_response.status_code == 200 and len(players_response.json()) > 0:
            player_id = players_response.json()[0]["user_id"]
            TestAgentWatchlist.stored_player_id = player_id
            
            # Add to watchlist
            response = requests.post(f"{API}/agent/favorites", 
                json={"player_id": player_id}, 
                headers=get_headers(agent_token))
            # 200 = added, 400 = already in watchlist
            assert response.status_code in [200, 400], f"Add to watchlist failed: {response.text}"
            print(f"✓ Added player to watchlist (or already exists)")
        else:
            pytest.skip("No players available for watchlist test")
    
    def test_remove_player_from_watchlist(self, agent_token):
        """Agent can remove player from watchlist"""
        if TestAgentWatchlist.stored_player_id:
            response = requests.delete(
                f"{API}/agent/favorites/{TestAgentWatchlist.stored_player_id}",
                headers=get_headers(agent_token))
            # 200 = removed, 404 = not found (might have been removed in previous test run)
            assert response.status_code in [200, 404]
            print("✓ Remove from watchlist works")
        else:
            pytest.skip("No player ID stored for removal test")


# ==================== SPECIALIST CLIENTS TESTS ====================
class TestSpecialistClients:
    """Test Specialist client list (favorites) functionality"""
    
    stored_player_id = None
    
    def test_get_specialist_clients(self, specialist_token):
        """Specialist can view their client list"""
        response = requests.get(f"{API}/specialist/favorites", headers=get_headers(specialist_token))
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Specialist client list contains {len(data)} players")
    
    def test_add_player_to_client_list(self, specialist_token):
        """Specialist can add player to client list"""
        # First get a player ID
        players_response = requests.get(f"{API}/specialist/players", headers=get_headers(specialist_token))
        if players_response.status_code == 200 and len(players_response.json()) > 0:
            player_id = players_response.json()[0]["user_id"]
            TestSpecialistClients.stored_player_id = player_id
            
            # Add to client list
            response = requests.post(f"{API}/specialist/favorites", 
                json={"player_id": player_id}, 
                headers=get_headers(specialist_token))
            # 200 = added, 400 = already in client list
            assert response.status_code in [200, 400], f"Add to client list failed: {response.text}"
            print("✓ Added player to client list (or already exists)")
        else:
            pytest.skip("No players available for client list test")
    
    def test_remove_player_from_client_list(self, specialist_token):
        """Specialist can remove player from client list"""
        if TestSpecialistClients.stored_player_id:
            response = requests.delete(
                f"{API}/specialist/favorites/{TestSpecialistClients.stored_player_id}",
                headers=get_headers(specialist_token))
            assert response.status_code in [200, 404]
            print("✓ Remove from client list works")
        else:
            pytest.skip("No player ID stored for removal test")


# ==================== AGENT OPPORTUNITIES TESTS ====================
class TestAgentOpportunities:
    """Test Agent opportunities viewing"""
    
    def test_agent_view_opportunities(self, agent_token):
        """Agent can view all opportunities"""
        response = requests.get(f"{API}/agent/opportunities", headers=get_headers(agent_token))
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Agent opportunities returned {len(data)} opportunities")
    
    def test_agent_opportunities_structure(self, agent_token):
        """Verify opportunity data structure"""
        response = requests.get(f"{API}/agent/opportunities", headers=get_headers(agent_token))
        data = response.json()
        if len(data) > 0:
            opp = data[0]
            # Verify expected fields
            assert "id" in opp
            assert "club_name" in opp
            assert "position" in opp
            print("✓ Opportunity structure is correct")
        else:
            print("✓ No opportunities to verify structure (list is empty)")


# ==================== ADMIN AGENTS MANAGEMENT TESTS ====================
class TestAdminAgents:
    """Test Admin management of agents"""
    
    def test_admin_get_all_agents(self, admin_token):
        """Admin can view all agents"""
        response = requests.get(f"{API}/admin/agents", headers=get_headers(admin_token))
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin retrieved {len(data)} agents")
    
    def test_admin_agents_contains_details(self, admin_token):
        """Agent data includes required fields"""
        response = requests.get(f"{API}/admin/agents", headers=get_headers(admin_token))
        data = response.json()
        if len(data) > 0:
            agent = data[0]
            assert "user_id" in agent
            assert "name" in agent
            assert "email" in agent  # Admin can see email
            assert "approved" in agent
            print("✓ Agent details include all required fields")
        else:
            print("✓ No agents to verify (list is empty)")
    
    def test_admin_approve_agent(self, admin_token):
        """Admin can approve an agent"""
        # Get first agent
        response = requests.get(f"{API}/admin/agents", headers=get_headers(admin_token))
        agents = response.json()
        if len(agents) > 0:
            agent_id = agents[0]["user_id"]
            # Approve
            approve_response = requests.put(
                f"{API}/admin/agents/{agent_id}/approve",
                json={"user_id": agent_id, "approved": True},
                headers=get_headers(admin_token))
            assert approve_response.status_code == 200, f"Approve failed: {approve_response.text}"
            print("✓ Admin approved agent successfully")
        else:
            pytest.skip("No agents to approve")
    
    def test_admin_verify_agent(self, admin_token):
        """Admin can verify an agent"""
        response = requests.get(f"{API}/admin/agents", headers=get_headers(admin_token))
        agents = response.json()
        if len(agents) > 0:
            agent_id = agents[0]["user_id"]
            # Verify
            verify_response = requests.put(
                f"{API}/admin/agents/{agent_id}/verify?verified=true",
                headers=get_headers(admin_token))
            assert verify_response.status_code == 200, f"Verify failed: {verify_response.text}"
            print("✓ Admin verified agent successfully")
        else:
            pytest.skip("No agents to verify")
    
    def test_non_admin_cannot_access_agents(self, agent_token):
        """Non-admin cannot access admin agents endpoint"""
        response = requests.get(f"{API}/admin/agents", headers=get_headers(agent_token))
        assert response.status_code == 403
        print("✓ Non-admin cannot access admin agents (403)")


# ==================== ADMIN SPECIALISTS MANAGEMENT TESTS ====================
class TestAdminSpecialists:
    """Test Admin management of specialists"""
    
    def test_admin_get_all_specialists(self, admin_token):
        """Admin can view all specialists"""
        response = requests.get(f"{API}/admin/specialists", headers=get_headers(admin_token))
        assert response.status_code == 200, f"Failed: {response.text}"
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Admin retrieved {len(data)} specialists")
    
    def test_admin_specialists_contains_details(self, admin_token):
        """Specialist data includes required fields"""
        response = requests.get(f"{API}/admin/specialists", headers=get_headers(admin_token))
        data = response.json()
        if len(data) > 0:
            specialist = data[0]
            assert "user_id" in specialist
            assert "name" in specialist
            assert "email" in specialist  # Admin can see email
            assert "approved" in specialist
            print("✓ Specialist details include all required fields")
        else:
            print("✓ No specialists to verify (list is empty)")
    
    def test_admin_approve_specialist(self, admin_token):
        """Admin can approve a specialist"""
        response = requests.get(f"{API}/admin/specialists", headers=get_headers(admin_token))
        specialists = response.json()
        if len(specialists) > 0:
            specialist_id = specialists[0]["user_id"]
            # Approve
            approve_response = requests.put(
                f"{API}/admin/specialists/{specialist_id}/approve",
                json={"user_id": specialist_id, "approved": True},
                headers=get_headers(admin_token))
            assert approve_response.status_code == 200, f"Approve failed: {approve_response.text}"
            print("✓ Admin approved specialist successfully")
        else:
            pytest.skip("No specialists to approve")
    
    def test_admin_verify_specialist(self, admin_token):
        """Admin can verify a specialist"""
        response = requests.get(f"{API}/admin/specialists", headers=get_headers(admin_token))
        specialists = response.json()
        if len(specialists) > 0:
            specialist_id = specialists[0]["user_id"]
            # Verify
            verify_response = requests.put(
                f"{API}/admin/specialists/{specialist_id}/verify?verified=true",
                headers=get_headers(admin_token))
            assert verify_response.status_code == 200, f"Verify failed: {verify_response.text}"
            print("✓ Admin verified specialist successfully")
        else:
            pytest.skip("No specialists to verify")
    
    def test_non_admin_cannot_access_specialists(self, specialist_token):
        """Non-admin cannot access admin specialists endpoint"""
        response = requests.get(f"{API}/admin/specialists", headers=get_headers(specialist_token))
        assert response.status_code == 403
        print("✓ Non-admin cannot access admin specialists (403)")


# ==================== ADMIN STATS TESTS ====================
class TestAdminStats:
    """Test Admin dashboard stats include agent and specialist counts"""
    
    def test_admin_stats_includes_agents_specialists(self, admin_token):
        """Admin stats include total_agents and total_specialists"""
        response = requests.get(f"{API}/admin/stats", headers=get_headers(admin_token))
        assert response.status_code == 200
        data = response.json()
        assert "total_agents" in data
        assert "total_specialists" in data
        assert "total_players" in data
        assert "total_clubs" in data
        assert "pending_approvals" in data
        print(f"✓ Admin stats: {data['total_agents']} agents, {data['total_specialists']} specialists")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
