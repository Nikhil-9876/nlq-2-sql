const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const queryRoutes = require("./routes/queryRoutes");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'http://localhost:5173',
    'https://nlq-frontend.vercel.app',
    'https://*.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Library NLQ Backend API',
    status: 'running',
    endpoints: {
      health: '/api/health',
      query: '/api/query',
      schema: '/api/schema'
    }
  });
});

app.get('/health', (req, res) => {
  res.json({msg : "server is running!!"});
})

// Routes
app.use("/api", queryRoutes);

// Test database connection
app.get("/api/health", async (req, res) => {
  try {
    // Test basic database connection with a simple query
    const [rows] = await pool.query("SELECT 1 as test");
    
    res.json({
      status: "healthy",
      database: "connected",
      timestamp: new Date().toISOString(),
      message: "Server is running properly"
    });
  } catch (error) {
    console.error('Health check failed:', error);
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Test RAG service (only when explicitly requested)
app.get("/api/health/rag", async (req, res) => {
  try {
    // Test RAG service availability
    let ragStatus = "unknown";
    let pythonVersion = "unknown";
    
    try {
      const { exec } = require('child_process');
      const util = require('util');
      const execAsync = util.promisify(exec);
      const { stdout } = await execAsync('python --version');
      pythonVersion = stdout.trim();
      ragStatus = "available";
    } catch (ragError) {
      ragStatus = "unavailable";
    }
    
    res.json({
      status: "healthy",
      ragService: ragStatus,
      pythonVersion: pythonVersion,
      timestamp: new Date().toISOString(),
      message: "RAG service check completed"
    });
  } catch (error) {
    console.error('RAG health check failed:', error);
    res.status(500).json({
      status: "unhealthy",
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

const PORT = process.env.PORT || 5000;
// Only listen locally, not on Vercel
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`⚕️ Check server health on http://localhost:${PORT}/api/health`);
  });
}

module.exports = app;