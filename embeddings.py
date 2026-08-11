import numpy as np
import faiss
from sentence_transformers import SentenceTransformer

# Load the model once when this file is imported
model = SentenceTransformer('all-MiniLM-L6-v2')
VECTOR_DIM = 384  # dimension size for this model

def get_embedding(text):
    """Get a single embedding vector for a piece of text."""
    embedding = model.encode(text)
    return embedding


def get_embeddings_batch(texts):
    """Get embeddings for multiple texts at once (more efficient)."""
    embeddings = model.encode(texts)
    return embeddings


def build_faiss_index(chunk_texts):
    """
    Takes a list of chunk texts, generates embeddings,
    and builds a FAISS index for similarity search.
    Returns the index and the embeddings array.
    """
    embeddings = get_embeddings_batch(chunk_texts)
    embeddings_array = np.array(embeddings).astype('float32')

    index = faiss.IndexFlatL2(VECTOR_DIM)
    index.add(embeddings_array)

    return index, embeddings_array


def search_similar_chunks(query_text, index, chunk_texts, top_k=3):
    """
    Given a query, find the top_k most similar chunks using the FAISS index.
    Returns the indices of the matching chunks.
    """
    query_embedding = get_embedding(query_text)
    query_array = np.array([query_embedding]).astype('float32')

    distances, indices = index.search(query_array, top_k)
    return indices[0]