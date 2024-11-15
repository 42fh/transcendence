# Generated by Django 5.1.2 on 2024-11-15 18:15

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0010_alter_customuser_blocked_users_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="emailverificationtoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 11, 16, 18, 15, 26, 402709, tzinfo=datetime.timezone.utc
                )
            ),
        ),
        migrations.AlterField(
            model_name="passwordresettoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 11, 15, 19, 15, 26, 403526, tzinfo=datetime.timezone.utc
                )
            ),
        ),
    ]
