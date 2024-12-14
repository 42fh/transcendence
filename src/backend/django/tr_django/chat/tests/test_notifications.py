from django.test import TestCase, Client
from django.urls import reverse
from users.models import CustomUser
import json


class NotificationAPITests(TestCase):
    def setUp(self):
        self.client = Client()
        self.url = reverse("notifications")
        self.user = CustomUser.objects.create_user(username="dev", password="devpassword")

    def test_create_notification_with_url(self):
        """Test creating a notification with a URL for the user 'dev'."""
        self.client.login(username="dev", password="devpassword")  # Log in as the user

        notification_data = {"message": "You have a new message from Dev.", "url": "http://example.com"}

        response = self.client.post(self.url, data=json.dumps(notification_data), content_type="application/json")

        self.assertEqual(response.status_code, 201)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertIn("id", data)
