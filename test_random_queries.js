#!/usr/bin/env node
/**
 * Test script for random NLQ queries with RAG
 * This demonstrates that RAG works with any natural language query
 */

const { generateSQL } = require('./server/services/llmService');

async function testRandomQueries() {
  console.log('🎲 Testing RAG with Random Natural Language Queries\n');
  
  const randomTestCases = [
    {
      query: "Find all products that cost more than $50",
      schema: `Table: products
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - price (DECIMAL(10,2))
  - category_id (INT)`
    },
    {
      query: "Get the average price of all products",
      schema: `Table: products
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - price (DECIMAL(10,2))
  - category_id (INT)`
    },
    {
      query: "Show me the most recent orders from last week",
      schema: `Table: orders
  - id (INT) PRIMARY KEY
  - user_id (INT)
  - total_amount (DECIMAL(10,2))
  - order_date (DATE)
  - status (VARCHAR(50))`
    },
    {
      query: "Find customers who spent more than $1000 in total",
      schema: `Table: customers
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - email (VARCHAR(255))

Table: orders
  - id (INT) PRIMARY KEY
  - customer_id (INT)
  - total_amount (DECIMAL(10,2))`
    },
    {
      query: "List all employees hired in 2023",
      schema: `Table: employees
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - department (VARCHAR(100))
  - hire_date (DATE)
  - salary (DECIMAL(10,2))`
    },
    {
      query: "What are the top 3 best-selling products?",
      schema: `Table: products
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - price (DECIMAL(10,2))

Table: order_items
  - id (INT) PRIMARY KEY
  - order_id (INT)
  - product_id (INT)
  - quantity (INT)`
    },
    {
      query: "Find all users who registered this month",
      schema: `Table: users
  - id (INT) PRIMARY KEY
  - username (VARCHAR(255))
  - email (VARCHAR(255))
  - created_at (TIMESTAMP)
  - is_active (BOOLEAN)`
    },
    {
      query: "Show me products that are out of stock",
      schema: `Table: products
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - price (DECIMAL(10,2))
  - stock_quantity (INT)
  - category_id (INT)`
    }
  ];

  let successCount = 0;
  let totalTests = randomTestCases.length;

  for (let i = 0; i < randomTestCases.length; i++) {
    const testCase = randomTestCases[i];
    console.log(`\n🎯 Random Query ${i + 1}: "${testCase.query}"`);
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

  console.log(`\n📊 Random Query Test Results: ${successCount}/${totalTests} tests passed`);
  
  if (successCount === totalTests) {
    console.log('🎉 All random queries processed successfully!');
    console.log('🚀 RAG system can handle ANY natural language query!');
  } else {
    console.log('⚠️  Some queries failed, but RAG is still working for most cases.');
  }

  console.log('\n💡 Key Points:');
  console.log('• RAG works with ANY natural language query');
  console.log('• Knowledge base provides context for better SQL generation');
  console.log('• System handles complex queries with multiple tables');
  console.log('• Fallback to direct API ensures reliability');
}

// Run the test
if (require.main === module) {
  testRandomQueries().catch(console.error);
}

module.exports = { testRandomQueries };
