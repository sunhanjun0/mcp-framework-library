# Flask 示例代码集合

## 1. 完整项目结构

```
flask-app/
├── app/
│   ├── __init__.py
│   ├── models.py
│   ├── routes.py
│   ├── forms.py
│   └── templates/
│       ├── base.html
│       ├── index.html
│       └── login.html
├── migrations/
├── tests/
├── .env
├── config.py
├── requirements.txt
└── wsgi.py
```

---

## 2. 基础应用 (app/__init__.py)

```python
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager
from flask_migrate import Migrate
from config import Config
import os

db = SQLAlchemy()
login_manager = LoginManager()
migrate = Migrate()

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # 初始化扩展
    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)

    # 注册蓝图
    from app.routes import main_bp
    app.register_blueprint(main_bp)

    # 登录配置
    login_manager.login_view = 'main.login'
    login_manager.login_message = '请先登录'

    return app

# 创建应用实例
app = create_app()

from app import models
```

---

## 3. 配置类 (config.py)

```python
import os
from dotenv import load_dotenv

basedir = os.path.abspath(os.path.dirname(__file__))
load_dotenv(os.path.join(basedir, '.env'))

class Config:
    # 安全配置
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-key-change-in-production'
    
    # 数据库配置
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
        'sqlite:///' + os.path.join(basedir, 'app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # 邮件配置
    MAIL_SERVER = os.environ.get('MAIL_SERVER')
    MAIL_PORT = int(os.environ.get('MAIL_PORT') or 25)
    MAIL_USE_TLS = os.environ.get('MAIL_USE_TLS') is not None
    MAIL_USERNAME = os.environ.get('MAIL_USERNAME')
    MAIL_PASSWORD = os.environ.get('MAIL_PASSWORD')
    
    # 分页配置
    POSTS_PER_PAGE = 10
    
    # 上传配置
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB
    UPLOAD_FOLDER = os.path.join(basedir, 'uploads')
```

---

## 4. 数据模型 (app/models.py)

```python
from app import db, login_manager
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    avatar = db.Column(db.String(256), default='default.jpg')
    bio = db.Column(db.Text, default='')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # 关系
    posts = db.relationship('Post', backref='author', lazy='dynamic')
    comments = db.relationship('Comment', backref='author', lazy='dynamic')
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def __repr__(self):
        return f'<User {self.username}>'

class Post(db.Model):
    __tablename__ = 'posts'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # 关系
    comments = db.relationship('Comment', backref='post', lazy='dynamic', cascade='all, delete-orphan')
    
    def __repr__(self):
        return f'<Post {self.title}>'

class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey('posts.id'), nullable=False)
    
    def __repr__(self):
        return f'<Comment {self.id}>'
```

---

## 5. 路由和视图 (app/routes.py)

```python
from flask import Blueprint, render_template, redirect, url_for, flash, request, abort
from flask_login import login_user, logout_user, login_required, current_user
from app import db
from app.models import User, Post, Comment
from app.forms import LoginForm, RegistrationForm, PostForm, CommentForm
from werkzeug.urls import url_parse

main_bp = Blueprint('main', __name__)

# 首页
@main_bp.route('/')
@main_bp.route('/index')
def index():
    page = request.args.get('page', 1, type=int)
    posts = Post.query.order_by(Post.created_at.desc()).paginate(
        page=page, per_page=10, error_out=False
    )
    return render_template('index.html', posts=posts)

# 用户注册
@main_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('注册成功！请登录', 'success')
        return redirect(url_for('main.login'))
    
    return render_template('register.html', form=form)

# 用户登录
@main_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))
    
    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('用户名或密码错误', 'error')
            return redirect(url_for('main.login'))
        
        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get('next')
        if not next_page or url_parse(next_page).netloc != '':
            next_page = url_for('main.index')
        return redirect(next_page)
    
    return render_template('login.html', form=form)

# 用户登出
@main_bp.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect(url_for('main.index'))

# 创建文章
@main_bp.route('/post/create', methods=['GET', 'POST'])
@login_required
def create_post():
    form = PostForm()
    if form.validate_on_submit():
        post = Post(title=form.title.data, content=form.content.data, author=current_user)
        db.session.add(post)
        db.session.commit()
        flash('文章创建成功！', 'success')
        return redirect(url_for('main.index'))
    return render_template('post_form.html', form=form, title='创建文章')

# 编辑文章
@main_bp.route('/post/<int:id>/edit', methods=['GET', 'POST'])
@login_required
def edit_post(id):
    post = Post.query.get_or_404(id)
    if post.author != current_user:
        abort(403)
    
    form = PostForm(obj=post)
    if form.validate_on_submit():
        post.title = form.title.data
        post.content = form.content.data
        db.session.commit()
        flash('文章更新成功！', 'success')
        return redirect(url_for('main.post_detail', id=post.id))
    
    return render_template('post_form.html', form=form, title='编辑文章')

# 删除文章
@main_bp.route('/post/<int:id>/delete', methods=['POST'])
@login_required
def delete_post(id):
    post = Post.query.get_or_404(id)
    if post.author != current_user:
        abort(403)
    
    db.session.delete(post)
    db.session.commit()
    flash('文章已删除', 'success')
    return redirect(url_for('main.index'))

# 文章详情
@main_bp.route('/post/<int:id>')
def post_detail(id):
    post = Post.query.get_or_404(id)
    form = CommentForm()
    return render_template('post_detail.html', post=post, form=form)

# 添加评论
@main_bp.route('/post/<int:id>/comment', methods=['POST'])
@login_required
def add_comment(id):
    post = Post.query.get_or_404(id)
    form = CommentForm()
    
    if form.validate_on_submit():
        comment = Comment(content=form.content.data, author=current_user, post=post)
        db.session.add(comment)
        db.session.commit()
        flash('评论成功！', 'success')
    
    return redirect(url_for('main.post_detail', id=id))

# 用户资料
@main_bp.route('/user/<username>')
def user_profile(username):
    user = User.query.filter_by(username=username).first_or_404()
    page = request.args.get('page', 1, type=int)
    posts = user.posts.order_by(Post.created_at.desc()).paginate(
        page=page, per_page=10, error_out=False
    )
    return render_template('user_profile.html', user=user, posts=posts)
```

---

## 6. Flask-WTF 表单 (app/forms.py)

```python
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, BooleanField, SubmitField, TextAreaField
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError
from app.models import User

class LoginForm(FlaskForm):
    username = StringField('用户名', validators=[DataRequired()])
    password = PasswordField('密码', validators=[DataRequired()])
    remember_me = BooleanField('记住我')
    submit = SubmitField('登录')

class RegistrationForm(FlaskForm):
    username = StringField('用户名', validators=[DataRequired(), Length(min=3, max=64)])
    email = StringField('邮箱', validators=[DataRequired(), Email()])
    password = PasswordField('密码', validators=[DataRequired(), Length(min=6)])
    password2 = PasswordField('确认密码', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('注册')
    
    def validate_username(self, field):
        if User.query.filter_by(username=field.data).first():
            raise ValidationError('用户名已被使用')
    
    def validate_email(self, field):
        if User.query.filter_by(email=field.data).first():
            raise ValidationError('邮箱已被注册')

class PostForm(FlaskForm):
    title = StringField('标题', validators=[DataRequired(), Length(max=200)])
    content = TextAreaField('内容', validators=[DataRequired()])
    submit = SubmitField('提交')

class CommentForm(FlaskForm):
    content = TextAreaField('评论', validators=[DataRequired()])
    submit = SubmitField('提交评论')

class UpdateProfileForm(FlaskForm):
    username = StringField('用户名', validators=[DataRequired(), Length(min=3, max=64)])
    email = StringField('邮箱', validators=[DataRequired(), Email()])
    bio = TextAreaField('简介', validators=[Length(max=500)])
    submit = SubmitField('更新')
    
    def validate_username(self, field):
        if field.data != current_user.username:
            if User.query.filter_by(username=field.data).first():
                raise ValidationError('用户名已被使用')
    
    def validate_email(self, field):
        if field.data != current_user.email:
            if User.query.filter_by(email=field.data).first():
                raise ValidationError('邮箱已被注册')
```

---

## 7. 模板示例 (templates/base.html)

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{% block title %}Flask App{% endblock %}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
</head>
<body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
        <div class="container">
            <a class="navbar-brand" href="{{ url_for('main.index') }}">Flask App</a>
            <div class="navbar-nav">
                {% if current_user.is_authenticated %}
                    <a class="nav-link" href="{{ url_for('main.create_post') }}">写文章</a>
                    <a class="nav-link" href="{{ url_for('main.user_profile', username=current_user.username) }}">个人资料</a>
                    <a class="nav-link" href="{{ url_for('main.logout') }}">登出</a>
                {% else %}
                    <a class="nav-link" href="{{ url_for('main.login') }}">登录</a>
                    <a class="nav-link" href="{{ url_for('main.register') }}">注册</a>
                {% endif %}
            </div>
        </div>
    </nav>

    <main class="container mt-4">
        {% with messages = get_flashed_messages(with_categories=true) %}
            {% if messages %}
                {% for category, message in messages %}
                    <div class="alert alert-{{ 'danger' if category == 'error' else category }} alert-dismissible fade show">
                        {{ message }}
                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                    </div>
                {% endfor %}
            {% endif %}
        {% endwith %}

        {% block content %}{% endblock %}
    </main>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

---

## 8. RESTful API (使用 Flask-RESTful)

```python
from flask import Blueprint, request, jsonify
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from app import db
from app.models import User, Post
from werkzeug.security import check_password_hash, generate_password_hash

api_bp = Blueprint('api', __name__, url_prefix='/api')

# JWT 配置
api_bp.config['JWT_SECRET_KEY'] = 'your-secret-key'
jwt = JWTManager()

@api_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if User.query.filter_by(username=data['username']).first():
        return jsonify({'error': '用户名已存在'}), 400
    
    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': '注册成功'}), 201

@api_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(username=data['username']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': '用户名或密码错误'}), 401
    
    access_token = create_access_token(identity=user.id)
    return jsonify({'access_token': access_token}), 200

@api_bp.route('/posts', methods=['GET'])
def get_posts():
    posts = Post.query.order_by(Post.created_at.desc()).all()
    return jsonify([{
        'id': p.id,
        'title': p.title,
        'content': p.content,
        'author': p.author.username,
        'created_at': p.created_at.isoformat()
    } for p in posts]), 200

@api_bp.route('/posts', methods=['POST'])
@jwt_required()
def create_post():
    data = request.get_json()
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    post = Post(title=data['title'], content=data['content'], author=user)
    db.session.add(post)
    db.session.commit()
    
    return jsonify({
        'id': post.id,
        'title': post.title,
        'message': '文章创建成功'
    }), 201

@api_bp.route('/posts/<int:id>', methods=['GET'])
def get_post(id):
    post = Post.query.get_or_404(id)
    return jsonify({
        'id': post.id,
        'title': post.title,
        'content': post.content,
        'author': post.author.username,
        'comments': [{
            'id': c.id,
            'content': c.content,
            'author': c.author.username,
            'created_at': c.created_at.isoformat()
        } for c in post.comments]
    }), 200
```

---

## 9. 启动脚本 (wsgi.py)

```python
from app import app, db
from app.models import User, Post, Comment

@app.shell_context_processor
def make_shell_context():
    return {'db': db, 'User': User, 'Post': Post, 'Comment': Comment}

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
```

---

## 10. 依赖文件 (requirements.txt)

```txt
Flask==3.0.0
Flask-SQLAlchemy==3.1.1
Flask-Login==0.6.3
Flask-WTF==1.2.1
Flask-Migrate==4.0.5
Flask-JWT-Extended==4.6.0
python-dotenv==1.0.0
Werkzeug==3.0.1
email-validator==2.1.0
gunicorn==21.2.0
```

---

## 最佳实践总结

### ✅ 推荐做法

1. **使用应用工厂** - 便于测试和扩展
2. **使用蓝图** - 组织大型应用
3. **使用 Flask-SQLAlchemy** - ORM 管理数据库
4. **使用 Flask-Migrate** - 数据库迁移
5. **使用 Flask-Login** - 用户认证
6. **使用 Flask-WTF** - 表单处理和验证
7. **使用环境变量** - 管理配置

### ❌ 避免做法

1. 避免在视图中直接写 SQL
2. 避免硬编码配置
3. 避免忽略表单 CSRF 保护
4. 避免在生产环境使用 debug=True

### 📦 推荐扩展

- Flask-SQLAlchemy - 数据库 ORM
- Flask-Migrate - 数据库迁移
- Flask-Login - 用户认证
- Flask-WTF - 表单处理
- Flask-JWT-Extended - JWT 认证
- Flask-Mail - 邮件发送
- Flask-Caching - 缓存
