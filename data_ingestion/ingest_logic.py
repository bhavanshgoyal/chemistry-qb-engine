import os
import json
import fitz  # PyMuPDF
from google import genai
import requests
from dotenv import load_dotenv

# Load environment variables from root .env
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found in environment!")

# FIX: Read backend URL from env instead of hardcoding localhost
# Set BACKEND_URL=https://chemistry-qb-backend.onrender.com in .env for production
BACKEND_URL = os.environ.get("BACKEND_URL", "http://localhost:8080")

client = genai.Client(api_key=api_key)


def load_syllabus():
    config_path = os.path.join(os.path.dirname(__file__), "..", "config", "cbse_class12_syllabus_2026.json")
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)


def process_pdf(file_path):
    text = ""
    if file_path.endswith(".txt"):
        with open(file_path, "r", encoding="utf-8") as f:
            text = f.read()
    else:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text()
    return text


def analyze_questions_with_gemini(text, syllabus):
    prompt = f"""
    You are an expert chemistry educator and data extraction assistant.
    I will provide you with extracted text containing chemistry questions, and the CBSE Class 12 Chemistry syllabus schema.
    
    SYLLABUS:
    {json.dumps(syllabus, indent=2)}
    
    TEXT:
    {text}
    
    TASK:
    Analyze each question in the TEXT separately. For each question, determine if it belongs to one of the 'active_chapters' or 'excluded_chapters' from the syllabus.
    
    If the question belongs to a chapter in 'active_chapters', return a JSON object with:
    - topic (string: chapter name from the syllabus)
    - sub_topic (string: closest matching sub-topic from the syllabus)
    - bloom_level (integer 1-6)
    - question_text (string: Convert chemistry formulas to LaTeX, e.g., $H_{{2}}SO_{{4}}$)
    - explanation (string: brief explanation of the answer or concept)
    
    If it belongs to 'excluded_chapters', return a JSON object with:
    - status: "OUTDATED"
    
    IMPORTANT: Return a JSON array of these objects, one for each question identified in the text. 
    Ensure the output is strictly valid JSON, without any markdown formatting blocks like ```json.
    """
    
    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=prompt,
    )
    
    try:
        output = response.text.strip()
        if output.startswith("```json"):
            output = output[7:]
        if output.startswith("```"):
            output = output[3:]
        if output.endswith("```"):
            output = output[:-3]
        return json.loads(output.strip())
    except Exception as e:
        print("Error parsing JSON:", e)
        print("Raw response:", response.text)
        return None


def main():
    syllabus = load_syllabus()
    raw_pdfs_dir = os.path.join(os.path.dirname(__file__), "raw_pdfs")
    
    # FIX: use env var BACKEND_URL instead of hardcoded localhost
    api_url = f"{BACKEND_URL}/api/questions"
    print(f"Backend URL: {api_url}")
    
    for filename in os.listdir(raw_pdfs_dir):
        if filename.endswith(".pdf") or filename.endswith(".txt"):
            file_path = os.path.join(raw_pdfs_dir, filename)
            print(f"\nProcessing: {filename}")
            
            text = process_pdf(file_path)
            if not text.strip():
                print("No text extracted.")
                continue
            
            results = analyze_questions_with_gemini(text, syllabus)
            print(f"Gemini found {len(results) if results else 0} items")
            
            if results:
                for q in results:
                    if q.get("status") == "OUTDATED":
                        print(f"  Skipping outdated question")
                        continue
                    
                    # KEY FIX: Map snake_case keys from Gemini to camelCase Java field names
                    payload = {
                        "chapter":      q.get("topic"),           # Gemini "topic" → Java "chapter"
                        "topic":        q.get("sub_topic"),       # Gemini "sub_topic" → Java "topic"
                        "subTopic":     q.get("sub_topic"),       # also fill subTopic
                        "bloomLevel":   q.get("bloom_level"),     # snake_case → camelCase
                        "questionText": q.get("question_text"),   # snake_case → camelCase
                        "explanation":  q.get("explanation"),
                    }
                    
                    try:
                        res = requests.post(api_url, json=payload, timeout=30)
                        if res.status_code == 200:
                            print(f"  ✓ Saved: {payload.get('chapter')} / {payload.get('topic')}")
                        else:
                            print(f"  ✗ Failed {res.status_code}: {res.text[:200]}")
                    except Exception as e:
                        print(f"  ✗ Connection error: {e}")


if __name__ == "__main__":
    main()