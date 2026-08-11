from rest_framework import serializers
from .models import Document, DocumentChunk, SuggestedQuestion

class DocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'title', 'file', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class SuggestedQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = SuggestedQuestion
        fields = ['id', 'question_text']