# agent_config.py
"""智能体提示词配置文件
Version: 1.2
Last Modified: 2024-04-17
"""
import requests
import json

round_path = "/home/admin/backend/backendprj/core/data/round.json"

today_path = "/home/admin/backend/backendprj/core/data/today.json"

week_path = "/home/admin/backend/backendprj/core/data/week.json"

month_path = "/home/admin/backend/backendprj/core/data/month.json"

history_path = "/home/admin/backend/backendprj/core/data/history.json"

MP_role_prompt = """
你是思维导图架构专家，具备跨文本关联分析、层级化信息组织及多版本回溯能力。每次对话自动加载前3次处理结果，使用余弦相似度>0.6的锚点建立关联。

执行流程：
1. 概念提取：从当前文本识别多个核心概念（主主题 -> 子主题 -> 要点）
2. 关联建立
3. 结构生成：输出XMind兼容的三级Markdown，信息密度 >= 80%，冗余度 <= 5%

输入规范：
- 当前文本：{{新文本内容}}
- 历史上下文：{{自动整合加载前三次输出}}

质量校验：
* 概念保留率 >= 90%
* 跨版本关联完整度 >= 80%
* 响应延迟 <= 2.8秒/千字
"""

MP_action_prompt = """
理解以下文本, 将整理成适合生成思维导图的Markdown, 并回顾本次对话的历史记录的Markdown与本次Markdown的联系, 将新对话的Markdown整合进去, 形成唯一的Markdown输出,注意不要输出与本次提问无关的的内容

格式规范：
1. 层级结构：
   # 主主题
   ## 子主题
   ### 要点
2. 禁止项：
 不使用版本标记（如^v1.0）;输出的Markdown文档不包含历史记录回顾
示例输出：
# 人工智能技术
## 机器学习
### 监督学习
## 深度学习
### 神经网络架构 
"""


KG_role_prompt = """
你是一个专注于教育知识图谱构建的人工智能专家，擅长从教材文本中精准识别技术概念实体、属性及逻辑关系。
你具备结构化思维，能根据上下文自动消歧义、合并同义词节点，并在多轮对话中维护知识图谱的拓扑一致性。
每次生成图谱时需严格检查节点ID的唯一性，确保后续Python脚本可无缝处理节点合并与关系更新"""

KG_action_prompt ="""
请根据教材文本生成结构化知识图谱数据，遵循以下规则：

1. 节点规则
   - 字段格式：
     id: 全小写下划线格式（例："react_context"）
     name: 概念完整名称
     group: 技术分类标签（state/routing/core_concept等）
     properties: 可选属性列表
   - 多轮对话中相同概念必须复用id

2. 关系规则
   - 字段格式：
     source: 起始节点id
     target: 目标节点id
     type: 关系类型（alternatives/dependency等）
   - 需明确方向性（例：Redux→Context表示替代关系）

3. 输出要求
   - 仅返回纯JSON对象，结构示例：
     {"nodes": [{"id":"redux","name":"Redux","group":"state"}], "links": [{"source":"redux","target":"context"}]}
   - 每次响应仅返回增量数据
   - 自动继承前序对话节点

禁止项: 
   - 返回值中没有json单词
"""


class SparkAgent:
    def __init__(self, role: str, action: str):


        self.conf = {
            "url": "https://spark-api-open.xf-yun.com/v1/chat/completions",
            "max_tokens": 4096,
            "top_k": 4,
            "temperature": 0.5,
            "model": "generalv3.5",
            "system_prompt":role,
                "stream": True,
             "headers": {
                "Authorization": "Bearer OmvmWFvVFYUaNgxILwtX:tMFKFuoEOcANfxCDAZxV"
            },
        }
        self.__action = action  # 私有属性（指令）


    def ask_spark_ai(self,question_text):
        """发送请求并聚合流式响应中的content内容"""
        #print(self.__action, self.conf["system_prompt"])
        #final_question = self.__action + question_text
        #print(f"{self.__action}:{question_text}")
        request_data = {
            "messages": [
                {"role": "system", "content": self.conf["system_prompt"]},
                {"role": "user", "content": f"{self.__action}:{question_text}"}
            ],
            "max_tokens": self.conf["max_tokens"],
            "top_k": self.conf["top_k"],
            "temperature": self.conf["temperature"],
            "model": self.conf["model"],
            "stream": self.conf["stream"]
        }

        response = requests.post(
            url = self.conf["url"],
            headers = self.conf["headers"],
            json = request_data,
            stream = True
        )

        # 强制设置响应编码
        response.encoding = 'utf-8'

        full_response = ""

        if response.status_code == 200:
            for line in response.iter_lines(decode_unicode=True):
                if line.startswith('data:'):
                    try:
                        # 增加调试日志（正式使用时可移除）
                        # print("原始数据:", line)

                        json_data = json.loads(line[5:].strip())
                        if json_data["code"] == 0:
                            content = json_data["choices"][0]["delta"].get("content", "")
                            full_response += content
                    except (json.JSONDecodeError, KeyError) as e:
                        # print("解析异常:", str(e))
                        continue
            return full_response.strip()
        else:
            response.raise_for_status()