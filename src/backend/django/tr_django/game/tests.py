from django.test import TestCase
from game.models import GameMode


class GameModeTestCase(TestCase):
    def setUp(self):
        # Set up a GameMode instance for testing
        self.mode = GameMode.objects.create(
            name="Arcade", description="Fast-paced game mode with power-ups."
        )

    def test_creation(self):
        """Test that a GameMode instance is created correctly."""
        self.assertEqual(self.mode.name, "Arcade")
        self.assertEqual(self.mode.description, "Fast-paced game mode with power-ups.")

    def test_string_representation(self):
        """Test the string representation of GameMode."""
        self.assertEqual(str(self.mode), "Arcade")

    def test_update(self):
        """Test that a GameMode instance can be updated."""
        self.mode.name = "Classic"
        self.mode.description = "Traditional game mode without power-ups."
        self.mode.save()

        # Refresh from database to confirm update
        updated_mode = GameMode.objects.get(id=self.mode.id)
        self.assertEqual(updated_mode.name, "Classic")
        self.assertEqual(
            updated_mode.description, "Traditional game mode without power-ups."
        )

    def test_deletion(self):
        """Test that a GameMode instance can be deleted."""
        mode_id = self.mode.id
        self.mode.delete()

        # Check that the mode no longer exists in the database
        with self.assertRaises(GameMode.DoesNotExist):
            GameMode.objects.get(id=mode_id)
