import requests
import sys
import json
from datetime import datetime
import uuid

class SoccerMatchAPITester:
    def __init__(self, base_url="https://transfer-pro-8.preview.emergentagent.com"):
        self.base_url = base_url
        self.player_token = None
        self.club_token = None
        self.admin_token = None
        self.test_player_id = None
        self.test_club_id = None
        self.test_opportunity_id = None
        self.tests_run = 0
        self.tests_passed = 0

    def log_result(self, test_name, success, details=""):
        self.tests_run += 1
        status = "✅ PASSED" if success else "❌ FAILED"
        print(f"{status} - {test_name}")
        if details:
            print(f"   {details}")
        if success:
            self.tests_passed += 1
        print()

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                try:
                    return True, response.json()
                except:
                    return True, {}
            else:
                return False, {
                    "status_code": response.status_code,
                    "error": response.text
                }

        except Exception as e:
            return False, {"error": str(e)}

    def test_player_registration(self):
        test_email = f"testplayer_{uuid.uuid4().hex[:8]}@test.com"
        data = {
            "name": "John Player",
            "email": test_email,
            "password": "password123",
            "role": "player"
        }
        
        success, response = self.make_request('POST', 'auth/register', data, expected_status=200)
        if success and 'token' in response:
            self.player_token = response['token']
            self.test_player_id = response['user_id']
            self.log_result("Player Registration", True, f"Player ID: {self.test_player_id}")
        else:
            self.log_result("Player Registration", False, f"Response: {response}")
        return success

    def test_club_registration(self):
        test_email = f"testclub_{uuid.uuid4().hex[:8]}@test.com"
        data = {
            "name": "Test FC",
            "email": test_email,
            "password": "password123",
            "role": "club"
        }
        
        success, response = self.make_request('POST', 'auth/register', data, expected_status=200)
        if success and 'token' in response:
            self.club_token = response['token']
            self.test_club_id = response['user_id']
            self.log_result("Club Registration", True, f"Club ID: {self.test_club_id}")
        else:
            self.log_result("Club Registration", False, f"Response: {response}")
        return success

    def test_player_login(self):
        test_email = f"logintest_{uuid.uuid4().hex[:8]}@test.com"
        # First register
        reg_data = {
            "name": "Login Test Player",
            "email": test_email,
            "password": "password123",
            "role": "player"
        }
        self.make_request('POST', 'auth/register', reg_data)
        
        # Then login
        login_data = {"email": test_email, "password": "password123"}
        success, response = self.make_request('POST', 'auth/login', login_data, expected_status=200)
        
        if success and 'token' in response:
            self.log_result("Player Login", True, f"Token received")
        else:
            self.log_result("Player Login", False, f"Response: {response}")
        return success

    def test_admin_login(self):
        data = {
            "email": "admin@soccermatch.com",
            "password": "admin123"
        }
        
        success, response = self.make_request('POST', 'auth/admin/login', data, expected_status=200)
        if success and 'token' in response:
            self.admin_token = response['token']
            self.log_result("Admin Login", True, "Admin token received")
        else:
            self.log_result("Admin Login", False, f"Response: {response}")
        return success

    def test_player_profile_get(self):
        if not self.player_token:
            self.log_result("Player Profile Get", False, "No player token available")
            return False
            
        success, response = self.make_request('GET', 'player/profile', token=self.player_token)
        if success and 'name' in response:
            self.log_result("Player Profile Get", True, f"Profile name: {response.get('name')}")
        else:
            self.log_result("Player Profile Get", False, f"Response: {response}")
        return success

    def test_player_profile_update(self):
        if not self.player_token:
            self.log_result("Player Profile Update", False, "No player token available")
            return False
            
        update_data = {
            "position": "Striker",
            "age": 25,
            "nationality": "Brazil",
            "height": 180,
            "weight": 75,
            "games": 50,
            "goals": 15,
            "assists": 8
        }
        
        success, response = self.make_request('PUT', 'player/profile', update_data, token=self.player_token)
        if success and response.get('position') == 'Striker':
            self.log_result("Player Profile Update", True, "Profile updated successfully")
        else:
            self.log_result("Player Profile Update", False, f"Response: {response}")
        return success

    def test_club_profile_get(self):
        if not self.club_token:
            self.log_result("Club Profile Get", False, "No club token available")
            return False
            
        success, response = self.make_request('GET', 'club/profile', token=self.club_token)
        if success and 'name' in response:
            self.log_result("Club Profile Get", True, f"Club name: {response.get('name')}")
        else:
            self.log_result("Club Profile Get", False, f"Response: {response}")
        return success

    def test_club_profile_update(self):
        if not self.club_token:
            self.log_result("Club Profile Update", False, "No club token available")
            return False
            
        update_data = {
            "country": "Spain",
            "league": "La Liga"
        }
        
        success, response = self.make_request('PUT', 'club/profile', update_data, token=self.club_token)
        if success and response.get('country') == 'Spain':
            self.log_result("Club Profile Update", True, "Club profile updated successfully")
        else:
            self.log_result("Club Profile Update", False, f"Response: {response}")
        return success

    def test_create_opportunity(self):
        if not self.club_token:
            self.log_result("Create Opportunity", False, "No club token available")
            return False
            
        opp_data = {
            "position": "Striker",
            "league_level": "Professional",
            "salary_range": "$50k - $80k",
            "contract_duration": "2 years",
            "description": "Looking for a talented striker for our first team"
        }
        
        success, response = self.make_request('POST', 'opportunities', opp_data, token=self.club_token, expected_status=200)
        if success and 'id' in response:
            self.test_opportunity_id = response['id']
            self.log_result("Create Opportunity", True, f"Opportunity ID: {self.test_opportunity_id}")
        else:
            self.log_result("Create Opportunity", False, f"Response: {response}")
        return success

    def test_get_opportunities(self):
        if not self.player_token:
            self.log_result("Get Opportunities", False, "No player token available")
            return False
            
        success, response = self.make_request('GET', 'opportunities', token=self.player_token)
        if success and isinstance(response, list):
            self.log_result("Get Opportunities", True, f"Found {len(response)} opportunities")
        else:
            self.log_result("Get Opportunities", False, f"Response: {response}")
        return success

    def test_get_recommended_opportunities(self):
        if not self.player_token:
            self.log_result("Get Recommended Opportunities", False, "No player token available")
            return False
            
        success, response = self.make_request('GET', 'opportunities/recommended', token=self.player_token)
        if success and isinstance(response, list):
            self.log_result("Get Recommended Opportunities", True, f"Found {len(response)} recommended opportunities")
        else:
            self.log_result("Get Recommended Opportunities", False, f"Response: {response}")
        return success

    def test_apply_to_opportunity(self):
        if not self.player_token or not self.test_opportunity_id:
            self.log_result("Apply to Opportunity", False, "Missing player token or opportunity ID")
            return False
            
        app_data = {"opportunity_id": self.test_opportunity_id}
        success, response = self.make_request('POST', 'applications', app_data, token=self.player_token, expected_status=200)
        if success and 'id' in response:
            self.log_result("Apply to Opportunity", True, f"Application ID: {response['id']}")
        else:
            self.log_result("Apply to Opportunity", False, f"Response: {response}")
        return success

    def test_get_my_applications(self):
        if not self.player_token:
            self.log_result("Get My Applications", False, "No player token available")
            return False
            
        success, response = self.make_request('GET', 'applications/my', token=self.player_token)
        if success and isinstance(response, list):
            self.log_result("Get My Applications", True, f"Found {len(response)} applications")
        else:
            self.log_result("Get My Applications", False, f"Response: {response}")
        return success

    def test_get_players(self):
        if not self.club_token:
            self.log_result("Get Players (Club)", False, "No club token available")
            return False
            
        success, response = self.make_request('GET', 'players', token=self.club_token)
        if success and isinstance(response, list):
            self.log_result("Get Players (Club)", True, f"Found {len(response)} players")
        else:
            self.log_result("Get Players (Club)", False, f"Response: {response}")
        return success

    def test_add_favorite_player(self):
        if not self.club_token or not self.test_player_id:
            self.log_result("Add Favorite Player", False, "Missing club token or player ID")
            return False
            
        fav_data = {"player_id": self.test_player_id}
        success, response = self.make_request('POST', 'favorites', fav_data, token=self.club_token, expected_status=200)
        if success and 'id' in response:
            self.log_result("Add Favorite Player", True, f"Favorite ID: {response['id']}")
        else:
            self.log_result("Add Favorite Player", False, f"Response: {response}")
        return success

    def test_get_favorites(self):
        if not self.club_token:
            self.log_result("Get Favorites", False, "No club token available")
            return False
            
        success, response = self.make_request('GET', 'favorites', token=self.club_token)
        if success and isinstance(response, list):
            self.log_result("Get Favorites", True, f"Found {len(response)} favorite players")
        else:
            self.log_result("Get Favorites", False, f"Response: {response}")
        return success

    def test_admin_stats(self):
        if not self.admin_token:
            self.log_result("Admin Stats", False, "No admin token available")
            return False
            
        success, response = self.make_request('GET', 'admin/stats', token=self.admin_token)
        if success and 'total_players' in response:
            self.log_result("Admin Stats", True, f"Stats: {response}")
        else:
            self.log_result("Admin Stats", False, f"Response: {response}")
        return success

    def test_admin_get_players(self):
        if not self.admin_token:
            self.log_result("Admin Get Players", False, "No admin token available")
            return False
            
        success, response = self.make_request('GET', 'admin/players', token=self.admin_token)
        if success and isinstance(response, list):
            self.log_result("Admin Get Players", True, f"Found {len(response)} players")
        else:
            self.log_result("Admin Get Players", False, f"Response: {response}")
        return success

    def test_admin_approve_player(self):
        if not self.admin_token or not self.test_player_id:
            self.log_result("Admin Approve Player", False, "Missing admin token or player ID")
            return False
            
        approval_data = {"user_id": self.test_player_id, "approved": True}
        success, response = self.make_request('PUT', f'admin/players/{self.test_player_id}/approve', approval_data, token=self.admin_token)
        if success:
            self.log_result("Admin Approve Player", True, "Player approved successfully")
        else:
            self.log_result("Admin Approve Player", False, f"Response: {response}")
        return success

    def run_all_tests(self):
        print("=" * 80)
        print("🏆 SOCCERMATCH API TESTING")
        print("=" * 80)
        print()

        # Authentication Tests
        print("🔐 AUTHENTICATION TESTS")
        print("-" * 40)
        self.test_player_registration()
        self.test_club_registration()
        self.test_player_login()
        self.test_admin_login()

        # Player Tests
        print("⚽ PLAYER FUNCTIONALITY TESTS")
        print("-" * 40)
        self.test_player_profile_get()
        self.test_player_profile_update()
        self.test_get_opportunities()
        self.test_get_recommended_opportunities()

        # Club Tests
        print("🏟️  CLUB FUNCTIONALITY TESTS")
        print("-" * 40)
        self.test_club_profile_get()
        self.test_club_profile_update()
        self.test_create_opportunity()
        self.test_get_players()
        self.test_add_favorite_player()
        self.test_get_favorites()

        # Application Tests
        print("📝 APPLICATION TESTS")
        print("-" * 40)
        self.test_apply_to_opportunity()
        self.test_get_my_applications()

        # Admin Tests
        print("👑 ADMIN FUNCTIONALITY TESTS")
        print("-" * 40)
        self.test_admin_stats()
        self.test_admin_get_players()
        self.test_admin_approve_player()

        # Final Results
        print("=" * 80)
        print("📊 TEST RESULTS")
        print("=" * 80)
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 80:
            print("🟢 OVERALL STATUS: GOOD")
        elif success_rate >= 60:
            print("🟡 OVERALL STATUS: NEEDS ATTENTION")
        else:
            print("🔴 OVERALL STATUS: CRITICAL ISSUES")
            
        return self.tests_passed == self.tests_run

def main():
    tester = SoccerMatchAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())