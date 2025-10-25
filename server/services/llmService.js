const RAGService = require('./ragService');
require('dotenv').config();

// Lazy initialization - only create RAG service when needed
let ragService = null;

async function generateSQL(naturalLanguageQuery, schema) {
  try {
    console.log('Using RAG service for SQL generation...');
    
    // Initialize RAG service only when needed (lazy loading)
    if (!ragService) {
      console.log('Initializing RAG service...');
      ragService = new RAGService();
    }
    
    // Use RAG service to generate SQL with context from knowledge base
    const sqlQuery = await ragService.generateSQLWithRAGDirect(naturalLanguageQuery, schema);
    
    console.log('RAG-generated SQL:', sqlQuery);
    
    return sqlQuery;
  } catch (error) {
    console.error('RAG Service Error:', error.message);
    
    // Fallback to direct Gemini API if RAG fails
    console.log('Falling back to direct Gemini API...');
    return await generateSQLWithDirectAPI(naturalLanguageQuery, schema);
  }
}

// Fallback method using direct Gemini API
async function generateSQLWithDirectAPI(naturalLanguageQuery, schema) {
  const axios = require('axios');
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  
  const prompt = `You are an expert MySQL query generator.

Database Schema:
${schema}

CRITICAL: Return ONLY the SQL query as plain text. Do NOT include:
- Markdown code blocks
- The word "sql" before the query
- Explanations
- Comments
- Any text before or after the query
- Semicolons or UNION operations

SECURITY REQUIREMENTS:
- ONLY generate SELECT queries
- NO INSERT, UPDATE, DELETE, DROP, CREATE, ALTER, or any other DDL/DML operations
- Focus on data retrieval and analysis queries only

User Question: ${naturalLanguageQuery}

Plain SQL query:`;

  try {
    const response = await axios.post(GEMINI_API_URL, {
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 500
      }
    });

    let sqlQuery = response.data.candidates[0].content.parts[0].text.trim();
    
    // Remove markdown code blocks
    sqlQuery = sqlQuery.replace(/```/g, '');
    
    // Remove the word "sql" at the beginning (case insensitive)
    sqlQuery = sqlQuery.replace(/^sql\s*/i, '');
    
    // Normalize whitespace - replace multiple spaces/newlines with single space
    sqlQuery = sqlQuery.replace(/\s+/g, ' ').trim();
    
    // Remove semicolon at the end
    sqlQuery = sqlQuery.replace(/;$/, '');
    
    return sqlQuery;
  } catch (error) {
    console.error('Direct Gemini API Error:', error.response?.data || error.message);
    throw new Error('Failed to generate SQL query with both RAG and direct API');
  }
}

module.exports = { generateSQL };
