from django.core.management.base import BaseCommand
from chat.models import BlockedUser
from users.models import CustomUser


class Command(BaseCommand):
    help = "Seeding 'dev' blocking 'LexFridman'"

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS("Seeding 'dev' blocking 'LexFridman'"))

        try:
            dev_user = CustomUser.objects.get(username="dev")
            LexFridman = CustomUser.objects.get(username="LexFridman")

            # Create the BlockedUser entry
            BlockedUser.objects.get_or_create(user=dev_user, blocked_user=LexFridman)

            self.stdout.write(self.style.SUCCESS("Successfully seeded 'dev' blocking 'LexFridman'"))
        except CustomUser.DoesNotExist:
            self.stdout.write(self.style.ERROR("One or both users do not exist"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"An error occurred: {str(e)}"))
