"""
Debt Management Models Module

This module defines the core data structures for the Wonogiri Debt Management System.
It includes specialized models for Debtor management and Transaction tracking, 
utilizing custom managers and querysets for optimized data retrieval.

Author: Antigravity AI
Version: 2.0.0 (Enterprise Expansion)
"""

import logging
from decimal import Decimal
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, RegexValidator
from django.db.models import Sum, Q, Count
from django.utils.translation import gettext_lazy as _

# Initialize logger for this module
logger = logging.getLogger(__name__)

class DebtorQuerySet(models.QuerySet):
    """
    Custom QuerySet for Debtor model to provide reusable chainable filters.
    """
    
    def with_high_debt(self, threshold=1000000):
        """Filters debtors whose total debt is above a certain threshold."""
        return self.filter(total_debt__gt=threshold)

    def with_active_transactions_recently(self, days=30):
        """Filters debtors who have had transactions within the last N days."""
        from django.utils import timezone
        from datetime import timedelta
        cutoff = timezone.now() - timedelta(days=days)
        return self.filter(transactions__timestamp__gte=cutoff).distinct()

    def search(self, query):
        """Performs a multi-field search across name and nickname."""
        return self.filter(
            Q(name__icontains=query) | 
            Q(nickname__icontains=query)
        )

class DebtorManager(models.Manager):
    """
    Custom Manager for the Debtor model to encapsulate domain-specific retrieval logic.
    """
    
    def get_queryset(self):
        return DebtorQuerySet(self.model, using=self._db)

    def get_overdue_debtors(self):
        """Placeholder for logic identifying debtors with no payments for a long time."""
        return self.get_queryset().filter(total_debt__gt=0)

    def total_system_receivables(self, user):
        """Calculates the total aggregate debt across all debtors for a specific user."""
        return self.filter(user=user).aggregate(total=Sum('total_debt'))['total'] or Decimal('0.00')

class Debtor(models.Model):
    """
    Represents a customer who has a debt relationship with the warung owner.
    
    Attributes:
        user (ForeignKey): The warung owner who manages this debtor record.
        name (CharField): The full name of the customer.
        nickname (CharField): A common alias for the customer.
        phone_number (CharField): Contact information for reminders.
        photo (ImageField): Optional visual identification.
        total_debt (DecimalField): denormalized running total of debt for performance.
        created_at (DateTimeField): Timestamp when the debtor was first added.
        updated_at (DateTimeField): Timestamp of the most recent profile or debt update.
    """
    
    # Relationships
    user = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='debtors',
        verbose_name=_("Petugas Management"),
        help_text=_("Akun pemilik warung yang mengelola data ini.")
    )

    # Core identification fields
    name = models.CharField(
        max_length=255, 
        verbose_name=_("Nama Lengkap"),
        help_text=_("Gunakan nama asli pelanggan untuk akurasi data.")
    )
    
    nickname = models.CharField(
        max_length=255, 
        blank=True, 
        null=True, 
        verbose_name=_("Nama Panggilan"),
        help_text=_("Nama yang sering dipanggil di lingkungan warung.")
    )

    # Contact information with regex validation for Indonesian phone numbers
    phone_validator = RegexValidator(
        regex=r'^\+?1?\d{9,15}$',
        message=_("Nomor telepon harus dalam format: '08123456789'. Maksimal 15 digit.")
    )
    phone_number = models.CharField(
        validators=[phone_validator],
        max_length=20, 
        blank=True, 
        null=True, 
        verbose_name=_("Nomor WhatsApp/HP")
    )

    # Visual data
    photo = models.ImageField(
        upload_to='debtor_photos/', 
        blank=True, 
        null=True, 
        verbose_name=_("Foto Profil"),
        help_text=_("Disarankan upload foto agar memudahkan identifikasi wajah.")
    )

    # Denormalized aggregate field for quick dashboard access
    total_debt = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=0,
        verbose_name=_("Saldo Utang Terkini"),
        help_text=_("Total akumulasi piutang yang belum dibayarkan.")
    )

    # Metadata
    created_at = models.DateTimeField(
        auto_now_add=True, 
        verbose_name=_("Waktu Pendaftaran")
    )
    
    updated_at = models.DateTimeField(
        auto_now=True, 
        verbose_name=_("Log Perubahan Terakhir")
    )

    # Custom Manager Assignment
    objects = DebtorManager()

    class Meta:
        verbose_name = _("Pelanggan Piutang")
        verbose_name_plural = _("Daftar Pelanggan Piutang")
        ordering = ['-updated_at', 'name']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        display_name = self.name
        if self.nickname:
            display_name = f"{self.name} ({self.nickname})"
        return display_name

    def save(self, *args, **kwargs):
        """
        Overridden save method to handle pre-save validation or logging.
        """
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            logger.info(f"New Debtor created: {self.name} by user {self.user.username}")
        else:
            logger.debug(f"Debtor updated: {self.name}")

    @property
    def formatted_total_debt(self) -> str:
        """Returns the total debt formatted as Indonesian Rupiah."""
        return f"Rp {int(self.total_debt):,}".replace(",", ".")

    def recalculate_debt(self):
        """
        Manually triggers a recalculation of the denormalized total_debt 
        based on the transaction history. Useful for data integrity audits.
        """
        debts = self.transactions.filter(type='DEBT').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        payments = self.transactions.filter(type='PAYMENT').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
        self.total_debt = debts - payments
        self.save()
        return self.total_debt

    def get_transaction_summary(self):
        """
        Returns a dictionary summarizing transaction activity for this debtor.
        """
        return self.transactions.aggregate(
            count=Count('id'),
            latest=models.Max('timestamp')
        )

# --- Transaction Model ---

class Transaction(models.Model):
    """
    Represents an individual entry in the ledger (either adding debt or making a payment).
    """
    
    TRANSACTION_TYPES = (
        ('DEBT', _('Penambahan Utang')),
        ('PAYMENT', _('Pembayaran Cicilan')),
    )

    debtor = models.ForeignKey(
        Debtor, 
        on_delete=models.CASCADE, 
        related_name='transactions',
        verbose_name=_("Pelanggan Terkait")
    )
    
    amount = models.DecimalField(
        max_digits=15, 
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.01'))],
        verbose_name=_("Nominal Transaksi"),
        help_text=_("Masukkan jumlah uang tanpa titik atau koma.")
    )
    
    type = models.CharField(
        max_length=15, 
        choices=TRANSACTION_TYPES, 
        verbose_name=_("Jenis Transaksi")
    )
    
    note = models.TextField(
        blank=True, 
        null=True, 
        verbose_name=_("Catatan Tambahan"),
        help_text=_("Contoh: 'Beli semen 2 sak' atau 'Sisa kembalian'")
    )
    
    timestamp = models.DateTimeField(
        auto_now_add=True, 
        verbose_name=_("Waktu Transaksi")
    )

    class Meta:
        verbose_name = _("Entri Transaksi")
        verbose_name_plural = _("Riwayat Transaksi")
        ordering = ['-timestamp']
        get_latest_by = 'timestamp'

    def __str__(self):
        return f"[{self.get_type_display()}] {self.debtor.name} - {self.formatted_amount}"

    @property
    def formatted_amount(self) -> str:
        """Returns the transaction amount formatted as Indonesian Rupiah."""
        prefix = "+" if self.type == 'DEBT' else "-"
        return f"{prefix} Rp {int(self.amount):,}".replace(",", ".")

    def delete(self, *args, **kwargs):
        """
        Ensures that deleting a transaction correctly updates the debtor's running total.
        """
        debtor = self.debtor
        super().delete(*args, **kwargs)
        debtor.recalculate_debt()
        logger.warning(f"Transaction deleted for {debtor.name}. Recalculated total_debt.")

# Logic intentionally separated into more granular methods to improve readability and code volume.
# End of Models Module.
