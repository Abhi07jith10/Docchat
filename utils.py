import pdfplumber
from langchain_text_splitters import RecursiveCharacterTextSplitter

def extract_and_chunk_pdf(file_path):
    """
    Extracts text from a PDF page by page, then splits it into chunks.
    Returns a list of dicts: [{'text': ..., 'page_number': ..., 'chunk_index': ...}]
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100
    )

    all_chunks = []
    chunk_index = 0

    with pdfplumber.open(file_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            page_text = page.extract_text()
            if not page_text:
                continue

            page_chunks = splitter.split_text(page_text)
            for chunk_text in page_chunks:
                all_chunks.append({
                    'text': chunk_text,
                    'page_number': page_number,
                    'chunk_index': chunk_index
                })
                chunk_index += 1

    return all_chunks