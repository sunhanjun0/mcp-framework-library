# Express.js 示例代码集合

## 1. JWT 认证完整示例

### 项目结构

```
express-jwt-auth/
├── controllers/
│   └── auth.controller.js
├── middleware/
│   ├── auth.middleware.js
│   └── validation.middleware.js
├── models/
│   └── user.model.js
├── routes/
│   └── auth.routes.js
├── utils/
│   └── jwt.util.js
├── .env
├── server.js
└── package.json
```

### .env

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/jwt-auth
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
NODE_ENV=development
```

### models/user.model.js

```javascript
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请输入用户名'],
    trim: true
  },
  email: {
    type: String,
    required: [true, '请输入邮箱'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, '请输入有效的邮箱']
  },
  password: {
    type: String,
    required: [true, '请输入密码'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  avatar: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 密码加密
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 生成 JWT
userSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// 验证密码
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
```

### middleware/auth.middleware.js

```javascript
const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

exports.protect = async (req, res, next) => {
  let token;

  // 检查请求头
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  // 确保 token 存在
  if (!token) {
    return res.status(401).json({
      success: false,
      message: '未授权访问，请先登录'
    });
  }

  try {
    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 获取用户
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '用户不存在'
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token 无效或已过期'
    });
  }
};

// 授权特定角色
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `用户角色 ${req.user.role} 无权访问此资源`
      });
    }
    next();
  };
};
```

### controllers/auth.controller.js

```javascript
const User = require('../models/user.model');
const ErrorResponse = require('../utils/errorResponse');

// @desc    用户注册
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    // 创建用户
    const user = await User.create({
      name,
      email,
      password,
      role
    });

    // 生成 token
    const token = user.getSignedJwtToken();

    res.status(201).json({
      success: true,
      message: '注册成功',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    // 处理 MongoDB 唯一键冲突
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: '该邮箱已被注册'
      });
    }

    // 处理验证错误
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages
      });
    }

    next(error);
  }
};

// @desc    用户登录
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 验证邮箱和密码
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '请输入邮箱和密码'
      });
    }

    // 查找用户（包含密码字段）
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 验证密码
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '邮箱或密码错误'
      });
    }

    // 生成 token
    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    获取当前用户
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    更新用户信息
// @route   PUT /api/auth/updateprofile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      email: req.body.email
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: '资料更新成功',
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    更新密码
// @route   PUT /api/auth/updatepassword
// @access  Private
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请输入当前密码和新密码'
      });
    }

    const user = await User.findById(req.user.id).select('+password');

    // 验证当前密码
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误'
      });
    }

    user.password = newPassword;
    await user.save();

    const token = user.getSignedJwtToken();

    res.status(200).json({
      success: true,
      message: '密码修改成功',
      data: { token }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    用户登出
// @route   GET /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  res.status(200).json({
    success: true,
    message: '登出成功',
    data: {}
  });
};
```

### routes/auth.routes.js

```javascript
const express = require('express');
const {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  logout
} = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updateprofile', protect, updateProfile);
router.put('/updatepassword', protect, updatePassword);

module.exports = router;
```

### server.js

```javascript
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const morgan = require('morgan');

// 加载环境变量
dotenv.config();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// 连接数据库
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB 连接成功'))
.catch(err => console.error('MongoDB 连接失败:', err));

// 路由
app.use('/api/auth', require('./routes/auth.routes'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 404 处理
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: '路由不存在'
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`服务器运行在 ${process.env.NODE_ENV} 模式，端口 ${PORT}`);
});
```

### package.json

```json
{
  "name": "express-jwt-auth",
  "version": "1.0.0",
  "description": "Express JWT Authentication Example",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "morgan": "^1.10.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0"
  }
}
```

---

## 2. CRUD API 示例

### models/product.model.js

```javascript
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, '请输入产品名称'],
    trim: true,
    maxlength: [100, '产品名称不能超过 100 个字符']
  },
  description: {
    type: String,
    required: [true, '请输入产品描述'],
    maxlength: [500, '产品描述不能超过 500 个字符']
  },
  price: {
    type: Number,
    required: [true, '请输入产品价格'],
    min: [0, '价格不能为负数']
  },
  category: {
    type: String,
    required: [true, '请选择产品类别'],
    enum: ['electronics', 'clothing', 'books', 'home', 'sports']
  },
  stock: {
    type: Number,
    required: [true, '请输入库存数量'],
    min: [0, '库存不能为负数'],
    default: 0
  },
  images: [{
    type: String
  }],
  rating: {
    type: Number,
    min: [1, '评分最低为 1'],
    max: [5, '评分最高为 5'],
    default: 0
  },
  numReviews: {
    type: Number,
    default: 0
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// 索引
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
```

### controllers/product.controller.js

```javascript
const Product = require('../models/product.model');
const ErrorResponse = require('../utils/errorResponse');

// @desc    获取所有产品
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments();

    // 构建查询
    let query = {};
    
    // 分类过滤
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // 价格范围
    if (req.query.minPrice || req.query.maxPrice) {
      query.price = {};
      if (req.query.minPrice) query.price.$gte = req.query.minPrice;
      if (req.query.maxPrice) query.price.$lte = req.query.maxPrice;
    }

    // 搜索
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    // 排序
    let sort = {};
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',');
      sortBy.forEach(item => {
        const [field, order] = item.split(':');
        sort[field] = order === 'desc' ? -1 : 1;
      });
    } else {
      sort = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .sort(sort)
      .limit(limit)
      .skip(startIndex)
      .populate('user', 'name email');

    // 分页信息
    const pagination = {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    };

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

// @desc    获取单个产品
// @route   GET /api/products/:id
// @access  Public
exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate('user', 'name email');

    if (!product) {
      return next(new ErrorResponse('产品不存在', 404));
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return next(new ErrorResponse('产品 ID 无效', 404));
    }
    next(error);
  }
};

// @desc    创建产品
// @route   POST /api/products
// @access  Private
exports.createProduct = async (req, res, next) => {
  try {
    // 添加用户 ID
    req.body.user = req.user.id;

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: '产品创建成功',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    更新产品
// @route   PUT /api/products/:id
// @access  Private
exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse('产品不存在', 404));
    }

    // 检查权限
    if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('无权更新此产品', 403));
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: '产品更新成功',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

// @desc    删除产品
// @route   DELETE /api/products/:id
// @access  Private
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse('产品不存在', 404));
    }

    // 检查权限
    if (product.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(new ErrorResponse('无权删除此产品', 403));
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: '产品已删除',
      data: {}
    });
  } catch (error) {
    next(error);
  }
};
```

### routes/product.routes.js

```javascript
const express = require('express');
const {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct
} = require('../controllers/product.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

const router = express.Router();

// 重用路由
router.route('/')
  .get(getProducts)
  .post(protect, createProduct);

router.route('/:id')
  .get(getProduct)
  .put(protect, updateProduct)
  .delete(protect, deleteProduct);

module.exports = router;
```

---

## 3. 中间件示例

### middleware/error.middleware.js

```javascript
const ErrorResponse = require('../utils/errorResponse');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // 开发环境显示详细错误
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  // Mongoose 错误
  if (err.name === 'CastError') {
    const message = '资源不存在';
    error = new ErrorResponse(message, 404);
  }

  // Mongoose 重复键错误
  if (err.code === 11000) {
    const message = '重复的字段值';
    error = new ErrorResponse(message, 400);
  }

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new ErrorResponse(message, 400);
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || '服务器内部错误',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
```

### middleware/logger.middleware.js

```javascript
const fs = require('fs');
const path = require('path');

const logger = (req, res, next) => {
  const timestamp = new Date().toISOString();
  const log = `${timestamp} - ${req.method} ${req.path} - ${req.ip}\n`;

  // 写入日志文件
  fs.appendFile(
    path.join(__dirname, '../logs/requests.log'),
    log,
    (err) => {
      if (err) console.error('写入日志失败:', err);
    }
  );

  console.log(log);
  next();
};

module.exports = logger;
```

### middleware/rateLimit.middleware.js

```javascript
const rateLimit = new Map();

const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 分钟
const MAX_REQUESTS = 100;

const rateLimitMiddleware = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();

  if (!rateLimit.has(ip)) {
    rateLimit.set(ip, {
      count: 1,
      startTime: now
    });
    return next();
  }

  const record = rateLimit.get(ip);
  const elapsedTime = now - record.startTime;

  if (elapsedTime > RATE_LIMIT_WINDOW) {
    // 重置计数
    rateLimit.set(ip, {
      count: 1,
      startTime: now
    });
    return next();
  }

  record.count++;

  if (record.count > MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: '请求过于频繁，请稍后再试'
    });
  }

  next();
};

// 定期清理过期的记录
setInterval(() => {
  const now = Date.now();
  rateLimit.forEach((record, ip) => {
    if (now - record.startTime > RATE_LIMIT_WINDOW) {
      rateLimit.delete(ip);
    }
  });
}, RATE_LIMIT_WINDOW);

module.exports = rateLimitMiddleware;
```

---

## 最佳实践总结

### ✅ 推荐做法

1. **使用环境变量** - 敏感信息不要硬编码
2. **使用中间件** - 错误处理、日志、限流
3. **使用 async/await** - 避免回调地狱
4. **使用 try-catch** - 统一错误处理
5. **使用 JWT** - 无状态认证
6. **使用 bcrypt** - 密码加密
7. **使用 Mongoose 验证** - 数据验证

### ❌ 避免做法

1. 避免在代码中硬编码敏感信息
2. 避免不使用错误处理中间件
3. 避免直接暴露 MongoDB 错误信息
4. 避免不限制请求频率
5. 避免不验证用户输入

### 📦 推荐依赖

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^8.0.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "morgan": "^1.10.0",
    "express-rate-limit": "^7.1.0",
    "helmet": "^7.1.0",
    "express-validator": "^7.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0",
    "supertest": "^6.3.3"
  }
}
```
