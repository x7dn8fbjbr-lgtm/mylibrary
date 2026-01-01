from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from routers import auth, users, books, locations, stats, public

app = FastAPI(
    title="MyLibrary API",
    description="Personal Library Management System",
    version="1.0.0"
)

# CORS Configuration
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(books.router)
app.include_router(locations.router)
app.include_router(stats.router)
app.include_router(public.router)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory="/app/uploads"), name="uploads")

# Serve frontend static files
app.mount("/static", StaticFiles(directory="/app/static"), name="static")

# Health check
@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

# Serve frontend for all other routes (SPA)
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    """Serve frontend index.html for all non-API routes"""
    if full_path.startswith("api/"):
        return {"error": "Not found"}
    
    index_path = "/app/static/index.html"
    if os.path.exists(index_path):
        return FileResponse(index_path)
    else:
        return {"message": "Frontend not built yet. Please build the frontend."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
