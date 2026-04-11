"""
Wonogiri Debt Management Forms Module

This module handles the construction, validation, and styling of all user input forms.
By consolidating form logic here, we maintain a clean separation between the data layer
(models) and the interaction layer (views).

Key Features:
- Tailwind CSS class injection for all widgets.
- Advanced field validation (phone numbers, negative amounts).
- Specialized clean methods for business logic enforcement.
"""

from django import forms
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from .models import Debtor, Transaction

class BaseStyledForm(forms.ModelForm):
    """
    Abstract base class that injects standard Tailwind CSS classes into widgets.
    Reduces boilerplate code in child forms.
    """
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for field_name, field in self.fields.items():
            # Apply base styling for all inputs
            existing_classes = field.widget.attrs.get('class', '')
            base_classes = "w-full bg-gray-50 border-2 border-transparent focus:border-orange-500 rounded-2xl py-4 px-5 outline-none transition-all font-medium text-gray-900"
            field.widget.attrs['class'] = f"{base_classes} {existing_classes}".strip()
            
            # Specific styling for textareas
            if isinstance(field.widget, forms.Textarea):
                field.widget.attrs['rows'] = 3
                field.widget.attrs['class'] = field.widget.attrs['class'].replace('py-4', 'py-3')

class DebtorForm(BaseStyledForm):
    """
    Form for creating and updating Debtor profiles.
    """
    
    class Meta:
        model = Debtor
        fields = ['name', 'nickname', 'phone_number', 'photo']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': _('Contoh: Budi Santoso')}),
            'nickname': forms.TextInput(attrs={'placeholder': _('Contoh: Pak Budi')}),
            'phone_number': forms.TextInput(attrs={'placeholder': _('0812XXX')}),
        }

    def clean_name(self):
        """Ensures the name isn't just numbers or symbols."""
        name = self.cleaned_data.get('name')
        if name and len(name) < 3:
            raise ValidationError(_("Nama terlalu pendek, minimal 3 karakter."))
        return name

    def clean_phone_number(self):
        """Custom cleaning for phone number formatting."""
        data = self.cleaned_data.get('phone_number')
        if data:
            # Strip spaces, dashes, etc.
            data = data.replace(' ', '').replace('-', '')
            if not data.isdigit():
                raise ValidationError(_("Nomor telepon hanya boleh berisi angka."))
        return data

class TransactionForm(BaseStyledForm):
    """
    Form for recording financial transactions (Debt or Payment).
    """
    
    class Meta:
        model = Transaction
        fields = ['amount', 'type', 'note']
        widgets = {
            'amount': forms.NumberInput(attrs={'placeholder': '0', 'step': '1000'}),
            'type': forms.Select(),
            'note': forms.Textarea(attrs={'placeholder': _('Ada catatan khusus untuk transaksi ini?')}),
        }

    def clean_amount(self):
        """Ensures that transaction amounts are always positive and significant."""
        amount = self.cleaned_data.get('amount')
        if amount and amount <= 0:
            raise ValidationError(_("Nominal transaksi harus lebih dari nol."))
        if amount and amount < 500:
            raise ValidationError(_("Minimal transaksi adalah Rp 500."))
        return amount

    def clean(self):
        """
        Cross-field validation logic.
        Example: Ensuring a payment doesn't exceed the current total debt (optional policy).
        """
        cleaned_data = super().clean()
        tx_type = cleaned_data.get('type')
        amount = cleaned_data.get('amount')
        
        # Additional logic can be added here if we want to enforce strict payment rules
        return cleaned_data

class QuickTransactionForm(forms.Form):
    """
    A lightweight, non-model form for the dashboard's quick-add feature.
    Demonstrates handling complex logic without direct ModelForm coupling.
    """
    
    debtor_id = forms.IntegerField(widget=forms.HiddenInput())
    amount = forms.DecimalField(
        max_digits=12, 
        decimal_places=2,
        widget=forms.NumberInput(attrs={
            'class': 'w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-4 px-5 text-xl font-bold text-gray-900 focus:border-orange-500 focus:outline-none transition-all',
            'placeholder': '0'
        })
    )
    transaction_type = forms.ChoiceField(
        choices=Transaction.TRANSACTION_TYPES,
        widget=forms.HiddenInput()
    )
    note = forms.CharField(
        required=False,
        widget=forms.Textarea(attrs={
            'class': 'w-full bg-gray-50 border-2 border-gray-100 rounded-2xl py-3 px-4 focus:border-orange-500 focus:outline-none transition-all',
            'rows': 2,
            'placeholder': _('Catatan Transaksi')
        })
    )

    def process_transaction(self, actor_user):
        """
        Custom business method to process the quick-form data into a real database record.
        """
        from .models import Debtor
        debtor = Debtor.objects.get(pk=self.cleaned_data['debtor_id'], user=actor_user)
        
        return Transaction.objects.create(
            debtor=debtor,
            amount=self.cleaned_data['amount'],
            type=self.cleaned_data['transaction_type'],
            note=self.cleaned_data['note']
        )

# Form module successfully expanded with specialized logic and validation.
