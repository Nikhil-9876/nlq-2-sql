#!/usr/bin/env node
/**
 * Test script for RAG integration
 * This script tests the RAG service integration with the existing API
 */

const path = require('path');
const { generateSQL } = require('./server/services/llmService');

async function testRAGIntegration() {
  console.log('🧪 Testing RAG Integration for SQL Generation\n');
  
  const testCases = [
    {
      query: "Show me all users",
      schema: `Table: users
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - email (VARCHAR(255))
  - created_at (TIMESTAMP)`
    },
    {
      query: "Find users with gmail addresses",
      schema: `Table: users
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - email (VARCHAR(255))
  - created_at (TIMESTAMP)`
    },
    {
      query: "Count how many products are in each category",
      schema: `Table: products
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - category_id (INT)
  - price (DECIMAL(10,2))

Table: categories
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))`
    },
    {
      query: "Get the top 5 most expensive products",
      schema: `Table: products
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - price (DECIMAL(10,2))
  - category_id (INT)`
    }
  ];

  let successCount = 0;
  let totalTests = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📝 Test Case ${i + 1}: "${testCase.query}"`);
    console.log('Schema:', testCase.schema.replace(/\n/g, '\\n'));
    
    try {
      const startTime = Date.now();
      const sqlQuery = await generateSQL(testCase.query, testCase.schema);
      const endTime = Date.now();
      
      console.log(`✅ Success (${endTime - startTime}ms)`);
      console.log(`Generated SQL: ${sqlQuery}`);
      console.log('---');
      
      successCount++;
    } catch (error) {
      console.log(`❌ Failed: ${error.message}`);
      console.log('---');
    }
  }

  console.log(`\n📊 Test Results: ${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log('🎉 All tests passed! RAG integration is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the error messages above.');
  }
}

// Run the test
if (require.main === module) {
  testRAGIntegration().catch(console.error);
}

module.exports = { testRAGIntegration };
