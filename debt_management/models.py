from django.db import models
from django.contrib.auth.models import User

class Debtor(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='debtors')
    name = models.CharField(max_length=255)
    nickname = models.CharField(max_length=255, blank=True, null=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    photo = models.ImageField(upload_to='debtor_photos/', blank=True, null=True)
    total_debt = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({self.nickname})" if self.nickname else self.name

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('DEBT', 'Utang'),
        ('PAYMENT', 'Bayar'),
    )

    debtor = models.ForeignKey(Debtor, on_delete=models.CASCADE, related_name='transactions')
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    note = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type} - {self.debtor.name} - {self.amount}"
