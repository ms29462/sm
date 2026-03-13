"""
Test suite for Chat Requests and Privacy Controls
Features tested:
1. Privacy controls - Email visibility for different user roles
2. Chat request creation by club
3. Chat request viewing (player and club)
4. Chat request response (accept/reject) by player
5. Admin chat requests management
6. Notifications for chat requests
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@soccermatch.com"
ADMIN_PASSWORD = "admin123"

class TestAuthSetup:
    """Create test users for the test suite"""
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_admin_login(self, session):
        """Admin login to get token"""
        response = session.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["role"] == "admin"
        # Store admin token
        session.headers["admin_token"] = data["token"]
        session.headers["admin_user_id"] = data["user_id"]
        print(f"Admin login successful, user_id: {data['user_id']}")


class TestUserCreation:
    """Create test player and club for chat request flow tests"""
    
    @pytest.fixture(scope="class")
    def test_data(self):
        """Shared test data storage"""
        return {}
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_create_test_player(self, session, test_data):
        """Register a test player"""
        unique_id = str(uuid.uuid4())[:8]
        player_email = f"TEST_player_{unique_id}@test.com"
        
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": player_email,
            "password": "testpass123",
            "role": "player",
            "name": f"Test Player {unique_id}"
        })
        assert response.status_code == 200, f"Player registration failed: {response.text}"
        data = response.json()
        
        test_data["player_token"] = data["token"]
        test_data["player_id"] = data["user_id"]
        test_data["player_email"] = player_email
        test_data["player_name"] = f"Test Player {unique_id}"
        print(f"Test player created: {test_data['player_id']}")
    
    def test_create_test_club(self, session, test_data):
        """Register a test club"""
        unique_id = str(uuid.uuid4())[:8]
        club_email = f"TEST_club_{unique_id}@test.com"
        
        response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": club_email,
            "password": "testpass123",
            "role": "club",
            "name": f"Test Club {unique_id}"
        })
        assert response.status_code == 200, f"Club registration failed: {response.text}"
        data = response.json()
        
        test_data["club_token"] = data["token"]
        test_data["club_id"] = data["user_id"]
        test_data["club_email"] = club_email
        test_data["club_name"] = f"Test Club {unique_id}"
        print(f"Test club created: {test_data['club_id']}")
    
    def test_admin_approve_player(self, session, test_data):
        """Admin approves the test player"""
        # First login as admin
        admin_response = session.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert admin_response.status_code == 200
        admin_token = admin_response.json()["token"]
        test_data["admin_token"] = admin_token
        
        # Approve player
        response = session.put(
            f"{BASE_URL}/api/admin/players/{test_data['player_id']}/approve",
            json={"user_id": test_data["player_id"], "approved": True},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200, f"Player approval failed: {response.text}"
        print(f"Player {test_data['player_id']} approved")
    
    def test_admin_approve_club(self, session, test_data):
        """Admin approves the test club"""
        response = session.put(
            f"{BASE_URL}/api/admin/clubs/{test_data['club_id']}/approve",
            json={"user_id": test_data["club_id"], "approved": True},
            headers={"Authorization": f"Bearer {test_data['admin_token']}"}
        )
        assert response.status_code == 200, f"Club approval failed: {response.text}"
        print(f"Club {test_data['club_id']} approved")


class TestPrivacyControls:
    """Test email visibility based on user role"""
    
    @pytest.fixture(scope="class")
    def test_data(self):
        """Create fresh test data for privacy tests"""
        return {}
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_setup_users(self, session, test_data):
        """Setup player, club and get admin token"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create and approve player
        player_email = f"TEST_privacy_player_{unique_id}@test.com"
        player_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": player_email,
            "password": "testpass123",
            "role": "player",
            "name": f"Privacy Test Player {unique_id}"
        })
        assert player_response.status_code == 200
        player_data = player_response.json()
        test_data["player_id"] = player_data["user_id"]
        test_data["player_token"] = player_data["token"]
        test_data["player_email"] = player_email
        
        # Create and approve club
        club_email = f"TEST_privacy_club_{unique_id}@test.com"
        club_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": club_email,
            "password": "testpass123",
            "role": "club",
            "name": f"Privacy Test Club {unique_id}"
        })
        assert club_response.status_code == 200
        club_data = club_response.json()
        test_data["club_id"] = club_data["user_id"]
        test_data["club_token"] = club_data["token"]
        
        # Admin login and approve
        admin_response = session.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert admin_response.status_code == 200
        admin_token = admin_response.json()["token"]
        test_data["admin_token"] = admin_token
        
        # Approve player
        session.put(
            f"{BASE_URL}/api/admin/players/{test_data['player_id']}/approve",
            json={"user_id": test_data["player_id"], "approved": True},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"Setup complete: player_id={test_data['player_id']}")
    
    def test_club_cannot_see_player_email(self, session, test_data):
        """PRIVACY: Club user should NOT see player email"""
        response = session.get(
            f"{BASE_URL}/api/players/{test_data['player_id']}",
            headers={"Authorization": f"Bearer {test_data['club_token']}"}
        )
        assert response.status_code == 200, f"Get player failed: {response.text}"
        player = response.json()
        
        # Email should be None or not present
        assert player.get("email") is None, f"Club can see player email! Got: {player.get('email')}"
        print(f"PASS: Club cannot see player email (email is hidden)")
    
    def test_admin_can_see_player_email(self, session, test_data):
        """PRIVACY: Admin user should see player email"""
        response = session.get(
            f"{BASE_URL}/api/players/{test_data['player_id']}",
            headers={"Authorization": f"Bearer {test_data['admin_token']}"}
        )
        assert response.status_code == 200, f"Admin get player failed: {response.text}"
        player = response.json()
        
        # Admin should see email
        assert player.get("email") == test_data["player_email"], \
            f"Admin cannot see player email! Expected: {test_data['player_email']}, Got: {player.get('email')}"
        print(f"PASS: Admin can see player email: {player.get('email')}")
    
    def test_club_players_list_no_email(self, session, test_data):
        """PRIVACY: Player list for club should not contain emails"""
        response = session.get(
            f"{BASE_URL}/api/players",
            headers={"Authorization": f"Bearer {test_data['club_token']}"}
        )
        assert response.status_code == 200, f"Get players list failed: {response.text}"
        players = response.json()
        
        # Check each player has no email
        for player in players:
            assert player.get("email") is None, f"Player list contains email: {player}"
        print(f"PASS: Player list ({len(players)} players) has no emails exposed")


class TestChatRequestFlow:
    """Test the complete chat request flow"""
    
    @pytest.fixture(scope="class")
    def test_data(self):
        return {}
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_setup_users_for_chat(self, session, test_data):
        """Setup player, club and admin for chat request tests"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create player
        player_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_chatflow_player_{unique_id}@test.com",
            "password": "testpass123",
            "role": "player",
            "name": f"ChatFlow Player {unique_id}"
        })
        assert player_response.status_code == 200
        player_data = player_response.json()
        test_data["player_id"] = player_data["user_id"]
        test_data["player_token"] = player_data["token"]
        test_data["player_name"] = f"ChatFlow Player {unique_id}"
        
        # Create club
        club_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_chatflow_club_{unique_id}@test.com",
            "password": "testpass123",
            "role": "club",
            "name": f"ChatFlow Club {unique_id}"
        })
        assert club_response.status_code == 200
        club_data = club_response.json()
        test_data["club_id"] = club_data["user_id"]
        test_data["club_token"] = club_data["token"]
        test_data["club_name"] = f"ChatFlow Club {unique_id}"
        
        # Admin login
        admin_response = session.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        assert admin_response.status_code == 200
        test_data["admin_token"] = admin_response.json()["token"]
        
        # Approve player
        session.put(
            f"{BASE_URL}/api/admin/players/{test_data['player_id']}/approve",
            json={"user_id": test_data["player_id"], "approved": True},
            headers={"Authorization": f"Bearer {test_data['admin_token']}"}
        )
        print(f"Chat flow test setup complete")
    
    def test_club_creates_chat_request(self, session, test_data):
        """Club creates a chat request to a player"""
        response = session.post(
            f"{BASE_URL}/api/chat-requests",
            json={
                "player_id": test_data["player_id"],
                "message": "We are interested in discussing a contract opportunity"
            },
            headers={"Authorization": f"Bearer {test_data['club_token']}"}
        )
        assert response.status_code == 200, f"Create chat request failed: {response.text}"
        data = response.json()
        
        assert "request_id" in data
        test_data["chat_request_id"] = data["request_id"]
        print(f"PASS: Chat request created with ID: {data['request_id']}")
    
    def test_club_cannot_create_duplicate_request(self, session, test_data):
        """Club cannot create duplicate pending request"""
        response = session.post(
            f"{BASE_URL}/api/chat-requests",
            json={
                "player_id": test_data["player_id"],
                "message": "Duplicate request"
            },
            headers={"Authorization": f"Bearer {test_data['club_token']}"}
        )
        assert response.status_code == 400, "Duplicate request should fail"
        print("PASS: Duplicate chat request correctly rejected")
    
    def test_player_can_view_incoming_requests(self, session, test_data):
        """Player can view incoming chat requests"""
        response = session.get(
            f"{BASE_URL}/api/chat-requests/my",
            headers={"Authorization": f"Bearer {test_data['player_token']}"}
        )
        assert response.status_code == 200, f"Get player requests failed: {response.text}"
        requests_list = response.json()
        
        assert len(requests_list) >= 1, "Player should have at least 1 request"
        
        # Find our request
        our_request = next((r for r in requests_list if r["id"] == test_data["chat_request_id"]), None)
        assert our_request is not None, "Our chat request not found"
        assert our_request["status"] == "pending"
        assert our_request["club_name"] == test_data["club_name"]
        print(f"PASS: Player can see incoming request from {our_request['club_name']}")
    
    def test_club_can_view_outgoing_requests(self, session, test_data):
        """Club can view outgoing chat requests"""
        response = session.get(
            f"{BASE_URL}/api/chat-requests/my",
            headers={"Authorization": f"Bearer {test_data['club_token']}"}
        )
        assert response.status_code == 200, f"Get club requests failed: {response.text}"
        requests_list = response.json()
        
        assert len(requests_list) >= 1, "Club should have at least 1 request"
        
        our_request = next((r for r in requests_list if r["id"] == test_data["chat_request_id"]), None)
        assert our_request is not None, "Our chat request not found"
        assert our_request["status"] == "pending"
        print(f"PASS: Club can see outgoing request")
    
    def test_admin_can_view_all_chat_requests(self, session, test_data):
        """Admin can view all chat requests"""
        response = session.get(
            f"{BASE_URL}/api/admin/chat-requests",
            headers={"Authorization": f"Bearer {test_data['admin_token']}"}
        )
        assert response.status_code == 200, f"Admin get requests failed: {response.text}"
        requests_list = response.json()
        
        # Should have at least our request
        our_request = next((r for r in requests_list if r["id"] == test_data["chat_request_id"]), None)
        assert our_request is not None, "Admin should see all requests"
        print(f"PASS: Admin can view all chat requests ({len(requests_list)} total)")
    
    def test_player_accepts_chat_request(self, session, test_data):
        """Player accepts the chat request"""
        response = session.put(
            f"{BASE_URL}/api/chat-requests/{test_data['chat_request_id']}/respond",
            json={"status": "accepted"},
            headers={"Authorization": f"Bearer {test_data['player_token']}"}
        )
        assert response.status_code == 200, f"Accept request failed: {response.text}"
        data = response.json()
        
        assert "accepted" in data["message"].lower()
        print(f"PASS: Player accepted chat request")
    
    def test_request_status_updated_to_accepted(self, session, test_data):
        """Verify request status is now accepted"""
        response = session.get(
            f"{BASE_URL}/api/chat-requests/my",
            headers={"Authorization": f"Bearer {test_data['player_token']}"}
        )
        assert response.status_code == 200
        requests_list = response.json()
        
        our_request = next((r for r in requests_list if r["id"] == test_data["chat_request_id"]), None)
        assert our_request is not None
        assert our_request["status"] == "accepted", f"Status should be accepted, got: {our_request['status']}"
        print(f"PASS: Request status is now 'accepted'")


class TestChatRequestRejection:
    """Test chat request rejection flow"""
    
    @pytest.fixture(scope="class")
    def test_data(self):
        return {}
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_setup_for_rejection(self, session, test_data):
        """Setup fresh users for rejection test"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create player
        player_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_reject_player_{unique_id}@test.com",
            "password": "testpass123",
            "role": "player",
            "name": f"Reject Test Player {unique_id}"
        })
        assert player_response.status_code == 200
        player_data = player_response.json()
        test_data["player_id"] = player_data["user_id"]
        test_data["player_token"] = player_data["token"]
        
        # Create club
        club_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_reject_club_{unique_id}@test.com",
            "password": "testpass123",
            "role": "club",
            "name": f"Reject Test Club {unique_id}"
        })
        assert club_response.status_code == 200
        club_data = club_response.json()
        test_data["club_id"] = club_data["user_id"]
        test_data["club_token"] = club_data["token"]
        
        # Admin login and approve player
        admin_response = session.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        test_data["admin_token"] = admin_response.json()["token"]
        
        session.put(
            f"{BASE_URL}/api/admin/players/{test_data['player_id']}/approve",
            json={"user_id": test_data["player_id"], "approved": True},
            headers={"Authorization": f"Bearer {test_data['admin_token']}"}
        )
        print("Rejection test setup complete")
    
    def test_create_request_for_rejection(self, session, test_data):
        """Create a chat request to be rejected"""
        response = session.post(
            f"{BASE_URL}/api/chat-requests",
            json={
                "player_id": test_data["player_id"],
                "message": "Request that will be rejected"
            },
            headers={"Authorization": f"Bearer {test_data['club_token']}"}
        )
        assert response.status_code == 200
        test_data["request_id"] = response.json()["request_id"]
        print(f"Created request for rejection: {test_data['request_id']}")
    
    def test_player_rejects_request(self, session, test_data):
        """Player rejects the chat request"""
        response = session.put(
            f"{BASE_URL}/api/chat-requests/{test_data['request_id']}/respond",
            json={"status": "rejected"},
            headers={"Authorization": f"Bearer {test_data['player_token']}"}
        )
        assert response.status_code == 200, f"Reject request failed: {response.text}"
        data = response.json()
        
        assert "rejected" in data["message"].lower()
        print("PASS: Player rejected chat request")
    
    def test_request_status_is_rejected(self, session, test_data):
        """Verify request status is now rejected"""
        response = session.get(
            f"{BASE_URL}/api/chat-requests/my",
            headers={"Authorization": f"Bearer {test_data['player_token']}"}
        )
        assert response.status_code == 200
        requests_list = response.json()
        
        our_request = next((r for r in requests_list if r["id"] == test_data["request_id"]), None)
        assert our_request is not None
        assert our_request["status"] == "rejected", f"Status should be rejected, got: {our_request['status']}"
        print("PASS: Request status is now 'rejected'")


class TestNotifications:
    """Test notification creation for chat requests"""
    
    @pytest.fixture(scope="class")
    def test_data(self):
        return {}
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_setup_for_notifications(self, session, test_data):
        """Setup users for notification test"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create player
        player_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_notif_player_{unique_id}@test.com",
            "password": "testpass123",
            "role": "player",
            "name": f"Notif Test Player {unique_id}"
        })
        assert player_response.status_code == 200
        test_data["player_id"] = player_response.json()["user_id"]
        test_data["player_token"] = player_response.json()["token"]
        
        # Create club
        club_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_notif_club_{unique_id}@test.com",
            "password": "testpass123",
            "role": "club",
            "name": f"Notif Test Club {unique_id}"
        })
        assert club_response.status_code == 200
        test_data["club_id"] = club_response.json()["user_id"]
        test_data["club_token"] = club_response.json()["token"]
        
        # Admin login and approve
        admin_response = session.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        test_data["admin_token"] = admin_response.json()["token"]
        
        session.put(
            f"{BASE_URL}/api/admin/players/{test_data['player_id']}/approve",
            json={"user_id": test_data["player_id"], "approved": True},
            headers={"Authorization": f"Bearer {test_data['admin_token']}"}
        )
        print("Notification test setup complete")
    
    def test_player_gets_notification_on_chat_request(self, session, test_data):
        """Player receives notification when club requests chat"""
        # Get initial notification count
        initial_response = session.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {test_data['player_token']}"}
        )
        initial_count = len(initial_response.json()) if initial_response.status_code == 200 else 0
        
        # Club creates chat request
        request_response = session.post(
            f"{BASE_URL}/api/chat-requests",
            json={
                "player_id": test_data["player_id"],
                "message": "Test notification"
            },
            headers={"Authorization": f"Bearer {test_data['club_token']}"}
        )
        assert request_response.status_code == 200
        
        # Check player notifications
        notif_response = session.get(
            f"{BASE_URL}/api/notifications",
            headers={"Authorization": f"Bearer {test_data['player_token']}"}
        )
        assert notif_response.status_code == 200
        notifications = notif_response.json()
        
        # Should have at least one more notification
        assert len(notifications) > initial_count, "Player should receive notification"
        
        # Check for chat_request type notification
        chat_notifs = [n for n in notifications if n.get("type") == "chat_request"]
        assert len(chat_notifs) > 0, "Player should have chat_request notification"
        print(f"PASS: Player received notification ({len(notifications)} total)")


class TestAccessControl:
    """Test access control for chat request endpoints"""
    
    @pytest.fixture(scope="class")
    def test_data(self):
        return {}
    
    @pytest.fixture(scope="class")
    def session(self):
        return requests.Session()
    
    def test_setup_access_control(self, session, test_data):
        """Setup for access control tests"""
        unique_id = str(uuid.uuid4())[:8]
        
        # Create player
        player_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_access_player_{unique_id}@test.com",
            "password": "testpass123",
            "role": "player",
            "name": f"Access Test Player {unique_id}"
        })
        assert player_response.status_code == 200
        test_data["player_id"] = player_response.json()["user_id"]
        test_data["player_token"] = player_response.json()["token"]
        
        # Create club
        club_response = session.post(f"{BASE_URL}/api/auth/register", json={
            "email": f"TEST_access_club_{unique_id}@test.com",
            "password": "testpass123",
            "role": "club",
            "name": f"Access Test Club {unique_id}"
        })
        assert club_response.status_code == 200
        test_data["club_token"] = club_response.json()["token"]
        
        # Admin
        admin_response = session.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        test_data["admin_token"] = admin_response.json()["token"]
    
    def test_player_cannot_create_chat_request(self, session, test_data):
        """Players cannot create chat requests (only clubs can)"""
        response = session.post(
            f"{BASE_URL}/api/chat-requests",
            json={"player_id": "some-id", "message": "test"},
            headers={"Authorization": f"Bearer {test_data['player_token']}"}
        )
        assert response.status_code == 403, "Players should not create chat requests"
        print("PASS: Players cannot create chat requests")
    
    def test_club_cannot_respond_to_request(self, session, test_data):
        """Clubs cannot respond to chat requests (only players can)"""
        # First create a valid request
        # (Need to approve player first)
        session.put(
            f"{BASE_URL}/api/admin/players/{test_data['player_id']}/approve",
            json={"user_id": test_data["player_id"], "approved": True},
            headers={"Authorization": f"Bearer {test_data['admin_token']}"}
        )
        
        create_response = session.post(
            f"{BASE_URL}/api/chat-requests",
            json={"player_id": test_data["player_id"], "message": "test"},
            headers={"Authorization": f"Bearer {test_data['club_token']}"}
        )
        
        if create_response.status_code == 200:
            request_id = create_response.json()["request_id"]
            
            # Club tries to respond
            respond_response = session.put(
                f"{BASE_URL}/api/chat-requests/{request_id}/respond",
                json={"status": "accepted"},
                headers={"Authorization": f"Bearer {test_data['club_token']}"}
            )
            assert respond_response.status_code == 403, "Clubs should not respond to requests"
            print("PASS: Clubs cannot respond to chat requests")
        else:
            print(f"Skipping: Could not create request: {create_response.text}")
    
    def test_non_admin_cannot_view_all_requests(self, session, test_data):
        """Non-admins cannot view admin chat request list"""
        response = session.get(
            f"{BASE_URL}/api/admin/chat-requests",
            headers={"Authorization": f"Bearer {test_data['club_token']}"}
        )
        assert response.status_code == 403, "Non-admins should not view admin requests"
        
        response2 = session.get(
            f"{BASE_URL}/api/admin/chat-requests",
            headers={"Authorization": f"Bearer {test_data['player_token']}"}
        )
        assert response2.status_code == 403, "Players should not view admin requests"
        print("PASS: Non-admins cannot access admin chat requests endpoint")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
