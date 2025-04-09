import React, { useState, useEffect } from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  DialogActions,
  Button,
  CircularProgress
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getFolders, createFolder, addToFolder } from '../api/learning';
import '../styles/main.css';

const FolderMenu = ({ userId, bookId, anchorEl, onClose }) => {
  const [folders, setFolders] = useState([]);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Toast自动隐藏逻辑
  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // 获取文件夹列表
  useEffect(() => {
    const fetchFolders = async () => {
      try {
        const response = await getFolders(userId);
        setFolders(response.data.folders || []);
      } catch (error) { 
        console.error('获取文件夹失败:', error);
      }
    };
    if (anchorEl) fetchFolders();
  }, [anchorEl, userId]);

  // 添加到文件夹
  const handleAddToFolder = async (folder) => {
    try {
      await addToFolder(userId, folder, bookId);
      setToastMessage(`已添加到 ${folder}`);
      setShowToast(true);
      onClose();
    } catch (error) {
      alert(`添加失败: ${error.message}`);
    }
  };

  // 创建新文件夹
  const handleCreateFolder = async () => {
    const trimmedName = folderName.trim();
    if (!trimmedName) {
      alert('文件夹名称不能为空');
      return;
    }
    if (folders.includes(trimmedName)) {
      alert('文件夹已存在');
      return;
    }

    setLoading(true);
    try {
      await createFolder(userId, trimmedName, bookId);
      setFolders(prev => [...prev, trimmedName]);
      setToastMessage(`文件夹 ${trimmedName} 创建成功`);
      setShowToast(true);
      setNewFolderOpen(false);
      setFolderName('');
    } catch (error) {
      alert(`创建失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 成功提示Toast */}
      {showToast && (
        <div className="toast-success">
          <CheckCircleIcon fontSize="small" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 文件夹菜单 */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {folders.map(folder => (
          <MenuItem key={folder} onClick={() => handleAddToFolder(folder)}>
            {folder}
          </MenuItem>
        ))}
        <MenuItem onClick={() => setNewFolderOpen(true)}>
          <ListItemIcon><AddIcon fontSize="small" /></ListItemIcon>
          <ListItemText
            primary="新建文件夹"
            sx={{
              pl: 1,
              '& .MuiListItemText-primary': {
                fontFamily: '"Noto Sans SC", sans-serif',
                fontWeight: 500,
                color: '#2e7d32',
                fontSize: '0.95rem',
                letterSpacing: '0.03em'
              }
            }}
          />
        </MenuItem>
      </Menu>

      {/* 新建文件夹弹窗 */}
      <Dialog open={newFolderOpen} onClose={() => setNewFolderOpen(false)}>
        <DialogTitle>新建文件夹</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="文件夹名称"
            fullWidth
            value={folderName}
            onChange={(e) => setFolderName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewFolderOpen(false)}>取消</Button>
          <Button 
            onClick={handleCreateFolder}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            创建
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default FolderMenu;