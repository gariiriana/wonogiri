"""
Django Signals Module for Debt Management

This module handles automated side-effects triggered by model events.
Primarily, it ensures that the denormalized 'total_debt' field on the Debtor 
model remains synchronized with the aggregate Transaction history without 
requiring manual triggers in views.

Architecture:
- post_save(Transaction): Updates debtor ledger on every new or edited transaction.
- post_delete(Transaction): Corrects debtor ledger when a transaction is removed.
"""

import logging
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Transaction, Debtor

# Obtain a specialized logger for signal tracking
logger = logging.getLogger('debt_management.signals')

@receiver(post_save, sender=Transaction)
def update_debtor_balance_on_save(sender, instance, created, **kwargs):
    """
    Signal handler that triggers whenever a Transaction is saved.
    It recalculates the total debt of the associated Debtor to maintain data integrity.
    
    Args:
        sender: The model class (Transaction).
        instance: The actual instance of Transaction being saved.
        created: Boolean, True if a new record was created.
        kwargs: Additional arguments.
    """
    debtor = instance.debtor
    old_balance = debtor.total_debt
    
    # Trigger the model's self-recalculation logic
    new_balance = debtor.recalculate_debt()
    
    action_type = "Created" if created else "Updated"
    
    # Log the change for auditing purposes
    logger.info(
        f"Signal fired: {action_type} Transaction ID {instance.pk}. "
        f"Debtor '{debtor.name}' balance adjusted from {old_balance} to {new_balance}."
    )

@receiver(post_delete, sender=Transaction)
def update_debtor_balance_on_delete(sender, instance, **kwargs):
    """
    Signal handler that triggers whenever a Transaction is deleted.
    Crucial for ensuring that 'orphaned' values in total_debt are recalculated.
    
    Args:
        sender: The model class (Transaction).
        instance: The instance that was just deleted.
        kwargs: Additional arguments.
    """
    debtor = instance.debtor
    
    # Since the instance is gone, we perform a full scan of remaining transactions
    new_balance = debtor.recalculate_debt()
    
    logger.warning(
        f"Signal fired: Deleted Transaction for Debtor '{debtor.name}'. "
        f"Balance recalculated to {new_balance}."
    )

def register_signals():
    """
    Explicit registration function if needed for apps.py.
    Usually handled automatically via the @receiver decorator.
    """
    logger.debug("Debt management signals successfully linked to Dispatcher.")
