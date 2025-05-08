import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

MEDIA_ROOT = '/home/admin/bookstore/uploads'  # 固定绝对路径
MEDIA_URL = '/media/'  # 显式声明媒体URL
FILE_UPLOAD_PERMISSIONS = 0o644  # 确保文件可读
SECRET_KEY = 'django-insecure-your-secret-key-here'  # 生产环境应替换为强随机字符串

DEBUG = True
ALLOWED_HOSTS = ['8.134.250.169', 'localhost']  # 限制为服务器IP
CSRF_TRUSTED_ORIGINS = [
    "http://8.134.250.169",       # 前端通过80端口访问
    "http://localhost:5173",
    "http://183.63.97.177:5173"
]
# CSRF_TRUSTED_ORIGINS = [
#     "http://localhost:5173",
#     "http://183.63.97.177:5173",
#     "http://8.134.250.169:8000"
# ]
# -------------------------------- MongoDB 配置 --------------------------------
MONGODB_CONFIG = {
    'HOST': '8.134.250.169',        #  MongoDB 服务器 IP
    'PORT': 27017,                  # MongoDB 默认端口
    'USER': 'amon',                 #  MongoDB 用户名
    'PASSWORD': os.environ.get('MONGODB_PASSWORD', r'1WwehYktXk6Tb1Pkz7Ci4Y'),  # 优先从环境变量读取
    'AUTH_SOURCE': 'admin',          # 认证数据库（用户创建时所在的数据库）
    'AUTH_MECHANISM': 'SCRAM-SHA-256' # MongoDB 4.0+ 认证协议
}

# -------------------------------- Neo4j 配置 --------------------------------
NEO4J_CONFIG = {
    'URI': 'bolt://8.134.250.169:7687',  # Neo4j 服务器地址
    'USER': 'neo4j',                     # 管理员账号（社区版只能使用此账号）
    'PASSWORD': os.environ.get('NEO4J_PASSWORD', 'Z6uKm7Gv5Ce2Yvh2Kq9Gc9'),  # 从环境变量读取
    'ENCRYPTED': False                   # 本地测试可关闭加密，生产环境应设为 True
}

INSTALLED_APPS = [
    'corsheaders',
    'django.contrib.staticfiles',
    'core',
    'django_extensions',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
]
CORS_ALLOW_ALL_ORIGINS = True
CORS_EXPOSE_HEADERS = ['Content-Length', 'Content-Range'] # 暴露必要头信息
CORS_ALLOW_HEADERS = [
    'content-type',
    'authorization',
    'x-csrftoken'
]

SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = False  
ROOT_URLCONF = 'backendprj.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
    },
]

WSGI_APPLICATION = 'backendprj.wsgi.application'

STATIC_URL = '/static/'
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'