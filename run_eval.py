import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from documents.models import DocumentChunk
from documents.rag import generate_answer
from eval.test_qa import TEST_CASES

DOCUMENT_ID = 2  # change this to match your test document's ID

def run_evaluation():
    chunks = list(DocumentChunk.objects.filter(document_id=DOCUMENT_ID).order_by('chunk_index'))

    if not chunks:
        print("No chunks found for this document. Check DOCUMENT_ID.")
        return

    total = len(TEST_CASES)
    correct = 0
    results = []

    for i, case in enumerate(TEST_CASES, start=1):
        question = case["question"]
        expected_keywords = case["expected_keywords"]

        try:
            answer_text, source_page = generate_answer(question, chunks)
        except Exception as e:
            print(f"[{i}] ERROR: {e}")
            continue

        # Simple correctness check: does the answer contain at least one expected keyword?
        answer_lower = answer_text.lower()
        matched = any(keyword.lower() in answer_lower for keyword in expected_keywords)

        if matched:
            correct += 1

        results.append({
            "question": question,
            "answer": answer_text,
            "source_page": source_page,
            "matched": matched
        })

        status = "PASS" if matched else "FAIL"
        print(f"[{i}] {status} | Q: {question}")
        print(f"    A: {answer_text[:150]}...")
        print(f"    Source page: {source_page}\n")

    accuracy = (correct / total) * 100 if total > 0 else 0
    print("=" * 50)
    print(f"EVAL RESULTS: {correct}/{total} correct ({accuracy:.1f}% accuracy)")
    print("=" * 50)

    return results


if __name__ == "__main__":
    run_evaluation()