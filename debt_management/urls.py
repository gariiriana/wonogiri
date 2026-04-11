from django.urls import path
from . import views

app_name = 'debt_management'

urlpatterns = [
    path('', views.DashboardView.as_view(), name='dashboard'),
    path('debtors/', views.DebtorListView.as_view(), name='debtor_list'),
    path('debtors/<int:pk>/', views.DebtorDetailView.as_view(), name='debtor_detail'),
    path('debtors/add/', views.DebtorCreateView.as_view(), name='add_debtor'),
    path('debtors/<int:pk>/edit/', views.DebtorUpdateView.as_view(), name='edit_debtor'),
    path('debtors/<int:pk>/transaction/', views.ProcessTransactionView.as_view(), name='add_transaction'),
    path('debtors/<int:pk>/delete/', views.DeleteDebtorView.as_view(), name='delete_debtor'),
    path('recap/', views.RecapView.as_view(), name='recap_view'),
    path('export/pdf/', views.ExportPDFView.as_view(), name='export_pdf'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
]
