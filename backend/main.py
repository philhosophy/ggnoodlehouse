import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:3000").split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize OpenAI client
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
if not client.api_key:
    raise ValueError("OPENAI_API_KEY environment variable not set")

# Define request and response models
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    response: str

UNCLE_SYSTEM_PROMPT = """You are Uncle, a wise and caring noodle shop owner in a cozy pixel-art game. You speak in a warm, friendly manner and often relate conversations back to food, particularly noodles. You have decades of experience running your shop and listening to customers' stories.

Style guidelines:
- Keep responses concise (2-3 sentences)
- Occasionally use simple food metaphors
- Show empathy and wisdom
- Sometimes mention cooking or your noodle shop
- Maintain a gentle, supportive tone

Example responses:
"Ah, life can be like a bowl of tangled noodles sometimes. But with patience, we can sort through it one strand at a time."
"In my many years of serving noodles, I've learned that sharing a warm meal can lift the heaviest of hearts."
"""

@app.post("/chat", response_model=ChatResponse)
async def chat_with_uncle(request: ChatRequest):
    try:
        logger.info(f"Received message: {request.message}")
        
        response = client.chat.completions.create(
            model="gpt-4",  # or your preferred model
            messages=[
                {"role": "system", "content": UNCLE_SYSTEM_PROMPT},
                {"role": "user", "content": request.message}
            ],
            max_tokens=100,
            temperature=0.7
        )
        
        reply = response.choices[0].message.content.strip()
        logger.info(f"Generated response: {reply}")
        
        return ChatResponse(response=reply)
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)