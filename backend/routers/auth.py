from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from jose import JWTError, jwt

from .. import schemas, models, utils, database

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(database.get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, utils.SECRET_KEY, algorithms=[utils.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=schemas.Token)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if user exists
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    hashed_password = utils.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Create default preferences
    new_prefs = models.UserPreference(user_id=new_user.id)
    db.add(new_prefs)
    db.commit()

    # Create token
    access_token = utils.create_access_token(data={"sub": new_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token = utils.create_access_token(data={"sub": user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=schemas.UserResponse)
def update_profile(
    profile_update: schemas.UserProfileUpdate,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_update.firstName is not None:
        current_user.first_name = profile_update.firstName
    if profile_update.lastName is not None:
        current_user.last_name = profile_update.lastName
    if profile_update.phoneNumber is not None:
        current_user.phone_number = profile_update.phoneNumber
    if profile_update.location is not None:
        current_user.location = profile_update.location
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Create unique filename
    file_ext = os.path.splitext(file.filename)[1]
    filename = f"{current_user.id}_{uuid.uuid4().hex}{file_ext}"
    
    # Path to save
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    upload_path = os.path.join(base_dir, "uploads", "avatars", filename)
    
    # Actually save the file
    os.makedirs(os.path.dirname(upload_path), exist_ok=True) # Ensure directory exists
    with open(upload_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    # Delete old avatar if it exists
    if current_user.avatar_url and current_user.avatar_url.startswith("/uploads/avatars/"):
        old_path = os.path.join(base_dir, current_user.avatar_url.lstrip("/"))
        if os.path.exists(old_path):
            try:
                os.remove(old_path)
            except Exception:
                pass # Ignore errors on deletion
    
    # Update user record
    current_user.avatar_url = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    
    return {"avatar_url": current_user.avatar_url}
