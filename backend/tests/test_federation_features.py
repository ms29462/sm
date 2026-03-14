"""
Federation Feature Tests
Tests for the newly implemented Federation user type including:
- Federation registration flow
- Federation login and dashboard redirect
- Federation profile management
- Federation players search with filters
- Federation recommended players
- Federation scouting list (favorites)
- Federation teams management
- Admin federation management
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@soccermatch.com"
ADMIN_PASSWORD = "admin123"
TEST_FEDERATION_EMAIL = f"TEST_federation_{uuid.uuid4().hex[:8]}@soccermatch.com"
TEST_FEDERATION_PASSWORD = "test123"
TEST_FEDERATION_NAME = f"TEST Federation {uuid.uuid4().hex[:8]}"
TEST_PLAYER_EMAIL = f"TEST_player_{uuid.uuid4().hex[:8]}@soccermatch.com"
TEST_PLAYER_PASSWORD = "test123"
TEST_PLAYER_NAME = f"TEST Player {uuid.uuid4().hex[:8]}"


class TestFederationRegistration:
    """Tests for federation registration flow"""
    
    def test_federation_registration_success(self):
        """Test successful federation registration with role='federation'"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_FEDERATION_EMAIL,
            "password": TEST_FEDERATION_PASSWORD,
            "role": "federation",
            "name": TEST_FEDERATION_NAME
        })
        
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert "token" in data
        assert data["role"] == "federation"
        assert "user_id" in data
        assert data["email"] == TEST_FEDERATION_EMAIL
        
        # Store for later tests
        pytest.federation_token = data["token"]
        pytest.federation_user_id = data["user_id"]
        print(f"✓ Federation registered successfully with user_id: {data['user_id']}")
    
    def test_federation_duplicate_registration_fails(self):
        """Test that duplicate email registration fails"""
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_FEDERATION_EMAIL,
            "password": TEST_FEDERATION_PASSWORD,
            "role": "federation",
            "name": "Duplicate Federation"
        })
        
        assert response.status_code == 400, f"Should have failed: {response.text}"
        assert "already registered" in response.json().get("detail", "").lower()
        print("✓ Duplicate registration correctly prevented")


class TestFederationLogin:
    """Tests for federation login flow"""
    
    def test_federation_login_success(self):
        """Test successful federation login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_FEDERATION_EMAIL,
            "password": TEST_FEDERATION_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        assert "token" in data
        assert data["role"] == "federation"
        assert data["email"] == TEST_FEDERATION_EMAIL
        pytest.federation_token = data["token"]
        print("✓ Federation login successful")
    
    def test_federation_login_wrong_password(self):
        """Test login with wrong password fails"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_FEDERATION_EMAIL,
            "password": "wrongpassword"
        })
        
        assert response.status_code == 401
        print("✓ Wrong password correctly rejected")


class TestFederationProfile:
    """Tests for federation profile management"""
    
    def get_auth_headers(self):
        return {"Authorization": f"Bearer {pytest.federation_token}"}
    
    def test_get_federation_profile(self):
        """Test getting federation profile"""
        response = requests.get(f"{BASE_URL}/api/federation/profile", 
                                headers=self.get_auth_headers())
        
        assert response.status_code == 200, f"Get profile failed: {response.text}"
        data = response.json()
        
        assert data["name"] == TEST_FEDERATION_NAME
        assert "user_id" in data
        assert data["approved"] == False  # New federations start unapproved
        print("✓ Federation profile retrieved successfully")
    
    def test_update_federation_profile_country(self):
        """Test updating federation country"""
        response = requests.put(f"{BASE_URL}/api/federation/profile",
                                headers=self.get_auth_headers(),
                                json={"country": "Cameroon"})
        
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        
        assert data["country"] == "Cameroon"
        print("✓ Federation country updated to Cameroon")
    
    def test_update_federation_profile_description(self):
        """Test updating federation description"""
        description = "Test federation for national team scouting"
        response = requests.put(f"{BASE_URL}/api/federation/profile",
                                headers=self.get_auth_headers(),
                                json={"description": description})
        
        assert response.status_code == 200, f"Update failed: {response.text}"
        data = response.json()
        
        assert data["description"] == description
        print("✓ Federation description updated")
    
    def test_federation_profile_persistence(self):
        """Test that profile updates persist"""
        response = requests.get(f"{BASE_URL}/api/federation/profile",
                                headers=self.get_auth_headers())
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["country"] == "Cameroon"
        assert "Test federation" in data["description"]
        print("✓ Profile updates persisted correctly")


class TestSetupTestPlayer:
    """Create a test player for federation search tests"""
    
    def test_create_test_player(self):
        """Create a player with Cameroon nationality for testing"""
        # Register player
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": TEST_PLAYER_EMAIL,
            "password": TEST_PLAYER_PASSWORD,
            "role": "player",
            "name": TEST_PLAYER_NAME
        })
        
        assert response.status_code == 200, f"Player registration failed: {response.text}"
        data = response.json()
        pytest.test_player_token = data["token"]
        pytest.test_player_id = data["user_id"]
        
        # Update player profile with nationality
        response = requests.put(f"{BASE_URL}/api/player/profile",
                                headers={"Authorization": f"Bearer {pytest.test_player_token}"},
                                json={
                                    "nationality": "Cameroon",
                                    "position": "Forward",
                                    "age": 22
                                })
        
        assert response.status_code == 200, f"Player update failed: {response.text}"
        print(f"✓ Test player created: {TEST_PLAYER_NAME} (Cameroon)")
    
    def test_approve_test_player(self):
        """Approve the test player via admin"""
        # Get admin token
        admin_response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert admin_response.status_code == 200
        admin_token = admin_response.json()["token"]
        pytest.admin_token = admin_token
        
        # Approve player
        response = requests.put(
            f"{BASE_URL}/api/admin/players/{pytest.test_player_id}/approve",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={"user_id": pytest.test_player_id, "approved": True}
        )
        
        assert response.status_code == 200, f"Player approval failed: {response.text}"
        print("✓ Test player approved")


class TestFederationPlayersSearch:
    """Tests for federation player search functionality"""
    
    def get_auth_headers(self):
        return {"Authorization": f"Bearer {pytest.federation_token}"}
    
    def test_search_players_no_filters(self):
        """Test searching players without filters"""
        response = requests.get(f"{BASE_URL}/api/federation/players",
                                headers=self.get_auth_headers())
        
        assert response.status_code == 200, f"Search failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Federation players search returned {len(data)} players")
    
    def test_search_players_by_nationality(self):
        """Test searching players by nationality"""
        response = requests.get(f"{BASE_URL}/api/federation/players",
                                headers=self.get_auth_headers(),
                                params={"nationality": "Cameroon"})
        
        assert response.status_code == 200, f"Search failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        # Should find at least our test player
        for player in data:
            nationalities = [player.get("nationality"), player.get("nationality_1"),
                           player.get("nationality_2"), player.get("nationality_3")]
            assert "Cameroon" in nationalities, f"Player {player.get('name')} doesn't have Cameroon nationality"
        print(f"✓ Found {len(data)} players with Cameroon nationality")
    
    def test_search_players_by_position(self):
        """Test searching players by position"""
        response = requests.get(f"{BASE_URL}/api/federation/players",
                                headers=self.get_auth_headers(),
                                params={"position": "Forward"})
        
        assert response.status_code == 200
        data = response.json()
        
        for player in data:
            assert player.get("position") == "Forward"
        print(f"✓ Found {len(data)} Forward players")
    
    def test_search_players_by_age_range(self):
        """Test searching players by age range"""
        response = requests.get(f"{BASE_URL}/api/federation/players",
                                headers=self.get_auth_headers(),
                                params={"min_age": 18, "max_age": 25})
        
        assert response.status_code == 200
        data = response.json()
        
        for player in data:
            if player.get("age"):
                assert 18 <= player["age"] <= 25
        print(f"✓ Found {len(data)} players aged 18-25")
    
    def test_search_players_privacy(self):
        """Test that player emails are NOT exposed to federations (null or missing)"""
        response = requests.get(f"{BASE_URL}/api/federation/players",
                                headers=self.get_auth_headers())
        
        assert response.status_code == 200
        data = response.json()
        
        for player in data:
            # Email should either be missing or null (Pydantic serializes as null)
            email_value = player.get("email")
            assert email_value is None, f"Email exposed for player: {player.get('name')}, email={email_value}"
        print("✓ Player emails correctly hidden from federations (null)")


class TestFederationRecommendedPlayers:
    """Tests for federation recommended players based on country"""
    
    def get_auth_headers(self):
        return {"Authorization": f"Bearer {pytest.federation_token}"}
    
    def test_get_recommended_players(self):
        """Test getting recommended players matching federation's country"""
        response = requests.get(f"{BASE_URL}/api/federation/recommended-players",
                                headers=self.get_auth_headers())
        
        assert response.status_code == 200, f"Recommended failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        # All recommended players should have the federation's country
        for player in data:
            nationalities = [player.get("nationality"), player.get("nationality_1"),
                           player.get("nationality_2"), player.get("nationality_3")]
            assert "Cameroon" in nationalities, f"Recommended player doesn't match country"
        print(f"✓ Got {len(data)} recommended players matching Cameroon nationality")


class TestFederationScoutingList:
    """Tests for federation scouting list (favorites)"""
    
    def get_auth_headers(self):
        return {"Authorization": f"Bearer {pytest.federation_token}"}
    
    def test_add_to_scouting_list(self):
        """Test adding a player to scouting list"""
        response = requests.post(f"{BASE_URL}/api/federation/favorites",
                                 headers=self.get_auth_headers(),
                                 json={"player_id": pytest.test_player_id})
        
        assert response.status_code == 200, f"Add favorite failed: {response.text}"
        print("✓ Player added to scouting list")
    
    def test_add_duplicate_to_scouting_list(self):
        """Test that adding duplicate favorite fails"""
        response = requests.post(f"{BASE_URL}/api/federation/favorites",
                                 headers=self.get_auth_headers(),
                                 json={"player_id": pytest.test_player_id})
        
        assert response.status_code == 400
        assert "already" in response.json().get("detail", "").lower()
        print("✓ Duplicate favorite correctly prevented")
    
    def test_get_scouting_list(self):
        """Test getting scouting list"""
        response = requests.get(f"{BASE_URL}/api/federation/favorites",
                                headers=self.get_auth_headers())
        
        assert response.status_code == 200, f"Get favorites failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) >= 1
        # Check that our test player is in the list
        player_ids = [p["user_id"] for p in data]
        assert pytest.test_player_id in player_ids
        print(f"✓ Scouting list has {len(data)} players")
    
    def test_remove_from_scouting_list(self):
        """Test removing a player from scouting list"""
        response = requests.delete(
            f"{BASE_URL}/api/federation/favorites/{pytest.test_player_id}",
            headers=self.get_auth_headers())
        
        assert response.status_code == 200, f"Remove favorite failed: {response.text}"
        print("✓ Player removed from scouting list")
    
    def test_scouting_list_empty_after_removal(self):
        """Verify scouting list is updated after removal"""
        response = requests.get(f"{BASE_URL}/api/federation/favorites",
                                headers=self.get_auth_headers())
        
        assert response.status_code == 200
        data = response.json()
        
        player_ids = [p["user_id"] for p in data]
        assert pytest.test_player_id not in player_ids
        print("✓ Player confirmed removed from scouting list")


class TestFederationTeams:
    """Tests for federation team management"""
    
    def get_auth_headers(self):
        return {"Authorization": f"Bearer {pytest.federation_token}"}
    
    def test_get_teams_initially_empty(self):
        """Test getting teams when none exist"""
        response = requests.get(f"{BASE_URL}/api/federation/teams",
                                headers=self.get_auth_headers())
        
        assert response.status_code == 200
        data = response.json()
        
        assert isinstance(data, list)
        print(f"✓ Got {len(data)} teams initially")
    
    def test_create_team(self):
        """Test creating a new team"""
        response = requests.post(f"{BASE_URL}/api/federation/teams",
                                 headers=self.get_auth_headers(),
                                 json={
                                     "name": "TEST Senior Team",
                                     "description": "Main national team"
                                 })
        
        assert response.status_code == 200, f"Create team failed: {response.text}"
        data = response.json()
        
        assert data["name"] == "TEST Senior Team"
        assert "id" in data
        pytest.test_team_id = data["id"]
        print(f"✓ Team created with id: {data['id']}")
    
    def test_create_u23_team(self):
        """Test creating U23 team"""
        response = requests.post(f"{BASE_URL}/api/federation/teams",
                                 headers=self.get_auth_headers(),
                                 json={
                                     "name": "TEST U23",
                                     "description": "Under-23 Olympic team"
                                 })
        
        assert response.status_code == 200
        data = response.json()
        pytest.test_u23_team_id = data["id"]
        print("✓ U23 team created")
    
    def test_get_teams_after_creation(self):
        """Test getting teams after creation"""
        response = requests.get(f"{BASE_URL}/api/federation/teams",
                                headers=self.get_auth_headers())
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) >= 2
        team_names = [t["name"] for t in data]
        assert "TEST Senior Team" in team_names
        assert "TEST U23" in team_names
        print(f"✓ Found {len(data)} teams after creation")
    
    def test_add_player_to_team(self):
        """Test adding a player to a team"""
        response = requests.post(
            f"{BASE_URL}/api/federation/teams/{pytest.test_team_id}/players",
            headers=self.get_auth_headers(),
            json={
                "player_id": pytest.test_player_id,
                "notes": "Test player addition"
            })
        
        assert response.status_code == 200, f"Add player failed: {response.text}"
        print("✓ Player added to team")
    
    def test_add_duplicate_player_to_team(self):
        """Test that adding duplicate player to team fails"""
        response = requests.post(
            f"{BASE_URL}/api/federation/teams/{pytest.test_team_id}/players",
            headers=self.get_auth_headers(),
            json={"player_id": pytest.test_player_id})
        
        assert response.status_code == 400
        print("✓ Duplicate player in team correctly prevented")
    
    def test_get_team_players(self):
        """Test getting players in a team"""
        response = requests.get(
            f"{BASE_URL}/api/federation/teams/{pytest.test_team_id}/players",
            headers=self.get_auth_headers())
        
        assert response.status_code == 200, f"Get team players failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) >= 1
        player_ids = [p["user_id"] for p in data]
        assert pytest.test_player_id in player_ids
        print(f"✓ Team has {len(data)} players")
    
    def test_remove_player_from_team(self):
        """Test removing a player from a team"""
        response = requests.delete(
            f"{BASE_URL}/api/federation/teams/{pytest.test_team_id}/players/{pytest.test_player_id}",
            headers=self.get_auth_headers())
        
        assert response.status_code == 200, f"Remove player failed: {response.text}"
        print("✓ Player removed from team")
    
    def test_delete_team(self):
        """Test deleting a team"""
        response = requests.delete(
            f"{BASE_URL}/api/federation/teams/{pytest.test_team_id}",
            headers=self.get_auth_headers())
        
        assert response.status_code == 200, f"Delete team failed: {response.text}"
        print("✓ Team deleted")


class TestAdminFederationManagement:
    """Tests for admin federation management"""
    
    def get_admin_headers(self):
        return {"Authorization": f"Bearer {pytest.admin_token}"}
    
    def test_admin_get_all_federations(self):
        """Test admin can get all federations"""
        response = requests.get(f"{BASE_URL}/api/admin/federations",
                                headers=self.get_admin_headers())
        
        assert response.status_code == 200, f"Get federations failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        # Should find our test federation
        federation_ids = [f["user_id"] for f in data]
        assert pytest.federation_user_id in federation_ids
        print(f"✓ Admin found {len(data)} federations")
    
    def test_admin_approve_federation(self):
        """Test admin can approve a federation"""
        response = requests.put(
            f"{BASE_URL}/api/admin/federations/{pytest.federation_user_id}/approve",
            headers=self.get_admin_headers(),
            json={"user_id": pytest.federation_user_id, "approved": True})
        
        assert response.status_code == 200, f"Approve failed: {response.text}"
        print("✓ Federation approved by admin")
    
    def test_federation_approved_status(self):
        """Verify federation is now approved"""
        response = requests.get(f"{BASE_URL}/api/federation/profile",
                                headers={"Authorization": f"Bearer {pytest.federation_token}"})
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["approved"] == True
        print("✓ Federation approval status confirmed")
    
    def test_admin_revoke_federation_approval(self):
        """Test admin can revoke federation approval"""
        response = requests.put(
            f"{BASE_URL}/api/admin/federations/{pytest.federation_user_id}/approve",
            headers=self.get_admin_headers(),
            json={"user_id": pytest.federation_user_id, "approved": False})
        
        assert response.status_code == 200
        print("✓ Federation approval revoked")


class TestAdminStatsIncludeFederations:
    """Test that admin stats include federation count"""
    
    def get_admin_headers(self):
        return {"Authorization": f"Bearer {pytest.admin_token}"}
    
    def test_admin_stats_has_federation_count(self):
        """Test admin stats includes total_federations"""
        response = requests.get(f"{BASE_URL}/api/admin/stats",
                                headers=self.get_admin_headers())
        
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        data = response.json()
        
        assert "total_federations" in data
        assert data["total_federations"] >= 1
        print(f"✓ Admin stats shows {data['total_federations']} federations")
        print(f"  Total players: {data['total_players']}")
        print(f"  Total clubs: {data['total_clubs']}")
        print(f"  Total federations: {data['total_federations']}")


class TestFederationAccessControl:
    """Test access control for federation endpoints"""
    
    def test_non_federation_cannot_access_federation_profile(self):
        """Test that non-federation users cannot access federation endpoints"""
        # Use player token
        response = requests.get(f"{BASE_URL}/api/federation/profile",
                                headers={"Authorization": f"Bearer {pytest.test_player_token}"})
        
        assert response.status_code == 403
        print("✓ Non-federation user correctly denied access")
    
    def test_non_federation_cannot_search_federation_players(self):
        """Test that non-federation users cannot use federation player search"""
        response = requests.get(f"{BASE_URL}/api/federation/players",
                                headers={"Authorization": f"Bearer {pytest.test_player_token}"})
        
        assert response.status_code == 403
        print("✓ Non-federation user cannot search players via federation API")
    
    def test_non_admin_cannot_view_admin_federations(self):
        """Test that non-admin users cannot view admin federation list"""
        response = requests.get(f"{BASE_URL}/api/admin/federations",
                                headers={"Authorization": f"Bearer {pytest.federation_token}"})
        
        assert response.status_code == 403
        print("✓ Non-admin cannot view admin federation list")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_data(self):
        """Clean up test users and data"""
        admin_headers = {"Authorization": f"Bearer {pytest.admin_token}"}
        
        # Delete test federation
        if hasattr(pytest, 'federation_user_id'):
            response = requests.delete(
                f"{BASE_URL}/api/admin/users/{pytest.federation_user_id}",
                headers=admin_headers)
            print(f"Cleaned up federation: {response.status_code}")
        
        # Delete test player
        if hasattr(pytest, 'test_player_id'):
            response = requests.delete(
                f"{BASE_URL}/api/admin/users/{pytest.test_player_id}",
                headers=admin_headers)
            print(f"Cleaned up player: {response.status_code}")
        
        # Delete remaining test team if exists
        if hasattr(pytest, 'test_u23_team_id') and hasattr(pytest, 'federation_token'):
            try:
                response = requests.delete(
                    f"{BASE_URL}/api/federation/teams/{pytest.test_u23_team_id}",
                    headers={"Authorization": f"Bearer {pytest.federation_token}"})
            except:
                pass
        
        print("✓ Test data cleanup completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
