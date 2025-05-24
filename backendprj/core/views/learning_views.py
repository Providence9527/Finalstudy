# core/views/learning_views.py
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from core.utils.mongo_conn import MongoDBClient
from core.utils.neo4j_conn import Neo4jClient
from datetime import datetime,timedelta
from bson import ObjectId
import json
from isoweek import Week
import pytz
import threading
from collections import defaultdict
from ..utils.llm_util import (
    json_to_cypher_import,
    merge_graph,
    set_graph_root
)

NEO4J_URI = "bolt://localhost:7687"
NEO4J_AUTH = ("neo4j", "Z6uKm7Gv5Ce2Yvh2Kq9Gc9")
_user_locks = defaultdict(threading.Lock)


@csrf_exempt
def user_stats(request, user_id):
    """获取或创建用户学习统计信息"""
    if request.method != 'GET':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)
    
    try:
        mongo = MongoDBClient.get_instance()
        stats_collection = mongo.get_collection('learning_stats')
        #print("进入获取学习状态函数")
        # 使用find_one_and_update实现原子性创建
        stats = stats_collection.find_one_and_update(
            {"user_id": user_id},
            {"$setOnInsert": {
                "user_id": user_id,
                "completed_courses": 0,
                "daily_study_minutes": {},
                "weekly_study_minutes": {},
                "monthly_study_minutes": {},
                "history_study_minutes": {},
                "yesterday": datetime.now(pytz.UTC).isoformat()  
            }},
            upsert=True,
            projection={"_id": 0, "user_id": 0, "yesterday": 0},
            return_document=True
        )
        #print("查询到的学习状态",stats)
        return JsonResponse({
            'data': stats
        }, status=200)
        
    except Exception as e:
        return JsonResponse({
            'detail': f'获取统计信息失败: {str(e)}'
        }, status=500)

@csrf_exempt
def ongoing_courses(request, user_id):
    """返回最近浏览的4本书（自动初始化用户记录）"""
    if request.method != 'GET':
        return JsonResponse({'error': 'Method not allowed'}, status=405)
    
    try:
        mongo = MongoDBClient.get_instance()
        collection = mongo.db['learning_progress']
        
        # 自动初始化用户记录
        doc = collection.find_one_and_update(
            {"user_id": user_id},
            {"$setOnInsert": {
                "user_id": user_id,
                "recent_views": [],
                "created_at": datetime.utcnow()
            }},
            upsert=True,
            return_document=True
        )

        def parse_last_viewed(item):
            """统一时间解析逻辑"""
            if isinstance(item['last_viewed'], datetime):
                return item['last_viewed']
                
            try:
                time_str = item['last_viewed']['$date']
                return datetime.strptime(time_str.rstrip('Z'), "%Y-%m-%dT%H:%M:%S.%f")
            except:
                return datetime.min

        # 获取并处理最近浏览数据
        recent_views = doc.get('recent_views', [])
        sorted_views = sorted(
            recent_views,
            key=parse_last_viewed,
            reverse=True
        )[:4]
        
        # 启动异步任务更新图谱
        threading.Thread(target=update_neo4j_graph, args=(doc,)).start()
        
        return JsonResponse({'data': sorted_views}, safe=False)
        
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def recommend_courses(request, user_id):
    """智能推荐课程（新用户返回热门课程）"""
    if request.method != 'GET':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)
    
    try:
        mongo = MongoDBClient.get_instance()
        stats_collection = mongo.get_collection('learning_stats')
        materials_collection = mongo.get_collection('materials')

        # 判断是否新用户
        user_stat = stats_collection.find_one(
            {"user_id": user_id},
            projection=["totalTime"]
        )
        is_new_user = not user_stat or user_stat.get('totalTime', 0) == 0

        # 动态调整推荐策略
        if is_new_user:
            # 新用户推荐热门课程（按收藏数排序）
            pipeline = [
                {'$sort': {'favorites_count': -1}},
                {'$limit': 3},
                {'$project': {
                    '_id': 0,
                    'materialId': '$_id',
                    'title': '$book_title',
                    'category': {'$arrayElemAt': ['$book_tags', 0]},
                    'thumbnail': '$book_thumbnail'
                }}
            ]
        else:
            # 老用户随机推荐
            pipeline = [
                {'$sample': {'size': 3}},
                {'$project': {
                    '_id': 0,
                    'materialId': '$_id',
                    'title': '$book_title',
                    'category': {'$arrayElemAt': ['$book_tags', 0]},
                    'thumbnail': '$book_thumbnail'
                }}
            ]
        
        recommended = list(materials_collection.aggregate(pipeline))
        
        # 转换ID类型
        for course in recommended:
            course['materialId'] = str(course['materialId'])
        
        return JsonResponse({'data': recommended}, safe=False)

    except Exception as e:
        return JsonResponse({'detail': str(e)}, status=500)

@csrf_exempt
@require_http_methods(["POST"])
def track_learning_time(request, user_id):
    """记录用户学习时长"""
    # print("收到更新时请求",request.body,user_id)
    try:
        # 解析请求数据
        data = json.loads(request.body)
        path = data.get('path', '')
        duration_seconds = data.get('duration', 0)
        duration_minutes = duration_seconds // 60 
        timestamp = data.get('timestamp')
        
        print("页面,持续时间,时间戳:\n",path,",",duration_minutes,",",timestamp)
        
        # 获取MongoDB连接
        mongo = MongoDBClient.get_instance()
        collection = mongo.get_collection('learning_stats')
        
        # 处理时间参数
        current_time = datetime.fromisoformat(timestamp).astimezone(pytz.UTC) if timestamp else datetime.now(pytz.UTC)
        
        
        last_update_key = "yesterday"
        
        # 生成路径分类（例如/book/123 → 'book'）
        path_parts = path.strip('/').split('/')
        category = path_parts[0] if path_parts else 'other'

        # 原子操作：查找并更新文档
        result = collection.find_one_and_update(
            {"user_id": user_id},
            {
                "$setOnInsert": {
                    last_update_key: current_time.isoformat(),
                    "daily_study_minutes": {},
                    "weekly_study_minutes": {},
                    "monthly_study_minutes": {},
                    "history_study_minutes": {},
                    "completed_courses": 0
                }
            },
            upsert=True,
            return_document=True
        )
        # print("查找并更新学习时长文档",result)

        # 计算时间差
        last_update = datetime.fromisoformat(result[last_update_key]).astimezone(pytz.UTC)
        # print("last_update: ",last_update)
        update_data = {"$set": {last_update_key: current_time.isoformat()}}
        # print("update_data: ",update_data)
        # 定义时间周期判断
        same_month = current_time.month == last_update.month
        same_week = current_time.isocalendar()[1] == last_update.isocalendar()[1]
        same_day = current_time.date() == last_update.date()
        
        # print("逻辑判断结束")

        # 构建重置逻辑
        reset_operations = []
        if not same_month:
            reset_operations.extend([
                "daily_study_minutes",
                "weekly_study_minutes",
                "monthly_study_minutes"
            ])
        elif not same_week:
            reset_operations.extend([
                "daily_study_minutes",
                "weekly_study_minutes"
            ])
        elif not same_day:
            reset_operations.append("daily_study_minutes")

        # 添加重置操作
        for field in reset_operations:
            update_data["$set"][field] = {}

        # 添加时长累加操作
        time_fields = []
        if same_month:
            time_fields.append("monthly_study_minutes")
            if same_week:
                time_fields.append("weekly_study_minutes")
                if same_day:
                    time_fields.append("daily_study_minutes")
        
        for field in time_fields + ["history_study_minutes"]:
            update_data.setdefault("$inc", {})
            update_data["$inc"][f"{field}.{category}"] = duration_minutes

        # 执行更新操作
        collection.update_one(
            {"_id": result["_id"]},
            update_data
        )

        return JsonResponse({
            'status': 'success',
            'updated_fields': list(update_data.get("$inc", {}).keys()),
            'reset_fields': reset_operations
        }, status=200)

    except ValueError as ve:
        return JsonResponse({
            'detail': f'时间格式错误: {str(ve)}'
        }, status=400)
    except Exception as e:
        return JsonResponse({
            'detail': f'学习时长记录失败: {str(e)}'
        }, status=500)
        

@csrf_exempt
def user_report(request, user_id):
    """获取用户学习报告数据"""
    #print("进入学习报告页面")
    if request.method != 'GET':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    # 解析请求参数
    period = request.GET.get('period', 'daily')
    valid_periods = ['daily', 'weekly', 'monthly', 'history']
    if period not in valid_periods:
        return JsonResponse({'detail': '无效的时间范围参数'}, status=400)

    try:
        mongo = MongoDBClient.get_instance()
        
        # 1. 获取学习时长数据 -------------------------------------------------
        # 拼接字段名
        duration_field = f"{period}_study_minutes"
        stats_collection = mongo.get_collection('learning_stats')
        
        # 查询学习时长统计
        stats_doc = stats_collection.find_one(
            {"user_id": user_id},
            {duration_field: 1, "_id": 0}
        )
        
        # 计算总学习时长（分钟）
        total_minutes = sum(stats_doc.get(duration_field, {}).values()) if stats_doc else 0
        
        # 2. 获取知识图谱数据 -------------------------------------------------
        progress_collection = mongo.get_collection('learning_progress')
        
        graph_field = f"{period}_graph"
        # print("拼接的graph字段",graph_field)
        
        # 查询知识图谱结构
        progress_doc = progress_collection.find_one( 
            {"user_id": user_id},
            {graph_field: 1, "_id": 0}
        )
        
        
        # 提取图谱数据
        graph_data = progress_doc.get(graph_field, {}) if progress_doc else {}
        #print("提取的graph文档",graph_data)
        
        # 格式化学习时长
        def format_duration(minutes):
            hours = minutes // 60
            mins = minutes % 60
            return f"{hours}h{mins}m" if mins else f"{hours}h"
        
        # 最终响应结构
        response_data = {
            "stats": {
                "study_duration": format_duration(total_minutes),
                "mastered_concepts": len(graph_data.get('nodes', [])),
                 "focus_area": "重点领域"  # 硬编码值
            },
            "recommendation": "纸上得来终觉浅，绝知此事要躬行",  # 硬编码建议
            "knowledge_graph": {
                "nodes": graph_data.get('nodes', []),
                "links": graph_data.get('links', [])
            }
        }
        
        return JsonResponse({'data': response_data}, status=200)

    except Exception as e:
        logger.error(f"获取学习报告失败: {str(e)}")
        return JsonResponse({
            'detail': '无法生成学习报告，请稍后重试'
        }, status=500)
        
def update_neo4j_graph(user_doc):
    """异步更新Neo4j图谱数据"""
    user_id = user_doc.get('user_id')
    try:
        with _user_locks[user_id]:  # 获取用户级锁
          #print(f"[{datetime.now()}] 用户 {user_id} 开始更新图谱")
          pass
        # 获取最新阅读时间
        latest_data = user_doc.get('latest', {})
        if not latest_data:
            return

        # 解析MongoDB日期格式
        last_viewed_data = latest_data['last_viewed']
        if isinstance(last_viewed_data, datetime):
            last_viewed = last_viewed_data
        else:
            last_viewed_str = last_viewed_data['$date'].rstrip('Z')
            last_viewed = datetime.strptime(last_viewed_str, "%Y-%m-%dT%H:%M:%S.%f")
        
        now = datetime.utcnow()
        
        

        # 时间变化检测
        day_changed = last_viewed.date() < now.date()
        week_changed = last_viewed.isocalendar()[1] < now.isocalendar()[1]
        month_changed = last_viewed.month < now.month or last_viewed.year < now.year

        # 更新MongoDB图谱字段
        mongo = MongoDBClient.get_instance()
        collection = mongo.db['learning_progress']
        
        update_fields = {}
        if day_changed: 
            print("日期变更")
            update_fields['daily_graph'] = {"nodes": [], "links": []}
        if week_changed: 
            print("周变更")
            update_fields['weekly_graph'] = {"nodes": [], "links": []}
        if month_changed: 
            print("月变更")
            update_fields['monthly_graph'] = {"nodes": [], "links": []}
 
        if update_fields:
            collection.update_one(
                {'user_id': user_doc['user_id']},
                {'$set': update_fields}
            )

        # 日变化时更新Neo4j
        if day_changed and 'history_graph' in user_doc:
            #print("需要更新neo4j")

            history = json.dumps(user_doc['history_graph'])
            #print("本次/n",history)
            #merge_graph(history)
            json_to_cypher_import(
                history,
                NEO4J_URI,
                NEO4J_AUTH,
                user_id
            )
            #print(f"[{datetime.now()}] 用户 {user_id} 更新完成")

    except Exception as e:
        print(f"异步更新异常: {str(e)}")