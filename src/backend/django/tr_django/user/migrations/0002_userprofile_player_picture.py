# Generated by Django 3.2.25 on 2024-10-19 16:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("user", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="userprofile",
            name="player_picture",
            field=models.ImageField(blank=True, null=True, upload_to="player_pics/"),
        ),
    ]
