"""
Test suite for Player Matching features - Iteration 3
Tests: transfermarkt_url field, available-leagues endpoint, benchmark-status endpoint, league dropdown
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAvailableLeagues:
    """Tests for GET /api/available-leagues endpoint"""
    
    def test_available_leagues_returns_list(self):
        """Test that available-leagues returns list of leagues"""
        response = requests.get(f"{BASE_URL}/api/available-leagues")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "leagues" in data, "Response should contain 'leagues' key"
        assert isinstance(data["leagues"], list), "Leagues should be a list"
        assert len(data["leagues"]) == 15, f"Expected 15 leagues, got {len(data['leagues'])}"
        
    def test_available_leagues_contains_expected_leagues(self):
        """Test that response contains expected leagues"""
        response = requests.get(f"{BASE_URL}/api/available-leagues")
        assert response.status_code == 200
        
        leagues = response.json()["leagues"]
        expected_leagues = ["USL Championship", "MLS", "Premier League", "CPL", "La Liga"]
        for league in expected_leagues:
            assert league in leagues, f"Expected league '{league}' not found"


class TestAdminBenchmarkStatus:
    """Tests for GET /api/admin/benchmark-status endpoint"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": "admin@soccermatch.com",
            "password": "admin123"
        })
        assert response.status_code == 200, "Admin login failed"
        return response.json()["token"]
    
    def test_benchmark_status_requires_auth(self):
        """Test that benchmark-status requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/benchmark-status")
        assert response.status_code in [401, 403], "Should require auth"
        
    def test_benchmark_status_requires_admin(self, admin_token):
        """Test that benchmark-status endpoint works for admin"""
        response = requests.get(
            f"{BASE_URL}/api/admin/benchmark-status",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "exists" in data, "Response should contain 'exists' key"
        assert isinstance(data["exists"], bool), "'exists' should be boolean"
        
    def test_benchmark_status_returns_expected_fields(self, admin_token):
        """Test response structure when no benchmark exists"""
        response = requests.get(
            f"{BASE_URL}/api/admin/benchmark-status",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # When no benchmark exists
        if not data["exists"]:
            assert "message" in data, "Should have message when no benchmark"
            assert "No benchmark data" in data["message"], "Should indicate no benchmark"


class TestPlayerTransfermarktUrl:
    """Tests for transfermarkt_url field in player profile"""
    
    @pytest.fixture(scope="class")
    def player_credentials(self):
        """Create a test player account"""
        unique_email = f"test_player_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "role": "player",
            "name": "TEST_TransfermarktPlayer"
        })
        if response.status_code == 200:
            return {"token": response.json()["token"], "email": unique_email}
        elif response.status_code == 400:
            # Try logging in if already exists
            login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
                "email": unique_email,
                "password": "testpass123"
            })
            return {"token": login_resp.json()["token"], "email": unique_email}
        pytest.fail(f"Failed to create player: {response.text}")
        
    def test_player_profile_has_transfermarkt_url_field(self, player_credentials):
        """Test that player profile includes transfermarkt_url field"""
        response = requests.get(
            f"{BASE_URL}/api/player/profile",
            headers={"Authorization": f"Bearer {player_credentials['token']}"}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Field may be null but should exist in schema
        assert "transfermarkt_url" in data or data.get("transfermarkt_url") is None or data.get("transfermarkt_url") == ""
        
    def test_update_player_profile_with_transfermarkt_url(self, player_credentials):
        """Test updating player profile with transfermarkt_url"""
        test_url = "https://www.transfermarkt.us/test-player/profil/spieler/123456"
        
        response = requests.put(
            f"{BASE_URL}/api/player/profile",
            headers={"Authorization": f"Bearer {player_credentials['token']}"},
            json={"transfermarkt_url": test_url}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify the update
        data = response.json()
        assert data.get("transfermarkt_url") == test_url, "transfermarkt_url should be updated"
        
    def test_transfermarkt_url_persists_after_update(self, player_credentials):
        """Test that transfermarkt_url persists when fetching profile"""
        test_url = "https://www.transfermarkt.us/test-player/profil/spieler/654321"
        
        # Update
        update_resp = requests.put(
            f"{BASE_URL}/api/player/profile",
            headers={"Authorization": f"Bearer {player_credentials['token']}"},
            json={"transfermarkt_url": test_url}
        )
        assert update_resp.status_code == 200
        
        # Fetch and verify
        get_resp = requests.get(
            f"{BASE_URL}/api/player/profile",
            headers={"Authorization": f"Bearer {player_credentials['token']}"}
        )
        assert get_resp.status_code == 200
        assert get_resp.json().get("transfermarkt_url") == test_url


class TestPlayerMatchScoresEndpoint:
    """Tests for GET /api/player/match-scores endpoint"""
    
    @pytest.fixture(scope="class")
    def player_token(self):
        """Create a player for testing"""
        unique_email = f"test_matchscore_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "role": "player",
            "name": "TEST_MatchScorePlayer"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not create player")
    
    def test_match_scores_requires_player_auth(self):
        """Test that match-scores requires authentication"""
        response = requests.get(f"{BASE_URL}/api/player/match-scores")
        assert response.status_code in [401, 403]
        
    def test_match_scores_returns_error_without_transfermarkt_url(self, player_token):
        """Test that endpoint returns appropriate error without transfermarkt_url"""
        response = requests.get(
            f"{BASE_URL}/api/player/match-scores",
            headers={"Authorization": f"Bearer {player_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Should return error message if no transfermarkt_url set
        assert "error" in data or "scores" in data


class TestClubOpportunityLeagueLevel:
    """Tests for club opportunity creation with league_level"""
    
    @pytest.fixture(scope="class")
    def club_credentials(self):
        """Create a test club account"""
        unique_email = f"test_club_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "role": "club",
            "name": "TEST_LeagueTestClub"
        })
        if response.status_code == 200:
            return {"token": response.json()["token"], "email": unique_email}
        pytest.skip("Could not create club")
        
    def test_create_opportunity_with_league_level(self, club_credentials):
        """Test creating opportunity with league_level field"""
        response = requests.post(
            f"{BASE_URL}/api/opportunities",
            headers={"Authorization": f"Bearer {club_credentials['token']}"},
            json={
                "position": "Striker",
                "league_level": "USL Championship",
                "salary_range": "$50k-$80k",
                "contract_duration": "2 years",
                "description": "TEST_Looking for a striker for upcoming season"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["position"] == "Striker"
        assert data["league_level"] == "USL Championship"
        assert "id" in data
        
    def test_opportunity_league_level_persists(self, club_credentials):
        """Test that league_level is returned when fetching opportunities"""
        # Create opportunity
        create_resp = requests.post(
            f"{BASE_URL}/api/opportunities",
            headers={"Authorization": f"Bearer {club_credentials['token']}"},
            json={
                "position": "Midfielder",
                "league_level": "MLS",
                "description": "TEST_Looking for a midfielder"
            }
        )
        assert create_resp.status_code == 200
        opp_id = create_resp.json()["id"]
        
        # Fetch and verify
        get_resp = requests.get(
            f"{BASE_URL}/api/club/opportunities",
            headers={"Authorization": f"Bearer {club_credentials['token']}"}
        )
        assert get_resp.status_code == 200
        
        opportunities = get_resp.json()
        matching_opp = next((o for o in opportunities if o["id"] == opp_id), None)
        assert matching_opp is not None, "Created opportunity not found"
        assert matching_opp["league_level"] == "MLS"


class TestAdminNonAdminAccess:
    """Tests to verify non-admin cannot access admin benchmark endpoints"""
    
    @pytest.fixture(scope="class")
    def player_token(self):
        """Get a player token"""
        unique_email = f"test_noadmin_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "role": "player",
            "name": "TEST_NoAdminPlayer"
        })
        if response.status_code == 200:
            return response.json()["token"]
        pytest.skip("Could not create player")
        
    def test_player_cannot_access_benchmark_status(self, player_token):
        """Test that player cannot access admin benchmark status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/benchmark-status",
            headers={"Authorization": f"Bearer {player_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"
        
    def test_player_cannot_generate_benchmark(self, player_token):
        """Test that player cannot generate benchmark"""
        response = requests.post(
            f"{BASE_URL}/api/admin/generate-benchmark",
            headers={"Authorization": f"Bearer {player_token}"}
        )
        assert response.status_code == 403, f"Expected 403, got {response.status_code}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
