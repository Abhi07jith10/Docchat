from django.contrib import admin
from .models import Document, DocumentChunk, SuggestedQuestion

admin.site.register(Document)
admin.site.register(DocumentChunk)
admin.site.register(SuggestedQuestion)