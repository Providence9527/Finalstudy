import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  getFolders,
  createFolder,
  fetchLastViewed,
  fetchMaterialsByFolder 
} from '../api/learning';
import SearchBox from '../components/SearchBox';
import BookGridItem from '../components/BookGridItem';
import LastViewedCard from '../components/LastViewedCard';
import CustomFolders from '../components/CustomFolders';
import ImportButton from '../components/ImportButton';
import { Typography } from '@mui/material';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import '../styles/main.css';
import { useTimeTracking } from '../hooks/useTimeTracking';

const Diy = () => {
  useTimeTracking();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [lastViewed, setLastViewed] = useState(null);
  const [localMaterials, setLocalMaterials] = useState([]);
  const [folders, setFolders] = useState([]);

  // 保持与Plaza相同的初始化逻辑
  const initializeFolders = async (userId) => {
    try {
      const { data } = await getFolders(userId);
      const folderNames = data?.folders?.map(f => 
        typeof f === 'string' ? f : f.name
      ) || [];
      
      if (!folderNames.includes('我喜欢的书籍')) {
        await createFolder(userId, '我喜欢的书籍', '');
        setFolders(['我喜欢的书籍', ...folderNames]);
        setSelectedFolder('我喜欢的书籍');
      } else {
        setFolders(folderNames);
        setSelectedFolder(folderNames[0]);
      }
    } catch (error) {
      setFolders(['我喜欢的书籍']);
      setSelectedFolder('我喜欢的书籍');
    }
  };

  useEffect(() => {
    const initData = async () => {
      if (user?.userId) {
        await initializeFolders(user.userId);
        try {
          const lastViewedData = await fetchLastViewed(user.userId);
          setLastViewed(lastViewedData || null);
          //console.log("取回数据   ",lastViewedData )
          //console.log("设置  ", lastViewed)
        } catch (error) {
          console.error('最近浏览加载失败:', error);
        }
      }
    };
    initData();
  }, [user]);

  
  useEffect(() => {
    const loadMaterials = async () => {
      try {
        if (user?.userId && selectedFolder) {
          const res = await fetchMaterialsByFolder(user.userId, selectedFolder);
          //console.log("取回教材",res)
          const validData = Array.isArray(res?.data) 
            ? res.data.map(item => ({
                ...item,
                thumbnail: item.thumbnail || '/default-book.jpg',
                formats: Object.keys(item.file_info || {})
              }))
            : [];
          setLocalMaterials(validData);
        }
      } catch (error) {
        setLocalMaterials([]);
      }
    };
    loadMaterials();
  }, [user, selectedFolder]);

  // 保持与Plaza完全相同的搜索逻辑
  const filteredMaterials = localMaterials.filter(material => {
    const searchKey = searchTerm.toLowerCase();
    return (
      material.book_title?.toLowerCase().includes(searchKey) ||
      material.author?.toLowerCase().includes(searchKey) ||
      material.formats?.some(f => f.includes(searchKey))
    );
  });

  // 统一导入逻辑
  const handleImportLocal = (file) => {
    const newMaterial = {
      _id: `local_${Date.now()}`,
      book_title: file.name,
      author: '本地文件',
      formats: [file.type.split('/')[1]],
      thumbnail_url: URL.createObjectURL(file),
      lastViewed: new Date().toISOString()
    };
    setLocalMaterials(prev => [...prev, newMaterial]);
    setLastViewed(newMaterial);
  };

  const handleImportURL = (url) => {
    const newMaterial = {
      _id: `url_${Date.now()}`,
      book_title: `网络资源: ${url.substring(0, 25)}...`,
      author: new URL(url).hostname,
      formats: ['web'],
      thumbnail_url: '/default-book.jpg',
      lastViewed: new Date().toISOString()
    };
    setLocalMaterials(prev => [...prev, newMaterial]);
    setLastViewed(newMaterial);
  };

  return (
    <div className="diy-layout">
      <div className="left-panel">
        <SearchBox 
          value={searchTerm}
          placeholder="搜索教材..."
          onChange={(value) => setSearchTerm(value)}
          delay={300} // 与Plaza保持相同的防抖时间
        />
        
        <CustomFolders 
          folders={folders}
          selectedFolder={selectedFolder}
          onSelectFolder={setSelectedFolder}
        />
      </div>

      <div className="right-panel">
        <div className="panel-header">
          <div className="last-viewed-container">
            {lastViewed ? (
               <LastViewedCard item={lastViewed} style={{ position: 'relative', zIndex: 1 }} />
            ) : (
              <div className="empty-state-card">
                <Typography variant="h6">最近浏览</Typography>
                <Typography color="textSecondary">暂无浏览记录</Typography>
              </div>
            )}
          </div>
          
          <div className="floating-import-container">
            <ImportButton 
              onImportLocal={handleImportLocal}
              onImportURL={handleImportURL}
              sx={{ position: 'sticky', top: 80 }} // 与Plaza保持相同定位
            />
          </div>
        </div>

        <div className="results-section">
          {filteredMaterials.length > 0 ? (
            <div className="book-grid">
              {filteredMaterials.map(material => (
                <BookGridItem
                  currentFolder={selectedFolder}
                  key={material._id}
                  material={material}
                  onRemoveSuccess={() => {
                    // 优化后的数据更新逻辑
                    setLocalMaterials(prev => prev.filter(m => m._id !== material._id));
                    if (lastViewed?._id === material._id) {
                      setLastViewed(null);
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="empty-content">
              <FolderOpenIcon className="empty-icon" />
              <Typography variant="h6">
                {searchTerm ? '没有找到相关内容' : '当前分类暂无数据'}
              </Typography>
              <Typography color="textSecondary">
                {selectedFolder ? '尝试切换分类或修改搜索词' : '请从左侧选择分类'}
              </Typography>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Diy;