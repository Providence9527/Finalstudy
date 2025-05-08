from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from urllib.parse import unquote
from bson import ObjectId, errors
from core.utils.mongo_conn import MongoDBClient
import json

@csrf_exempt
def user_shelf_operation(request, user_id, folder_name=None):
    mongo = MongoDBClient.get_instance()
    shelf_collection = mongo.get_collection('shelf')
    
    try:
        user_oid = ObjectId(user_id)
    except errors.InvalidId:
        return JsonResponse({"error": "用户ID格式错误"}, status=400)

    def initialize_shelf():
        """原子化初始化书架结构"""
        return shelf_collection.update_one(
            {"_id": user_oid},
            {"$setOnInsert": {"folders": {"我喜欢的书籍": []}}},
            upsert=True
        )

    if request.method == 'GET':
        try:
            initialize_shelf()
            shelf_data = shelf_collection.find_one(
                {"_id": user_oid},
                {"folders": 1}
            )
            folders = list(shelf_data.get("folders", {"我喜欢的书籍": []}).keys())
            return JsonResponse({"data": {"folders": folders}})
        
        except Exception as e:
            return JsonResponse({"error": f"数据查询失败: {str(e)}"}, status=500)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            folder_name = data['folder_name'].strip()
            book_oid = ObjectId(data['book_id'])
        except (KeyError, json.JSONDecodeError):
            return JsonResponse({"error": "缺少必要参数"}, status=400)
        except errors.InvalidId:
            return JsonResponse({"error": "书籍ID格式错误"}, status=400)

        try:
            # 第一步：强制初始化文档
            initialize_result = initialize_shelf()
            
            # 第二步：安全创建文件夹（带存在性检查）
            update_result = shelf_collection.update_one(
                {
                    "_id": user_oid,
                    f"folders.{folder_name}": {"$exists": False}
                },
                {
                    "$set": {f"folders.{folder_name}": [book_oid]}
                }
            )
            
            if update_result.modified_count == 0:
                return JsonResponse({"error": "文件夹已存在"}, status=409)
            return JsonResponse({"message": "文件夹创建成功"})
            
        except Exception as e:
            return JsonResponse({"error": f"数据库操作失败: {str(e)}"}, status=500)

    elif request.method == 'PUT' and folder_name:
        try:
            folder_name = unquote(folder_name).strip()
            data = json.loads(request.body) if request.body else {}
            book_id = data.get('book_id')

            # 处理空book_id的情况
            if not book_id:
                # 原子操作：初始化空文件夹
                result = shelf_collection.update_one(
                    {"_id": user_oid},
                    {
                        "$setOnInsert": {f"folders.{folder_name}": []},
                        "$currentDate": {"lastModified": True}
                    },
                    upsert=True
                )
                if result.upserted_id:
                    return JsonResponse({"message": "空文件夹创建成功"}, status=201)
                return JsonResponse({"message": "文件夹已存在"}, status=200)

            # 处理有效book_id的情况
            try:
                book_oid = ObjectId(book_id)
            except errors.InvalidId:
                return JsonResponse({"error": "书籍ID格式错误"}, status=400)

            # 分两步保证原子操作
            try:
                # 1. 确保文件夹存在
                shelf_collection.update_one(
                    {"_id": user_oid},
                    {
                        "$setOnInsert": {f"folders.{folder_name}": []},
                        "$currentDate": {"lastModified": True}
                    },
                    upsert=True
                )
                # 2. 添加书籍到文件夹
                update_result = shelf_collection.update_one(
                    {"_id": user_oid},
                    {
                        "$addToSet": {f"folders.{folder_name}": book_oid},
                        "$currentDate": {"lastModified": True}
                    }
                )
                
                if update_result.modified_count == 0:
                    return JsonResponse({"warning": "书籍已存在"}, status=200)
                return JsonResponse({"message": "添加成功"})
                
            except Exception as e:
                return JsonResponse({"error": f"数据库操作失败: {str(e)}"}, status=500)

        except (KeyError, json.JSONDecodeError):
            return JsonResponse({"error": "请求参数错误"}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"服务器错误: {str(e)}"}, status=500)

    
    
    elif request.method == 'DELETE' and folder_name:
        try:
            
            folder_name = unquote(folder_name).strip()
            print("删除  ",folder_name)
            # 校验默认文件夹
            if folder_name == "我喜欢的书籍":
                return JsonResponse(
                    {"error": "默认文件夹不可删除"}, 
                    status=403
                )

            # 执行删除操作
            result = shelf_collection.update_one(
                {"_id": user_oid},
                {
                    "$unset": {f"folders.{folder_name}": ""},
                    "$currentDate": {"lastModified": True}
                }
            )

            if result.modified_count == 0:
                return JsonResponse(
                    {"error": "文件夹不存在或删除失败"}, 
                    status=404
                )

            return JsonResponse(
                {"message": f"文件夹「{folder_name}」已删除"}, 
                status=200
            )

        except Exception as e:
            return JsonResponse(
                {"error": f"删除操作失败: {str(e)}"}, 
                status=500
            )
    return JsonResponse({"error": "方法不允许"}, status=405)


@csrf_exempt
def get_folder_materials(request, user_id, folder_name):
    """获取指定文件夹的教材列表"""
    mongo = MongoDBClient.get_instance()
    shelf_collection = mongo.get_collection('shelf')
    materials_collection = mongo.get_collection('materials')

    try:
        user_oid = ObjectId(user_id)
    except errors.InvalidId:
        return JsonResponse({"error": "用户ID格式错误"}, status=400)

    try:
        # 获取书架数据
        shelf_data = shelf_collection.find_one(
            {"_id": user_oid},
            {f"folders.{folder_name}": 1}
        )

        if not shelf_data:
            return JsonResponse({"error": "用户书架不存在"}, status=404)

        # 获取书籍ID列表
        book_ids = shelf_data.get("folders", {}).get(folder_name, [])
        if not book_ids:
            return JsonResponse({"data": []})

        # 转换ID格式
        book_oids = [ObjectId(bid) for bid in book_ids]

        # 修正查询投影字段（关键修改）
        materials = materials_collection.find(
            {"_id": {"$in": book_oids}},
            {
                "book_title": 1,
                "author": 1,
                "formats": 1,
                "thumbnail": 1,  # 添加缩略图字段
                "file_info": 1   # 添加文件信息字段（如果前端需要）
            }
        )

        # 处理缩略图路径（添加默认值）
        result = []
        for mat in materials:
            mat['_id'] = str(mat['_id'])
            # 确保缩略图字段存在
            mat['thumbnail'] = mat.get('thumbnail', '/default-book.jpg')  
            result.append(mat)

        return JsonResponse({"data": result})

    except Exception as e:
        return JsonResponse({"error": f"数据查询失败: {str(e)}"}, status=500)


def get_last_viewed(request, user_id):
    """获取用户最新浏览记录（书架模块）"""
    #print("进入最近浏览函数")
    try:
        # 移除ObjectId转换
        #print("原始用户ID:", user_id)  # 验证接收的user_id值
        
        mongo = MongoDBClient.get_instance()
        collection = mongo.db['learning_progress']
        
        # 直接使用user_id字段查询
        doc = collection.find_one({"user_id": user_id})  # 关键修改点
        
        #print("查询结果:", doc)
        
        if not doc or 'latest' not in doc:
            return JsonResponse({"data": None}, safe=False)

        # 构造响应数据（保持原逻辑）
        response_data = {
            "book_id": doc['latest']['book_id'],
            "title": doc['latest']['title'],
            "author": doc['latest']['author'],
            "fmt": doc['latest']['fmt'],
            "last_viewed": doc['latest']['last_viewed'].isoformat()
        }
        #print(response_data)
        return JsonResponse({"data": response_data}, safe=False)

    except Exception as e:
        print("发生异常:", str(e))
        return JsonResponse({"error": "Server error"}, status=500)


@csrf_exempt
def remove_book_from_folder(request, user_id, folder_name):
    """独立接口：从文件夹移除单个书籍"""
    mongo = MongoDBClient.get_instance()
    shelf_collection = mongo.get_collection('shelf')
    print(request, user_id, folder_name)
    try:
        # 参数验证
        user_oid = ObjectId(user_id)
        data = json.loads(request.body)
        book_id = data['book_id']
        book_oid = ObjectId(book_id)
    except errors.InvalidId:
        return JsonResponse({"error": "ID格式错误"}, status=400)
    except (KeyError, json.JSONDecodeError):
        return JsonResponse({"error": "需要提供book_id参数"}, status=400)

    # 执行数据库操作
    result = shelf_collection.update_one(
        {"_id": user_oid},
        {
            "$pull": {f"folders.{folder_name}": book_oid},
            "$currentDate": {"lastModified": True}
        }
    )

    if result.modified_count == 0:
        return JsonResponse(
            {"error": "操作未生效：书籍不存在或文件夹不存在"},
            status=404
        )
        
    return JsonResponse(
        {"message": f"已从「{folder_name}」移除书籍"}, 
        status=200
    )