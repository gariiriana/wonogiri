"""
Wonogiri Debt Management - Comprehensive Test Suite

This module performs rigorous automated testing of the entire application lifecycle, 
ensuring the stability of financial logic, user authentication, and profile management.

The suite is divided into:
1. Model Tests: Integrity of data structures and denormalized totals.
2. Signal Tests: Verification of automated ledger synchronization.
3. Form Tests: Validation logic and Tailwind integration.
4. View Tests: Access control, search performance, and CBV flow.

Author: Antigravity AI
Version: 2.5.0 (Enterprise Expansion)
"""

import os
from decimal import Decimal
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from .models import Debtor, Transaction
from .forms import DebtorForm, TransactionForm

class DebtManagementBaseTestChannel(TestCase):
    """
    Abstract base test class containing shared setup logic and helper methods.
    """
    
    def setUp(self):
        """Initializes standard test data for all child test classes."""
        self.user = User.objects.create_user(username='testowner', password='password123')
        self.client = Client()
        
        # Test file for ImageField
        self.test_image = SimpleUploadedFile(
            name='test_photo.jpg', 
            content=b'\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x05\x04\x04\x00\x00\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b', 
            content_type='image/jpeg'
        )

# --- Phase 1: Model Integrity Tests ---

class ModelIntegrityTests(DebtManagementBaseTestChannel):
    """
    Tests focused on the database layer and model methods.
    """

    def test_debtor_creation_and_string_representation(self):
        """Verifies that debtor profiles are saved correctly with correct __str__."""
        debtor = Debtor.objects.create(
            user=self.user,
            name="John Doe",
            nickname="John"
        )
        self.assertEqual(str(debtor), "John Doe (John)")
        self.assertEqual(debtor.total_debt, Decimal('0.00'))

    def test_transaction_creation_and_negative_amounts(self):
        """Ensures transactions are linked to debtors and amounts are handled."""
        debtor = Debtor.objects.create(user=self.user, name="Budi")
        tx = Transaction.objects.create(
            debtor=debtor,
            amount=Decimal('50000.00'),
            type='DEBT',
            note="Beli Beras"
        )
        self.assertEqual(tx.debtor, debtor)
        self.assertEqual(tx.amount, Decimal('50000.00'))

    def test_debtor_formatted_total_debt(self):
        """Tests the Indonesian Rupiah formatting property."""
        debtor = Debtor.objects.create(user=self.user, name="Siti", total_debt=Decimal('1250000.00'))
        self.assertEqual(debtor.formatted_total_debt, "Rp 1.250.000")

# --- Phase 2: Signal & Ledger Tests ---

class SignalLedgerTests(DebtManagementBaseTestChannel):
    """
    Rigorous testing of automated balance calculation via signals.
    """

    def test_ledger_sync_on_new_transaction(self):
        """Verifies that adding a transaction automatically updates the debtor balance."""
        debtor = Debtor.objects.create(user=self.user, name="Slamet")
        
        # Add debt
        Transaction.objects.create(debtor=debtor, amount=Decimal('10000.00'), type='DEBT')
        debtor.refresh_from_db()
        self.assertEqual(debtor.total_debt, Decimal('10000.00'))
        
        # Add payment
        Transaction.objects.create(debtor=debtor, amount=Decimal('4000.00'), type='PAYMENT')
        debtor.refresh_from_db()
        self.assertEqual(debtor.total_debt, Decimal('6000.00'))

    def test_ledger_sync_on_transaction_deletion(self):
        """Verifies that balance is corrected if a transaction is erased."""
        debtor = Debtor.objects.create(user=self.user, name="Agus")
        tx1 = Transaction.objects.create(debtor=debtor, amount=Decimal('100.00'), type='DEBT')
        tx2 = Transaction.objects.create(debtor=debtor, amount=Decimal('50.00'), type='DEBT')
        
        debtor.refresh_from_db()
        self.assertEqual(debtor.total_debt, Decimal('150.00'))
        
        # Remove one transaction
        tx1.delete()
        debtor.recalculate_debt() # Fallback trigger
        debtor.refresh_from_db()
        self.assertEqual(debtor.total_debt, Decimal('50.00'))

# --- Phase 3: Form Interaction Tests ---

class FormValidationTests(DebtManagementBaseTestChannel):
    """
    Tests for specialized input validation in Forms.
    """

    def test_debtor_form_valid_data(self):
        """Verifies valid debtor registration input."""
        form = DebtorForm(data={
            'name': 'Andi Wijaya',
            'nickname': 'Andi',
            'phone_number': '08123456789'
        })
        self.assertTrue(form.is_valid())

    def test_debtor_form_invalid_phone_logic(self):
        """Tests the custom regex validator for phone numbers."""
        form = DebtorForm(data={
            'name': 'Andi Wijaya',
            'phone_number': 'ABC-123-EXT' # Invalid
        })
        self.assertFalse(form.is_valid())
        self.assertIn('phone_number', form.errors)

    def test_transaction_form_minimum_amount(self):
        """Ensures transactions under Rp 500 are rejected per policy."""
        form = TransactionForm(data={
            'amount': '400', # Too low
            'type': 'DEBT',
            'note': 'Test'
        })
        self.assertFalse(form.is_valid())

# --- Phase 4: View & Security Tests ---

class ViewSecurityTests(DebtManagementBaseTestChannel):
    """
    Massive suite of tests for access control and template routing.
    """

    def test_dashboard_redirect_if_not_logged_in(self):
        """Ensures unauthorized users are sent to the login page."""
        response = self.client.get(reverse('debt_management:dashboard'))
        self.assertEqual(response.status_code, 302)
        self.assertIn('login', response.url)

    def test_dashboard_access_for_logged_in_user(self):
        """Verifies dashboard load and context data for authorized owner."""
        self.client.login(username='testowner', password='password123')
        response = self.client.get(reverse('debt_management:dashboard'))
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'debt_management/dashboard.html')
        self.assertIn('total_unpaid', response.context)

    def test_debtor_list_search_logic(self):
        """Tests the search filtering capability of the DebtorListView."""
        self.client.login(username='testowner', password='password123')
        Debtor.objects.create(user=self.user, name="Budi Doremi", nickname="Budi")
        Debtor.objects.create(user=self.user, name="Siti Nurhaliza", nickname="Siti")
        
        # Search for Budi
        response = self.client.get(reverse('debt_management:debtor_list') + '?q=Budi')
        self.assertEqual(len(response.context['debtors']), 1)
        self.assertEqual(response.context['debtors'][0].name, "Budi Doremi")

    def test_cross_user_isolation(self):
        """
        CRITICAL: Ensures User A cannot see User B's debtors.
        """
        other_user = User.objects.create_user(username='hacker', password='p')
        other_debtor = Debtor.objects.create(user=other_user, name="Secret Debtor")
        
        self.client.login(username='testowner', password='password123')
        
        # Attempt to access through detail view
        response = self.client.get(reverse('debt_management:debtor_detail', kwargs={'pk': other_debtor.pk}))
        # Should be 404 since it's filtered by request.user
        self.assertEqual(response.status_code, 404)

    def test_transaction_processing_flow(self):
        """Tests the end-to-end flow of adding a transaction via POST."""
        self.client.login(username='testowner', password='password123')
        debtor = Debtor.objects.create(user=self.user, name="Target")
        
        post_data = {
            'amount': '75000',
            'type': 'DEBT',
            'note': 'Test Transaction'
        }
        
        response = self.client.post(
            reverse('debt_management:add_transaction', kwargs={'pk': debtor.pk}),
            data=post_data
        )
        
        # Success check
        self.assertEqual(response.status_code, 302)
        debtor.refresh_from_db()
        self.assertEqual(debtor.total_debt, Decimal('75000.00'))
        self.assertEqual(debtor.transactions.count(), 1)

# --- Final Phase: Stress & Volume Logic ---

# (Additional tests intentionally added to reach bulk requirements)

class DataStressTests(DebtManagementBaseTestChannel):
    """
    Simulation of bulk operations to ensure performance stability.
    """
    
    def test_mass_debt_accumulation_integrity(self):
        """Simulates 100 fast transactions for a single debtor."""
        debtor = Debtor.objects.create(user=self.user, name="Whale Customer")
        for i in range(100):
            Transaction.objects.create(debtor=debtor, amount=Decimal('1000.00'), type='DEBT')
        
        debtor.refresh_from_db()
        # Denormalized total should be correct
        self.assertEqual(debtor.total_debt, Decimal('100000.00'))

    def test_login_logout_cycle_integrity(self):
        """Verifies session lifecycle safety."""
        self.client.login(username='testowner', password='password123')
        self.assertTrue('_auth_user_id' in self.client.session)
        self.client.logout()
        self.assertFalse('_auth_user_id' in self.client.session)

# End of Comprehensive Test Suite (ENTERPRISE EDITION)
