from django.core.management.base import BaseCommand
from users.models import CustomUser


class Command(BaseCommand):
    help = "Seeds the database with various test users, friendships and friend requests"

    def create_test_user(self, friends=0, sent=0, received=0):
        """Creates a test user with specified number of relationships"""
        # Username format: test{f}f{s}s{r}r - e.g., test5f3s5r
        username = f"test{friends}f{sent}s{received}r"
        user = CustomUser.objects.create_user(
            username=username, password="test123", email=f"{username}@example.com"  # Same password for all test users
        )
        self.stdout.write(f"Created user: {username}")
        return user

    def handle(self, *args, **kwargs):

        # Create test scenarios
        scenarios = [
            # (friends, sent_requests, received_requests)
            (0, 0, 0),  # User with no relationships
            (5, 3, 2),  # User with moderate relationships
            (10, 5, 5),  # User with more relationships
            (20, 8, 7),  # User with many relationships
            (100, 15, 10),  # User with lots of relationships
        ]

        # Check if any of these specific test users exist
        test_usernames = [f"test{f}f{s}s{r}r" for f, s, r in scenarios]
        if CustomUser.objects.filter(username__in=test_usernames).exists():
            self.stdout.write(
                self.style.SUCCESS(
                    "Test users with friends already exist, skipping...\n"
                    "Available test accounts:\n"
                    + "\n".join([f"- {username} (password: test123)" for username in test_usernames])
                )
            )
            return

        # Clear existing test users
        CustomUser.objects.filter(username__startswith="test").delete()
        self.stdout.write("Cleared existing test users")
        created_users = {}
        # First create all main test users
        for friends, sent, received in scenarios:
            user = self.create_test_user(friends, sent, received)
            created_users[(friends, sent, received)] = user

        # Create necessary additional users and establish relationships
        for (friends, sent, received), main_user in created_users.items():
            # Create and add friends
            for i in range(friends):
                friend = CustomUser.objects.create_user(
                    username=f"friend_{main_user.username}_{i}",
                    password="test123",
                    email=f"friend_{i}_{main_user.username}@example.com",
                )
                main_user.friends.add(friend)
                self.stdout.write(f"Added friend {i} to {main_user.username}")

            # Create and add sent requests
            for i in range(sent):
                target = CustomUser.objects.create_user(
                    username=f"sent_to_{main_user.username}_{i}",
                    password="test123",
                    email=f"sent_to_{i}_{main_user.username}@example.com",
                )
                main_user.send_friend_request(target)
                self.stdout.write(f"Sent friend request from {main_user.username} to user {i}")

            # Create and add received requests
            for i in range(received):
                sender = CustomUser.objects.create_user(
                    username=f"received_from_{main_user.username}_{i}",
                    password="test123",
                    email=f"received_from_{i}_{main_user.username}@example.com",
                )
                sender.send_friend_request(main_user)
                self.stdout.write(f"Created received request for {main_user.username} from user {i}")

        self.stdout.write(
            self.style.SUCCESS(
                f"Successfully created test users!\n"
                f"Test accounts created:\n"
                + "\n".join([f"- {user.username} (password: test123)" for user in created_users.values()])
                + "\nAll users have password: test123"
            )
        )
