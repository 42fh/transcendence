import unittest
import requests
import os

BASE_URL = os.getenv("API_URL", "http://localhost:8000/api")


class TestUserAPI(unittest.TestCase):
    def setUp(self):
        self.api_url = f"{BASE_URL}/users"
        # Ensure API is accessible
        try:
            requests.get(f"{BASE_URL}/health/")
        except requests.ConnectionError:
            self.skipTest("API server is not running")

    def test_list_users(self):
        """Test GET /api/users/"""
        response = requests.get(f"{self.api_url}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Check if our seeded users exist
        usernames = [user["username"] for user in data["users"]]
        expected_users = ["dev", "ThePrimeagen", "LexFridman", "ElonMusk", "CheGuevara"]
        for username in expected_users:
            self.assertIn(username, usernames)

        # Check pagination structure
        self.assertIn("pagination", data)
        pagination = data["pagination"]
        self.assertIn("total", pagination)
        self.assertIn("page", pagination)
        self.assertIn("per_page", pagination)
        self.assertIn("total_pages", pagination)

    def test_user_detail(self):
        """Test GET /api/users/<uuid:user_id>/"""
        # First get the user's UUID from the list endpoint
        response = requests.get(f"{self.api_url}/")
        users = response.json()["users"]
        dev_user = next(user for user in users if user["username"] == "dev")
        user_id = dev_user["id"]

        # Then test the detail endpoint
        response = requests.get(f"{self.api_url}/{user_id}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()

        # Check basic user details
        self.assertEqual(data["username"], "dev")
        self.assertEqual(data["email"], "dev@example.com")
        self.assertEqual(data["bio"], "Development user for local testing")

        # Check required fields are present
        required_fields = {
            "id",
            "username",
            "email",
            "avatar",
            "bio",
            "telephone_number",
            "pronoun",
            "is_active",
            "visibility_online_status",
            "visibility_user_profile",
            "stats",
            "recent_matches",
        }
        self.assertTrue(all(field in data for field in required_fields))

        # Check stats structure
        self.assertIn("stats", data)
        stats = data["stats"]
        self.assertEqual(stats["wins"], 5)
        self.assertEqual(stats["losses"], 2)
        self.assertAlmostEqual(stats["win_ratio"], 5 / 7)  # Should be wins/(wins+losses)
        self.assertIn("display_name", stats)

        # Check recent matches
        self.assertIn("recent_matches", data)
        matches = data["recent_matches"]
        self.assertIsInstance(matches, list)
        if matches:  # If there are matches
            match = matches[0]
            required_match_fields = {"game_id", "date", "score", "won", "game_type", "opponent"}
            self.assertTrue(all(field in match for field in required_match_fields))

            # If there's an opponent, check opponent data
            if match["opponent"]:
                required_opponent_fields = {"username", "display_name", "score"}
                self.assertTrue(all(field in match["opponent"] for field in required_opponent_fields))

    def test_invalid_user(self):
        """Test requesting non-existent user"""
        response = requests.get(f"{self.api_url}/nonexistent-uuid/")
        self.assertEqual(response.status_code, 404)

    def test_update_user(self):
        """Test PATCH /api/users/<uuid:user_id>/"""
        # Create a session
        session = requests.Session()

        # First create and login as a test user
        signup_data = {
            "username": f"testuser_{os.urandom(4).hex()}",
            "password": "testpass123",
            "email": "testuser@example.com",
        }

        # Signup request with headers
        response = session.post(
            f"{self.api_url}/auth/signup/", json=signup_data, headers={"Content-Type": "application/json"}
        )
        print(f"\nSignup Response Status: {response.status_code}")
        print(f"Signup Response Headers: {response.headers}")
        print(f"Signup Response Content: {response.text}")
        print(f"Session Cookies after signup: {dict(session.cookies)}")
        self.assertEqual(response.status_code, 200, "Failed to create user")
        user_id = response.json()["id"]
        print(f"User ID: {user_id}")
        session_cookie = response.cookies.get("sessionid")
        print(f"Session Cookie: {session_cookie}")
        self.assertIsNotNone(session_cookie, "No session cookie received")

        # Update user profile
        update_data = {
            "email": "test@example.com",
            "bio": "Updated bio",
            "telephone_number": "1234567890",
            "pronoun": "they/them",
            "visibility_online_status": "everyone",
            "visibility_user_profile": "friends",
        }

        # Use session for PATCH request with explicit cookie header

        update_response = session.patch(
            f"{self.api_url}/{user_id}/",
            json=update_data,
            headers={"Content-Type": "application/json"},
            # headers={"Content-Type": "application/json", "Cookie": f"sessionid={session_cookie}"},
        )
        print(f"\nUpdate Response Status: {update_response.status_code}")
        print(f"Update Response Content: {update_response.text}")
        print(f"Session Cookies after update: {dict(session.cookies)}")

        self.assertEqual(update_response.status_code, 200)
        data = update_response.json()

        # Verify the updates
        self.assertEqual(data["email"], "test@example.com")
        self.assertEqual(data["bio"], "Updated bio")
        self.assertEqual(data["telephone_number"], "1234567890")
        self.assertEqual(data["pronoun"], "they/them")
        self.assertEqual(data["visibility_online_status"], "everyone")
        self.assertEqual(data["visibility_user_profile"], "friends")

    def test_update_other_user(self):
        """Test that a user cannot update another user's profile"""
        # Create a session
        session = requests.Session()

        # Create first user
        signup_data1 = {
            "username": f"user1_{os.urandom(4).hex()}",
            "password": "pass123",
            "email": "user1@example.com",
            "first_name": "User",
            "last_name": "One",
        }
        response = session.post(
            f"{self.api_url}/auth/signup/", json=signup_data1, headers={"Content-Type": "application/json"}
        )
        print(f"First user signup response: {response.status_code}")
        print(f"Response content: {response.text}")
        print(f"Cookies: {dict(response.cookies)}")
        self.assertEqual(response.status_code, 200)
        session_cookie = response.cookies.get("sessionid")
        self.assertIsNotNone(session_cookie, "No session cookie received")

        # Create second user (using a different request, not the session)
        signup_data2 = {
            "username": f"user2_{os.urandom(4).hex()}",
            "password": "pass123",
            "email": "user2@example.com",
            "first_name": "User",
            "last_name": "Two",
        }
        response = requests.post(f"{self.api_url}/auth/signup/", json=signup_data2)
        print(f"Second user signup response: {response.status_code}")
        print(f"Response content: {response.text}")
        self.assertEqual(response.status_code, 200)
        user2_id = response.json()["id"]

        # Try to update user2's profile while logged in as user1
        update_data = {"bio": "Should not work"}
        response = session.patch(
            f"{self.api_url}/{user2_id}/",
            json=update_data,
            headers={"Content-Type": "application/json", "Cookie": f"sessionid={session_cookie}"},
        )
        print(f"Update response: {response.status_code}")
        print(f"Update response content: {response.text}")

        self.assertEqual(response.status_code, 403)  # Should be forbidden

    def test_update_user_invalid_data(self):
        """Test PATCH with invalid data format"""
        # First create and login as a test user with a unique username
        signup_data = {
            "username": f"testuser_{os.urandom(4).hex()}",  # Generate unique username
            "password": "testpass123",
            "email": "test@example.com",  # Add required email field
        }
        response = requests.post(f"{self.api_url}/auth/signup/", json=signup_data)
        self.assertEqual(response.status_code, 200)
        user_data = response.json()
        user_id = user_data["id"]

        # Get the session cookie and create proper headers
        session_cookie = response.cookies.get("sessionid")  # or whatever your session cookie name is
        headers = {"Cookie": f"sessionid={session_cookie}", "Content-Type": "application/json"}

        # Test invalid visibility option
        update_data = {"visibility_online_status": "invalid_option"}
        response = requests.patch(f"{self.api_url}/{user_id}/", json=update_data, headers=headers)
        self.assertEqual(response.status_code, 400)

    def test_invalid_user_format(self):
        """Test requesting user with invalid UUID format"""
        response = requests.get(f"{self.api_url}/invalid-format/")
        self.assertEqual(response.status_code, 404)

    def test_nonexistent_user(self):
        """Test requesting user with valid UUID format but non-existent"""
        response = requests.get(f"{self.api_url}/123e4567-e89b-12d3-a456-999999999999/")
        self.assertEqual(response.status_code, 404)

    def test_friend_request_flow(self):
        """Test the complete friend request flow through the API"""
        # Create sessions for both users
        session1 = requests.Session()
        session2 = requests.Session()

        # Create two users
        signup_data1 = {
            "username": f"user1_{os.urandom(4).hex()}",
            "password": "pass123",
            "email": "user1@example.com",
        }
        signup_data2 = {
            "username": f"user2_{os.urandom(4).hex()}",
            "password": "pass123",
            "email": "user2@example.com",
        }

        # Sign up first user
        signup_response1 = session1.post(
            f"{self.api_url}/auth/signup/", json=signup_data1, headers={"Content-Type": "application/json"}
        )
        print(f"\nSignup Response Status: {signup_response1.status_code}")
        print(f"Signup Response Content: {signup_response1.text}")
        print(f"Signup Cookies: {dict(session1.cookies)}")
        self.assertEqual(signup_response1.status_code, 200, "Failed to create first user")
        user1_id = signup_response1.json()["id"]

        # Sign up second user
        signup_response2 = session2.post(
            f"{self.api_url}/auth/signup/", json=signup_data2, headers={"Content-Type": "application/json"}
        )
        print(f"\nSecond user signup Response Status: {signup_response2.status_code}")
        print(f"Second user signup Response Content: {signup_response2.text}")
        print(f"Second user signup Cookies: {dict(session2.cookies)}")
        self.assertEqual(signup_response2.status_code, 200, "Failed to create second user")
        user2_id = signup_response2.json()["id"]

        # Explicitly login first user
        login_response1 = session1.post(
            f"{self.api_url}/auth/login/",
            json={"username": signup_data1["username"], "password": signup_data1["password"]},
            headers={"Content-Type": "application/json"},
        )
        print(f"\nLogin Response Status: {login_response1.status_code}")
        print(f"Login Response Content: {login_response1.text}")
        print(f"Login Cookies: {dict(session1.cookies)}")
        self.assertEqual(login_response1.status_code, 200, "Failed to login first user")

        # Send friend request with proper headers
        friend_request_response = session1.post(
            f"{self.api_url}/friend-requests/",
            json={"to_user_id": user2_id},
            headers={"Content-Type": "application/json"},
        )
        print(f"\nFriend Request Response Status: {friend_request_response.status_code}")
        print(f"Friend Request Response Content: {friend_request_response.text}")
        print(f"Friend Request Session Cookies: {dict(session1.cookies)}")
        self.assertEqual(friend_request_response.status_code, 200)

        # Check sent requests for user1
        response = session1.get(f"{self.api_url}/friend-requests/", headers={"Content-Type": "application/json"})
        print(f"\nCheck Sent Requests Response Status: {response.status_code}")
        print(f"Check Sent Requests Content: {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["sent"]), 1)
        self.assertEqual(data["sent"][0]["id"], user2_id)

        # Check received requests for user2
        response = session2.get(f"{self.api_url}/friend-requests/", headers={"Content-Type": "application/json"})
        print(f"\nCheck Received Requests Response Status: {response.status_code}")
        print(f"Check Received Requests Content: {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["received"]), 1)
        self.assertEqual(data["received"][0]["id"], user1_id)

        # Accept friend request (as user2)
        response = session2.patch(
            f"{self.api_url}/friend-requests/",
            json={"from_user_id": user1_id, "action": "accept"},
            headers={"Content-Type": "application/json"},
        )
        print(f"\nAccept Friend Request Response Status: {response.status_code}")
        print(f"Accept Friend Request Content: {response.text}")
        self.assertEqual(response.status_code, 200)

        # Verify friendship status through friends list
        response = session1.get(f"{self.api_url}/{user1_id}/friends/", headers={"Content-Type": "application/json"})
        print(f"\nVerify Friendship Status Response Status: {response.status_code}")
        print(f"Verify Friendship Status Content: {response.text}")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        friend_ids = [friend["id"] for friend in data["friends"]]
        self.assertIn(user2_id, friend_ids)

    def test_friend_requests_error_cases(self):
        """Test error cases for friend request endpoints"""
        # Create test user
        signup_data = {
            "username": f"user_{os.urandom(4).hex()}",
            "password": "pass123",
            "email": "user@example.com",
        }
        response = requests.post(
            f"{self.api_url}/auth/signup/", json=signup_data, headers={"Content-Type": "application/json"}
        )
        user_cookies = response.cookies
        user_id = response.json()["id"]

        # Test unauthenticated access
        response = requests.get(f"{self.api_url}/friend-requests/", headers={"Content-Type": "application/json"})
        self.assertEqual(response.status_code, 401)

        # Test sending request to non-existent user
        response = requests.post(
            f"{self.api_url}/friend-requests/",
            json={"to_user_id": "00000000-0000-0000-0000-000000000000"},
            cookies=user_cookies,
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(response.status_code, 404)

        # Test sending request to self
        response = requests.post(
            f"{self.api_url}/friend-requests/",
            json={"to_user_id": user_id},
            cookies=user_cookies,
            headers={"Content-Type": "application/json"},
        )
        self.assertEqual(response.status_code, 400)

    def test_friends_list_features(self):
        """Test friends list features including pagination and search"""
        # Create main test user
        session = requests.Session()  # Create a session for the main user
        signup_data = {
            "username": f"main_user_{os.urandom(4).hex()}",
            "password": "pass123",
            "email": "main@example.com",
        }
        response = session.post(
            f"{self.api_url}/auth/signup/", json=signup_data, headers={"Content-Type": "application/json"}
        )
        user_id = response.json()["id"]

        # Create and add multiple friends
        friend_ids = []
        for i in range(3):
            friend_session = requests.Session()  # Create a separate session for each friend
            friend_data = {
                "username": f"friend{i}_{os.urandom(4).hex()}",
                "password": "pass123",
                "email": f"friend{i}@example.com",
            }
            response = friend_session.post(
                f"{self.api_url}/auth/signup/", json=friend_data, headers={"Content-Type": "application/json"}
            )
            friend_id = response.json()["id"]
            friend_ids.append(friend_id)

            # Send friend request using main user's session
            response = session.post(
                f"{self.api_url}/friend-requests/",
                json={"to_user_id": friend_id},
                headers={"Content-Type": "application/json"},
            )

            # Accept friend request using friend's session
            response = friend_session.patch(
                f"{self.api_url}/friend-requests/",
                json={"from_user_id": user_id, "action": "accept"},
                headers={"Content-Type": "application/json"},
            )

        # Test pagination using main user's session
        response = session.get(
            f"{self.api_url}/{user_id}/friends/?page=1&per_page=2", headers={"Content-Type": "application/json"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data["friends"]), 2)
        self.assertEqual(data["pagination"]["total"], 3)
        self.assertEqual(data["pagination"]["total_pages"], 2)

        # Test search functionality
        friend_username = data["friends"][0]["username"]
        search_term = friend_username[:5]
        response = requests.get(
            f"{self.api_url}/{user_id}/friends/?search={search_term}", headers={"Content-Type": "application/json"}
        )
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(any(friend["username"].startswith(search_term) for friend in data["friends"]))

    def test_avatar_upload(self):
        """Test avatar upload functionality through the API"""
        # Create a session
        session = requests.Session()

        # First create and login as a test user
        signup_data = {
            "username": f"testuser_{os.urandom(4).hex()}",
            "password": "testpass123",
            "email": "testuser@example.com",
        }

        # Signup request
        response = session.post(
            f"{self.api_url}/auth/signup/", json=signup_data, headers={"Content-Type": "application/json"}
        )
        self.assertEqual(response.status_code, 200, "Failed to create user")
        user_id = response.json()["id"]

        # Use existing image from media folder
        media_path = os.path.join(os.path.dirname(__file__), "media", "max_fischer.jpeg")

        with open(media_path, "rb") as img_file:
            files = {"avatar": ("new_avatar.jpg", img_file, "image/jpeg")}

            # Upload avatar
            response = session.post(f"{self.api_url}/users/{user_id}/avatar/", files=files)

            print(f"Avatar upload response status: {response.status_code}")
            print(f"Avatar upload response content: {response.text}")

            self.assertEqual(response.status_code, 200)
            data = response.json()

            # Verify the avatar URL is returned
            self.assertIn("avatar", data)
            avatar_url = data["avatar"]

            # Verify the avatar path structure
            self.assertTrue(avatar_url.startswith("/media/avatars/"))
            self.assertTrue(avatar_url.endswith(".jpg"))

    def test_avatar_upload_and_retrieve(self):
        """Test avatar upload with existing image and URL retrieval"""
        # Create a session
        session = requests.Session()

        # First create and login as a test user
        signup_data = {
            "username": f"testuser_{os.urandom(4).hex()}",
            "password": "testpass123",
            "email": "testuser@example.com",
        }

        # Signup request with headers
        response = session.post(
            f"{self.api_url}/auth/signup/", json=signup_data, headers={"Content-Type": "application/json"}
        )
        self.assertEqual(response.status_code, 200, "Failed to create user")
        user_id = response.json()["id"]

        # Use existing image from media folder
        media_path = os.path.join(os.path.dirname(__file__), "media", "max_fischer.jpeg")

        with open(media_path, "rb") as img_file:
            files = {"avatar": ("max_fischer.jpeg", img_file, "image/jpeg")}

            # Upload avatar
            upload_response = session.post(f"{self.api_url}/users/{user_id}/avatar/", files=files)

            print(f"Avatar upload response status: {upload_response.status_code}")
            print(f"Avatar upload response content: {upload_response.text}")

            self.assertEqual(upload_response.status_code, 200)
            upload_data = upload_response.json()

            # Verify the avatar URL is returned
            self.assertIn("avatar", upload_data)
            avatar_url = upload_data["avatar"]
            self.assertTrue(avatar_url.startswith("/media/avatars/"))
            self.assertTrue("max_fischer" in avatar_url)
            self.assertTrue(avatar_url.endswith(".jpeg"))

            # Now get the user profile to verify the avatar URL is correctly stored
            profile_response = session.get(
                f"{self.api_url}/{user_id}/", headers={"Content-Type": "application/json"}  # Remove the extra /users/
            )
            self.assertEqual(profile_response.status_code, 200)
            profile_data = profile_response.json()

            # Verify the avatar URL in the profile matches the upload response
            self.assertEqual(profile_data["avatar"], avatar_url)

            print(f"Avatar URL from upload: {avatar_url}")
            print(f"Avatar URL in profile: {profile_data['avatar']}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
