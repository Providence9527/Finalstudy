# core/views/book_views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from core.utils.mongo_conn import MongoDBClient
from bson import ObjectId
from bson.errors import InvalidId
import os
import logging
from backendprj.settings import MEDIA_ROOT, MEDIA_URL

logger = logging.getLogger(__name__)


 
@csrf_exempt
def bookshelf_operation(request, user_id):
    """用户书架操作接口"""
    try:
        mongo = MongoDBClient.get_instance()
        users_col = mongo.get_collection('users')
        materials_col = mongo.get_collection('materials')

        if request.method == 'POST':
            data = request.POST if request.POST else request.data
            material_id = data.get('material_id')

            # 验证书籍ID格式
            try:
                material_oid = ObjectId(material_id)
            except:
                return JsonResponse({'error': '无效的书籍ID格式'}, status=400)

            # 验证书籍存在性
            if not materials_col.find_one({'_id': material_oid}):
                return JsonResponse({'error': '教材不存在'}, status=404)

            # 更新用户书架
            result = users_col.update_one(
                {'_id': user_id},
                {'$addToSet': {'bookshelf.default_folder': material_oid}},
                upsert=True
            )

            if result.modified_count == 0:
                return JsonResponse({'warning': '书籍已在书架中'}, status=200)

            return JsonResponse(
                {'status': 'success', 'folder': 'default_folder'},
                status=201
            )

    except Exception as e:
        logger.error(f"书架操作失败: {str(e)}", exc_info=True)
        return JsonResponse({'error': '服务器内部错误'}, status=500)


@csrf_exempt
def get_book_content(request, book_id):
    """获取书籍文件内容"""
    try:
        mongo = MongoDBClient.get_instance()
        materials_col = mongo.get_collection('materials')
        
        # 严格验证书籍ID格式
        try:
            obj_id = ObjectId(book_id)
        except InvalidId:
            logger.error(f"无效的书籍ID格式: {book_id}")
            return JsonResponse({'error': '无效的书籍ID格式'}, status=400)

        # 精确查询必要字段
        book = materials_col.find_one(
            {'_id': obj_id},
            {'file_info': 1, 'book_title': 1, '_id':1, 'author':1}
        )
        
        if not book or not book.get('file_info'):
            logger.warning(f"书籍不存在或无可读内容 ID: {book_id}")
            return JsonResponse({'error': '书籍不存在或无可读内容'}, status=404)

        file_info = book['file_info']
        supported_formats = ['epub', 'pdf', 'txt']
        
        # 安全遍历可用格式
        sanitized_path = None  # 显式初始化
        for fmt in supported_formats:
            if file_info.get(fmt):
                
                # 安全处理文件路径
                raw_path = file_info[fmt]
                #print("原始数据:",raw_path)
                clean_path = raw_path.replace('home/admin/bookstore/', '') \
                                     .replace('uploads/', '') \
                                     .replace('../', '') \
                                     .lstrip('/')

                file_path = os.path.join(MEDIA_ROOT, clean_path)

                # 严格验证文件存在性
                if not os.path.isfile(file_path):
                    logger.warning(f"文件不存在: {file_path}")
                    continue
                    
                # 返回完整元数据
                
                return JsonResponse({
                     '_id': str(book['_id']),
                     'type': fmt,
                     'url': f"{MEDIA_URL}{clean_path}",
                     'meta': {
                         'title': book.get('book_title', '未知书籍'),
                         'author':book.get('author','未知作者'),
                         'fileSize': os.path.getsize(file_path),
                         'fmt': fmt,
                     }
                 }, json_dumps_params={'ensure_ascii': False})

        return JsonResponse(
             {'error': '无可用的阅读格式'}, 
             status=415,
             json_dumps_params={'ensure_ascii': False}  # 确保返回中文
         )
        
    except Exception as e:
        logger.error(f"内容获取失败: {str(e)}", exc_info=True)
        return JsonResponse({'error': '服务器内部错误'}, status=500)