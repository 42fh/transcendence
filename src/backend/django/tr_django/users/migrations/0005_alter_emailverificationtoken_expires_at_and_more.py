# Generated by Django 5.1.2 on 2024-11-26 17:42

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0004_alter_emailverificationtoken_expires_at_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="emailverificationtoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 11, 27, 17, 42, 27, 401798, tzinfo=datetime.timezone.utc
                )
            ),
        ),
        migrations.AlterField(
            model_name="passwordresettoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 11, 26, 18, 42, 27, 402194, tzinfo=datetime.timezone.utc
                )
            ),
        ),
    ]
