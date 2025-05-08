#mongo_conn.py
from pymongo import MongoClient
from django.conf import settings


class MongoDBClient:
    _instance = None
    
    def __init__(self):
        # 从配置读取连接参数
        config = settings.MONGODB_CONFIG
        self.client = MongoClient(
            host=config['HOST'],
            port=config['PORT'],
            username=config['USER'],
            password=config['PASSWORD'],
            authSource=config['AUTH_SOURCE'],
            authMechanism=config['AUTH_MECHANISM']
        )
        self.db = self.client['backendb']  # 你的数据库名
    
    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def get_collection(self, collection_name):
        return self.db[collection_name]
    
    