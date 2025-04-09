import { useState } from 'react';
import {
  Card,
  CardActionArea,
  Typography,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  CardMedia,
  IconButton
} from '@mui/material';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { removeFromFolder } from '../api/learning';

export default function BookGridItem({ material, currentFolder, onRemoveSuccess }) {
  const navigate = useNavigate();
  const [showReaderDialog, setShowReaderDialog] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { user } = useAuth();

  const handleRemoveInit = (event) => {
    event.stopPropagation();
    setShowConfirmDialog(true);
  };

  const handleConfirmRemove = async () => {
    setIsDeleting(true);
    try {
      await removeFromFolder(user.userId, currentFolder, material._id);
      onRemoveSuccess?.();
    } catch (error) {
      alert(`操作失败: ${error.message}`);
    } finally {
      setIsDeleting(false);
      setShowConfirmDialog(false);
    }
  };

  const handleRead = (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (Object.keys(material.file_info || {}).includes('pdf')) {
      setShowReaderDialog(true);
    } else {
      navigate(`/book/${material._id}?returnPath=/diy`);
    }
  };

  const handleReaderChoice = (readerType) => {
    navigate(`/book/${material._id}?reader=${readerType}&returnPath=/diy`);
    setShowReaderDialog(false);
  };

  const getThumbnailUrl = () => {
    if (!material.thumbnail) return '/default-book.jpg';
    return material.thumbnail.replace(
      '/home/admin/bookstore/uploads/thumbnails/',
      '/media/thumbnails/'
    );
  };

  return (
    <Card sx={{ 
      width: 180,
      height: 220,
      overflow: 'hidden',
      position: 'relative',
      borderRadius: 2,
      boxShadow: 1,
      '&:hover': {
        '& .book-thumbnail': { transform: 'scale(1.05)' },
        '& .remove-button': { opacity: 1 },
        boxShadow: 3
      },
      transition: 'all 0.3s ease'
    }}>
      {/* 删除按钮 */}
      <IconButton
        className="remove-button"
        sx={{
          position: 'absolute',
          right: 0,
          top: 0,
          zIndex: 1,
          opacity: 0,
          transition: 'opacity 0.2s ease',
          color: 'text.secondary',
          '&:hover': {
            color: 'error.main',
            transform: 'scale(0.9)', 
            backgroundColor: 'rgba(255,255,255,0.8)'
          }
        }}
        onClick={handleRemoveInit}
      >
        <RemoveCircleOutlineIcon fontSize="small" />
      </IconButton>

      {/* 删除确认弹窗 */}
      <Dialog
        open={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            p: 2,
            width: 380
          }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1.5 }}>
          <RemoveCircleOutlineIcon color="error" sx={{ mr: 1.5, fontSize: 28 }} />
          <Typography variant="h6" fontWeight="600">移除确认</Typography>
        </DialogTitle>
        
        <DialogContent sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body1" paragraph>
            确定要从「{currentFolder}」移除《{material.book_title}》吗？
          </Typography>
          <Typography variant="body2" color="text.secondary">
            注意：此操作只会从当前分类移除，不会删除书籍文件
          </Typography>
        </DialogContent>

        <DialogActions sx={{ px: 2, py: 2, gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setShowConfirmDialog(false)}
            sx={{ flex: 1, borderRadius: 2 }}
          >
            取消
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmRemove}
            disabled={isDeleting}
            sx={{ flex: 1, borderRadius: 2 }}
            startIcon={<RemoveCircleOutlineIcon />}
          >
            {isDeleting ? '处理中...' : '确认移除'}
          </Button>
        </DialogActions>
      </Dialog>

      <CardActionArea onClick={handleRead} sx={{ height: '100%' }}>
        {/* 缩略图容器 */}
        <Box sx={{ 
          position: 'relative',
          paddingTop: '100%',
          bgcolor: 'rgba(248, 249, 250, 0.9)',
          overflow: 'hidden',
          borderBottom: '1px solid',
          borderColor: 'divider'
        }}>
          <CardMedia
            className="book-thumbnail"
            component="img"
            sx={{
              position: 'absolute',
              top: '8%',
              left: '8%',
              width: '84%',
              height: '90%',
              objectFit: 'contain',
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }}
            image={getThumbnailUrl()}
            alt={material.book_title}
            onError={(e) => {
              e.target.src = '/default-book.jpg';
              e.target.style.objectFit = 'cover';
            }}
          />
        </Box>

        {/* 书籍信息 */}
        <Box sx={{ 
          p: 1,
          height: 76,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          transform: 'translateY(-4px)',
        }}>
          <Typography variant="subtitle2" sx={{
            fontWeight: 600,
            height: '2.6em',
            lineHeight: 1.25,
            fontSize: '0.8rem',
            overflow: 'hidden',
            marginTop: '6px',
            display: '-webkit-box',
            WebkitBoxorient: 'vertical',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            textAlign: 'center',
            color: 'text.primary'
          }}>
            {material.book_title}
          </Typography>

          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="textSecondary" sx={{
              display: 'block',
              fontSize: '0.65rem',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {material.author || '未知作者'}
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 0.3, mt: 0.25 }}>
              {material.book_tags?.slice(0, 2).map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  size="small"
                  sx={{
                    fontSize: '0.55rem',
                    height: 18,
                    maxWidth: 68,
                    '& .MuiChip-label': { px: 0.5 }
                  }}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </CardActionArea>

      {/* 阅读器选择对话框 */}
      <Dialog open={showReaderDialog} onClose={() => setShowReaderDialog(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>选择阅读模式</DialogTitle>
        <DialogContent sx={{ py: 2 }}>
          <Typography variant="body1">请选择PDF阅读方式：</Typography>
          <Typography variant="caption" color="textSecondary">
            高级模式支持标注功能，快速模式加载更快
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 2 }}>
          <Button 
            variant="outlined"
            onClick={() => handleReaderChoice('pdfjs')}
            sx={{ width: 160, height: 48, borderRadius: 2 }}
          >
            PDF.js 高级模式
          </Button>
          <Button
            variant="contained"
            onClick={() => handleReaderChoice('embedded')}
            sx={{ width: 160, height: 48, borderRadius: 2 }}
          >
            内置快速阅读器
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}