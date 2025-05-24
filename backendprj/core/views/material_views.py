
#material_views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from core.utils.mongo_conn import MongoDBClient
from django.views.decorators.http import require_http_methods
import math
import json
import os
import threading
import fcntl
from datetime import datetime
from ..utils.llm_util import (
    append_json_to_file,
    merge_graph,
    set_graph_root,
)


@csrf_exempt
def material_filter_options(request):
    """获取所有筛选选项"""
    try:
        mongo = MongoDBClient.get_instance()
        collection = mongo.get_collection('materials')
        
        # 获取唯一出版社（过滤空值）
        publishers = [p for p in collection.distinct('press') if p]
        
        # 获取所有标签（展平去重）
        tags = list({tag for doc in collection.find({}, {'book_tags': 1}) 
                   for tag in doc.get('book_tags', [])})
        
        # 获取文件格式（从file_info的key提取）
        formats = list({
            fmt for doc in collection.find({}, {'file_info': 1})
            for fmt in doc.get('file_info', {}).keys()
        })
        
        return JsonResponse({
            'data': {
                'subjects': sorted(tags),
                'publishers': sorted(publishers),
                'formats': sorted(formats),
                'tags': sorted(tags)
            }
        }, status=200)
        
    except Exception as e:
        return JsonResponse({
            'detail': f'获取筛选选项失败: {str(e)}'
        }, status=500)

@csrf_exempt
def material_list(request):
    """分页获取教材列表"""
    try:
        # 解析请求参数
        params = {
            'page': int(request.GET.get('page', 1)),
            'page_size': int(request.GET.get('page_size', 5)),  # 与前端一致
            'search': request.GET.get('search', '').strip(),
            'subjects': request.GET.get('subjects', '').split(','),
            'publishers': request.GET.get('publishers', '').split(','),
            'formats': request.GET.get('formats', '').split(','),
            'tags': request.GET.get('tags', '').split(',')
        }
        
        # 清理空值参数
        params['subjects'] = [s for s in params['subjects'] if s]
        params['publishers'] = [p for p in params['publishers'] if p]
        params['formats'] = [f for f in params['formats'] if f]
        params['tags'] = [t for t in params['tags'] if t]

        # 构建复合查询条件
        query_conditions = []
        
        # 搜索条件
        if params['search']:
            query_conditions.append({
                '$or': [
                    {'book_title': {'$regex': params['search'], '$options': 'i'}},
                    {'author': {'$regex': params['search'], '$options': 'i'}}
                ]
            })
        
        # 出版社筛选
        if params['publishers']:
            query_conditions.append({'press': {'$in': params['publishers']}})
        
        # 文件格式筛选
        if params['formats']:
            query_conditions.append({
                '$or': [
                    {f'file_info.{fmt}': {'$exists': True}}
                    for fmt in params['formats']
                ]
            })
        
        # 标签组合筛选（同时满足学科和标签）
        tag_filters = []
        if params['subjects']:
            tag_filters.append({'book_tags': {'$in': params['subjects']}})
        if params['tags']:
            tag_filters.append({'book_tags': {'$all': params['tags']}})
        if tag_filters:
            query_conditions.append({'$and': tag_filters})

        # 组合最终查询条件
        final_query = {}
        if query_conditions:
            final_query['$and'] = query_conditions

        mongo = MongoDBClient.get_instance()
        collection = mongo.get_collection('materials')
        
        # 分页查询
        total = collection.count_documents(final_query)
        skip = (params['page'] - 1) * params['page_size']
        
        pipeline = [
            {'$match': final_query},
            {'$skip': skip},
            {'$limit': params['page_size']},
            {'$project': {
                '_id': {'$toString': '$_id'},
                'book_title': 1,
                'author': 1,
                'press': 1,
                'book_tags': 1,
                'file_info': {'$objectToArray': '$file_info'},
                'thumbnail': 1
            }},
            {'$addFields': {
                'formats': '$file_info.k',
                'thumbnail_url': {
                    '$concat': [
                        '/media/thumbnails/',
                        {'$arrayElemAt': [
                            {'$split': ['$thumbnail', 'thumbnails/']},
                            1
                        ]}
                    ]
                },
                'file_urls': {
                    '$map': {
                        'input': '$file_info',
                        'as': 'f',
                        'in': {
                            '$concat': [
                                '/media/books/',
                                {'$arrayElemAt': [
                                    {'$split': ['$$f.v', 'books/']},
                                    1
                                ]}
                            ]
                        }
                    }
                }
            }},
            {'$unset': ['file_info', 'thumbnail']}
        ]

        results = list(collection.aggregate(pipeline))
        
        return JsonResponse({
            'data': results,
            'pagination': {
                'total': total,
                'total_pages': math.ceil(total / params['page_size']),
                'current_page': params['page'],
                'page_size': params['page_size']
            }
        }, status=200)
        
    except ValueError:
        return JsonResponse({
            'detail': '无效的分页参数'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'detail': f'查询失败: {str(e)}'
        }, status=500)

@csrf_exempt 
@require_http_methods(["POST"])
def save_reading_progress(request):
    """按循环队列规则更新阅读记录"""
    try:
        # 解析请求数据
        data = json.loads(request.body)
        user_id = str(data['userId'])
        book_id = str(data['bookId'])
        update_time = datetime.fromisoformat(data['lastViewed'].rstrip('Z'))
        print("待保存数据",data)
        # 构建当前记录
        current_record = {
            'book_id': book_id,
            'title': data.get('title', '未命名文档'),
            'author': data.get('author', '佚名'),
            'fmt':  data.get('fmt', 'pdf'),
            'progress': max(0.0, min(1.0, float(data.get('progress', 0.0)))),
            'last_viewed': update_time
        }
        print("已构建待保存的数据",current_record)
        # 获取MongoDB连接
        mongo = MongoDBClient.get_instance()
        collection = mongo.db['learning_progress']

        # 查询现有记录
        doc = collection.find_one({'user_id': user_id})
        print("已有的用户文档",doc)
        #print("\n\n\n"+user_id+"异步处理前的doc\n",doc)
        recent_views = doc['recent_views'] if doc else []
        print("doc赋值的recent_views",recent_views)
        latest = doc.get('latest') if doc else None
        print("doc赋值的latest",latest)
        pos = next((i for i, item in enumerate(recent_views) if item.get('book_id') == latest['book_id']), -1) if latest else -1

        # 查找现有书籍索引
        
        existing_index = next((i for i, x in enumerate(recent_views) 
                             if x['book_id'] == book_id), -1)
        print("现有书籍索引",existing_index)
        
        # 存在则更新时间
        if existing_index != -1:
            recent_views[existing_index]['last_viewed'] = update_time
            recent_views[existing_index]['progress'] = current_record['progress']
        else:
            insert_pos = (pos+1) % 5

            # 覆盖或追加
            if len(recent_views) >= 5:
                print("插入到",insert_pos)
                recent_views[insert_pos] = current_record
            else:
                recent_views.insert(insert_pos, current_record)
        
        # 保持最多5条记录
        recent_views = recent_views[:5]


        print("待更新数据 recent_views",recent_views)
        print("待更新数据 latest",current_record)

        # 更新对应文档的新字段（原子操作）
        update_result = collection.update_one(
            {'user_id': user_id},
            {'$set': {
                'recent_views': recent_views,
                'latest': current_record
            }},
            upsert=True
        ) 


        # 启动异步保存图谱数据
        threading.Timer(
              interval = 10,
              function=update_graph,
              args=(user_id,current_record),
              
          ).start()

        return JsonResponse({'status': 'success'})

    except json.JSONDecodeError:
        return JsonResponse({'error': '数据格式错误'}, status=400)
    except KeyError as e:
        return JsonResponse({'error': f'缺少字段:{str(e)}'}, status=400)
    except ValueError:
        return JsonResponse({'error': '时间格式异常'}, status=400)
    except Exception:
        return JsonResponse({'error': '系统错误'}, status=500)

  
def update_graph(userId, book_info):
    """异步保存用户图谱数据"""
    #print(f"[{datetime.now()}] 开始处理用户 {userId} 图谱更新")
    mongo = None
    try:
        # 1. 提取核心数据并验证
        required_fields = ['book_id', 'title']
        if not all(field in book_info for field in required_fields):
            raise ValueError("书籍信息缺少必要字段")

        root = {
            "id": book_info["book_id"],
            "name": book_info["title"],
            "group": book_info["book_id"]  # 明确分组类型
        }

        # 2. 安全处理本地文件
        file_path = os.path.join("/home/admin/backend/backendprj/core/data", f"{userId}.json")
        original_content = ''
        
        if os.path.exists(file_path):
            with open(file_path, 'r+', encoding='utf-8') as f:
                fcntl.flock(f, fcntl.LOCK_EX)
                try:
                    original_content = f.read()
                    #print("\n\n\nupdate_graph函数中更新图谱前读取save_current_graph已写数据:\n",original_content)
                    # 创建备份副本用于错误恢复
                    backup_content = original_content  
                finally:
                    fcntl.flock(f, fcntl.LOCK_UN)
        else:
            original_content = '{"nodes": [], "links": []}'

        # 3. 生成当前图谱（带异常捕获）
        try:
            cur_graph = set_graph_root(root, original_content)
            parsed_cur_graph = json.loads(cur_graph)  # 提前验证JSON格式
        except json.JSONDecodeError as e:
            print(f"生成当前图谱失败，使用空模板。错误：{str(e)}")
            cur_graph = '{"nodes": [], "links": []}'
            parsed_cur_graph = json.loads(cur_graph)

        # 4. 获取MongoDB连接（延迟初始化）
        mongo = MongoDBClient.get_instance()
        collection = mongo.db['learning_progress']
        
        # 5. 原子化数据操作（先准备所有更新内容）
        base_doc = collection.find_one({'user_id': userId}) or {}
        #print("\n\n\n"+userId+"base_doc:\n",base_doc)
        preserved_data = {  # 保留原有数据副本
            'daily_graph': base_doc.get('daily_graph', {"nodes": [], "links": []}),
            'weekly_graph': base_doc.get('weekly_graph', {"nodes": [], "links": []}),
            'monthly_graph': base_doc.get('monthly_graph', {"nodes": [], "links": []}),
            'history_graph': base_doc.get('history_graph', {"nodes": [], "links": []})
        }

        # 6. 准备更新内容（不直接修改数据库字段）
        updates = {
            'cur_graph': parsed_cur_graph,
            'last_updated': datetime.now()
        }

        # 7. 安全合并图谱（带中间变量）
        #print("保存数据\n",preserved_data)
        merge_results = {}
        for period in ['daily', 'weekly', 'monthly', 'history']:
            try:
                existing = json.dumps(preserved_data[f'{period}_graph'])
                
                merged = json.loads(merge_graph(cur_graph, existing))
                #print("增量\n",cur_graph)
                #print(f'{period}_graph'+"基础\n",existing)
                merge_results[f'{period}_graph'] = merged
            except Exception as e:
                print(f"合并{period}图谱失败，保留原数据。错误：{str(e)}")
                merge_results[f'{period}_graph'] = preserved_data[f'{period}_graph']

        updates.update(merge_results)

        # 8. 原子化更新操作（使用$set只更新指定字段）
        update_result = collection.update_one(
            {'user_id': userId},
            {'$set': updates},
            upsert=True
        )
        #print(f"数据库更新结果：匹配{update_result.matched_count}条，修改{update_result.modified_count}条")

        # 9. 安全清空本地文件（操作前验证）
        if os.path.exists(file_path):
            with open(file_path, 'w', encoding='utf-8') as f:
                fcntl.flock(f, fcntl.LOCK_EX)
                try:
                    f.truncate()
                    print(f"[{datetime.now()}] 成功清空用户 {userId} 本地缓存")
                finally:
                    fcntl.flock(f, fcntl.LOCK_UN)

    except Exception as e:
        print(f"!!! 关键错误: {str(e)}")
        # 错误恢复：当MongoDB操作失败时恢复本地文件
        if 'backup_content' in locals() and file_path:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(backup_content)
                print("已恢复本地文件备份")
        # 记录详细错误日志
        traceback.print_exc()
    finally:
        if mongo:
            try:
                # 添加连接状态检查
                if hasattr(mongo, 'connection') and mongo.connection is not None:  
                    mongo.close_connection()
                    print(f"[{datetime.now()}] 成功关闭用户 {userId} 的数据库连接")
            except AttributeError as e:
                print(f"连接未正确初始化: {str(e)}")
            except Exception as e:
                print(f"关闭连接时发生意外错误: {str(e)}")
                # 记录详细日志但不中断线程
                traceback.print_exc()  