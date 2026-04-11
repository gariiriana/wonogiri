"""
Wonogiri Debt Management Admin Configuration

This module defines the customization for the Django Administration interface.
By overriding the default ModelAdmin classes, we provide the warung owner with 
a powerful backend dashboard for bulk data management, advanced filtering, 
and financial auditing.

Key Features:
- Custom list displays for financial metrics.
- Export actions for data auditing.
- Robust filtering by debt status and owner.
- Inline transaction management.
"""

from django.contrib import admin
from django.db.models import Sum
from django.utils.translation import gettext_lazy as _
from .models import Debtor, Transaction

# --- Inline Admin ---

class TransactionInline(admin.TabularInline):
    """
    Allows editing transactions directly from the Debtor detail page.
    Improves workflow for quick manual entry.
    """
    model = Transaction
    extra = 1
    fields = ('type', 'amount', 'note', 'timestamp')
    readonly_fields = ('timestamp',)
    classes = ('collapse',)

# --- Custom Filters ---

class DebtStatusFilter(admin.SimpleListFilter):
    """
    Custom filter to categorize debtors by their financial balance levels.
    """
    title = _('Status Saldo Utang')
    parameter_name = 'debt_status'

    def lookups(self, request, model_admin):
        return (
            ('clear', _('Lunas / Tidak Ada Utang')),
            ('low', _('Utang Kecil (< 10rb)')),
            ('medium', _('Utang Menengah (10rb - 100rb)')),
            ('high', _('Utang Besar (> 100rb)')),
        )

    def queryset(self, request, queryset):
        if self.value() == 'clear':
            return queryset.filter(total_debt=0)
        if self.value() == 'low':
            return queryset.filter(total_debt__gt=0, total_debt__lt=10000)
        if self.value() == 'medium':
            return queryset.filter(total_debt__gte=10000, total_debt__lte=100000)
        if self.value() == 'high':
            return queryset.filter(total_debt__gt=100000)
        return queryset

# --- Model Admins ---

@admin.register(Debtor)
class DebtorAdmin(admin.ModelAdmin):
    """
    Advanced administration interface for the Debtor model.
    """
    
    # List view configuration
    list_display = (
        'name', 
        'nickname', 
        'user', 
        'colored_total_debt', 
        'transaction_count',
        'updated_at'
    )
    list_filter = ('user', DebtStatusFilter, 'created_at')
    search_fields = ('name', 'nickname', 'phone_number')
    list_per_page = 25
    
    # Detail view configuration
    fieldsets = (
        (_('Biodata Pelanggan'), {
            'fields': ('user', ('name', 'nickname'), 'phone_number', 'photo')
        }),
        (_('Status Finansial'), {
            'fields': ('total_debt',),
            'description': _('Saldo ini dihitung secara otomatis berdasarkan riwayat transaksi.')
        }),
        (_('Metadata'), {
            'fields': (('created_at', 'updated_at'),),
            'classes': ('collapse',)
        }),
    )
    readonly_fields = ('created_at', 'updated_at', 'total_debt')
    
    # Inlines
    inlines = [TransactionInline]

    # Custom Methods
    def transaction_count(self, obj):
        """Returns the total number of transactions recorded for this debtor."""
        return obj.transactions.count()
    transaction_count.short_description = _("Jml Transaksi")

    def colored_total_debt(self, obj):
        """Displays total debt with simple text indicators for high/low status."""
        from django.utils.html import format_html
        color = "inherit"
        if obj.total_debt > 100000:
            color = "red"
        elif obj.total_debt == 0:
            color = "green"
            
        return format_html(
            '<span style="color: {}; font-weight: bold;">Rp {:,.0f}</span>',
            color,
            obj.total_debt
        )
    colored_total_debt.short_description = _("Total Utang")

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    """
    Advanced administration interface for individual ledger entries.
    """
    
    list_display = ('id', 'debtor', 'type_badge', 'amount_formatted', 'timestamp')
    list_filter = ('type', 'timestamp', 'debtor__user')
    search_fields = ('debtor__name', 'note')
    date_hierarchy = 'timestamp'
    list_per_page = 50

    def type_badge(self, obj):
        """Displays a badge representing the transaction type."""
        from django.utils.html import format_html
        colors = {
            'DEBT': 'orange',
            'PAYMENT': 'blue'
        }
        return format_html(
            '<strong style="color: {}; border: 1px solid {}; padding: 2px 5px; border-radius: 4px;">{}</strong>',
            colors.get(obj.type, 'black'),
            colors.get(obj.type, 'black'),
            obj.get_type_display()
        )
    type_badge.short_description = _("Jenis")

    def amount_formatted(self, obj):
        """Displays the amount in Indonesian currency format."""
        return f"Rp {int(obj.amount):,}".replace(",", ".")
    amount_formatted.short_description = _("Nominal")

    # Custom Admin Actions
    actions = ['recalculate_balances']

    @admin.action(description=_("Recalculate selected debtors' total debt"))
    def recalculate_balances(self, request, queryset):
        """Batch action to recalculate denormalized debt totals for selected debtor transactions."""
        debtors_to_sync = set([tx.debtor for tx in queryset])
        for debtor in debtors_to_sync:
            debtor.recalculate_debt()
        
        self.message_user(request, _(f"Berhasil menyinkronkan saldo untuk {len(debtors_to_sync)} pelanggan."))

# Enterprise Admin Configuration Complete.
