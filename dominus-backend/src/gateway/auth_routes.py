import math
import hashlib
from typing import List
from pydantic import BaseModel
from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from src.database.connection import get_db
from src.database.models.dominus import DominusUser

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# Hashing utilities using standard hashlib
def hash_password(password: str) -> str:
    salt = "dominus_secret_salt_1298"
    return hashlib.sha256((password + salt).encode("utf-8")).hexdigest()

def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed

def calculate_euclidean_distance(vector_a: List[float], vector_b: List[float]) -> float:
    if not vector_a or not vector_b or len(vector_a) != len(vector_b):
        return 1.0
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(vector_a, vector_b)))

# Pydantic schemas
class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str
    face_embedding: List[float] = None

class LoginRequest(BaseModel):
    username_or_email: str
    password: str

class FaceLoginRequest(BaseModel):
    username: str
    face_embedding: List[float]

class RegisterFaceRequest(BaseModel):
    username: str
    face_embedding: List[float]

@router.post("/register")
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    # Check duplicate
    existing_user = db.query(DominusUser).filter(
        (DominusUser.username == req.username) | (DominusUser.email == req.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    new_user = DominusUser(
        username=req.username,
        email=req.email,
        password_hash=hash_password(req.password),
        face_embedding=req.face_embedding,
        role="member",
        status="active"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {
        "status": "success",
        "message": "User registered successfully",
        "user": {
            "id": new_user.id,
            "username": new_user.username,
            "email": new_user.email,
            "role": new_user.role
        }
    }

@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(DominusUser).filter(
        (DominusUser.username == req.username_or_email) | (DominusUser.email == req.username_or_email)
    ).first()
    
    if not user or not user.password_hash or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    if user.status != "active":
        raise HTTPException(status_code=403, detail="User account is inactive or suspended")
        
    return {
        "status": "success",
        "message": "Logged in successfully",
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role,
            "has_face": user.face_embedding is not None
        }
    }

@router.post("/login-face")
async def login_face(req: FaceLoginRequest, db: Session = Depends(get_db)):
    user = db.query(DominusUser).filter(DominusUser.username == req.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if user.status != "active":
        raise HTTPException(status_code=403, detail="User account is inactive or suspended")
        
    if not user.face_embedding:
        raise HTTPException(status_code=400, detail="Face authentication is not registered for this user")
        
    # Compare embeddings
    distance = calculate_euclidean_distance(req.face_embedding, user.face_embedding)
    # Threshold for face matching is typically 0.6
    if distance > 0.6:
        raise HTTPException(status_code=401, detail=f"Face mismatch. Verification failed (distance={distance:.3f})")
        
    return {
        "status": "success",
        "message": "Face verified and logged in successfully",
        "distance": round(distance, 4),
        "user": {
            "id": user.id,
            "username": user.username,
            "role": user.role
        }
    }

@router.post("/register-face")
async def register_face(req: RegisterFaceRequest, db: Session = Depends(get_db)):
    user = db.query(DominusUser).filter(DominusUser.username == req.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.face_embedding = req.face_embedding
    db.commit()
    return {
        "status": "success",
        "message": "Face embedding updated successfully"
    }
