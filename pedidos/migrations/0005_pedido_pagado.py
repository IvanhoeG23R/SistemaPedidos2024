# Generated by Django 5.1 on 2024-09-09 02:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("pedidos", "0004_pedido_cedula_pedido_nombre_alter_mesa_numero"),
    ]

    operations = [
        migrations.AddField(
            model_name="pedido",
            name="pagado",
            field=models.BooleanField(default=False),
        ),
    ]
