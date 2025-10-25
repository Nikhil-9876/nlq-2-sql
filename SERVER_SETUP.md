# Server Setup Guide

## 🔧 Fixing "Unhealthy Backend Server" Issue

### 1. Create Environment File

Create a `.env` file in the project root with the following content:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=your_database_name
DB_PORT=3306

# Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Server Configuration
PORT=5000
NODE_ENV=development
```

### 2. Database Setup

Make sure you have MySQL running and create a database:

```sql
CREATE DATABASE your_database_name;
```

### 3. Install Dependencies

```bash
cd server
npm install
```

### 4. Install Python Dependencies

```bash
cd LangChain
pip install -r requirements.txt
```

### 5. Test Server

```bash
cd server
node server.js
```

### 6. Check Health

Visit: `http://localhost:5000/api/health`

## 🚨 Common Issues

### Issue 1: Database Connection Failed
- **Solution**: Check your database credentials in `.env`
- **Test**: Make sure MySQL is running
- **Verify**: Database exists and is accessible

### Issue 2: Python Not Found
- **Solution**: Install Python 3.8+ and add to PATH
- **Test**: Run `python --version` in terminal

### Issue 3: Missing Dependencies
- **Solution**: Run `npm install` in server directory
- **Solution**: Run `pip install -r requirements.txt` in LangChain directory

### Issue 4: API Key Missing
- **Solution**: Get a Gemini API key from Google AI Studio
- **Add**: Set `GEMINI_API_KEY` in your `.env` file

## 🔍 Quick Diagnosis

Run this command to check server status:

```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "ragService": "available",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "message": "Server is running properly"
}
```

## 📞 Need Help?

1. Check the server logs for error messages
2. Verify all environment variables are set
3. Ensure MySQL database is running
4. Confirm Python is installed and accessible
