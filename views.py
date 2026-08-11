from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from documents.models import Document, DocumentChunk
from documents.rag import generate_answer
from .models import ChatSession, Message
from .serializers import ChatSessionSerializer

class QueryView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        document_id = request.data.get('document_id')
        question = request.data.get('question')
        session_id = request.data.get('session_id')  # optional, for continuing a chat

        if not document_id or not question:
            return Response({'error': 'document_id and question are required'}, status=400)

        # Validate question isn't empty/whitespace and isn't excessively long
        question = question.strip()
        if not question:
            return Response({'error': 'Question cannot be empty'}, status=400)
        if len(question) > 1000:
            return Response({'error': 'Question is too long (max 1000 characters)'}, status=400)

        # Verify the document belongs to this user
        try:
            document = Document.objects.get(id=document_id, user=request.user)
        except Document.DoesNotExist:
            return Response({'error': 'Document not found'}, status=404)

        # Get or create the chat session
        if session_id:
            try:
                session = ChatSession.objects.get(id=session_id, user=request.user)
            except ChatSession.DoesNotExist:
                return Response({'error': 'Chat session not found'}, status=404)
        else:
            session = ChatSession.objects.create(
                user=request.user,
                document=document,
                title=question[:50]
            )

        # Save the user's question as a message
        Message.objects.create(session=session, role='user', content=question)

        # Get all chunks for this document
        chunks = list(DocumentChunk.objects.filter(document=document).order_by('chunk_index'))

        if not chunks:
            return Response({'error': 'This document has no processed content'}, status=400)

        # Generate the answer using RAG
        try:
            answer_text, source_page = generate_answer(question, chunks)
        except Exception as e:
            return Response({'error': f'Failed to generate answer: {str(e)}'}, status=500)

        # Save the AI's answer as a message
        Message.objects.create(
            session=session,
            role='assistant',
            content=answer_text,
            source_page=source_page
        )

        return Response({
            'session_id': session.id,
            'answer': answer_text,
            'source_page': source_page
        })


class ChatListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        sessions = ChatSession.objects.filter(user=request.user).order_by('-created_at')
        serializer = ChatSessionSerializer(sessions, many=True)
        return Response(serializer.data)


class ChatDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, session_id):
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Chat session not found'}, status=404)

        serializer = ChatSessionSerializer(session)
        return Response(serializer.data)


class ChatRenameView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, session_id):
        try:
            session = ChatSession.objects.get(id=session_id, user=request.user)
        except ChatSession.DoesNotExist:
            return Response({'error': 'Chat session not found'}, status=404)

        new_title = request.data.get('title', '').strip()
        if not new_title:
            return Response({'error': 'Title cannot be empty'}, status=400)
        if len(new_title) > 255:
            return Response({'error': 'Title too long'}, status=400)

        session.title = new_title
        session.save()
        return Response({'id': session.id, 'title': session.title})

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