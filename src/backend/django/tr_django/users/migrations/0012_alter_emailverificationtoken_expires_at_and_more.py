# Generated by Django 5.1.2 on 2024-12-04 19:10

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0011_merge_20241204_1910"),
    ]

    operations = [
        migrations.AlterField(
            model_name="emailverificationtoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 12, 5, 19, 10, 33, 95521, tzinfo=datetime.timezone.utc
                )
            ),
        ),
        migrations.AlterField(
            model_name="passwordresettoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 12, 4, 20, 10, 33, 95993, tzinfo=datetime.timezone.utc
                )
            ),
        ),
    ]
