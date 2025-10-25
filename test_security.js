#!/usr/bin/env node
/**
 * Security test script for SELECT-only query enforcement
 * This script tests that only SELECT queries are allowed
 */

const { generateSQL } = require('./server/services/llmService');

async function testSecurityEnforcement() {
  console.log('🔒 Testing Security: SELECT-Only Query Enforcement\n');
  
  const securityTestCases = [
    {
      query: "Show me all users",
      schema: `Table: users
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - email (VARCHAR(255))`,
      expectedType: "SELECT",
      description: "Normal SELECT query (should pass)"
    },
    {
      query: "Delete all users",
      schema: `Table: users
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - email (VARCHAR(255))`,
      expectedType: "BLOCKED",
      description: "DELETE query (should be blocked)"
    },
    {
      query: "Update user names",
      schema: `Table: users
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - email (VARCHAR(255))`,
      expectedType: "BLOCKED",
      description: "UPDATE query (should be blocked)"
    },
    {
      query: "Create a new table",
      schema: `Table: users
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - email (VARCHAR(255))`,
      expectedType: "BLOCKED",
      description: "CREATE query (should be blocked)"
    },
    {
      query: "Drop the users table",
      schema: `Table: users
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - email (VARCHAR(255))`,
      expectedType: "BLOCKED",
      description: "DROP query (should be blocked)"
    },
    {
      query: "Insert new user data",
      schema: `Table: users
  - id (INT) PRIMARY KEY
  - name (VARCHAR(255))
  - email (VARCHAR(255))`,
      expectedType: "BLOCKED",
      description: "INSERT query (should be blocked)"
    }
  ];

  let passedTests = 0;
  let totalTests = securityTestCases.length;

  for (let i = 0; i < securityTestCases.length; i++) {
    const testCase = securityTestCases[i];
    console.log(`\n🛡️  Security Test ${i + 1}: ${testCase.description}`);
    console.log(`Query: "${testCase.query}"`);
    
    try {
      const sqlQuery = await generateSQL(testCase.query, testCase.schema);
      
      if (testCase.expectedType === "SELECT") {
        if (sqlQuery.toUpperCase().startsWith('SELECT')) {
          console.log(`✅ PASS: Generated valid SELECT query`);
          console.log(`SQL: ${sqlQuery}`);
          passedTests++;
        } else {
          console.log(`❌ FAIL: Expected SELECT query but got: ${sqlQuery}`);
        }
      } else if (testCase.expectedType === "BLOCKED") {
        console.log(`❌ FAIL: Security should have blocked this query but got: ${sqlQuery}`);
      }
      
    } catch (error) {
      if (testCase.expectedType === "BLOCKED") {
        console.log(`✅ PASS: Security correctly blocked dangerous query`);
        console.log(`Error: ${error.message}`);
        passedTests++;
      } else {
        console.log(`❌ FAIL: Unexpected error for valid query: ${error.message}`);
      }
    }
    
    console.log('---');
  }

  console.log(`\n📊 Security Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All security tests passed! SELECT-only enforcement is working correctly.');
  } else {
    console.log('⚠️  Some security tests failed. Review the security implementation.');
  }

  console.log('\n🔐 Security Features:');
  console.log('• Only SELECT queries are allowed');
  console.log('• Dangerous keywords are blocked');
  console.log('• Semicolons are blocked (prevents query chaining)');
  console.log('• Comments are blocked (prevents code injection)');
  console.log('• UNION operations are blocked');
  console.log('• Subqueries are validated for dangerous operations');
}

// Run the test
if (require.main === module) {
  testSecurityEnforcement().catch(console.error);
}

module.exports = { testSecurityEnforcement };
