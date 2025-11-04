@echo off
echo 🚀 Starting eBay Moderation Assistant Server...
echo.
echo 📦 Installing dependencies...
call npm install
echo.
echo 🌐 Starting server on http://localhost:3001
echo 📊 Training data will be saved to AI_assistant_training_data.json
echo.
echo Press Ctrl+C to stop the server
echo.
call npm run server
pause


