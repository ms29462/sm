"""
Test suite for Player Evaluation PDF Export and English Interface
Tests: PDF export endpoint, player dashboard, English labels verification
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ANALYST_EMAIL = "test.analyst@soccermatch.com"
ANALYST_PASSWORD = "test123"
ADMIN_EMAIL = "admin@soccermatch.com"
ADMIN_PASSWORD = "admin123"


class TestPDFExport:
    """PDF Export endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_analyst_token(self):
        """Get analyst authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ANALYST_EMAIL,
            "password": ANALYST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def get_admin_token(self):
        """Get admin authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_analyst_login(self):
        """Test analyst can login"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ANALYST_EMAIL,
            "password": ANALYST_PASSWORD
        })
        assert response.status_code == 200, f"Analyst login failed: {response.text}"
        data = response.json()
        assert "token" in data
        assert data.get("role") == "analyst"
        print("✓ Analyst login successful")
    
    def test_get_analyst_evaluations(self):
        """Test getting analyst's evaluations"""
        token = self.get_analyst_token()
        assert token, "Failed to get analyst token"
        
        response = self.session.get(
            f"{BASE_URL}/api/analyst/evaluations",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200, f"Failed to get evaluations: {response.text}"
        evaluations = response.json()
        assert isinstance(evaluations, list)
        print(f"✓ Got {len(evaluations)} evaluations")
        return evaluations
    
    def test_pdf_export_requires_auth(self):
        """Test PDF export requires authentication"""
        # First get an evaluation ID
        token = self.get_analyst_token()
        assert token, "Failed to get analyst token"
        
        response = self.session.get(
            f"{BASE_URL}/api/analyst/evaluations",
            headers={"Authorization": f"Bearer {token}"}
        )
        evaluations = response.json()
        
        if not evaluations:
            pytest.skip("No evaluations available for testing")
        
        eval_id = evaluations[0].get("id")
        
        # Try without auth
        response = self.session.get(f"{BASE_URL}/api/evaluation/{eval_id}/export-pdf")
        assert response.status_code in [401, 403], "PDF export should require authentication"
        print("✓ PDF export requires authentication")
    
    def test_pdf_export_returns_valid_pdf(self):
        """Test PDF export returns valid PDF file"""
        token = self.get_analyst_token()
        assert token, "Failed to get analyst token"
        
        # Get evaluations
        response = self.session.get(
            f"{BASE_URL}/api/analyst/evaluations",
            headers={"Authorization": f"Bearer {token}"}
        )
        evaluations = response.json()
        
        if not evaluations:
            pytest.skip("No evaluations available for testing")
        
        eval_id = evaluations[0].get("id")
        
        # Export PDF
        response = self.session.get(
            f"{BASE_URL}/api/evaluation/{eval_id}/export-pdf",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"PDF export failed: {response.status_code}"
        
        # Check content type
        content_type = response.headers.get("Content-Type", "")
        assert "application/pdf" in content_type, f"Expected PDF content type, got: {content_type}"
        
        # Check content disposition
        content_disp = response.headers.get("Content-Disposition", "")
        assert "attachment" in content_disp, "Expected attachment disposition"
        assert ".pdf" in content_disp, "Expected .pdf in filename"
        
        # Check PDF magic bytes
        pdf_content = response.content
        assert len(pdf_content) > 0, "PDF content is empty"
        assert pdf_content[:4] == b'%PDF', "Content does not start with PDF magic bytes"
        
        print(f"✓ PDF export successful - {len(pdf_content)} bytes")
    
    def test_pdf_export_nonexistent_evaluation(self):
        """Test PDF export with non-existent evaluation ID"""
        token = self.get_analyst_token()
        assert token, "Failed to get analyst token"
        
        response = self.session.get(
            f"{BASE_URL}/api/evaluation/nonexistent-id-12345/export-pdf",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print("✓ Non-existent evaluation returns 404")


class TestPlayerDashboard:
    """Player Dashboard endpoint tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_analyst_token(self):
        """Get analyst authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ANALYST_EMAIL,
            "password": ANALYST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_get_players_for_evaluation(self):
        """Test getting players list for evaluation"""
        token = self.get_analyst_token()
        assert token, "Failed to get analyst token"
        
        response = self.session.get(
            f"{BASE_URL}/api/evaluation/players",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Failed to get players: {response.text}"
        players = response.json()
        assert isinstance(players, list)
        assert len(players) > 0, "Expected at least one player"
        
        # Check player structure
        player = players[0]
        assert "user_id" in player
        print(f"✓ Got {len(players)} players for evaluation")
        return players
    
    def test_player_dashboard_endpoint(self):
        """Test player dashboard endpoint returns correct data"""
        token = self.get_analyst_token()
        assert token, "Failed to get analyst token"
        
        # Get a player ID
        response = self.session.get(
            f"{BASE_URL}/api/evaluation/players",
            headers={"Authorization": f"Bearer {token}"}
        )
        players = response.json()
        
        if not players:
            pytest.skip("No players available for testing")
        
        player_id = players[0].get("user_id")
        
        # Get player dashboard
        response = self.session.get(
            f"{BASE_URL}/api/player/{player_id}/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200, f"Dashboard failed: {response.text}"
        dashboard = response.json()
        
        # Verify dashboard structure
        assert "player" in dashboard
        assert "evaluations_count" in dashboard
        assert "all_evaluations" in dashboard
        
        print(f"✓ Player dashboard returned - {dashboard.get('evaluations_count')} evaluations")
    
    def test_player_dashboard_nonexistent(self):
        """Test player dashboard with non-existent player"""
        token = self.get_analyst_token()
        assert token, "Failed to get analyst token"
        
        response = self.session.get(
            f"{BASE_URL}/api/player/nonexistent-player-id/dashboard",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 404, f"Expected 404, got: {response.status_code}"
        print("✓ Non-existent player returns 404")


class TestEvaluationMetadata:
    """Test evaluation metadata endpoints (archetypes, metrics)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_archetypes(self):
        """Test archetypes endpoint returns English labels"""
        response = self.session.get(f"{BASE_URL}/api/evaluation/archetypes")
        
        assert response.status_code == 200, f"Failed to get archetypes: {response.text}"
        archetypes = response.json()
        
        # Check structure
        assert isinstance(archetypes, dict)
        assert "goalkeeper" in archetypes
        assert "defender" in archetypes
        assert "midfielder" in archetypes
        assert "attacker" in archetypes
        
        # Verify English labels (no French)
        for category, types in archetypes.items():
            for archetype in types:
                # Check for common French words that shouldn't be there
                assert "gardien" not in archetype.lower(), f"French word found: {archetype}"
                assert "défenseur" not in archetype.lower(), f"French word found: {archetype}"
                assert "milieu" not in archetype.lower(), f"French word found: {archetype}"
        
        print(f"✓ Archetypes returned in English - {len(archetypes)} categories")
    
    def test_get_metrics(self):
        """Test metrics endpoint returns English labels"""
        response = self.session.get(f"{BASE_URL}/api/evaluation/metrics")
        
        assert response.status_code == 200, f"Failed to get metrics: {response.text}"
        metrics = response.json()
        
        # Check structure
        assert "technical" in metrics
        assert "tactical" in metrics
        assert "physical" in metrics
        assert "mental" in metrics
        assert "recommendation_levels" in metrics
        
        # Verify English metric names
        all_metrics = metrics["technical"] + metrics["tactical"] + metrics["physical"] + metrics["mental"]
        for metric in all_metrics:
            # Check for common French words
            assert "passe" not in metric.lower(), f"French word found: {metric}"
            assert "vitesse" not in metric.lower(), f"French word found: {metric}"
            assert "force" not in metric.lower(), f"French word found: {metric}"
        
        print(f"✓ Metrics returned in English - {len(all_metrics)} total metrics")


class TestEvaluationView:
    """Test evaluation view endpoint returns English data"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def get_analyst_token(self):
        """Get analyst authentication token"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": ANALYST_EMAIL,
            "password": ANALYST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_evaluation_view_english_labels(self):
        """Test evaluation view returns English labels for strengths/weaknesses"""
        token = self.get_analyst_token()
        assert token, "Failed to get analyst token"
        
        # Get evaluations
        response = self.session.get(
            f"{BASE_URL}/api/analyst/evaluations",
            headers={"Authorization": f"Bearer {token}"}
        )
        evaluations = response.json()
        
        if not evaluations:
            pytest.skip("No evaluations available for testing")
        
        eval_id = evaluations[0].get("id")
        
        # Get specific evaluation
        response = self.session.get(
            f"{BASE_URL}/api/evaluation/{eval_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        evaluation = response.json()
        
        # Check strengths are in English
        strengths = evaluation.get("top_strengths", [])
        for strength in strengths:
            # Common French words that shouldn't appear
            assert "technique" not in strength.lower() or "technical" in strength.lower(), f"Possible French: {strength}"
            assert "passe" not in strength.lower(), f"French word found: {strength}"
        
        # Check development areas are in English
        areas = evaluation.get("development_areas", [])
        for area in areas:
            assert "amélioration" not in area.lower(), f"French word found: {area}"
        
        print(f"✓ Evaluation view returns English labels")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
