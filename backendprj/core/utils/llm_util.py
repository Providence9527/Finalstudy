import json
import pdfplumber
import os
import re
from collections import defaultdict, OrderedDict
from neo4j import GraphDatabase, Transaction
from typing import Dict, List
import warnings
warnings.filterwarnings("ignore", category=UserWarning, module="pdfplumber")
import fcntl
def pymupdf(pdf_path: str, page_number: int) -> str:
    doc = fitz.open(pdf_path)
    page = doc[page_number - 1]
    text = page.get_text("text")
    return text

def extract_text_from_pdf(pdf_path: str, page_number: int) -> str:
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # 检查页码有效性
            if page_number < 1 or page_number > len(pdf.pages):
                return f"错误：页码 {page_number} 超出范围（有效范围：1-{len(pdf.pages)}）"

            # 获取指定页（pdfplumber 的页码从 0 开始）
            page = pdf.pages[page_number - 1]

            # 提取文本并处理可能的空值
            text = page.extract_text()
            return text.strip() if text else "该页面无文本内容"

    except FileNotFoundError:
        return "错误：文件不存在，请检查路径"
    except Exception as e:
        return f"读取 PDF 时发生错误：{str(e)}"

def append_json_to_file(json_str, file_path):
    """
    将JSON字符串智能追加到指定文件

    参数：
    json_str - 需要追加的JSON字符串（支持对象/数组格式）
    file_path - 目标文件路径

    特性：
    1. 自动处理文件不存在的情况
    2. 智能合并对象/数组类型数据
    3. 保留原始数据格式
    """
    try:
        # 解析输入JSON字符串
        cleaned_str = json_str.strip('` \n')  # 移除首尾反引号、空格、换行
        if cleaned_str.lower().startswith('json'):
            cleaned_str = cleaned_str[4:].lstrip()  # 移除开头的"json"标识

        # print("\n\n待解析json\n",cleaned_str)
        new_data = json.loads(cleaned_str)
        print("\n\n写入\n",cleaned_str)

        # 读取现有数据（文件不存在时初始化空结构)
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                try:
                    existing_data = json.load(f)
                except json.JSONDecodeError:
                    print(f"警告：{file_path} 包含无效JSON，将初始化新数据")
                    existing_data = [] if isinstance(new_data, list) else {}
        else:
            existing_data = [] if isinstance(new_data, list) else {}

        # 智能合并数据结构
        if isinstance(existing_data, list):
            if isinstance(new_data, list):
                existing_data.extend(new_data)
            else:
                existing_data.append(new_data)
        elif isinstance(existing_data, dict):
            existing_data.update(new_data if isinstance(new_data, dict) else {"new_item": new_data})

        # 写回文件（保留原始缩进格式）
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, indent=2, ensure_ascii=False)

        return True
    except json.JSONDecodeError as e:
        print(f"JSON解析失败: {str(e)}")
        return False
    except Exception as e:
        print(f"文件操作异常: {str(e)}")
        return False

def merge_graph(src, dst=None) -> str:
    """
    合并知识图谱JSON数据，返回合并后的JSON字符串

    参数：
    src - 可以是JSON字符串或已解析的字典
    dst - 可以是JSON字符串、已解析的字典或None（默认为None时执行自合并）

    返回：
    合并后的JSON字符串
    """
    def _merge_properties(target_node, source_node):
        """合并节点属性"""
        target_props = target_node.get('properties', [])
        source_props = source_node.get('properties', [])
        merged_props = target_props + [
            p for p in source_props if p not in target_props
        ]
        target_node['properties'] = merged_props
    def parse_input(data):
        """统一处理输入数据，返回解析后的字典"""
        if isinstance(data, str):
            try:
                return json.loads(data)
            except json.JSONDecodeError:
                return {"nodes": [], "links": []}
        return data or {"nodes": [], "links": []}

    # 处理输入数据
    src_data = parse_input(src)
    dst_data = parse_input(dst) if dst is not None else {"nodes": [], "links": []}

    # 构建双重索引字典
    id_node_map = {n['id']: n for n in dst_data['nodes']}
    name_node_map = {}
    for n in dst_data['nodes']:
        if 'name' in n:
            name = n['name'].strip()
            if name not in name_node_map:
                name_node_map[name] = n['id']

    # ID映射表（处理同名节点）
    id_mapping = {}

    # 节点合并主逻辑
    for node in src_data['nodes']:
        current_id = node['id']
        current_name = node.get('name', '').strip()
        
        # 优先检查ID匹配
        if current_id in id_node_map:
            target_node = id_node_map[current_id]
            _merge_properties(target_node, node)
            continue
        
        # 其次检查严格name匹配
        if current_name and current_name in name_node_map:
            mapped_id = name_node_map[current_name]
            target_node = id_node_map[mapped_id]
            id_mapping[current_id] = mapped_id  # 记录ID映射关系
            _merge_properties(target_node, node)
            continue
        
        # 新增节点处理
        id_node_map[current_id] = node
        if current_name:
            name_node_map[current_name] = current_id

    # 更新处理后的节点列表
    merged_nodes = list(id_node_map.values())

    # 关系合并与ID替换
    def _remap_id(node_id):
        return id_mapping.get(node_id, node_id)
    
    all_links = []
    for link in dst_data['links'] + src_data['links']:
        # 应用ID映射
        source = _remap_id(link['source'])
        target = _remap_id(link['target'])
        link_type = link.get('type', '')
        
        # 验证节点存在性
        if source in id_node_map and target in id_node_map:
            all_links.append({
                'source': source,
                'target': target,
                'type': link_type
            })

    # 关系去重
    link_set = set()
    valid_links = [
        link for link in all_links
        if (link['source'], link['target'], link['type']) not in link_set
        and not link_set.add((link['source'], link['target'], link['type']))
    ]

    # 生成最终数据
    merged_data = {
        "nodes": merged_nodes,
        "links": valid_links
    }

    return json.dumps(merged_data, indent= 2, ensure_ascii=False)


def set_graph_root(root, dst=None) -> str:
    """
    设置知识图谱根节点并重构连接关系

    参数：
    root - 根节点字典，必须包含id/name/group字段
    dst - 可以是JSON字符串、已解析的字典或None

    返回：
    处理后的完整图谱JSON字符串
    """

    def parse_input(data):
        """统一处理输入数据，返回解析后的字典"""
        if isinstance(data, str):
            try:
                return json.loads(data)
            except json.JSONDecodeError:
                return {"nodes": [], "links": []}
        return data or {"nodes": [], "links": []}

    # 构建根节点初始数据
    root_data = {
        "nodes": [{
            "id": root["id"],
            "name": root["name"],
            "group": root["group"]
        }],
        "links": []
    }

    # 合并数据
    dst_data = parse_input(dst)
    merged_json = merge_graph(root_data, dst_data)
    merged_data = json.loads(merged_json)

    # 统一所有节点的group
    root_group = root["group"]
    for node in merged_data["nodes"]:
        node["group"] = root_group

    root_id = root["id"]

    # 重构连接关系
    processed_links = []
    existing_edges = set()

    # 第一步：处理现有连接
    for link in merged_data["links"]:
        source, target = link["source"], link["target"]
        link_type = link.get("type", "")

        # 调整连接到根的边方向
        if source == root_id or target == root_id:
            new_source = target if source == root_id else source
            new_target = root_id
            new_type = "from"
        else:
            new_source, new_target, new_type = source, target, link_type

        # 去重处理
        edge_key = (new_source, new_target, new_type)
        if edge_key not in existing_edges:
            existing_edges.add(edge_key)
            processed_links.append({
                "source": new_source,
                "target": new_target,
                "type": new_type
            })

    # 第二步：确保根节点连通性
    adj = defaultdict(list)
    for link in processed_links:
        adj[link["source"]].append(link["target"])
        adj[link["target"]].append(link["source"])  # 无向图

    visited = set()
    components = []

    # 找出所有连通分量
    for node in merged_data["nodes"]:
        nid = node["id"]
        if nid not in visited:
            queue = [nid]
            component = set()
            while queue:
                current = queue.pop(0)
                if current not in visited:
                    visited.add(current)
                    component.add(current)
                    for neighbor in adj[current]:
                        if neighbor not in visited:
                            queue.append(neighbor)
            components.append(component)

    # 添加缺失的连接
    for component in components:
        if root_id not in component:
            # 随机选择一个连接点
            bridge_node = next(iter(component))
            new_link = {
                "source": bridge_node,
                "target": root_id,
                "type": "from"
            }
            edge_key = (bridge_node, root_id, "from")
            if edge_key not in existing_edges:
                processed_links.append(new_link)
                existing_edges.add(edge_key)

    # 最终整理数据
    merged_data["links"] = processed_links

    # 确保根节点在首位
    root_index = next((i for i, n in enumerate(merged_data["nodes"])
                       if n["id"] == root_id), -1)
    if root_index > 0:
        merged_data["nodes"].insert(0, merged_data["nodes"].pop(root_index))

    # 转换为有序字典保证JSON结构稳定性
    ordered_data = OrderedDict([
        ("nodes", merged_data["nodes"]),
        ("links", merged_data["links"])
    ])

    # 返回标准JSON字符串
    return json.dumps(ordered_data, indent=2, ensure_ascii=False)



def json_to_cypher_import(json_str, uri, auth, upper_label):
    """
    将JSON格式的知识图谱数据导入Neo4j
    
    参数：
    json_str - 包含图谱数据的JSON字符串
    uri - Neo4j数据库连接URI
    auth - 认证元组（user, password）
    upper_label - 要添加到所有节点的额外上层标签
    """
    driver = GraphDatabase.driver(uri, auth=auth)
    
    def escape_label(label):
        """转义标签中的反引号"""
        return label.replace('`', '``') if label else label
    
    try:
        data = json.loads(json_str)
        
        # 创建唯一约束
        if upper_label:
            # 转义upper_label中的反引号
            safe_upper = escape_label(upper_label)
            constraint_query = (
                f"CREATE CONSTRAINT IF NOT EXISTS "
                f"FOR (n:`{safe_upper}`) REQUIRE n.id IS UNIQUE"
            )
            with driver.session() as session:
                session.execute_write(lambda tx: tx.run(constraint_query))
        
        # 生成带反引号的节点查询（包含upper_label）
        node_queries = []
        for node in data.get("nodes", []):
            labels = []
            if upper_label:
                # 添加转义后的upper_label
                labels.append(escape_label(upper_label))
            # 处理group标签
            group = node.get('group', 'Entity')
            if group:
                labels.append(escape_label(group))
            # 构建标签字符串
            label_str = ':'.join([f'`{l}`' for l in labels if l])
            # 构造查询和参数
            query = (
                f"MERGE (n:{label_str} {{id: $id}})\n"
                "ON CREATE SET n += $props"
            )
            params = {
                "id": node['id'],
                "props": {k: v for k, v in node.items() if k != 'group'}
            }
            node_queries.append((query, params))
        
        # 生成带反引号的关系查询
        rel_queries = [
            (
                f"MATCH (a {{id: $source}}), (b {{id: $target}})\n"
                f"MERGE (a)-[r:`{link.get('type', 'RELATES_TO')}`]->(b)",
                {
                    "source": link['source'],
                    "target": link['target']
                }
            )
            for link in data.get("links", [])
        ]
        
        # 执行节点插入（每个节点单独处理）
        with driver.session() as session:
            for query, params in node_queries:
                try:
                    session.execute_write(lambda tx: tx.run(query, params))
                except neo4j.exceptions.ConstraintError as e:
                    print(f"节点ID冲突已跳过: {params['id']}")
                except Exception as e:
                    raise RuntimeError(f"节点插入失败: {str(e)}")
            
            # 执行关系插入
            for query, params in rel_queries:
                try:
                    session.execute_write(lambda tx: tx.run(query, params))
                except Exception as e:
                    raise RuntimeError(f"关系插入失败: {str(e)}")
    
    except json.JSONDecodeError as e:
        raise ValueError(f"无效的JSON输入: {str(e)}") from e
    except Exception as e:
        raise RuntimeError(f"数据库操作失败: {str(e)}") from e
    finally:
        driver.close()

