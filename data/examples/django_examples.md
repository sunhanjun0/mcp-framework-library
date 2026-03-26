# Django 示例代码集合

## 1. 用户认证完整示例

### models.py

```python
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    """自定义用户模型"""
    phone = models.CharField('手机号', max_length=11, unique=True, blank=True)
    avatar = models.ImageField('头像', upload_to='avatars/', blank=True)
    bio = models.TextField('简介', blank=True)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)

    class Meta:
        verbose_name = '用户'
        verbose_name_plural = verbose_name
        ordering = ['-date_joined']

    def __str__(self):
        return self.username
```

### forms.py

```python
from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from .models import CustomUser

class CustomUserCreationForm(UserCreationForm):
    """用户注册表单"""
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': '邮箱'
        })
    )

    class Meta:
        model = CustomUser
        fields = ('username', 'email', 'password1', 'password2')
        widgets = {
            'username': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '用户名'
            }),
        }

    def clean_email(self):
        email = self.cleaned_data.get('email')
        if CustomUser.objects.filter(email=email).exists():
            raise forms.ValidationError('该邮箱已被注册')
        return email

class CustomAuthenticationForm(AuthenticationForm):
    """用户登录表单"""
    username = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': '用户名'
        })
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': '密码'
        })
    )
```

### views.py

```python
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.views.generic import CreateView, UpdateView
from django.urls import reverse_lazy
from .forms import CustomUserCreationForm, CustomAuthenticationForm
from .models import CustomUser

def register_view(request):
    """用户注册"""
    if request.user.is_authenticated:
        return redirect('home')
    
    if request.method == 'POST':
        form = CustomUserCreationForm(request.POST)
        if form.is_valid():
            user = form.save()
            login(request, user)
            messages.success(request, '注册成功！')
            return redirect('home')
    else:
        form = CustomUserCreationForm()
    
    return render(request, 'accounts/register.html', {'form': form})

def login_view(request):
    """用户登录"""
    if request.user.is_authenticated:
        return redirect('home')
    
    if request.method == 'POST':
        form = CustomAuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                messages.success(request, f'欢迎回来，{user.username}！')
                next_url = request.GET.get('next', 'home')
                return redirect(next_url)
    else:
        form = CustomAuthenticationForm()
    
    return render(request, 'accounts/login.html', {'form': form})

@login_required
def logout_view(request):
    """用户登出"""
    logout(request)
    messages.info(request, '您已退出登录')
    return redirect('login')

@login_required
def profile_view(request):
    """用户资料"""
    return render(request, 'accounts/profile.html', {'user': request.user})

@login_required
def profile_update_view(request):
    """更新资料"""
    if request.method == 'POST':
        user = request.user
        user.email = request.POST.get('email', user.email)
        user.phone = request.POST.get('phone', user.phone)
        user.bio = request.POST.get('bio', user.bio)
        
        if request.FILES.get('avatar'):
            user.avatar = request.FILES.get('avatar')
        
        user.save()
        messages.success(request, '资料更新成功！')
        return redirect('profile')
    
    return render(request, 'accounts/profile_update.html', {'user': request.user})

@login_required
def password_change_view(request):
    """修改密码"""
    if request.method == 'POST':
        user = request.user
        old_password = request.POST.get('old_password')
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')
        
        if not user.check_password(old_password):
            messages.error(request, '原密码错误')
            return redirect('password_change')
        
        if new_password != confirm_password:
            messages.error(request, '两次密码输入不一致')
            return redirect('password_change')
        
        if len(new_password) < 6:
            messages.error(request, '密码至少 6 个字符')
            return redirect('password_change')
        
        user.set_password(new_password)
        user.save()
        messages.success(request, '密码修改成功，请重新登录')
        return redirect('login')
    
    return render(request, 'accounts/password_change.html')
```

### urls.py

```python
from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('register/', views.register_view, name='register'),
    path('login/', views.login_view, name='login'),
    path('logout/', views.logout_view, name='logout'),
    path('profile/', views.profile_view, name='profile'),
    path('profile/update/', views.profile_update_view, name='profile_update'),
    path('password/change/', views.password_change_view, name='password_change'),
]
```

### templates/accounts/register.html

```html
{% extends 'base.html' %}

{% block title %}注册{% endblock %}

{% block content %}
<div class="register-container">
  <h2>用户注册</h2>
  
  <form method="post">
    {% csrf_token %}
    
    {% for field in form %}
    <div class="form-group">
      <label for="{{ field.id_for_label }}">{{ field.label }}</label>
      {{ field }}
      {% if field.errors %}
        <div class="error">{{ field.errors.0 }}</div>
      {% endif %}
    </div>
    {% endfor %}
    
    <button type="submit" class="btn btn-primary">注册</button>
  </form>
  
  <p class="mt-3">
    已有账号？<a href="{% url 'accounts:login' %}">立即登录</a>
  </p>
</div>
{% endblock %}
```

---

## 2. CRUD 操作示例

### models.py

```python
from django.db import models
from django.contrib.auth import get_user_model
from django.utils.text import slugify

User = get_user_model()

class Category(models.Model):
    """文章分类"""
    name = models.CharField('分类名', max_length=100)
    slug = models.SlugField('Slug', unique=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = '分类'
        verbose_name_plural = verbose_name
        ordering = ['name']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

class Post(models.Model):
    """文章"""
    STATUS_CHOICES = (
        ('draft', '草稿'),
        ('published', '已发布'),
    )
    
    title = models.CharField('标题', max_length=200)
    slug = models.SlugField('Slug', unique_for_date='publish', blank=True)
    author = models.ForeignKey(
        User, 
        on_delete=models.CASCADE, 
        related_name='blog_posts',
        verbose_name='作者'
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posts',
        verbose_name='分类'
    )
    body = models.TextField('正文')
    status = models.CharField(
        '状态',
        max_length=10,
        choices=STATUS_CHOICES,
        default='draft'
    )
    views = models.PositiveIntegerField('浏览量', default=0)
    created_at = models.DateTimeField('创建时间', auto_now_add=True)
    updated_at = models.DateTimeField('更新时间', auto_now=True)
    publish = models.DateTimeField('发布时间', auto_now_add=True)

    class Meta:
        verbose_name = '文章'
        verbose_name_plural = verbose_name
        ordering = ['-publish']
        indexes = [
            models.Index(fields=['-publish']),
            models.Index(fields=['status', '-publish']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Comment(models.Model):
    """评论"""
    post = models.ForeignKey(
        Post,
        on_delete=models.CASCADE,
        related_name='comments',
        verbose_name='文章'
    )
    name = models.CharField('昵称', max_length=80)
    email = models.EmailField('邮箱')
    body = models.TextField('评论内容')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    active = models.BooleanField(default=True)

    class Meta:
        verbose_name = '评论'
        verbose_name_plural = verbose_name
        ordering = ['created_at']

    def __str__(self):
        return f'Comment by {self.name} on {self.post}'
```

### views.py (函数视图)

```python
from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from .models import Post, Comment
from .forms import PostForm, CommentForm

def post_list(request):
    """文章列表"""
    posts = Post.objects.filter(status='published')
    
    # 分类过滤
    category_slug = request.GET.get('category')
    if category_slug:
        posts = posts.filter(category__slug=category_slug)
    
    # 搜索
    search = request.GET.get('search')
    if search:
        posts = posts.filter(title__icontains=search)
    
    # 分页
    paginator = Paginator(posts, 10)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)
    
    context = {
        'page_obj': page_obj,
        'search': search,
    }
    return render(request, 'blog/post_list.html', context)

def post_detail(request, year, month, day, post):
    """文章详情"""
    post = get_object_or_404(
        Post,
        slug=post,
        status='published',
        publish__year=year,
        publish__month=month,
        publish__day=day
    )
    
    # 增加浏览量
    post.views += 1
    post.save(update_fields=['views'])
    
    # 获取评论
    comments = post.comments.filter(active=True)
    
    # 提交评论
    if request.method == 'POST':
        form = CommentForm(request.POST)
        if form.is_valid():
            comment = form.save(commit=False)
            comment.post = post
            comment.save()
            messages.success(request, '评论提交成功，待审核后显示')
            return redirect(post.get_absolute_url())
    else:
        form = CommentForm()
    
    context = {
        'post': post,
        'comments': comments,
        'form': form,
    }
    return render(request, 'blog/post_detail.html', context)

@login_required
def post_create(request):
    """创建文章"""
    if request.method == 'POST':
        form = PostForm(request.POST)
        if form.is_valid():
            post = form.save(commit=False)
            post.author = request.user
            post.save()
            messages.success(request, '文章创建成功！')
            return redirect('blog:post_detail', 
                          post.publish.year,
                          post.publish.month,
                          post.publish.day,
                          post.slug)
    else:
        form = PostForm()
    
    return render(request, 'blog/post_form.html', {'form': form})

@login_required
def post_update(request, pk):
    """更新文章"""
    post = get_object_or_404(Post, pk=pk, author=request.user)
    
    if request.method == 'POST':
        form = PostForm(request.POST, instance=post)
        if form.is_valid():
            form.save()
            messages.success(request, '文章更新成功！')
            return redirect('blog:post_detail',
                          post.publish.year,
                          post.publish.month,
                          post.publish.day,
                          post.slug)
    else:
        form = PostForm(instance=post)
    
    return render(request, 'blog/post_form.html', {'form': form})

@login_required
def post_delete(request, pk):
    """删除文章"""
    post = get_object_or_404(Post, pk=pk, author=request.user)
    
    if request.method == 'POST':
        post.delete()
        messages.success(request, '文章已删除')
        return redirect('blog:post_list')
    
    return render(request, 'blog/post_confirm_delete.html', {'post': post})
```

### views.py (类视图)

```python
from django.views.generic import ListView, DetailView, CreateView, UpdateView, DeleteView
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin
from django.urls import reverse_lazy
from .models import Post

class PostListView(ListView):
    """文章列表视图"""
    model = Post
    template_name = 'blog/post_list.html'
    context_object_name = 'posts'
    paginate_by = 10
    
    def get_queryset(self):
        return Post.objects.filter(status='published')

class PostDetailView(DetailView):
    """文章详情视图"""
    model = Post
    template_name = 'blog/post_detail.html'
    context_object_name = 'post'
    
    def get_object(self):
        return get_object_or_404(
            Post,
            slug=self.kwargs['post'],
            status='published',
            publish__year=self.kwargs['year'],
            publish__month=self.kwargs['month'],
            publish__day=self.kwargs['day']
        )

class PostCreateView(LoginRequiredMixin, CreateView):
    """创建文章视图"""
    model = Post
    form_class = PostForm
    template_name = 'blog/post_form.html'
    
    def form_valid(self, form):
        form.instance.author = self.request.user
        return super().form_valid(form)

class PostUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    """更新文章视图"""
    model = Post
    form_class = PostForm
    template_name = 'blog/post_form.html'
    
    def test_func(self):
        post = self.get_object()
        return self.request.user == post.author

class PostDeleteView(LoginRequiredMixin, UserPassesTestMixin, DeleteView):
    """删除文章视图"""
    model = Post
    template_name = 'blog/post_confirm_delete.html'
    success_url = reverse_lazy('blog:post_list')
    
    def test_func(self):
        post = self.get_object()
        return self.request.user == post.author
```

### forms.py

```python
from django import forms
from .models import Post, Comment

class PostForm(forms.ModelForm):
    """文章表单"""
    class Meta:
        model = Post
        fields = ['title', 'category', 'body', 'status']
        widgets = {
            'title': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '文章标题'
            }),
            'category': forms.Select(attrs={
                'class': 'form-control'
            }),
            'body': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 10,
                'placeholder': '文章内容'
            }),
            'status': forms.Select(attrs={
                'class': 'form-control'
            }),
        }

class CommentForm(forms.ModelForm):
    """评论表单"""
    class Meta:
        model = Comment
        fields = ['name', 'email', 'body']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '昵称'
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': '邮箱'
            }),
            'body': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': '评论内容'
            }),
        }
```

---

## 3. Django REST Framework 示例

### serializers.py

```python
from rest_framework import serializers
from .models import Post, Comment, Category

class CategorySerializer(serializers.ModelSerializer):
    """分类序列化器"""
    post_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'post_count']
        read_only_fields = ['slug']
    
    def get_post_count(self, obj):
        return obj.posts.filter(status='published').count()

class CommentSerializer(serializers.ModelSerializer):
    """评论序列化器"""
    class Meta:
        model = Comment
        fields = ['id', 'name', 'email', 'body', 'created_at']
        read_only_fields = ['created_at']

class PostSerializer(serializers.ModelSerializer):
    """文章序列化器"""
    author = serializers.StringRelatedField(read_only=True)
    category = CategorySerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    category_id = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        source='category',
        write_only=True
    )
    
    class Meta:
        model = Post
        fields = [
            'id', 'title', 'slug', 'author', 'category', 'category_id',
            'body', 'status', 'views', 'comments', 'created_at', 'updated_at', 'publish'
        ]
        read_only_fields = ['slug', 'author', 'views', 'created_at', 'updated_at']

class PostListSerializer(serializers.ModelSerializer):
    """文章列表序列化器（简化版）"""
    author = serializers.StringRelatedField(read_only=True)
    category = serializers.StringRelatedField(read_only=True)
    
    class Meta:
        model = Post
        fields = ['id', 'title', 'slug', 'author', 'category', 'views', 'publish']
```

### views.py (API Views)

```python
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from .models import Post, Comment
from .serializers import PostSerializer, PostListSerializer, CommentSerializer

class IsAuthorOrReadOnly(permissions.BasePermission):
    """自定义权限：作者可编辑，其他人只读"""
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.author == request.user

class PostViewSet(viewsets.ModelViewSet):
    """文章 API 视图集"""
    queryset = Post.objects.select_related('author', 'category').all()
    permission_classes = [permissions.IsAuthenticatedOrReadOnly, IsAuthorOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'category']
    search_fields = ['title', 'body']
    ordering_fields = ['publish', 'views', 'created_at']
    ordering = ['-publish']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return PostListSerializer
        return PostSerializer
    
    def perform_create(self, serializer):
        serializer.save(author=self.request.user)

class CommentViewSet(viewsets.ModelViewSet):
    """评论 API 视图集"""
    queryset = Comment.objects.select_related('post').filter(active=True)
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]
    
    def perform_create(self, serializer):
        serializer.save(active=False)  # 评论需要审核
```

### urls.py (API)

```python
from rest_framework.routers import DefaultRouter
from .views import PostViewSet, CommentViewSet

router = DefaultRouter()
router.register(r'posts', PostViewSet, basename='post')
router.register(r'comments', CommentViewSet, basename='comment')

urlpatterns = router.urls
```

---

## 最佳实践总结

### ✅ 推荐做法

1. **使用自定义用户模型** - 项目初期就设置 AUTH_USER_MODEL
2. **使用类视图** - 代码复用性更好
3. **使用 Django REST Framework** - 快速构建 API
4. **使用 django-filter** - 强大的过滤功能
5. **使用 select_related/prefetch_related** - 优化查询
6. **使用 F() 表达式** - 原子操作

### ❌ 避免做法

1. 避免 N+1 查询问题
2. 避免在视图中直接处理表单（用 Form/ModelForm）
3. 避免硬编码 URL（用 reverse 和 get_absolute_url）
4. 避免忽略事务（用 transaction.atomic）

### 📦 推荐依赖

```txt
Django>=5.0
djangorestframework>=3.14
django-filter>=23.5
Pillow>=10.0  # 图片处理
celery>=5.3   # 异步任务
redis>=5.0    # 缓存
```
