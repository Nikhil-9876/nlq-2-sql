const { spawn } = require('child_process');
const path = require('path');

class RAGService {
  constructor() {
    this.pythonPath = 'python'; // Adjust if needed for your Python installation
    this.ragScriptPath = path.join(__dirname, '../../LangChain/rag_service_simple.py');
  }

  async generateSQLWithRAG(naturalLanguageQuery, schema) {
    return new Promise((resolve, reject) => {
      const args = [
        this.ragScriptPath,
        `"${naturalLanguageQuery}"`,
        `"${schema}"`
      ];

      console.log('Calling RAG service with args:', args);

      const pythonProcess = spawn(this.pythonPath, args, {
        stdio: ['pipe', 'pipe', 'ignore'], // Ignore stderr to avoid warnings
        shell: true
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      // stderr is ignored to avoid warnings

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          console.error('RAG service error: Process failed with code', code);
          reject(new Error(`RAG service failed with code ${code}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          
          if (result.success) {
            resolve(result.query);
          } else {
            reject(new Error(result.error || 'RAG service returned unsuccessful result'));
          }
        } catch (parseError) {
          console.error('Failed to parse RAG service output:', stdout);
          reject(new Error(`Failed to parse RAG service response: ${parseError.message}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start RAG service:', error);
        reject(new Error(`Failed to start RAG service: ${error.message}`));
      });
    });
  }

  // Alternative method using direct Python execution
  async generateSQLWithRAGDirect(naturalLanguageQuery, schema) {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);

    try {
      const command = `python "${this.ragScriptPath}" "${naturalLanguageQuery}" "${schema}"`;
      console.log('Executing RAG command:', command);
      
      const { stdout, stderr } = await execAsync(command, {
        stdio: ['pipe', 'pipe', 'ignore'] // Ignore stderr
      });

      const result = JSON.parse(stdout);
      
      if (result.success) {
        return result.query;
      } else {
        throw new Error(result.error || 'RAG service returned unsuccessful result');
      }
    } catch (error) {
      console.error('RAG service execution error:', error);
      throw new Error(`RAG service execution failed: ${error.message}`);
    }
  }
}

module.exports = RAGService;
