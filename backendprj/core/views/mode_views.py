# core/views/mode_views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
from pymongo import errors
import datetime
from core.utils.mongo_conn import MongoDBClient
import json

@csrf_exempt
def notes_operation(request, user_id):
    """处理笔记列表的创建和获取"""
    mongo = MongoDBClient.get_instance()
    notes_collection = mongo.get_collection('notes')
    
    try:
        user_oid = ObjectId(user_id)
    except errors.InvalidId:
        return JsonResponse({"error": "用户ID格式错误"}, status=400)

    if request.method == 'GET':
        # 获取用户所有笔记
        try:
            #print("进入获取用户笔记")
            user_notes = notes_collection.find_one({"_id": user_oid})
            if not user_notes:
                return JsonResponse({"data": []})
                
            note_list = user_notes.get('note_list', [])
            
            formatted_notes = [
                {
                    "note_id": str(note['note_id']),
                    "title": note['note_title'],
                    "lastViewed": note['lastViewed'].isoformat(),
                    "content": note['content'] 
                }
                for note in note_list
            ]
            #print("返回笔记列表",formatted_notes)
            return JsonResponse({"data": formatted_notes})
            
        except Exception as e:
            return JsonResponse({"error": f"获取笔记失败: {str(e)}"}, status=500)

    elif request.method == 'POST':
        # 创建新笔记
        try:
            data = json.loads(request.body)
            
            
            title = data.get('title', '未命名笔记')
            #print("准备创建笔记",title)
            new_note = {
                "note_id": ObjectId(),  # 生成唯一ID
                "note_title": title,
                "lastViewed": datetime.datetime.utcnow(),
                "content": ""
            }
            
            update_result = notes_collection.update_one(
                {"_id": user_oid},
                {"$push": {"note_list": new_note}},
                upsert=True
            )
            
            
            if update_result.modified_count > 0 or update_result.upserted_id:
                #print("创建笔记如下",update_result)
                return JsonResponse({
                    "data": {
                        "id": str(new_note['note_id']),
                        "title": title,
                        "lastViewed": new_note['lastViewed'].isoformat()
                    }
                }, status=201)
                
            return JsonResponse({"error": "创建笔记失败"}, status=500)
            
        except Exception as e:
            return JsonResponse({"error": f"创建失败: {str(e)}"}, status=500)

    else:
        return JsonResponse({"error": "方法不允许"}, status=405)

@csrf_exempt
def note_detail(request, user_id, note_id):
    """处理单个笔记的删除操作"""
    mongo = MongoDBClient.get_instance()
    notes_collection = mongo.get_collection('notes')
    
    try:
        user_oid = ObjectId(user_id)
        note_oid = ObjectId(note_id)
    except errors.InvalidId:
        return JsonResponse({"error": "ID格式错误"}, status=400)

    if request.method == 'DELETE':
        try:
            update_result = notes_collection.update_one(
                {"_id": user_oid},
                {"$pull": {"note_list": {"note_id": note_oid}}}
            )
            
            if update_result.modified_count > 0:
                return JsonResponse({"message": "删除成功"}, status=200)
            return JsonResponse({"error": "笔记不存在"}, status=404)
            
        except Exception as e:
            return JsonResponse({"error": f"删除失败: {str(e)}"}, status=500)

    else:
        return JsonResponse({"error": "方法不允许"}, status=405)
        
        
@csrf_exempt
def update_note_content(request, user_id, note_id):
    """更新笔记内容"""
    
    #print("进入笔记更新模式")
    mongo = MongoDBClient.get_instance()
    notes_collection = mongo.get_collection('notes')
     
    try:
        user_oid = ObjectId(user_id)
        note_oid = ObjectId(note_id)
    except errors.InvalidId:
        return JsonResponse({"error": "ID格式错误"}, status=400)

    if request.method == 'PUT':
        try:
            # 解析请求数据
            data = json.loads(request.body)
            new_content = data.get('content', '')
            current_time = datetime.datetime.utcnow()
            
            
            #print("更新笔记内容",new_content)
            # 执行MongoDB更新操作
            update_result = notes_collection.update_one(
                {
                    "_id": user_oid,
                    "note_list.note_id": note_oid
                },
                {
                    "$set": {
                        "note_list.$.content": new_content,
                        "note_list.$.lastViewed": current_time
                    }
                }
            )
            
            # 处理更新结果
            if update_result.modified_count > 0:
                return JsonResponse({"message": "保存成功"}, status=200)
            return JsonResponse({"error": "笔记不存在或内容未改变"}, status=404)
            
        except json.JSONDecodeError:
            return JsonResponse({"error": "无效的JSON格式"}, status=400)
        except KeyError as e:
            return JsonResponse({"error": f"缺少必要字段: {str(e)}"}, status=400)
        except Exception as e:
            return JsonResponse({"error": f"服务器错误: {str(e)}"}, status=500)
    else:
        return JsonResponse({"error": "方法不允许"}, status=405)