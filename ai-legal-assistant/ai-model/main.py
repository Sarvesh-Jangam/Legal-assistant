import os
import tempfile
import hashlib
from typing import Dict
from fastapi import FastAPI, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter, CharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings, ChatGoogleGenerativeAI
from langchain.chains import RetrievalQA
from langchain.vectorstores.base import VectorStore

# Load environment variables
load_dotenv()
GEMINI_API_KEY = os.environ["GEMINI_API_KEY"]

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------
# Caches
# -------------------------------
vectorstore_cache: Dict[str, VectorStore] = {}
legal_docs_store: Dict[str, VectorStore] = {}  # For /ask-existing

# -------------------------------
# Utility: File hash
# -------------------------------
def file_hash(file_bytes):
    return hashlib.md5(file_bytes).hexdigest()

# -------------------------------
# Utility: Create FAISS vectorstore safely
# -------------------------------
def create_faiss_vectorstore_safe(chunks, embeddings):
    try:
        return FAISS.from_documents(chunks, embeddings)
    except Exception as e:
        print(f"⚠️ Failed to embed documents: {e}")
        return None


# -------------------------------
# Startup: Preload legal docs
# -------------------------------
@app.on_event("startup")
async def preload_legal_documents():
    print("🔍 Preloading legal documents...")
    embeddings = GoogleGenerativeAIEmbeddings(
        model="models/embedding-001",
        google_api_key=GEMINI_API_KEY
    )
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)

    predefined_pdfs = {
        "Guide to Litigation in India": "data/Guide-to-Litigation-in-India.pdf",
        "Legal Compliance & Corporate Laws": "data/Legal-Compliance-Corporate-Laws.pdf",
        "legaldoc": "data/legaldoc.pdf",
        "Constitution of India": "data/constitution_of_india.pdf",
        "IPC": "data/penal_code.pdf",
        "Format":"data/format.pdf"
    }

    for name, path in predefined_pdfs.items():
        loader = PyPDFLoader(path)
        docs = loader.load()
        chunks = text_splitter.split_documents(docs)

        for chunk in chunks:
            chunk.metadata["source"] = name

        vectorstore = create_faiss_vectorstore_safe(chunks, embeddings)
        if vectorstore:
            legal_docs_store[name] = vectorstore

    print("✅ Legal documents preloaded.")

# -------------------------------
# /ask-existing: Ask from preloaded legal docs
# -------------------------------
@app.post("/ask-existing")
async def ask_from_existing(query: str = Form(...)):
    if not legal_docs_store:
        return {"error": "Legal documents not loaded yet."}

    all_matches = []
    for name, vectorstore in legal_docs_store.items():
        results = vectorstore.similarity_search_with_score(query, k=5)
        for doc, score in results:
            if doc and score is not None:
                all_matches.append({
                    "source": doc.metadata.get("source", name),
                    "content": doc.page_content,
                    "score": score
                })

    if not all_matches:
        return {"error": "No relevant information found."}

    from collections import defaultdict
    source_scores = defaultdict(list)
    for match in all_matches:
        source_scores[match["source"]].append(match["score"])

    best_source = min(source_scores, key=lambda s: sum(source_scores[s]) / len(source_scores[s]))
    best_chunks = [m["content"] for m in all_matches if m["source"] == best_source]
    combined_text = "\n\n".join(best_chunks)

    prompt = f"""
You are a legal assistant. Use the following legal document excerpts to answer the user's question.

---DOCUMENT EXCERPTS---
{combined_text}
-----------------------

Question: {query}

Provide a legally accurate, helpful, and context-aware answer.
"""

    llm = ChatGoogleGenerativeAI(
        model="models/gemini-2.5-pro",
        temperature=0.3,
        google_api_key=GEMINI_API_KEY
    )
    response = llm.invoke(prompt)
    answer = response.content if hasattr(response, 'content') else str(response)

    return {"answer": answer, "source": best_source}

# -------------------------------
# /ask-upload: Upload PDF & Ask
# -------------------------------
@app.post("/ask-upload")
async def ask_from_uploaded(query: str = Form(...), file: UploadFile = None):
    if file is None:
        return {"error": "No file uploaded."}

    file_bytes = await file.read()
    file_id = file_hash(file_bytes)

    if file_id in vectorstore_cache:
        vectorstore = vectorstore_cache[file_id]
    else:
        with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
            tmp_file.write(file_bytes)
            tmp_file_path = tmp_file.name

        loader = PyPDFLoader(tmp_file_path)
        docs = loader.load()
        splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = splitter.split_documents(docs)

        embeddings = GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=GEMINI_API_KEY
        )
        vectorstore = FAISS.from_documents(chunks, embeddings)
        vectorstore_cache[file_id] = vectorstore

    llm = ChatGoogleGenerativeAI(
        model="models/gemini-2.5-pro",
        temperature=0.3,
        google_api_key=GEMINI_API_KEY
    )
    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=vectorstore.as_retriever())
    result = qa_chain.run(query)

    return {"answer": result, "file_id": file_id}

# -------------------------------
# /chat: General chat endpoint
# -------------------------------
@app.post("/chat")
async def general_chat(query: str = Form(...)):
    """General chat endpoint for conversational AI without specific document context"""
    
    prompt = f"""
You are a helpful AI legal assistant. Provide professional, accurate, and helpful legal guidance.
Be conversational but maintain professionalism. If a question requires specific legal documents 
or analysis, suggest the user upload a document or use the legal database.

User Question: {query}

Provide a helpful, informative response:
"""

    llm = ChatGoogleGenerativeAI(
        model="models/gemini-2.5-pro",
        temperature=0.3,
        google_api_key=GEMINI_API_KEY
    )
    response = llm.invoke(prompt)
    answer = response.content if hasattr(response, 'content') else str(response)

    return {"response": answer}

# -------------------------------
# /ask-context: Ask using file_id
# -------------------------------
@app.post("/ask-context")
async def ask_from_context(query: str = Form(...), file_id: str = Form(...)):
    if file_id not in vectorstore_cache:
        return {"error": "Context not found. Please upload the file first."}

    vectorstore = vectorstore_cache[file_id]

    llm = ChatGoogleGenerativeAI(
        model="models/gemini-2.5-pro",
        temperature=0.3,
        google_api_key=GEMINI_API_KEY
    )
    qa_chain = RetrievalQA.from_chain_type(llm=llm, retriever=vectorstore.as_retriever())
    result = qa_chain.run(query)

    return {"answer": result, "file_id": file_id}
