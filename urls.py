from django.urls import path
from .views import DocumentUploadView, DocumentListView, SuggestedQuestionsView, DocumentRenameView

urlpatterns = [
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('list/', DocumentListView.as_view(), name='document-list'),
    path('<int:document_id>/suggestions/', SuggestedQuestionsView.as_view(), name='document-suggestions'),
    path('<int:document_id>/rename/', DocumentRenameView.as_view(), name='document-rename'),
]