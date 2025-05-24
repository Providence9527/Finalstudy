# core/urls.py
from django.urls import path
from core.views import (  # 使用绝对路径导入
    user_views,
    learning_views,
    material_views,
    conversation_views,
    book_views,
    shelf_views,
    current_views,
    mode_views 
    
)



urlpatterns = [
    # 认证接口
    path('auth/register/', user_views.register_view, name='register'),
    path('auth/login/', user_views.login_view, name='login'),
    path('users/mongo/', user_views.mongo_users, name='mongo_users'),
    path('users/neo4j/', user_views.neo4j_users, name='neo4j_users'),

    # 学习数据接口
    path('users/<str:user_id>/stats/', learning_views.user_stats, name='user-stats'),
    path('users/<str:user_id>/progress/', learning_views.ongoing_courses, name='ongoing-courses'),
    path('users/<str:user_id>/recommendations/', learning_views.recommend_courses, name='recommend-courses'),
    path(
        'users/<str:user_id>/learning-time/',
        learning_views.track_learning_time,
        name='learning-time-tracking'
    ),
    path('users/<str:user_id>/report/', learning_views.user_report, name='user_report'),

    # 人机对话接口
        # 对话列表
    path(
        'users/<str:user_id>/conversations/',
        conversation_views.conversation_list,
        name='conversation-list'
    ),
    
        # 对话详情操作
    path(
        'users/<str:user_id>/conversations/<str:conversation_id>/',
        conversation_views.conversation_detail,
        name='conversation-detail'
    ),
    
         # 消息操作
    path(
        'users/<str:user_id>/conversations/<str:conversation_id>/messages/',
        conversation_views.conversation_messages,
        name='conversation-messages'
    ),

    path(
    'users/<str:user_id>/conversations/<str:conversation_id>/',
    conversation_views.conversation_detail,
    name='conversation-detail'
    ),

    # 教材搜索接口
    path('materials/filter-options/', 
         material_views.material_filter_options, 
         name='material-filter-options'),
    path('materials/', 
         material_views.material_list, 
         name='material-list'),
    path(
        'users/progress/save',
        material_views.save_reading_progress,
        name='save-reading-progress'
    ),


    # 书架操作接口
    path(
        'users/<str:user_id>/bookshelf/', 
        book_views.bookshelf_operation,
        name='user-bookshelf'
    ),
    
    # 书籍内容接口
    path('books/<str:book_id>/content/',  
        book_views.get_book_content,
        name='book-content'),
    
    # 书架操作接口
    path('users/<str:user_id>/shelf/', shelf_views.user_shelf_operation, name='user-shelf'),

    path('users/<str:user_id>/shelf/<str:folder_name>/', shelf_views.user_shelf_operation, name='shelf-folder'),

    path('users/<str:user_id>/shelf/<str:folder_name>/materials/', 
     shelf_views.get_folder_materials, 
     name='folder-materials'),
    
    path('users/<str:user_id>/book/<str:folder_name>/',
     shelf_views.remove_book_from_folder,
     name='remove-book-from-folder'),
    
    path('users/<str:user_id>/shelf/<str:folder_name>/', 
     shelf_views.user_shelf_operation, 
     name='shelf-folder'),

    #获取最近浏览接口
    path(
    'users/<str:user_id>/progress/last-viewed/',
    shelf_views.get_last_viewed,
    name='last-viewed'),

    path(
        'current/markdown/',
        current_views.get_current_markdown,
        name='current-markdown'
    ),
    
    # 笔记模式接口
    path('users/<str:user_id>/notes/', mode_views.notes_operation, name='user-notes'),
    path('users/<str:user_id>/notes/<str:note_id>/', mode_views.note_detail, name='note-detail'),
    path('users/<str:user_id>/notes/<str:note_id>/content/', mode_views.update_note_content, name='update-note-content'),
    
]