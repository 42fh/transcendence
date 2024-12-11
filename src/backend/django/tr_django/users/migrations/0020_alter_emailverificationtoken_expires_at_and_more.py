# Generated by Django 5.1.2 on 2024-12-09 14:41

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0019_alter_emailverificationtoken_expires_at_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="emailverificationtoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 12, 10, 14, 41, 17, 754127, tzinfo=datetime.timezone.utc
                )
            ),
        ),
        migrations.AlterField(
            model_name="passwordresettoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 12, 9, 15, 41, 17, 754486, tzinfo=datetime.timezone.utc
                )
            ),
        ),
    ]
