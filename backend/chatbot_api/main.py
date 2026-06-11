from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy.orm import Session
import uvicorn
from contextlib import asynccontextmanager

from .database import engine, Base, get_db
from .auth import get_current_user
from .models import User
from .rag_engine import init_vector_db
from .agent import process_chat

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Vector DB on startup
    init_vector_db()
    yield
    # Cleanup on shutdown

app = FastAPI(title="AI Chatbot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    query: str
    session_id: str = "default"

class ChatResponse(BaseModel):
    answer: str

@app.post("/chat", response_model=ChatResponse)
def chat_endpoint(
    request: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        answer = process_chat(request.query, current_user, db, request.session_id)
        return ChatResponse(answer=answer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("backend.chatbot_api.main:app", host="0.0.0.0", port=3000, reload=True)
