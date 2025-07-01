"""
Questlog AI Service
Provides AI-powered task prioritization and suggestions
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI(
    title="Questlog AI Service",
    description="AI-powered task prioritization and suggestions",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Quest(BaseModel):
    id: str
    title: str
    description: Optional[str] = None
    difficulty: str
    priority: str
    estimated_duration: int

class PrioritizationRequest(BaseModel):
    quests: List[Quest]
    available_time: int
    context: Optional[str] = None

class PrioritizationResponse(BaseModel):
    prioritized_quests: List[Quest]
    reasoning: str
    suggested_time_allocation: dict

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "ai-service",
        "version": "1.0.0"
    }

# Quest prioritization endpoint
@app.post("/api/v1/ai/prioritize", response_model=PrioritizationResponse)
async def prioritize_quests(request: PrioritizationRequest):
    """
    Prioritize quests based on AI analysis
    """
    try:
        # TODO: Implement actual AI prioritization logic
        # For now, return a simple prioritization based on difficulty and priority
        
        prioritized = sorted(
            request.quests,
            key=lambda q: (
                {"LOW": 1, "MEDIUM": 2, "HIGH": 3, "URGENT": 4}[q.priority],
                {"EASY": 1, "MEDIUM": 2, "HARD": 3, "EPIC": 4}[q.difficulty]
            ),
            reverse=True
        )
        
        # Calculate time allocation
        total_time = request.available_time
        time_allocation = {}
        
        for quest in prioritized:
            if total_time <= 0:
                break
            allocated = min(quest.estimated_duration, total_time)
            time_allocation[quest.id] = allocated
            total_time -= allocated
        
        return PrioritizationResponse(
            prioritized_quests=prioritized,
            reasoning="Quests prioritized by urgency and difficulty. Higher priority and harder quests come first.",
            suggested_time_allocation=time_allocation
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prioritization failed: {str(e)}")

# Quest breakdown endpoint
@app.post("/api/v1/ai/breakdown")
async def breakdown_quest(quest: Quest):
    """
    Break down a complex quest into smaller steps
    """
    try:
        # TODO: Implement actual AI breakdown logic
        steps = [
            {
                "id": f"{quest.id}_step_1",
                "title": f"Research {quest.title}",
                "description": "Gather information and requirements",
                "estimated_duration": max(15, quest.estimated_duration // 4)
            },
            {
                "id": f"{quest.id}_step_2", 
                "title": f"Plan {quest.title}",
                "description": "Create a detailed plan and timeline",
                "estimated_duration": max(15, quest.estimated_duration // 4)
            },
            {
                "id": f"{quest.id}_step_3",
                "title": f"Execute {quest.title}",
                "description": "Work on the main task",
                "estimated_duration": quest.estimated_duration // 2
            },
            {
                "id": f"{quest.id}_step_4",
                "title": f"Review {quest.title}",
                "description": "Review and refine the work",
                "estimated_duration": max(15, quest.estimated_duration // 4)
            }
        ]
        
        return {
            "quest_id": quest.id,
            "steps": steps,
            "total_estimated_duration": sum(step["estimated_duration"] for step in steps)
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Breakdown failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "3003")),
        reload=os.getenv("NODE_ENV") != "production"
    ) 