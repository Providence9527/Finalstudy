from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from bson import ObjectId
from datetime import datetime
import json
from core.utils.mongo_conn import MongoDBClient

def validate_user_id(user_id):
    """简易用户ID验证"""
    try:
        return ObjectId(user_id)
    except:
        return None

@csrf_exempt
def conversation_list(request, user_id):
    print("list", user_id)
    """对话列表接口（带用户ID参数）"""
    # 验证用户ID格式
    user_id_obj = validate_user_id(user_id)
    if not user_id_obj:
        return JsonResponse({'detail': '无效的用户ID格式'}, status=400)

    mongo = MongoDBClient.get_instance()
    collection = mongo.get_collection('conversations')

    if request.method == 'GET':
        try:
            conversations = collection.find(
                {'user_id': user_id_obj},
                {'messages': 0}
            ).sort('last_updated', -1)
            
            return JsonResponse({
                'data': [{
                    'conversation_id': str(conv['_id']),
                    'title': conv['title'],
                    'created_at': conv['created_at'].isoformat(),
                    'last_updated': conv['last_updated'].isoformat()
                } for conv in conversations]
            }, safe=False)
            
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)

    elif request.method == 'POST':
        try:
            data = json.loads(request.body)
            first_message = data.get('first_message', '')
            
            # 空消息时不创建文档
            if not first_message.strip():
                return JsonResponse({
                    'detail': '需要提供初始消息'
                }, status=400)
            # 自动生成标题
            title = (first_message[:18] + '...') if len(first_message) > 20 else first_message
            
            result = collection.insert_one({
                'user_id': user_id_obj,
                'title': title,
                'created_at': datetime.utcnow(),
                'last_updated': datetime.utcnow(),
                'messages': []
            })

            return JsonResponse({
                'conversation_id': str(result.inserted_id),
                'title': title,
                'created_at': datetime.utcnow().isoformat(),
                'last_updated': datetime.utcnow().isoformat()
            }, status=201)
            
        except json.JSONDecodeError:
            return JsonResponse({'detail': '无效的JSON数据'}, status=400)
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)

@csrf_exempt
def conversation_detail(request, user_id, conversation_id):
    print(f"[DELETE] 删除请求 - 用户: {user_id}, 对话: {conversation_id}")
    
    try:
        user_id_obj = ObjectId(user_id)
    except:
        print(f"无效用户ID格式: {user_id}")
        return JsonResponse({'detail': '无效的用户ID格式'}, status=400)

    try:
        conv_id = ObjectId(conversation_id)
    except:
        print(f"无效对话ID格式: {conversation_id}")
        return JsonResponse({'detail': '无效的对话ID格式'}, status=400)

    mongo = MongoDBClient.get_instance()
    collection = mongo.get_collection('conversations')

    if request.method == 'DELETE':
        try:
            # 添加权限验证
            result = collection.delete_one({
                '_id': conv_id,
                'user_id': user_id_obj  # 确保只能删除自己的对话
            })
            
           # print(f"删除操作结果: {result.raw_result}")
            
            if result.deleted_count == 0:
                print("删除失败：文档不存在或权限不足")
                return JsonResponse({'detail': '对话不存在或无权操作'}, status=404)
                
            return HttpResponse(status=204)  # 返回空响应
            
        except Exception as e:
            #print(f"数据库操作异常: {str(e)}")
            return JsonResponse({'error': f'服务器错误: {str(e)}'}, status=500)

@csrf_exempt
def conversation_messages(request, user_id, conversation_id):
    #print("ms", user_id,"-----", conversation_id)
    """消息操作接口"""
    user_id_obj = validate_user_id(user_id)
    if not user_id_obj:
        return JsonResponse({'detail': '无效的用户ID格式'}, status=400)

    try:
        conv_id = ObjectId(conversation_id)
    except:
        return JsonResponse({'detail': '无效的对话ID格式'}, status=400)

    mongo = MongoDBClient.get_instance()
    collection = mongo.get_collection('conversations')

    if request.method == 'GET':
        conv = collection.find_one(
            {'_id': conv_id, 'user_id': user_id_obj},
            {'messages': 1}
        )
        if not conv:
            return JsonResponse({'detail': '对话不存在或无权访问'}, status=404)
            
        return JsonResponse({
            'messages': [{
                'content': msg['content'],
                'role': msg['role'],
                'timestamp': msg['timestamp'].isoformat() if isinstance(msg['timestamp'], datetime) else msg['timestamp']
            } for msg in conv.get('messages', [])]
        }, safe=False)

    elif request.method == 'PUT':
        try:
            data = json.loads(request.body)
            raw_messages = data.get('messages', [])
            
            # 规范化时间戳格式
            messages = []
            for msg in raw_messages:
                # 转换字符串时间为datetime对象
                if isinstance(msg.get('timestamp'), str):
                    try:
                        msg['timestamp'] = datetime.fromisoformat(msg['timestamp'])
                    except ValueError:
                        msg['timestamp'] = datetime.utcnow()
                elif not isinstance(msg.get('timestamp'), datetime):
                    msg['timestamp'] = datetime.utcnow()
                messages.append(msg)
            
            update_data = {
                '$set': {
                    'messages': messages,
                    'last_updated': datetime.utcnow()
                }
            }
            
            # 自动更新标题
            if messages:
                first_user_msg = next(
                    (msg for msg in messages if msg['role'] == 'user'), 
                    None
                )
                if first_user_msg:
                    title = (first_user_msg['content'][:18] + '...') if len(first_user_msg['content']) > 20 else first_user_msg['content']
                    update_data['$set']['title'] = title
            
            result = collection.update_one(
                {'_id': conv_id, 'user_id': user_id_obj},
                update_data
            )
            
            if result.modified_count == 0:
                return JsonResponse({'detail': '未检测到修改'}, status=200)
            return JsonResponse({'detail': '更新成功'})
            
        except json.JSONDecodeError:
            return JsonResponse({'detail': '无效的JSON数据'}, status=400)
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)

    return JsonResponse({'detail': '不支持的请求方法'}, status=405)