# current_views.py
from django.http import JsonResponse
from ..conf.agent_config import (
    SparkAgent,
    KG_role_prompt,
    KG_action_prompt,
    MP_role_prompt,
    MP_action_prompt,
)
from ..utils.llm_util import (
    pymupdf,
    extract_text_from_pdf,
    append_json_to_file,
    merge_graph,
    json_to_cypher_import,
)
import requests
import json
import pdfplumber
import re
import warnings
import threading
import os
# -*- coding: utf-8 -*-

def save_current_graph(text,user_id):
    try:
        #print("处理文本", text)
        #print("用户ID",user_id)
        KGman = SparkAgent(KG_role_prompt,KG_action_prompt)
        KG_result = KGman.ask_spark_ai(text)
        # print("\n\n\n图谱:\n",KG_result)
        file_path = os.path.join("/home/admin/backend/backendprj/core/data", f"{user_id}.json")
        if not os.path.exists(file_path):
            fd = os.open(file_path, os.O_CREAT | os.O_WRONLY, 0o664) 
            os.close(fd)
                 

        append_json_to_file(KG_result, file_path)
        print("后台存储成功")
    except Exception as e:
        print(f"后台任务保存失败: {str(e)}")
    finally:
        del KGman  # 清理资源

def get_current_markdown(request):
    MPman = SparkAgent(MP_role_prompt,MP_action_prompt)
    user_id = request.headers.get('X-User-Id', '') 
    # print(f"当前用户ID: {user_id}")  
    # 获取请求参数
    document_url = request.GET.get('documentUrl')
    current_page = request.GET.get('currentPage')
    
    file_path =  document_url.replace('/media', '/home/admin/bookstore/uploads', 1)

    page =  int(current_page)
    
    #print(f"正式使用 {file_path}, 当前页码: {page}")
    text = extract_text_from_pdf(file_path, page)
    # print("取回文本, ",text)

    # 新增错误检测（匹配所有错误格式）
    if re.match(r'^(错误：|该页面无文本内容)', text):
        return JsonResponse({
            "error": text,
            "status": "error"
        }, status=400)


    try:
        print("提取文本:",text)
        final_result = MPman.ask_spark_ai(text)
        # print("取回回答",final_result)
        threading.Thread(target=save_current_graph, args=(text,user_id), daemon=True).start()
        print("已启动后台处理线程")
        
        return JsonResponse({
            "data": {
                "content": final_result  
            },
        })

    except requests.exceptions.RequestException as e:
        print(f"请求发生错误: {str(e)}") 