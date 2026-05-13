import os
import json
import fitz  # PyMuPDF
import google.generativeai as genai
import requests
from dotenv import load_dotenv

# Load environment variables
env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
load_dotenv(env_path)

api_key = os.environ.get("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY not found in environment!")
else:
    os.environ["GOOGLE_API_KEY"] = api_key

# Configure Gemini API
genai.configure(api_key=api_key)

def load_syllabus():
    config_path = os.path.join(os.path.dirname(__file__), "..", "config", "cbse_class12_syllabus_2026.json")
    with open(config_path, "r", encoding="utf-8") as f:
        return json.load(f)

def process_pdf(file_path):
    text = ""
    # Support both txt and pdf for dummy test
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
    
    IMPORTANT: Return a JSON array of these objects, one for each question identified in the text. Ensure the output is strictly valid JSON, without any markdown formatting blocks like ```json.
    """
    
    model = genai.GenerativeModel('gemini-1.5-flash-latest')
    response = model.generate_content(prompt)
    
    try:
        output = response.text.strip()
        if output.startswith("```json"):
            output = output[7:]
        if output.startswith("```"):
            output = output[3:]
        if output.endswith("```"):
            output = output[:-3]
        return json.loads(output)
    except Exception as e:
        print("Error parsing JSON:", e)
        print("Raw response:", response.text)
        return None

def main():
    syllabus = load_syllabus()
    raw_pdfs_dir = os.path.join(os.path.dirname(__file__), "raw_pdfs")
    
    for filename in os.listdir(raw_pdfs_dir):
        if filename.endswith(".pdf") or filename.endswith(".txt"):
            file_path = os.path.join(raw_pdfs_dir, filename)
            print(f"Processing: {filename}")
            
            text = process_pdf(file_path)
            if not text.strip():
                print("No text extracted.")
                continue
            
            results = analyze_questions_with_gemini(text, syllabus)
            print("Extracted Data:")
            print(json.dumps(results, indent=2))
            
            if results:
                for q in results:
                    if q.get("status") != "OUTDATED":
                        try:
                            res = requests.post("http://localhost:8080/api/questions", json=q)
                            if res.status_code == 200:
                                print(f"Successfully saved question: {q.get('topic')} - {q.get('sub_topic')}")
                            else:
                                print(f"Failed to save question: {res.status_code} - {res.text}")
                        except Exception as e:
                            print(f"Error connecting to backend: {e}")

if __name__ == "__main__":
    main()
