#user_views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from core.utils.mongo_conn import MongoDBClient
from core.utils.neo4j_conn import Neo4jClient
import json
import base64
from datetime import datetime

@csrf_exempt
def register_view(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        required_fields = ['user_name', 'user_pwd']
        if not all(field in data for field in required_fields):
            return JsonResponse({'detail': '缺少必填字段'}, status=400)

        mongo = MongoDBClient.get_instance()
        collection = mongo.get_collection('users')

        if collection.find_one({'user_name': data['user_name']}):
            return JsonResponse({'detail': '用户名已存在'}, status=400)

        try:
            decoded_pwd = base64.b64decode(data['user_pwd']).decode('utf-8')
        except:
            return JsonResponse({'detail': '密码格式错误'}, status=400)

        user_doc = {
            'user_name': data['user_name'],
            'user_pwd': decoded_pwd,
            'created_at': datetime.now().isoformat(),
            'last_login': None
        }
        
        # 插入并获取生成的ID
        result = collection.insert_one(user_doc)
        user_id = str(result.inserted_id)

        return JsonResponse({
            'user_name': user_doc['user_name'],
            'userId': user_id
        }, status=201)

    except Exception as e:
        return JsonResponse({'detail': str(e)}, status=500)

@csrf_exempt
def login_view(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)
    
    try:
        data = json.loads(request.body)
        mongo = MongoDBClient.get_instance()
        collection = mongo.get_collection('users')

        if 'user_name' not in data or 'user_pwd' not in data:
            return JsonResponse({'detail': '需要用户名和密码'}, status=400)

        # 包含_id字段
        user = collection.find_one(
            {'user_name': data['user_name']},
            {'_id': 1, 'user_pwd': 1, 'user_name': 1}
        )
        
        if not user:
            return JsonResponse({'detail': '用户不存在'}, status=404)

        try:
            input_pwd = base64.b64decode(data['user_pwd']).decode('utf-8')
        except:
            return JsonResponse({'detail': '密码格式错误'}, status=400)
        
        if input_pwd != user['user_pwd']:
            return JsonResponse({'detail': '密码错误'}, status=401)

        collection.update_one(
            {'user_name': data['user_name']},
            {'$set': {'last_login': datetime.now().isoformat()}}
        )

        return JsonResponse({
            'user_name': user['user_name'],
            'userId': str(user['_id'])  # 转换ObjectId为字符串
        })

    except Exception as e:
        return JsonResponse({'detail': str(e)}, status=500)

# 保留原有的mongo_users和neo4j_users视图（保持原样）

@csrf_exempt
def mongo_users(request):
    mongo = MongoDBClient.get_instance()
    collection = mongo.get_collection('test1')
    
    if request.method == 'GET':
        users = list(collection.find({}, {'_id': 0}))
        return JsonResponse({'data': users})
    
    elif request.method == 'POST':
        data = json.loads(request.body)
        result = collection.insert_one(data)
        return JsonResponse({'id': str(result.inserted_id)}, status=201)
    
    elif request.method == 'DELETE':
        data = json.loads(request.body)
        result = collection.delete_one({'id': data['id']})
        return JsonResponse({'deleted_count': result.deleted_count})
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)

@csrf_exempt
def neo4j_users(request):
    neo4j = Neo4jClient.get_instance()
    
    if request.method == 'GET':
        with neo4j.get_session() as session:
            result = session.run("MATCH (n) RETURN n LIMIT 25")
            users = [dict(record['n'].items()) for record in result]
            return JsonResponse({'data': users})
    
    elif request.method == 'POST':
        data = json.loads(request.body)
        with neo4j.get_session() as session:
            result = session.run(
                "CREATE (u:User $props) RETURN u",
                props=data
            )
            created = result.single()[0]
            return JsonResponse(dict(created.items()), status=201)
    
    elif request.method == 'DELETE':
        user_id = request.GET.get('id')
        with neo4j.get_session() as session:
            result = session.run(
                "MATCH (u:User {id: $id}) DELETE u",
                id=user_id
            )
            return JsonResponse({'deleted': True})
    
    return JsonResponse({'error': 'Method not allowed'}, status=405)