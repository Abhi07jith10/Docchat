from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from .models import Document, DocumentChunk, SuggestedQuestion
from .serializers import DocumentSerializer, SuggestedQuestionSerializer
from .utils import extract_and_chunk_pdf
from .rag import generate_suggested_questions

class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        file_obj = request.FILES.get('file')

        if not file_obj:
            return Response({'error': 'No file provided'}, status=400)

        # Validate file type
        if not file_obj.name.lower().endswith('.pdf'):
            return Response({'error': 'Only PDF files are supported'}, status=400)

        # Validate file size (limit to 10MB)
        max_size = 10 * 1024 * 1024  # 10MB in bytes
        if file_obj.size > max_size:
            return Response({'error': 'File size must be under 10MB'}, status=400)

        title = request.data.get('title', file_obj.name)

        # Save the document first (this uploads it to S3)
        document = Document.objects.create(
            user=request.user,
            title=title,
            file=file_obj
        )

        # Extract and chunk the text
        try:
            chunks = extract_and_chunk_pdf(document.file)
        except Exception as e:
            document.delete()
            return Response({'error': f'Failed to process PDF: {str(e)}'}, status=400)

        # Save each chunk to the database
        for chunk in chunks:
            DocumentChunk.objects.create(
                document=document,
                text=chunk['text'],
                page_number=chunk['page_number'],
                chunk_index=chunk['chunk_index']
            )

        # Generate suggested questions
        try:
            saved_chunks = list(DocumentChunk.objects.filter(document=document).order_by('chunk_index'))
            suggested = generate_suggested_questions(saved_chunks)
            for question in suggested:
                SuggestedQuestion.objects.create(document=document, question_text=question)
        except Exception as e:
            print(f"Suggested question generation failed: {e}")  # non-critical, don't block upload

        serializer = DocumentSerializer(document)
        return Response({
            'document': serializer.data,
            'chunks_created': len(chunks)
        }, status=201)


class DocumentListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        documents = Document.objects.filter(user=request.user).order_by('-uploaded_at')
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data)


class SuggestedQuestionsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, document_id):
        try:
            document = Document.objects.get(id=document_id, user=request.user)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found'}, status=404)

        questions = SuggestedQuestion.objects.filter(document=document)
        serializer = SuggestedQuestionSerializer(questions, many=True)
        return Response(serializer.data)


class DocumentRenameView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, document_id):
        try:
            document = Document.objects.get(id=document_id, user=request.user)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found'}, status=404)

        new_title = request.data.get('title', '').strip()
        if not new_title:
            return Response({'error': 'Title cannot be empty'}, status=400)
        if len(new_title) > 255:
            return Response({'error': 'Title too long'}, status=400)

        document.title = new_title
        document.save()
        return Response({'id': document.id, 'title': document.title})