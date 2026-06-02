"""
Player Evaluation System Tests
Tests for analyst registration, profile management, evaluation CRUD, and admin analyst management
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_EMAIL = "admin@soccermatch.com"
ADMIN_PASSWORD = "admin123"
ANALYST_EMAIL = "test.analyst@soccermatch.com"
ANALYST_PASSWORD = "test123"


class TestAnalystAuthentication:
    """Test analyst registration and login"""
    
    def test_analyst_registration(self):
        """Test registering a new analyst"""
        unique_email = f"test_analyst_{uuid.uuid4().hex[:8]}@test.com"
        response = requests.post(f"{BASE_URL}/api/auth/register", json={
            "email": unique_email,
            "password": "testpass123",
            "role": "analyst",
            "name": "Test Analyst"
        })
        
        # Should succeed with 200
        assert response.status_code == 200, f"Registration failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["role"] == "analyst"
        assert data["email"] == unique_email
        print(f"✓ Analyst registration successful: {unique_email}")
    
    def test_analyst_login(self):
        """Test analyst login with existing credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ANALYST_EMAIL,
            "password": ANALYST_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data["role"] == "analyst"
        print(f"✓ Analyst login successful")


class TestAnalystProfile:
    """Test analyst profile endpoints"""
    
    @pytest.fixture
    def analyst_token(self):
        """Get analyst auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ANALYST_EMAIL,
            "password": ANALYST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Analyst login failed: {response.text}")
        return response.json()["token"]
    
    def test_get_analyst_profile(self, analyst_token):
        """Test GET /api/analyst/profile"""
        response = requests.get(
            f"{BASE_URL}/api/analyst/profile",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        
        assert response.status_code == 200, f"Get profile failed: {response.text}"
        data = response.json()
        assert "user_id" in data
        assert "name" in data
        assert "approved" in data
        print(f"✓ Get analyst profile successful: {data.get('name')}")
    
    def test_update_analyst_profile(self, analyst_token):
        """Test PUT /api/analyst/profile"""
        update_data = {
            "organization": "Test Football Club",
            "specialization": "Youth Development",
            "bio": "Experienced scout with 10 years in football"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/analyst/profile",
            json=update_data,
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        
        assert response.status_code == 200, f"Update profile failed: {response.text}"
        data = response.json()
        assert data.get("organization") == "Test Football Club"
        assert data.get("specialization") == "Youth Development"
        print(f"✓ Update analyst profile successful")
    
    def test_get_analyst_stats(self, analyst_token):
        """Test GET /api/analyst/stats"""
        response = requests.get(
            f"{BASE_URL}/api/analyst/stats",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        
        assert response.status_code == 200, f"Get stats failed: {response.text}"
        data = response.json()
        assert "total_evaluations" in data
        assert "players_evaluated" in data
        assert "recommendations_breakdown" in data
        print(f"✓ Get analyst stats successful: {data.get('total_evaluations')} evaluations")


class TestEvaluationMetadata:
    """Test evaluation metadata endpoints (archetypes, metrics)"""
    
    @pytest.fixture
    def analyst_token(self):
        """Get analyst auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ANALYST_EMAIL,
            "password": ANALYST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Analyst login failed: {response.text}")
        return response.json()["token"]
    
    def test_get_archetypes(self, analyst_token):
        """Test GET /api/evaluation/archetypes"""
        response = requests.get(
            f"{BASE_URL}/api/evaluation/archetypes",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        
        assert response.status_code == 200, f"Get archetypes failed: {response.text}"
        data = response.json()
        
        # Verify structure - should have position categories
        assert "goalkeeper" in data
        assert "defender" in data
        assert "midfielder" in data
        assert "attacker" in data
        assert "winger" in data
        
        # Verify archetypes exist
        assert len(data["goalkeeper"]) > 0
        assert "Sweeper Keeper" in data["goalkeeper"]
        print(f"✓ Get archetypes successful: {len(data)} position categories")
    
    def test_get_metrics(self, analyst_token):
        """Test GET /api/evaluation/metrics"""
        response = requests.get(
            f"{BASE_URL}/api/evaluation/metrics",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        
        assert response.status_code == 200, f"Get metrics failed: {response.text}"
        data = response.json()
        
        # Verify all metric categories
        assert "technical" in data
        assert "tactical" in data
        assert "physical" in data
        assert "mental" in data
        assert "recommendation_levels" in data
        
        # Verify technical metrics (8 metrics)
        assert len(data["technical"]) == 8
        assert "passing" in data["technical"]
        assert "dribbling" in data["technical"]
        
        # Verify tactical metrics (6 metrics)
        assert len(data["tactical"]) == 6
        
        # Verify physical metrics (5 metrics)
        assert len(data["physical"]) == 5
        
        # Verify mental metrics (6 metrics)
        assert len(data["mental"]) == 6
        
        # Total should be 25 metrics (8+6+5+6)
        total_metrics = len(data["technical"]) + len(data["tactical"]) + len(data["physical"]) + len(data["mental"])
        assert total_metrics == 25, f"Expected 25 metrics, got {total_metrics}"
        
        print(f"✓ Get metrics successful: {total_metrics} total metrics")
    
    def test_get_players_for_evaluation(self, analyst_token):
        """Test GET /api/evaluation/players"""
        response = requests.get(
            f"{BASE_URL}/api/evaluation/players",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        
        assert response.status_code == 200, f"Get players failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0, "No players found for evaluation"
        
        # Verify player structure
        player = data[0]
        assert "user_id" in player
        assert "evaluations_count" in player
        
        print(f"✓ Get players for evaluation successful: {len(data)} players")


class TestEvaluationCRUD:
    """Test evaluation create, read, update, delete operations"""
    
    @pytest.fixture
    def analyst_token(self):
        """Get analyst auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ANALYST_EMAIL,
            "password": ANALYST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Analyst login failed: {response.text}")
        return response.json()["token"]
    
    @pytest.fixture
    def player_id(self, analyst_token):
        """Get a player ID for testing"""
        response = requests.get(
            f"{BASE_URL}/api/evaluation/players",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        if response.status_code != 200 or len(response.json()) == 0:
            pytest.skip("No players available for evaluation")
        return response.json()[0]["user_id"]
    
    def test_create_evaluation(self, analyst_token, player_id):
        """Test POST /api/evaluation/create"""
        # Build evaluation payload with all 25 metrics
        evaluation_data = {
            "player_id": player_id,
            "match_date": "2026-01-15",
            "match_description": "Test Match - League Game",
            "position_played": "Central Midfielder",
            "minutes_played": 90,
            "technical": {
                "passing": {"score": 7.5, "comment": "Good passing range"},
                "first_touch": {"score": 7.0, "comment": ""},
                "ball_control": {"score": 7.5, "comment": ""},
                "dribbling": {"score": 6.5, "comment": ""},
                "finishing": {"score": 5.0, "comment": ""},
                "crossing": {"score": 6.0, "comment": ""},
                "tackling": {"score": 7.0, "comment": ""},
                "heading": {"score": 5.5, "comment": ""}
            },
            "tactical": {
                "positioning": {"score": 8.0, "comment": "Excellent positioning"},
                "decision_making": {"score": 7.5, "comment": ""},
                "game_intelligence": {"score": 8.0, "comment": ""},
                "defensive_awareness": {"score": 7.0, "comment": ""},
                "movement_off_ball": {"score": 7.5, "comment": ""},
                "transition_play": {"score": 7.0, "comment": ""}
            },
            "physical": {
                "speed": {"score": 6.5, "comment": ""},
                "acceleration": {"score": 6.5, "comment": ""},
                "agility": {"score": 7.0, "comment": ""},
                "strength": {"score": 6.0, "comment": ""},
                "endurance": {"score": 8.0, "comment": "Good stamina"}
            },
            "mental": {
                "leadership": {"score": 7.5, "comment": ""},
                "communication": {"score": 7.0, "comment": ""},
                "confidence": {"score": 7.5, "comment": ""},
                "discipline": {"score": 8.0, "comment": ""},
                "work_rate": {"score": 8.5, "comment": "Excellent work rate"},
                "competitive_mentality": {"score": 8.0, "comment": ""}
            },
            "archetypes": ["Box-to-Box Midfielder", "Ball Winning Midfielder"],
            "recommendation": "recommend",
            "video_references": [],
            "executive_summary": "Solid midfielder with good tactical awareness",
            "strengths_notes": "Strong work rate and positioning",
            "weaknesses_notes": "Could improve finishing",
            "development_potential": "High potential for top-level play",
            "generate_ai_report": False  # Skip AI to speed up test
        }
        
        response = requests.post(
            f"{BASE_URL}/api/evaluation/create",
            json=evaluation_data,
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        
        assert response.status_code == 200, f"Create evaluation failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert data["player_id"] == player_id
        assert data["match_description"] == "Test Match - League Game"
        assert data["recommendation"] == "recommend"
        
        # Verify computed scores
        assert "technical_score" in data
        assert "tactical_score" in data
        assert "physical_score" in data
        assert "mental_score" in data
        assert "attacking_score" in data
        assert "defending_score" in data
        
        # Verify strengths/weaknesses extracted
        assert "top_strengths" in data
        assert "development_areas" in data
        
        print(f"✓ Create evaluation successful: ID={data['id']}")
        return data["id"]
    
    def test_get_evaluation(self, analyst_token, player_id):
        """Test GET /api/evaluation/{id}"""
        # First create an evaluation
        evaluation_data = {
            "player_id": player_id,
            "match_date": "2026-01-16",
            "match_description": "Test Match for GET",
            "position_played": "Striker",
            "minutes_played": 75,
            "technical": {
                "passing": {"score": 6.0, "comment": ""},
                "first_touch": {"score": 7.0, "comment": ""},
                "ball_control": {"score": 7.0, "comment": ""},
                "dribbling": {"score": 7.5, "comment": ""},
                "finishing": {"score": 8.5, "comment": "Clinical finisher"},
                "crossing": {"score": 5.0, "comment": ""},
                "tackling": {"score": 4.0, "comment": ""},
                "heading": {"score": 7.0, "comment": ""}
            },
            "tactical": {
                "positioning": {"score": 8.0, "comment": ""},
                "decision_making": {"score": 7.0, "comment": ""},
                "game_intelligence": {"score": 7.5, "comment": ""},
                "defensive_awareness": {"score": 4.5, "comment": ""},
                "movement_off_ball": {"score": 8.5, "comment": "Excellent runs"},
                "transition_play": {"score": 7.0, "comment": ""}
            },
            "physical": {
                "speed": {"score": 8.0, "comment": ""},
                "acceleration": {"score": 8.5, "comment": ""},
                "agility": {"score": 7.5, "comment": ""},
                "strength": {"score": 6.5, "comment": ""},
                "endurance": {"score": 7.0, "comment": ""}
            },
            "mental": {
                "leadership": {"score": 6.0, "comment": ""},
                "communication": {"score": 6.0, "comment": ""},
                "confidence": {"score": 8.5, "comment": ""},
                "discipline": {"score": 7.0, "comment": ""},
                "work_rate": {"score": 7.5, "comment": ""},
                "competitive_mentality": {"score": 9.0, "comment": "Winner mentality"}
            },
            "archetypes": ["Poacher", "Pressing Forward"],
            "recommendation": "strongly_recommend",
            "generate_ai_report": False
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/evaluation/create",
            json=evaluation_data,
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        assert create_response.status_code == 200
        eval_id = create_response.json()["id"]
        
        # Now GET the evaluation
        response = requests.get(
            f"{BASE_URL}/api/evaluation/{eval_id}",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        
        assert response.status_code == 200, f"Get evaluation failed: {response.text}"
        data = response.json()
        
        assert data["id"] == eval_id
        assert data["match_description"] == "Test Match for GET"
        assert data["recommendation"] == "strongly_recommend"
        
        print(f"✓ Get evaluation successful: ID={eval_id}")
    
    def test_get_analyst_evaluations(self, analyst_token):
        """Test GET /api/analyst/evaluations"""
        response = requests.get(
            f"{BASE_URL}/api/analyst/evaluations",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        
        assert response.status_code == 200, f"Get analyst evaluations failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        # Should have at least the evaluations we created
        print(f"✓ Get analyst evaluations successful: {len(data)} evaluations")


class TestPlayerDashboard:
    """Test player scouting dashboard endpoint"""
    
    @pytest.fixture
    def analyst_token(self):
        """Get analyst auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ANALYST_EMAIL,
            "password": ANALYST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Analyst login failed: {response.text}")
        return response.json()["token"]
    
    @pytest.fixture
    def player_id(self, analyst_token):
        """Get a player ID for testing"""
        response = requests.get(
            f"{BASE_URL}/api/evaluation/players",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        if response.status_code != 200 or len(response.json()) == 0:
            pytest.skip("No players available")
        return response.json()[0]["user_id"]
    
    def test_get_player_dashboard(self, analyst_token, player_id):
        """Test GET /api/player/{id}/dashboard"""
        response = requests.get(
            f"{BASE_URL}/api/player/{player_id}/dashboard",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        
        assert response.status_code == 200, f"Get player dashboard failed: {response.text}"
        data = response.json()
        
        # Verify dashboard structure
        assert "player" in data
        assert "evaluations_count" in data
        assert "evolution" in data
        assert "all_evaluations" in data
        
        print(f"✓ Get player dashboard successful: {data.get('evaluations_count')} evaluations")


class TestAdminAnalystManagement:
    """Test admin endpoints for analyst management"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Admin login failed: {response.text}")
        return response.json()["token"]
    
    def test_get_all_analysts(self, admin_token):
        """Test GET /api/admin/analysts"""
        response = requests.get(
            f"{BASE_URL}/api/admin/analysts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Get all analysts failed: {response.text}"
        data = response.json()
        
        assert isinstance(data, list)
        assert len(data) > 0, "No analysts found"
        
        # Verify analyst structure
        analyst = data[0]
        assert "user_id" in analyst
        assert "name" in analyst
        assert "approved" in analyst
        
        print(f"✓ Get all analysts successful: {len(data)} analysts")
    
    def test_approve_analyst(self, admin_token):
        """Test PUT /api/admin/analysts/{id}/approve"""
        # First get an analyst
        response = requests.get(
            f"{BASE_URL}/api/admin/analysts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        analysts = response.json()
        
        if len(analysts) == 0:
            pytest.skip("No analysts to approve")
        
        analyst_id = analysts[0]["user_id"]
        
        # Approve the analyst
        response = requests.put(
            f"{BASE_URL}/api/admin/analysts/{analyst_id}/approve?approved=true",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Approve analyst failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert data.get("approved") == True
        
        print(f"✓ Approve analyst successful: {analyst_id}")
    
    def test_verify_analyst(self, admin_token):
        """Test PUT /api/admin/analysts/{id}/verify"""
        # First get an analyst
        response = requests.get(
            f"{BASE_URL}/api/admin/analysts",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        analysts = response.json()
        
        if len(analysts) == 0:
            pytest.skip("No analysts to verify")
        
        analyst_id = analysts[0]["user_id"]
        
        # Verify the analyst
        response = requests.put(
            f"{BASE_URL}/api/admin/analysts/{analyst_id}/verify?verified=true",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200, f"Verify analyst failed: {response.text}"
        data = response.json()
        assert data.get("success") == True
        
        print(f"✓ Verify analyst successful: {analyst_id}")


class TestEvaluationWithAI:
    """Test evaluation with AI report generation (slower test)"""
    
    @pytest.fixture
    def analyst_token(self):
        """Get analyst auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": ANALYST_EMAIL,
            "password": ANALYST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip(f"Analyst login failed: {response.text}")
        return response.json()["token"]
    
    @pytest.fixture
    def player_id(self, analyst_token):
        """Get a player ID for testing"""
        response = requests.get(
            f"{BASE_URL}/api/evaluation/players",
            headers={"Authorization": f"Bearer {analyst_token}"}
        )
        if response.status_code != 200 or len(response.json()) == 0:
            pytest.skip("No players available for evaluation")
        return response.json()[0]["user_id"]
    
    def test_create_evaluation_with_ai_report(self, analyst_token, player_id):
        """Test creating evaluation with AI report generation"""
        evaluation_data = {
            "player_id": player_id,
            "match_date": "2026-01-17",
            "match_description": "AI Test - Champions League Quarter Final",
            "position_played": "Attacking Midfielder",
            "minutes_played": 90,
            "technical": {
                "passing": {"score": 8.5, "comment": "Exceptional vision"},
                "first_touch": {"score": 8.0, "comment": ""},
                "ball_control": {"score": 8.5, "comment": ""},
                "dribbling": {"score": 9.0, "comment": "World class dribbler"},
                "finishing": {"score": 7.5, "comment": ""},
                "crossing": {"score": 7.0, "comment": ""},
                "tackling": {"score": 5.0, "comment": ""},
                "heading": {"score": 5.5, "comment": ""}
            },
            "tactical": {
                "positioning": {"score": 8.5, "comment": ""},
                "decision_making": {"score": 9.0, "comment": "Elite decision making"},
                "game_intelligence": {"score": 9.5, "comment": "Genius level"},
                "defensive_awareness": {"score": 5.5, "comment": ""},
                "movement_off_ball": {"score": 8.5, "comment": ""},
                "transition_play": {"score": 8.0, "comment": ""}
            },
            "physical": {
                "speed": {"score": 7.5, "comment": ""},
                "acceleration": {"score": 8.0, "comment": ""},
                "agility": {"score": 9.0, "comment": "Exceptional agility"},
                "strength": {"score": 6.0, "comment": ""},
                "endurance": {"score": 7.5, "comment": ""}
            },
            "mental": {
                "leadership": {"score": 8.0, "comment": ""},
                "communication": {"score": 7.5, "comment": ""},
                "confidence": {"score": 9.5, "comment": "Supreme confidence"},
                "discipline": {"score": 7.0, "comment": ""},
                "work_rate": {"score": 7.5, "comment": ""},
                "competitive_mentality": {"score": 9.0, "comment": ""}
            },
            "archetypes": ["Advanced Playmaker", "Inside Forward"],
            "recommendation": "strongly_recommend",
            "generate_ai_report": True  # Enable AI report
        }
        
        response = requests.post(
            f"{BASE_URL}/api/evaluation/create",
            json=evaluation_data,
            headers={"Authorization": f"Bearer {analyst_token}"},
            timeout=60  # AI generation may take time
        )
        
        assert response.status_code == 200, f"Create evaluation with AI failed: {response.text}"
        data = response.json()
        
        # Verify AI report was generated
        assert data.get("ai_report_generated") == True, "AI report was not generated"
        
        # Verify AI-generated content exists
        assert data.get("executive_summary") is not None, "Missing executive_summary"
        assert data.get("strengths_notes") is not None, "Missing strengths_notes"
        
        print(f"✓ Create evaluation with AI report successful")
        print(f"  - Executive Summary: {data.get('executive_summary', '')[:100]}...")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
