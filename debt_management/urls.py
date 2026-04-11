from django.urls import path
from . import views

app_name = 'debt_management'

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('debtors/', views.debtor_list, name='debtor_list'),
    path('debtors/<int:pk>/', views.debtor_detail, name='debtor_detail'),
    path('debtors/add/', views.add_debtor, name='add_debtor'),
    path('debtors/<int:pk>/add-transaction/', views.add_transaction, name='add_transaction'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
]
