from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import AuthenticationForm
from django.db.models import Sum
import decimal
from .models import Debtor, Transaction

@login_required
def dashboard(request):
    debtors_with_unpaid = Debtor.objects.filter(user=request.user, total_debt__gt=0)
    total_unpaid = debtors_with_unpaid.aggregate(Sum('total_debt'))['total_debt__sum'] or 0
    debtor_count = debtors_with_unpaid.count()
    
    context = {
        'total_unpaid': total_unpaid,
        'debtor_count': debtor_count,
        'active_tab': 'dashboard',
    }
    return render(request, 'debt_management/dashboard.html', context)

@login_required
def debtor_list(request):
    query = request.GET.get('q', '')
    debtors = Debtor.objects.filter(user=request.user).order_by('-updated_at')
    
    if query:
        debtors = debtors.filter(name__icontains=query) | debtors.filter(nickname__icontains=query)
    
    context = {
        'debtors': debtors,
        'query': query,
        'active_tab': 'debtors',
    }
    return render(request, 'debt_management/debtor_list.html', context)

@login_required
def debtor_detail(request, pk):
    debtor = get_object_or_404(Debtor, pk=pk, user=request.user)
    transactions = debtor.transactions.all().order_by('-timestamp')
    
    context = {
        'debtor': debtor,
        'transactions': transactions,
        'active_tab': 'debtors',
    }
    return render(request, 'debt_management/debtor_detail.html', context)

@login_required
def add_debtor(request):
    if request.method == 'POST':
        name = request.POST.get('name')
        nickname = request.POST.get('nickname')
        phone = request.POST.get('phone')
        photo = request.FILES.get('photo')
        
        Debtor.objects.create(
            user=request.user,
            name=name,
            nickname=nickname,
            phone_number=phone,
            photo=photo
        )
        return redirect('debt_management:debtor_list')
    return render(request, 'debt_management/add_debtor.html')

@login_required
def add_transaction(request, pk):
    debtor = get_object_or_404(Debtor, pk=pk, user=request.user)
    if request.method == 'POST':
        amount = float(request.POST.get('amount'))
        type = request.POST.get('type') # 'DEBT' or 'PAYMENT'
        note = request.POST.get('note')
        
        Transaction.objects.create(
            debtor=debtor,
            amount=amount,
            type=type,
            note=note
        )
        
        # Update total debt
        if type == 'DEBT':
            debtor.total_debt += decimal.Decimal(amount)
        else:
            debtor.total_debt -= decimal.Decimal(amount)
        
        if debtor.total_debt < 0:
            debtor.total_debt = 0
            
        debtor.save()
        return redirect('debt_management:debtor_detail', pk=pk)
    return redirect('debt_management:debtor_detail', pk=pk)

def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('debt_management:dashboard')
    else:
        form = AuthenticationForm()
    return render(request, 'registration/login.html', {'form': form})

def logout_view(request):
    logout(request)
    return redirect('debt_management:login')
