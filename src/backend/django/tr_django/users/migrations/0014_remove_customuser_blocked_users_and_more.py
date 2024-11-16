# Generated by Django 5.1.2 on 2024-11-16 18:09

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0013_merge_20241116_1358"),
    ]

    operations = [
        migrations.RemoveField(
            model_name="customuser",
            name="blocked_users",
        ),
        migrations.AlterField(
            model_name="emailverificationtoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 11, 17, 18, 9, 9, 715335, tzinfo=datetime.timezone.utc
                )
            ),
        ),
        migrations.AlterField(
            model_name="passwordresettoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 11, 16, 19, 9, 9, 715561, tzinfo=datetime.timezone.utc
                )
            ),
        ),
    ]
