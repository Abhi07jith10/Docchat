from django.db import models
from django.contrib.auth.models import User

class Document(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='documents')
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class DocumentChunk(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='chunks')
    text = models.TextField()
    page_number = models.IntegerField()
    chunk_index = models.IntegerField()  # order of chunk within the document

    def __str__(self):
        return f"{self.document.title} - page {self.page_number} - chunk {self.chunk_index}"


class SuggestedQuestion(models.Model):
    document = models.ForeignKey(Document, on_delete=models.CASCADE, related_name='suggested_questions')
    question_text = models.CharField(max_length=500)

    def __str__(self):
        return self.question_text