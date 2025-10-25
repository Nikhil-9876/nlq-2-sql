# RAG-Enhanced SQL Generation

This directory contains the RAG (Retrieval-Augmented Generation) implementation for enhanced SQL generation.

## Files

- `rag_service_simple.py` - Main RAG service for SQL generation
- `sql_knowledge_base.txt` - Comprehensive SQL knowledge base
- `sql_chroma_db/` - Vector database (auto-generated)
- `requirements.txt` - Python dependencies

## Setup

1. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Ensure your `.env` file contains:
   ```
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

## Usage

The RAG service is automatically called by the Node.js backend when processing natural language queries. No manual intervention required.

## How It Works

1. User submits natural language query
2. RAG service retrieves relevant SQL patterns from knowledge base
3. Context-aware SQL generation using Gemini
4. Generated SQL is executed on MySQL database
5. Results returned to user
