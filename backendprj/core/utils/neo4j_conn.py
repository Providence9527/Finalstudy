from neo4j import GraphDatabase
from django.conf import settings

class Neo4jClient:
    _instance = None
    
    def __init__(self):
        # 从 settings.py 获取配置
        config = settings.NEO4J_CONFIG
        
        # 初始化认证参数
        auth = (config['USER'], config['PASSWORD'])
        
        # 创建带认证的驱动连接
        self.driver = GraphDatabase.driver(
            config['URI'],
            auth=auth,
            encrypted=config['ENCRYPTED']
        )
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_session(self):
        return self.driver.session()

# -------------------------------- 使用示例 --------------------------------
# 在视图层调用：
# client = Neo4jClient.get_instance()
# with client.get_session() as session:
#     result = session.run("MATCH (n) RETURN n LIMIT 5")