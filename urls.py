from django.urls import path
from .views import QueryView, ChatListView, ChatDetailView, ChatRenameView

urlpatterns = [
    path('query/', QueryView.as_view(), name='query'),
    path('list/', ChatListView.as_view(), name='chat-list'),
    path('<int:session_id>/', ChatDetailView.as_view(), name='chat-detail'),
    path('<int:session_id>/rename/', ChatRenameView.as_view(), name='chat-rename'),
]