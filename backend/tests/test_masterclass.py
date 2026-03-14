"""
Test suite for Masterclass feature
- Public endpoints (categories, list, detail)
- Player bookmark functionality
- Comment functionality
- Admin CRUD operations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestMasterclassPublicEndpoints:
    """Test public masterclass endpoints that don't require auth"""
    
    def test_get_categories(self):
        """GET /api/masterclass/categories returns categories, subcategories, difficulties"""
        response = requests.get(f"{BASE_URL}/api/masterclass/categories")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "categories" in data
        assert "subcategories" in data
        assert "difficulties" in data
        
        # Verify expected categories
        expected_categories = ['medical_recovery', 'pro_masterclass', 'college_tips', 
                              'fitness_conditioning', 'mental_performance']
        assert set(data['categories']) == set(expected_categories)
        
        # Verify subcategories exist for each category
        for cat in expected_categories:
            assert cat in data['subcategories']
            assert len(data['subcategories'][cat]) > 0
        
        # Verify difficulties
        assert 'beginner' in data['difficulties']
        assert 'intermediate' in data['difficulties']
        assert 'advanced' in data['difficulties']
        print("GET /api/masterclass/categories - PASSED")
    
    def test_get_masterclasses_list(self):
        """GET /api/masterclass returns list of published masterclasses"""
        response = requests.get(f"{BASE_URL}/api/masterclass")
        assert response.status_code == 200
        data = response.json()
        
        # Should be a list
        assert isinstance(data, list)
        
        if len(data) > 0:
            mc = data[0]
            # Verify required fields
            assert "id" in mc
            assert "title" in mc
            assert "category" in mc
            assert "author_name" in mc
            assert "published" in mc
            assert mc["published"] == True  # Only published should be returned
        print(f"GET /api/masterclass - PASSED ({len(data)} masterclasses)")
    
    def test_filter_by_category(self):
        """GET /api/masterclass?category=... filters correctly"""
        response = requests.get(f"{BASE_URL}/api/masterclass?category=medical_recovery")
        assert response.status_code == 200
        data = response.json()
        
        # All returned should be medical_recovery
        for mc in data:
            assert mc['category'] == 'medical_recovery'
        print(f"GET /api/masterclass?category=medical_recovery - PASSED ({len(data)} results)")
    
    def test_filter_by_difficulty(self):
        """GET /api/masterclass?difficulty=... filters correctly"""
        response = requests.get(f"{BASE_URL}/api/masterclass?difficulty=beginner")
        assert response.status_code == 200
        data = response.json()
        
        for mc in data:
            assert mc['difficulty'] == 'beginner'
        print(f"GET /api/masterclass?difficulty=beginner - PASSED ({len(data)} results)")
    
    def test_filter_by_featured(self):
        """GET /api/masterclass?featured=true filters featured masterclasses"""
        response = requests.get(f"{BASE_URL}/api/masterclass?featured=true")
        assert response.status_code == 200
        data = response.json()
        
        for mc in data:
            assert mc['featured'] == True
        print(f"GET /api/masterclass?featured=true - PASSED ({len(data)} featured)")
    
    def test_search_masterclasses(self):
        """GET /api/masterclass?search=... searches in title/description"""
        response = requests.get(f"{BASE_URL}/api/masterclass?search=ACL")
        assert response.status_code == 200
        data = response.json()
        
        # Should find the ACL Recovery masterclass
        if len(data) > 0:
            found = any("ACL" in mc['title'] or "ACL" in mc['description'] for mc in data)
            assert found, "Search should find ACL-related masterclasses"
        print(f"GET /api/masterclass?search=ACL - PASSED ({len(data)} results)")
    
    def test_get_single_masterclass(self):
        """GET /api/masterclass/{id} returns masterclass details"""
        # First get list to find an ID
        list_response = requests.get(f"{BASE_URL}/api/masterclass")
        assert list_response.status_code == 200
        masterclasses = list_response.json()
        
        if len(masterclasses) > 0:
            mc_id = masterclasses[0]['id']
            response = requests.get(f"{BASE_URL}/api/masterclass/{mc_id}")
            assert response.status_code == 200
            data = response.json()
            
            assert data['id'] == mc_id
            assert "title" in data
            assert "description" in data
            assert "author_name" in data
            assert "category" in data
            print(f"GET /api/masterclass/{mc_id} - PASSED")
        else:
            print("GET /api/masterclass/{id} - SKIPPED (no masterclasses)")
    
    def test_get_masterclass_comments(self):
        """GET /api/masterclass/{id}/comments returns comments"""
        # First get list to find an ID
        list_response = requests.get(f"{BASE_URL}/api/masterclass")
        masterclasses = list_response.json()
        
        if len(masterclasses) > 0:
            mc_id = masterclasses[0]['id']
            response = requests.get(f"{BASE_URL}/api/masterclass/{mc_id}/comments")
            assert response.status_code == 200
            data = response.json()
            
            assert isinstance(data, list)
            print(f"GET /api/masterclass/{mc_id}/comments - PASSED ({len(data)} comments)")
        else:
            print("GET /api/masterclass/{id}/comments - SKIPPED (no masterclasses)")


class TestMasterclassPlayerBookmarks:
    """Test player bookmark functionality"""
    
    @pytest.fixture
    def player_token(self):
        """Get player auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo.player@soccermatch.com",
            "password": "demo123"
        })
        if login_response.status_code != 200:
            pytest.skip("Player login failed - skipping bookmark tests")
        return login_response.json()['token']
    
    def test_get_user_bookmarks_requires_auth(self):
        """GET /api/masterclass/user/bookmarks requires authentication"""
        response = requests.get(f"{BASE_URL}/api/masterclass/user/bookmarks")
        assert response.status_code in [401, 403]
        print("GET /api/masterclass/user/bookmarks without auth - PASSED (401/403)")
    
    def test_get_user_bookmarks(self, player_token):
        """GET /api/masterclass/user/bookmarks returns player's bookmarks"""
        headers = {"Authorization": f"Bearer {player_token}"}
        response = requests.get(f"{BASE_URL}/api/masterclass/user/bookmarks", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"GET /api/masterclass/user/bookmarks - PASSED ({len(data)} bookmarks)")
    
    def test_bookmark_and_unbookmark_masterclass(self, player_token):
        """POST/DELETE /api/masterclass/{id}/bookmark adds and removes bookmarks"""
        headers = {"Authorization": f"Bearer {player_token}"}
        
        # Get a masterclass to bookmark
        list_response = requests.get(f"{BASE_URL}/api/masterclass")
        masterclasses = list_response.json()
        
        if len(masterclasses) == 0:
            pytest.skip("No masterclasses to bookmark")
        
        mc_id = masterclasses[0]['id']
        
        # Remove bookmark if exists (cleanup)
        requests.delete(f"{BASE_URL}/api/masterclass/{mc_id}/bookmark", headers=headers)
        
        # Add bookmark
        add_response = requests.post(f"{BASE_URL}/api/masterclass/{mc_id}/bookmark", headers=headers)
        assert add_response.status_code == 200
        print(f"POST /api/masterclass/{mc_id}/bookmark - PASSED")
        
        # Verify bookmark in list
        bookmarks_response = requests.get(f"{BASE_URL}/api/masterclass/user/bookmarks", headers=headers)
        bookmarks = bookmarks_response.json()
        assert any(b['id'] == mc_id for b in bookmarks), "Bookmark should be in list"
        print("Bookmark verified in user bookmarks list - PASSED")
        
        # Remove bookmark
        remove_response = requests.delete(f"{BASE_URL}/api/masterclass/{mc_id}/bookmark", headers=headers)
        assert remove_response.status_code == 200
        print(f"DELETE /api/masterclass/{mc_id}/bookmark - PASSED")
        
        # Verify removed
        bookmarks_response2 = requests.get(f"{BASE_URL}/api/masterclass/user/bookmarks", headers=headers)
        bookmarks2 = bookmarks_response2.json()
        assert not any(b['id'] == mc_id for b in bookmarks2), "Bookmark should be removed"
        print("Bookmark removal verified - PASSED")
    
    def test_bookmark_nonexistent_masterclass(self, player_token):
        """POST /api/masterclass/{invalid_id}/bookmark returns 404"""
        headers = {"Authorization": f"Bearer {player_token}"}
        response = requests.post(f"{BASE_URL}/api/masterclass/nonexistent-id-12345/bookmark", headers=headers)
        assert response.status_code == 404
        print("POST /api/masterclass/{invalid_id}/bookmark - PASSED (404)")


class TestMasterclassComments:
    """Test comment functionality"""
    
    @pytest.fixture
    def player_token(self):
        """Get player auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo.player@soccermatch.com",
            "password": "demo123"
        })
        if login_response.status_code != 200:
            pytest.skip("Player login failed - skipping comment tests")
        return login_response.json()['token']
    
    def test_add_comment_requires_auth(self):
        """POST /api/masterclass/{id}/comments requires authentication"""
        # Get a masterclass
        list_response = requests.get(f"{BASE_URL}/api/masterclass")
        masterclasses = list_response.json()
        
        if len(masterclasses) == 0:
            pytest.skip("No masterclasses")
        
        mc_id = masterclasses[0]['id']
        response = requests.post(f"{BASE_URL}/api/masterclass/{mc_id}/comments", 
                                json={"content": "Test comment"})
        assert response.status_code in [401, 403]
        print("POST /api/masterclass/{id}/comments without auth - PASSED (401/403)")
    
    def test_add_and_delete_comment(self, player_token):
        """POST/DELETE comment functionality"""
        headers = {"Authorization": f"Bearer {player_token}"}
        
        # Get a masterclass
        list_response = requests.get(f"{BASE_URL}/api/masterclass")
        masterclasses = list_response.json()
        
        if len(masterclasses) == 0:
            pytest.skip("No masterclasses")
        
        mc_id = masterclasses[0]['id']
        
        # Add comment
        comment_content = "TEST_This is a test comment from automated testing"
        add_response = requests.post(
            f"{BASE_URL}/api/masterclass/{mc_id}/comments",
            json={"content": comment_content},
            headers=headers
        )
        assert add_response.status_code == 200
        comment_data = add_response.json()
        
        assert "id" in comment_data
        assert comment_data['content'] == comment_content
        assert "user_name" in comment_data
        assert "created_at" in comment_data
        comment_id = comment_data['id']
        print(f"POST /api/masterclass/{mc_id}/comments - PASSED (comment_id: {comment_id})")
        
        # Verify comment in list
        comments_response = requests.get(f"{BASE_URL}/api/masterclass/{mc_id}/comments")
        comments = comments_response.json()
        assert any(c['id'] == comment_id for c in comments), "Comment should be in list"
        print("Comment verified in comments list - PASSED")
        
        # Delete comment
        delete_response = requests.delete(
            f"{BASE_URL}/api/masterclass/{mc_id}/comments/{comment_id}",
            headers=headers
        )
        assert delete_response.status_code == 200
        print(f"DELETE /api/masterclass/{mc_id}/comments/{comment_id} - PASSED")
        
        # Verify deletion
        comments_response2 = requests.get(f"{BASE_URL}/api/masterclass/{mc_id}/comments")
        comments2 = comments_response2.json()
        assert not any(c['id'] == comment_id for c in comments2), "Comment should be deleted"
        print("Comment deletion verified - PASSED")
    
    def test_add_empty_comment_fails(self, player_token):
        """POST empty comment should fail"""
        headers = {"Authorization": f"Bearer {player_token}"}
        
        list_response = requests.get(f"{BASE_URL}/api/masterclass")
        masterclasses = list_response.json()
        
        if len(masterclasses) == 0:
            pytest.skip("No masterclasses")
        
        mc_id = masterclasses[0]['id']
        response = requests.post(
            f"{BASE_URL}/api/masterclass/{mc_id}/comments",
            json={"content": ""},
            headers=headers
        )
        assert response.status_code == 400
        print("POST empty comment - PASSED (400)")


class TestAdminMasterclassCRUD:
    """Test admin CRUD operations for masterclasses"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/admin/login", json={
            "email": "admin@soccermatch.com",
            "password": "admin123"
        })
        if login_response.status_code != 200:
            pytest.skip("Admin login failed")
        return login_response.json()['token']
    
    def test_admin_get_all_masterclasses(self, admin_token):
        """GET /api/admin/masterclass returns all masterclasses (including unpublished)"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        response = requests.get(f"{BASE_URL}/api/admin/masterclass", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"GET /api/admin/masterclass - PASSED ({len(data)} masterclasses)")
    
    def test_admin_get_masterclasses_requires_admin(self):
        """GET /api/admin/masterclass requires admin role"""
        # Without auth
        response = requests.get(f"{BASE_URL}/api/admin/masterclass")
        assert response.status_code in [401, 403]
        print("GET /api/admin/masterclass without auth - PASSED (401/403)")
    
    def test_create_masterclass(self, admin_token):
        """POST /api/admin/masterclass creates a new masterclass"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        new_mc = {
            "title": "TEST_Masterclass for Automated Testing",
            "description": "This is a test masterclass created by automated tests",
            "category": "medical_recovery",
            "subcategory": "General Rehabilitation",
            "difficulty": "beginner",
            "duration_minutes": 15,
            "author_name": "Test Author",
            "author_credentials": "Test Credentials",
            "tags": ["test", "automated"],
            "featured": False
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/masterclass", json=new_mc, headers=headers)
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert data['title'] == new_mc['title']
        assert data['category'] == new_mc['category']
        assert data['published'] == True
        
        mc_id = data['id']
        print(f"POST /api/admin/masterclass - PASSED (id: {mc_id})")
        
        # Cleanup - delete the test masterclass
        delete_response = requests.delete(f"{BASE_URL}/api/admin/masterclass/{mc_id}", headers=headers)
        assert delete_response.status_code == 200
        print(f"Cleanup: DELETE /api/admin/masterclass/{mc_id} - PASSED")
    
    def test_create_masterclass_invalid_category(self, admin_token):
        """POST /api/admin/masterclass with invalid category fails"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        new_mc = {
            "title": "TEST_Invalid Category",
            "description": "Test",
            "category": "invalid_category",
            "author_name": "Test Author"
        }
        
        response = requests.post(f"{BASE_URL}/api/admin/masterclass", json=new_mc, headers=headers)
        assert response.status_code == 400
        print("POST /api/admin/masterclass with invalid category - PASSED (400)")
    
    def test_update_masterclass(self, admin_token):
        """PUT /api/admin/masterclass/{id} updates a masterclass"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a masterclass first
        new_mc = {
            "title": "TEST_To Be Updated",
            "description": "Will be updated",
            "category": "pro_masterclass",
            "author_name": "Test Author"
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/masterclass", json=new_mc, headers=headers)
        mc_id = create_response.json()['id']
        
        # Update it
        update_data = {
            "title": "TEST_Updated Title",
            "description": "Updated description",
            "featured": True
        }
        update_response = requests.put(f"{BASE_URL}/api/admin/masterclass/{mc_id}", json=update_data, headers=headers)
        assert update_response.status_code == 200
        updated = update_response.json()
        
        assert updated['title'] == "TEST_Updated Title"
        assert updated['description'] == "Updated description"
        assert updated['featured'] == True
        print(f"PUT /api/admin/masterclass/{mc_id} - PASSED")
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/masterclass/{mc_id}")
        assert get_response.status_code == 200
        fetched = get_response.json()
        assert fetched['title'] == "TEST_Updated Title"
        print("Update persistence verified - PASSED")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/masterclass/{mc_id}", headers=headers)
    
    def test_delete_masterclass(self, admin_token):
        """DELETE /api/admin/masterclass/{id} deletes a masterclass"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a masterclass to delete
        new_mc = {
            "title": "TEST_To Be Deleted",
            "description": "Will be deleted",
            "category": "fitness_conditioning",
            "author_name": "Test Author"
        }
        create_response = requests.post(f"{BASE_URL}/api/admin/masterclass", json=new_mc, headers=headers)
        mc_id = create_response.json()['id']
        
        # Delete it
        delete_response = requests.delete(f"{BASE_URL}/api/admin/masterclass/{mc_id}", headers=headers)
        assert delete_response.status_code == 200
        print(f"DELETE /api/admin/masterclass/{mc_id} - PASSED")
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/masterclass/{mc_id}")
        assert get_response.status_code == 404
        print("Deletion verified (404 on get) - PASSED")
    
    def test_toggle_featured_status(self, admin_token):
        """PUT /api/admin/masterclass/{id} can toggle featured status"""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Get existing masterclasses
        list_response = requests.get(f"{BASE_URL}/api/admin/masterclass", headers=headers)
        masterclasses = list_response.json()
        
        if len(masterclasses) == 0:
            pytest.skip("No masterclasses to test toggle")
        
        mc = masterclasses[0]
        mc_id = mc['id']
        original_featured = mc.get('featured', False)
        
        # Toggle featured
        update_response = requests.put(
            f"{BASE_URL}/api/admin/masterclass/{mc_id}",
            json={"featured": not original_featured},
            headers=headers
        )
        assert update_response.status_code == 200
        updated = update_response.json()
        assert updated['featured'] == (not original_featured)
        print(f"Toggle featured {original_featured} -> {not original_featured} - PASSED")
        
        # Restore original state
        requests.put(
            f"{BASE_URL}/api/admin/masterclass/{mc_id}",
            json={"featured": original_featured},
            headers=headers
        )
        print("Featured status restored - PASSED")


class TestMasterclassAccessControl:
    """Test access control for masterclass endpoints"""
    
    @pytest.fixture
    def player_token(self):
        """Get player auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "demo.player@soccermatch.com",
            "password": "demo123"
        })
        if login_response.status_code != 200:
            pytest.skip("Player login failed")
        return login_response.json()['token']
    
    def test_player_cannot_create_masterclass(self, player_token):
        """Player should not be able to create masterclasses"""
        headers = {"Authorization": f"Bearer {player_token}"}
        response = requests.post(
            f"{BASE_URL}/api/admin/masterclass",
            json={
                "title": "Test Masterclass",
                "description": "Test description",
                "category": "medical_recovery",
                "author_name": "Test Author",
                "difficulty": "beginner",
                "duration_minutes": 10,
                "tags": []
            },
            headers=headers
        )
        assert response.status_code == 403
        print("Player cannot create masterclass - PASSED (403)")
    
    def test_player_cannot_delete_masterclass(self, player_token):
        """Player should not be able to delete masterclasses"""
        headers = {"Authorization": f"Bearer {player_token}"}
        
        # Get a masterclass ID
        list_response = requests.get(f"{BASE_URL}/api/masterclass")
        masterclasses = list_response.json()
        
        if len(masterclasses) == 0:
            pytest.skip("No masterclasses")
        
        mc_id = masterclasses[0]['id']
        response = requests.delete(f"{BASE_URL}/api/admin/masterclass/{mc_id}", headers=headers)
        assert response.status_code == 403
        print("Player cannot delete masterclass - PASSED (403)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
