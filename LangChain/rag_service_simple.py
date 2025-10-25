from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_chroma import Chroma
from langchain_huggingface import HuggingFaceEmbeddings  
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
import os
import json
import sys
import re
import logging

# Suppress warning messages
logging.getLogger("chromadb").setLevel(logging.ERROR)
os.environ["TOKENIZERS_PARALLELISM"] = "false"

load_dotenv()

class SQLRAGService:
    def __init__(self):
        self.google_api_key = os.getenv("GEMINI_API_KEY")
        if not self.google_api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        # Setup paths
        self.curdir = os.path.dirname(__file__)
        self.knowledge_file = os.path.join(self.curdir, 'sql_knowledge_base.txt')
        self.persist_dir = os.path.join(self.curdir, 'sql_chroma_db')
        
        # Lazy initialization - only initialize when needed
        self.embedding = None
        self.db = None
        self.llm = None
    
    def _initialize_vector_db(self):
        """Initialize or load the vector database with SQL knowledge"""
        if not os.path.exists(self.persist_dir):
            print(f"Creating SQL knowledge database at {self.persist_dir}", file=sys.stderr)  # Changed
            os.makedirs(self.persist_dir, exist_ok=True)
            
            # Load SQL knowledge base
            loader = TextLoader(self.knowledge_file, encoding='utf8')
            documents = loader.load()
            
            print(f"Loaded {len(documents)} documents from knowledge base", file=sys.stderr)  # Changed
            
            # Split documents into chunks
            text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=1000, 
                chunk_overlap=200,
                separators=["\n===", "\n\n", "\n", " "]
            )
            chunks = text_splitter.split_documents(documents)
            
            print(f"Created {len(chunks)} chunks from knowledge base", file=sys.stderr)  # Changed
            
            # Create vector database
            db = Chroma.from_documents(
                chunks, 
                self.embedding, 
                persist_directory=self.persist_dir
            )
            
            return db
        else:
            # Suppress debug output for JSON parsing
            import logging
            logging.getLogger("chromadb").setLevel(logging.ERROR)
            return Chroma(
                persist_directory=self.persist_dir, 
                embedding_function=self.embedding
            )

    def _ensure_initialized(self):
        """Ensure all components are initialized (lazy loading)"""
        if self.embedding is None:
            print("Initializing embeddings...", file=sys.stderr)  # Changed
            self.embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
        
        if self.db is None:
            print("Initializing vector database...", file=sys.stderr)  # Changed
            self.db = self._initialize_vector_db()
        
        if self.llm is None:
            print("Initializing LLM...", file=sys.stderr)  # Changed
            self.llm = ChatGoogleGenerativeAI(
                model="gemini-2.0-flash", 
                api_key=self.google_api_key, 
                temperature=0.1
            )

    
    def generate_sql_with_rag(self, natural_language_query, schema):
        """Generate SQL query using RAG with context from knowledge base"""
        try:
            # Ensure all components are initialized
            self._ensure_initialized()
            
            # Create retriever
            retriever = self.db.as_retriever(
                search_type="similarity",
                search_kwargs={"k": 4}  # Retrieve top 4 most relevant chunks
            )
            
            # Retrieve relevant documents
            retrieved_docs = retriever.invoke(natural_language_query)
            
            # Format context from retrieved documents
            context = "\n\n".join([doc.page_content for doc in retrieved_docs])
            
            # Create the prompt with context
            prompt = f"""You are an expert MySQL query generator with access to a comprehensive SQL knowledge base.

Database Schema:
{schema}

Relevant SQL Knowledge:
{context}

CRITICAL INSTRUCTIONS:
1. Return ONLY the SQL query as plain text
2. Do NOT include markdown code blocks (```)
3. Do NOT include the word "sql" before the query
4. Do NOT include explanations or comments
5. Do NOT include any text before or after the query
6. Use the provided schema to understand table and column names
7. Use the knowledge base to apply best practices and patterns
8. Ensure the query is syntactically correct and follows MySQL standards
9. ONLY generate SELECT queries - NO INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, or any other DDL/DML operations
10. Do NOT include semicolons, comments, or UNION operations
11. Focus on data retrieval and analysis queries only

User Question: {natural_language_query}

Plain SQL query:"""
            
            # Generate SQL using the LLM
            response = self.llm.invoke(prompt)
            generated_sql = response.content
            
            # Clean up the SQL query
            cleaned_sql = self._clean_sql_query(generated_sql)
            
            return cleaned_sql
            
        except Exception as e:
            print(f"Error in RAG SQL generation: {str(e)}")
            raise Exception(f"Failed to generate SQL query using RAG: {str(e)}")
    
    def _clean_sql_query(self, sql_query):
        """Clean and format the SQL query"""
        if not sql_query:
            raise ValueError("Empty SQL query generated")
        
        # Remove markdown code blocks
        sql_query = sql_query.replace("```", "")
        sql_query = sql_query.replace("```sql", "")
        sql_query = sql_query.replace("```mysql", "")
        
        # Remove the word "sql" at the beginning (case insensitive)
        sql_query = re.sub(r'^sql\s*', '', sql_query, flags=re.IGNORECASE)
        
        # Normalize whitespace - replace multiple spaces/newlines with single space
        sql_query = re.sub(r'\s+', ' ', sql_query).strip()
        
        # Remove semicolon at the end
        sql_query = re.sub(r';$', '', sql_query)
        
        # Ensure it starts with SELECT
        if not sql_query.upper().startswith('SELECT'):
            raise ValueError("Generated query is not a SELECT statement")
        
        return sql_query

def main():
    """Main function for testing the RAG service"""
    if len(sys.argv) < 3:
        print("Usage: python rag_service_simple.py '<natural_language_query>' '<schema>'")
        sys.exit(1)
    
    query = sys.argv[1]
    schema = sys.argv[2]
    
    try:
        rag_service = SQLRAGService()
        sql_query = rag_service.generate_sql_with_rag(query, schema)
        
        result = {
            "success": True,
            "query": sql_query,
            "method": "RAG"
        }
        
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        result = {
            "success": False,
            "error": str(e),
            "method": "RAG"
        }
        print(json.dumps(result, indent=2))
        sys.exit(1)

if __name__ == "__main__":
    main()
