import { useEffect, useState } from 'react';
import { 
  IconButton, 
  Tooltip, 
  Box, 
  CircularProgress,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { deleteFolder } from '../api/learning';
import { useAuth } from '../contexts/AuthContext';

const CustomFolders = ({ folders, selectedFolder, onSelectFolder, onFolderChange }) => {
  const [localFolders, setLocalFolders] = useState([]);
  const [deletingFolder, setDeletingFolder] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedFolderToDelete, setSelectedFolderToDelete] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const defaultFolder = '我喜欢的书籍';
    const filtered = folders.filter(f => f !== defaultFolder);
    setLocalFolders([defaultFolder, ...filtered]);
  }, [folders]);

  const handleDeleteConfirm = async () => {
    if (!selectedFolderToDelete) return;
    
    try {
      setDeletingFolder(selectedFolderToDelete);
      await deleteFolder(user.userId, selectedFolderToDelete);
      
      setLocalFolders(prev => prev.filter(f => f !== selectedFolderToDelete));
      onFolderChange?.();
      
      if (selectedFolder === selectedFolderToDelete) {
        onSelectFolder('我喜欢的书籍');
      }
    } catch (error) {
      alert(`删除失败: ${error.message}`);
    } finally {
      setDeletingFolder(null);
      setDeleteDialogOpen(false);
      setSelectedFolderToDelete(null);
    }
  };

  return (
    <Box sx={{ p: 1 }}>
      {/* 删除确认对话框 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: '12px',
            width: '400px',
            py: 1
          }
        }}
      >
        <DialogTitle sx={{ 
          fontWeight: 600,
          borderBottom: '1px solid',
          borderColor: 'divider',
          pb: 1.5
        }}>
          <DeleteOutlineIcon sx={{ 
            color: 'error.main',
            mr: 1.5,
            verticalAlign: 'middle',
            fontSize: '1.5rem'
          }}/>
          确认删除文件夹
        </DialogTitle>
        
        <DialogContent sx={{ py: 3 }}>
          <Typography variant="body1">
            确定要永久删除
            <Box component="span" sx={{ 
              color: 'error.main', 
              fontWeight: 500, 
              mx: 0.5 
            }}>
              「{selectedFolderToDelete}」
            </Box>
            吗？此操作不可恢复。
          </Typography>
        </DialogContent>
        
        <DialogActions sx={{ 
          px: 3, 
          pb: 2,
          gap: 2
        }}>
          <Button 
            variant="outlined"
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ 
              borderRadius: '8px',
              px: 3,
              textTransform: 'none'
            }}
          >
            取消
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteConfirm}
            disabled={deletingFolder === selectedFolderToDelete}
            sx={{
              borderRadius: '8px',
              px: 3,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: 'error.dark'
              }
            }}
          >
            {deletingFolder === selectedFolderToDelete ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              '确认删除'
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 文件夹列表 */}
      <Typography variant="subtitle2" sx={{ 
        mb: 1, 
        color: 'text.secondary',
        fontWeight: 500,
        letterSpacing: 0.5
      }}>
        我的书库
      </Typography>
      
      {localFolders.map(folder => (
        <Box
          key={folder}
          sx={{
            display: 'flex',
            alignItems: 'center',
            borderRadius: 1,
            bgcolor: selectedFolder === folder ? 'action.selected' : 'transparent',
            '&:hover': { 
              bgcolor: 'action.hover',
              '& .delete-button': {
                visibility: 'visible'
              }
            },
            mb: 0.5,
            position: 'relative'
          }}
        >
          <Box
            component="div"
            onClick={() => onSelectFolder(folder)}
            sx={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              px: 2,
              py: 1.2,
              cursor: 'pointer',
              userSelect: 'none'
            }}
          >
            <FolderIcon sx={{ 
              mr: 1.5, 
              fontSize: '2.5rem',
              color: selectedFolder === folder ? 'primary.main' : 'text.primary',
              transition: 'color 0.2s ease'
            }}/>
            <Typography 
              variant="body2" 
              noWrap
              sx={{
                color: selectedFolder === folder ? 'text.primary' : 'text.secondary',
                fontWeight: selectedFolder === folder ? 500 : 400
              }}
            >
              {folder}
            </Typography>
          </Box>
          
          {folder !== '我喜欢的书籍' && (
            <Tooltip title="删除选中文件夹" arrow>
              <IconButton
                className="delete-button"
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedFolderToDelete(folder);
                  setDeleteDialogOpen(true);
                }}
                disabled={deletingFolder === folder}
                sx={{ 
                  mr: 1,
                  visibility: selectedFolder === folder ? 'visible' : 'hidden',
                  color: theme => theme.palette.grey[600],
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: theme => theme.palette.error.main,
                    backgroundColor: 'transparent'
                  }
                }}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ))}
    </Box>
  );
};

export default CustomFolders;