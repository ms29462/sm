"""
Rejection Feedback Tests
Tests for POST /applications/{id}/reject endpoint including:
- Validation: missing reasons, unknown codes, other without text, message too long
- Auth: wrong org gets 404, player role gets 403
- Happy path: status set to rejected, feedback doc created
- Idempotency: double rejection returns 409
- Email: background task queued (not asserted directly — integration only)
"""
import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

ADMIN_EMAIL = "admin@soccermatch.com"
ADMIN_PASSWORD = "admin123"

ORG_EMAIL = f"TEST_club_{uuid.uuid4().hex[:8]}@soccermatch.com"
ORG_PASSWORD = "test123"
ORG_NAME = f"TEST Club {uuid.uuid4().hex[:8]}"

OTHER_ORG_EMAIL = f"TEST_club_{uuid.uuid4().hex[:8]}@soccermatch.com"
OTHER_ORG_PASSWORD = "test123"
OTHER_ORG_NAME = f"TEST Club {uuid.uuid4().hex[:8]}"

PLAYER_EMAIL = f"TEST_player_{uuid.uuid4().hex[:8]}@soccermatch.com"
PLAYER_PASSWORD = "test123"
PLAYER_NAME = f"TEST Player {uuid.uuid4().hex[:8]}"


def _headers(token):
    return {"Authorization": f"Bearer {token}"}


def _register(email, password, role, name):
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": email, "password": password, "role": role, "name": name
    })
    assert r.status_code == 200, f"Register failed: {r.text}"
    return r.json()


def _login(email, password):
    r = requests.post(f"{BASE_URL}/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, f"Login failed: {r.text}"
    return r.json()["token"]


def _admin_token():
    return _login(ADMIN_EMAIL, ADMIN_PASSWORD)


class TestRejectionFeedbackSetup:
    """Create the users and application needed for subsequent tests."""

    def test_register_org(self):
        data = _register(ORG_EMAIL, ORG_PASSWORD, "club", ORG_NAME)
        pytest.org_token = data["token"]
        pytest.org_id = data["user_id"]

    def test_register_other_org(self):
        data = _register(OTHER_ORG_EMAIL, OTHER_ORG_PASSWORD, "club", OTHER_ORG_NAME)
        pytest.other_org_token = data["token"]

    def test_register_player(self):
        data = _register(PLAYER_EMAIL, PLAYER_PASSWORD, "player", PLAYER_NAME)
        pytest.player_token = data["token"]
        pytest.player_id = data["user_id"]

    def test_admin_approve_org(self):
        token = _admin_token()
        r = requests.post(
            f"{BASE_URL}/api/admin/approve-club/{pytest.org_id}",
            headers=_headers(token)
        )
        assert r.status_code == 200, f"Approve org failed: {r.text}"

    def test_create_opportunity(self):
        """Create an opportunity under the org and publish it."""
        r = requests.post(f"{BASE_URL}/api/opportunities", json={
            "position": "Goalkeeper",
            "league_level": "Amateur / Regional",
            "country": "France",
            "contract_type": "Full-time",
        }, headers=_headers(pytest.org_token))
        assert r.status_code in (200, 201), f"Create opp failed: {r.text}"
        opp_id = r.json().get("id") or r.json().get("opportunity_id")
        pytest.opp_id = opp_id

    def test_publish_opportunity(self):
        token = _admin_token()
        r = requests.post(
            f"{BASE_URL}/api/admin/approve-opportunity/{pytest.opp_id}",
            headers=_headers(token)
        )
        assert r.status_code == 200, f"Publish opp failed: {r.text}"

    def test_player_applies(self):
        r = requests.post(f"{BASE_URL}/api/opportunities/{pytest.opp_id}/apply",
                          headers=_headers(pytest.player_token))
        assert r.status_code in (200, 201), f"Apply failed: {r.text}"
        # Retrieve the application id from the org's applications list
        r2 = requests.get(f"{BASE_URL}/api/applications",
                          headers=_headers(pytest.org_token))
        assert r2.status_code == 200
        apps = r2.json()
        match = next(
            (a for a in apps if a.get("opportunity_id") == pytest.opp_id
             and a.get("player_id") == pytest.player_id),
            None
        )
        assert match is not None, "Application not found in org's list"
        pytest.application_id = match["id"]


class TestRejectionFeedbackValidation:
    """Validation errors must return 422 (Pydantic) or 400."""

    def test_no_reasons_returns_error(self):
        r = requests.post(
            f"{BASE_URL}/api/applications/{pytest.application_id}/reject",
            json={"reasons": [], "tips": [], "message": None},
            headers=_headers(pytest.org_token)
        )
        assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}: {r.text}"

    def test_unknown_reason_code_returns_error(self):
        r = requests.post(
            f"{BASE_URL}/api/applications/{pytest.application_id}/reject",
            json={"reasons": ["not_a_real_code"]},
            headers=_headers(pytest.org_token)
        )
        assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}: {r.text}"

    def test_other_reason_without_text_returns_error(self):
        r = requests.post(
            f"{BASE_URL}/api/applications/{pytest.application_id}/reject",
            json={"reasons": ["other"], "other_text": ""},
            headers=_headers(pytest.org_token)
        )
        assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}: {r.text}"

    def test_message_too_long_returns_error(self):
        r = requests.post(
            f"{BASE_URL}/api/applications/{pytest.application_id}/reject",
            json={"reasons": ["level_mismatch"], "message": "x" * 301},
            headers=_headers(pytest.org_token)
        )
        assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}: {r.text}"

    def test_other_text_too_long_returns_error(self):
        r = requests.post(
            f"{BASE_URL}/api/applications/{pytest.application_id}/reject",
            json={"reasons": ["other"], "other_text": "y" * 201},
            headers=_headers(pytest.org_token)
        )
        assert r.status_code in (400, 422), f"Expected 400/422, got {r.status_code}: {r.text}"


class TestRejectionFeedbackAuth:
    """Wrong org gets 404; player role gets 403."""

    def test_wrong_org_gets_404(self):
        r = requests.post(
            f"{BASE_URL}/api/applications/{pytest.application_id}/reject",
            json={"reasons": ["level_mismatch"]},
            headers=_headers(pytest.other_org_token)
        )
        assert r.status_code == 404, f"Expected 404, got {r.status_code}: {r.text}"

    def test_player_role_gets_403(self):
        r = requests.post(
            f"{BASE_URL}/api/applications/{pytest.application_id}/reject",
            json={"reasons": ["level_mismatch"]},
            headers=_headers(pytest.player_token)
        )
        assert r.status_code == 403, f"Expected 403, got {r.status_code}: {r.text}"

    def test_unauthenticated_gets_401(self):
        r = requests.post(
            f"{BASE_URL}/api/applications/{pytest.application_id}/reject",
            json={"reasons": ["level_mismatch"]}
        )
        assert r.status_code == 401, f"Expected 401, got {r.status_code}: {r.text}"


class TestRejectionFeedbackHappyPath:
    """Successful rejection updates status and creates feedback doc."""

    def test_reject_with_feedback_succeeds(self):
        r = requests.post(
            f"{BASE_URL}/api/applications/{pytest.application_id}/reject",
            json={
                "reasons": ["level_mismatch", "age_mismatch"],
                "tips": ["complete_profile", "apply_others"],
                "message": "Keep improving and apply again next season.",
            },
            headers=_headers(pytest.org_token)
        )
        assert r.status_code == 200, f"Reject failed: {r.status_code} {r.text}"

    def test_application_status_is_rejected(self):
        r = requests.get(f"{BASE_URL}/api/applications",
                         headers=_headers(pytest.org_token))
        assert r.status_code == 200
        app = next((a for a in r.json() if a["id"] == pytest.application_id), None)
        assert app is not None
        assert app["status"] == "rejected"

    def test_player_sees_feedback(self):
        r = requests.get(f"{BASE_URL}/api/my-applications",
                         headers=_headers(pytest.player_token))
        assert r.status_code == 200
        app = next((a for a in r.json() if a["id"] == pytest.application_id), None)
        assert app is not None, "Application not found in player view"
        assert app.get("feedback") is not None, "Feedback not attached to player's application"
        fb = app["feedback"]
        assert "level_mismatch" in fb.get("reasons", [])
        assert "age_mismatch" in fb.get("reasons", [])
        assert "complete_profile" in fb.get("tips", [])
        assert fb.get("message") == "Keep improving and apply again next season."


class TestRejectionFeedbackIdempotency:
    """Second rejection on the same application must return 409."""

    def test_double_rejection_returns_409(self):
        r = requests.post(
            f"{BASE_URL}/api/applications/{pytest.application_id}/reject",
            json={"reasons": ["squad_complete"]},
            headers=_headers(pytest.org_token)
        )
        assert r.status_code == 409, f"Expected 409, got {r.status_code}: {r.text}"
