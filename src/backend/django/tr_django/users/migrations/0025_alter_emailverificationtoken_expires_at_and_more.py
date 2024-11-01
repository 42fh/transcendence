# Generated by Django 5.1.2 on 2024-11-01 22:47

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0024_alter_emailverificationtoken_expires_at_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="emailverificationtoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 11, 2, 22, 47, 6, 77113, tzinfo=datetime.timezone.utc
                )
            ),
        ),
        migrations.AlterField(
            model_name="passwordresettoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 11, 1, 23, 47, 6, 77523, tzinfo=datetime.timezone.utc
                )
            ),
        ),
    ]
