# FastAPI 示例代码集合

## 1. JWT 认证完整示例

### 依赖安装

```bash
pip install fastapi python-jose[cryptography] passlib[bcrypt] python-multipart
```

### 完整代码

```python
from datetime import datetime, timedelta
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

# ========== 配置 ==========
SECRET_KEY = "your-secret-key-change-in-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# ========== 初始化 ==========
app = FastAPI(
    title="JWT Auth Demo",
    description="FastAPI JWT 认证完整示例",
    version="1.0.0"
)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# ========== 数据模型 ==========
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str

class User(BaseModel):
    username: str
    email: str
    disabled: Optional[bool] = None

# ========== 模拟数据库 ==========
fake_users_db = {
    "admin": {
        "username": "admin",
        "email": "admin@example.com",
        "hashed_password": "$2b$12$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW",  # "secret"
        "disabled": False,
    }
}

# ========== 工具函数 ==========
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """生成密码哈希"""
    return pwd_context.hash(password)

def get_user(db: dict, username: str):
    """获取用户"""
    if username in db:
        user_dict = db[username]
        return User(**user_dict)

def authenticate_user(fake_db: dict, username: str, password: str):
    """认证用户"""
    user = get_user(fake_db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """创建访问令牌"""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """获取当前用户"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    user = get_user(fake_users_db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

# ========== API 路由 ==========

@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    登录获取访问令牌
    
    - **username**: 用户名
    - **password**: 密码
    """
    user = authenticate_user(fake_users_db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me/", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)):
    """获取当前用户信息"""
    return current_user

@app.get("/users/me/items/")
async def read_own_items(current_user: User = Depends(get_current_user)):
    """获取当前用户的项目（受保护的路由）"""
    return [{"item_id": "Foo", "owner": current_user.username}]

@app.post("/register", response_model=User)
async def register(user: UserCreate):
    """注册新用户"""
    if user.username in fake_users_db:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already registered"
        )
    
    hashed_password = get_password_hash(user.password)
    fake_users_db[user.username] = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "disabled": False,
    }
    
    return User(username=user.username, email=user.email, disabled=False)

# ========== 运行 ==========
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### 测试方法

```bash
# 1. 启动服务
python main.py

# 2. 访问文档
http://localhost:8000/docs

# 3. 使用 curl 测试
# 获取 token
curl -X POST "http://localhost:8000/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin&password=secret"

# 使用 token 访问受保护路由
curl -X GET "http://localhost:8000/users/me/" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 2. CRUD 操作示例

```python
from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

app = FastAPI()

# ========== 数据模型 ==========
class ItemBase(BaseModel):
    name: str
    description: Optional[str] = None
    price: float
    tax: Optional[float] = None

class ItemCreate(ItemBase):
    pass

class ItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    tax: Optional[float] = None

class Item(ItemBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ========== 模拟数据库 ==========
items_db: List[dict] = []
current_id = 0

# ========== CRUD 操作 ==========

@app.post("/items/", response_model=Item, status_code=status.HTTP_201_CREATED)
async def create_item(item: ItemCreate):
    """创建新项目"""
    global current_id
    current_id += 1
    
    now = datetime.utcnow()
    new_item = {
        "id": current_id,
        "created_at": now,
        "updated_at": now,
        **item.model_dump()
    }
    items_db.append(new_item)
    return new_item

@app.get("/items/", response_model=List[Item])
async def read_items(skip: int = 0, limit: int = 100):
    """获取所有项目（支持分页）"""
    return items_db[skip : skip + limit]

@app.get("/items/{item_id}", response_model=Item)
async def read_item(item_id: int):
    """获取单个项目"""
    for item in items_db:
        if item["id"] == item_id:
            return item
    raise HTTPException(status_code=404, detail="Item not found")

@app.put("/items/{item_id}", response_model=Item)
async def update_item(item_id: int, item: ItemUpdate):
    """更新项目"""
    for idx, existing_item in enumerate(items_db):
        if existing_item["id"] == item_id:
            update_data = item.model_dump(exclude_unset=True)
            items_db[idx]["updated_at"] = datetime.utcnow()
            items_db[idx].update(update_data)
            return items_db[idx]
    raise HTTPException(status_code=404, detail="Item not found")

@app.delete("/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_item(item_id: int):
    """删除项目"""
    for idx, item in enumerate(items_db):
        if item["id"] == item_id:
            items_db.pop(idx)
            return
    raise HTTPException(status_code=404, detail="Item not found")
```

---

## 3. 中间件示例

```python
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import time

app = FastAPI()

# CORS 中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应该指定具体域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gzip 压缩中间件
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 自定义日志中间件
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    print(f"{request.method} {request.url.path} - {process_time:.3f}s")
    
    return response
```

---

## 最佳实践总结

### 安全
- ✅ 使用环境变量存储 SECRET_KEY
- ✅ 密码使用 bcrypt 哈希
- ✅ Token 设置合理过期时间
- ✅ 使用 HTTPS 传输

### 代码组织
- ✅ 使用 Pydantic 模型验证
- ✅ 分离 Create/Update/Response 模型
- ✅ 使用 APIRouter 组织路由
- ✅ 添加适当的错误处理

### 性能
- ✅ 启用 Gzip 压缩
- ✅ 使用数据库连接池
- ✅ 添加缓存层（Redis）
- ✅ 异步数据库操作
