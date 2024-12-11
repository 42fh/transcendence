# Generated by Django 5.1.2 on 2024-12-04 19:31

import datetime
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("users", "0012_alter_emailverificationtoken_expires_at_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="emailverificationtoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 12, 5, 19, 31, 47, 139734, tzinfo=datetime.timezone.utc
                )
            ),
        ),
        migrations.AlterField(
            model_name="passwordresettoken",
            name="expires_at",
            field=models.DateTimeField(
                default=datetime.datetime(
                    2024, 12, 4, 20, 31, 47, 141362, tzinfo=datetime.timezone.utc
                )
            ),
        ),
    ]
