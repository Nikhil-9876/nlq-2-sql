const pool = require('../config/db');
const { generateSQL } = require('./llmService');
const { extractSchema } = require('../utils/schemaExtractor');

async function executeNLQuery(naturalLanguageQuery, maxRetries = 2) {
  let attempt = 0;
  let lastError = null;
  let generatedSQL = null;

  const schema = await extractSchema();

  while (attempt < maxRetries) {
    try {
      // Generate SQL from natural language
      if (attempt === 0) {
        generatedSQL = await generateSQL(naturalLanguageQuery, schema);
      } else {
        // Self-correction: include previous error in prompt
        generatedSQL = await generateSQL(
          `${naturalLanguageQuery}\n\nPrevious query failed with error: ${lastError}\nPlease fix the query.`,
          schema
        );
      }

      console.log(`Attempt ${attempt + 1} - Generated SQL:`, generatedSQL);

      // Validate query (security check)
      if (!isValidQuery(generatedSQL)) {
        throw new Error('Invalid or unsafe SQL query detected');
      }

      // Execute query
      const [results] = await pool.query(generatedSQL);

      return {
        success: true,
        query: generatedSQL,
        results: results,
        rowCount: results.length,
        attempt: attempt + 1
      };

    } catch (error) {
      lastError = error.message;
      attempt++;
      
      if (attempt >= maxRetries) {
        return {
          success: false,
          query: generatedSQL,
          error: lastError,
          attempts: attempt
        };
      }
    }
  }
}

function isValidQuery(sql) {
  if (!sql || typeof sql !== 'string') {
    return false;
  }
  
  const upperSQL = sql.toUpperCase().trim();
  
  // Only allow SELECT queries
  if (!upperSQL.startsWith('SELECT')) {
    console.log('Security: Rejected non-SELECT query:', sql);
    return false;
  }
  
  // Block dangerous keywords anywhere in the query
  const dangerousKeywords = [
    'DROP', 'DELETE', 'INSERT', 'UPDATE', 'TRUNCATE', 'ALTER', 'CREATE',
    'REPLACE', 'MERGE', 'CALL', 'EXEC', 'EXECUTE', 'GRANT', 'REVOKE',
    'LOCK', 'UNLOCK', 'LOAD', 'INTO', 'OUTFILE', 'DUMPFILE'
  ];
  
  for (const keyword of dangerousKeywords) {
    if (upperSQL.includes(keyword)) {
      console.log(`Security: Rejected query containing dangerous keyword '${keyword}':`, sql);
      return false;
    }
  }
  
  // Block semicolons (prevents query chaining)
  if (upperSQL.includes(';')) {
    console.log('Security: Rejected query containing semicolon:', sql);
    return false;
  }
  
  // Block comments that might hide malicious code
  if (upperSQL.includes('--') || upperSQL.includes('/*') || upperSQL.includes('*/')) {
    console.log('Security: Rejected query containing comments:', sql);
    return false;
  }
  
  // Block UNION (prevents data extraction attacks)
  if (upperSQL.includes('UNION')) {
    console.log('Security: Rejected query containing UNION:', sql);
    return false;
  }
  
  // Block subqueries with dangerous operations
  if (upperSQL.includes('(SELECT') && upperSQL.includes('FROM')) {
    // Allow subqueries but check for dangerous patterns
    const subqueryPattern = /\(SELECT[^)]+\)/gi;
    const subqueries = upperSQL.match(subqueryPattern);
    if (subqueries) {
      for (const subquery of subqueries) {
        for (const keyword of dangerousKeywords) {
          if (subquery.includes(keyword)) {
            console.log(`Security: Rejected subquery containing dangerous keyword '${keyword}':`, sql);
            return false;
          }
        }
      }
    }
  }
  
  console.log('Security: Query passed validation:', sql);
  return true;
}

module.exports = { executeNLQuery };
