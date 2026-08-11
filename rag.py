from groq import Groq
from decouple import config
from .embeddings import build_faiss_index, search_similar_chunks

client = Groq(api_key=config('GROQ_API_KEY'))

def generate_answer(question, chunks):
    """
    chunks: list of DocumentChunk objects (from the database)
    Returns: (answer_text, source_page)
    """
    chunk_texts = [c.text for c in chunks]

    # Build a FAISS index from this document's chunks and find the best matches
    index, _ = build_faiss_index(chunk_texts)
    top_indices = search_similar_chunks(question, index, chunk_texts, top_k=3)

    matched_chunks = [chunks[i] for i in top_indices]
    context_text = "\n\n".join([c.text for c in matched_chunks])
    source_page = matched_chunks[0].page_number  # page of the closest match

    prompt = f"""Answer the question using ONLY the context below.

Formatting rules:
- Start with a one-sentence framing intro that sets up what the answer covers, before any list or heading.
- Bold the key terms in your answer using markdown ("**term**") — names, organizations, technologies, dates, numbers, and other important specific details. Bold only the important word or phrase itself, never a full sentence.
- Use inline code formatting ("`term`") for library names, function names, file names, or technical identifiers (e.g. `pypdf`, `manage.py`).
- For "what is" / "explain" / "how does it work" style questions describing a process or system, break the answer into a numbered list of steps, each starting with a bolded short label (e.g., "1. **Extract the resume text** – ..."). Use nested bullet sub-points under a step if it has multiple parts.
- If a concrete example would make a technical explanation clearer, add a short "### Simple example" section after the steps, before the closing summary.
- After the numbered steps (and example, if included), add a short closing section titled "### In one sentence" with a single concise summary sentence.
- For a "summary" or "overview" style question, answer with short paragraphs under a bolded title line rather than a numbered list, unless the content is naturally a sequence of steps.
- For longer explanatory answers covering multiple distinct topics (not a single process), use a markdown heading ("## Topic") per topic instead of numbered steps.
- If the answer involves multiple structured facts (like dates, activities, categories), format them as a markdown table with clear column headers. The table must be its own standalone block — never place a table inside a bullet point or list item.
- If the answer is a simple list of points (not a process, not tabular), use a markdown bulleted list ("- " at the start of each line), one point per line.
- Never mix a table and a bullet list for the same set of facts — choose one format only.
- For short, direct answers (a single fact or a one-line answer), skip headings, lists, and the "In one sentence" section entirely — just answer in plain sentences, still bolding key terms.
- Keep it concise and easy to scan. Do not repeat information.
- If the answer isn't in the context, say you don't know.

Context:
{context_text}

Question: {question}

Answer:"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You are a helpful assistant that answers questions based only on the provided document context."},
            {"role": "user", "content": prompt}
        ]
    )

    answer_text = response.choices[0].message.content
    return answer_text, source_page

def generate_suggested_questions(chunks, num_questions=4):
    """
    Takes document chunks and generates sample questions a user might ask.
    Returns a list of question strings.
    """
    # Use the first few chunks as a representative sample of the document
    sample_text = "\n\n".join([c.text for c in chunks[:5]])

    prompt = f"""Based on the following document content, generate exactly {num_questions} example questions a user might ask about this document. Return ONLY the questions, one per line, with no numbering or extra text.

Document content:
{sample_text}

Questions:"""

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": "You generate concise, relevant example questions based on document content."},
            {"role": "user", "content": prompt}
        ]
    )

    raw_output = response.choices[0].message.content
    questions = [q.strip("- ").strip() for q in raw_output.split("\n") if q.strip()]
    return questions[:num_questions]