@echo off
echo =======================================================
echo   Starting KisanSetu Multi-Channel Procurement Platform
echo =======================================================
echo.

echo Starting FastAPI Backend on port 8000...
start "KisanSetu Backend" cmd /k "cd backend && .venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

timeout /t 2 /nobreak > nul

echo Starting Vite React Frontend on port 5173...
start "KisanSetu Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are starting:
echo  - Backend API:  http://127.0.0.1:8000/docs
echo  - Web App:      http://localhost:5173
echo.
pause
