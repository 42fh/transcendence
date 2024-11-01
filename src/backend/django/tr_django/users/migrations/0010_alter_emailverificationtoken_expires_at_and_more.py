# Generated by Django 5.1.2 on 2024-11-01 08:46

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0009_alter_emailverificationtoken_expires_at_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="emailverificationtoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 11, 2, 8, 46, 54, 353890, tzinfo=datetime.timezone.utc
                )
            ),
        ),
        migrations.AlterField(
            model_name="passwordresettoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 11, 1, 9, 46, 54, 354309, tzinfo=datetime.timezone.utc
                )
            ),
        ),
    ]
