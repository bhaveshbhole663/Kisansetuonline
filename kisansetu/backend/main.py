from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import auth, centres, bookings, procurement, walkins, channels, ai_assistant, analytics

# Initialize SQLite database on startup
init_db()

app = FastAPI(
    title="KisanSetu Multi-Channel Farmer Procurement API",
    description="Unified API gateway connecting Web, SMS, IVR, and Walk-in channels to a single backend, database, and queue.",
    version="1.0.0"
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router)
app.include_router(centres.router)
app.include_router(bookings.router)
app.include_router(procurement.router)
app.include_router(walkins.router)
app.include_router(channels.router)
app.include_router(ai_assistant.router)
app.include_router(analytics.router)

@app.get("/")
def root():
    return {
        "system": "KisanSetu — Multi-Channel Farmer Procurement Platform",
        "tagline": "Digital Procurement Without Forcing Farmers to Use Smartphones",
        "status": "ONLINE",
        "supported_channels": ["WEB", "SMS", "IVR", "WALK_IN"],
        "version": "1.0.0"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "service": "kisansetu-backend"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
