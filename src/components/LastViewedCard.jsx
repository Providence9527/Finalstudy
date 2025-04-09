import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button
} from '@mui/material';

const LastViewedCard = ({ item, width = 740 }) => {
  const navigate = useNavigate();
  const [showReaderDialog, setShowReaderDialog] = useState(false);

  // 使用fmt字段判断文件类型
  const isPDF = item?.fmt === 'pdf';

  const handleCardClick = () => {
    if (!item?.bookId) return;

    if (isPDF) {
      setShowReaderDialog(true);
    } else {
      navigate(`/book/${item.bookId}?returnPath=/diy`);
    }
  };

  const handleReaderChoice = (readerType) => {
    navigate(`/book/${item.bookId}?reader=${readerType}&returnPath=/diy`);
    setShowReaderDialog(false);
  };

  if (!item) {
    return (
      <Card sx={{ 
        width: width,
        minWidth: 275,
        mb: 2,
        borderRadius: '12px',
        bgcolor: 'background.paper',
        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }
      }}>
        <CardContent sx={{ py: 3, textAlign: 'center' }}>
          <Typography 
            variant="body1"
            sx={{ 
              color: 'text.disabled',
              fontStyle: 'italic'
            }}
          >
            暂无浏览记录
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card 
        onClick={handleCardClick}
        sx={{ 
          width: width,
          
          minWidth: 275,
          mb: 2,
          borderRadius: '12px',
          bgcolor: 'background.paper',
          
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            cursor: 'pointer'
          }
        }}>
        <CardContent sx={{ py: 2.5, px: 2.5 }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              fontWeight: 600,
              color: 'primary.main',
              fontSize: '1.1rem',
              letterSpacing: '0.5px'
            }}
          >
            最近访问
          </Typography>

          <Typography 
            variant="h5"
            component="div" 
            sx={{ 
              mb: 1.5,
              fontWeight: 500,
              fontSize: '1.3rem',
              lineHeight: 1.2,
              color: 'text.primary',
              wordBreak: 'break-word'
            }}
          >
            {item.bookTitle || '未命名文档'}
          </Typography>

          <Typography 
            sx={{ 
              mb: 2,
              fontSize: '0.95rem',
              fontStyle: item.author ? 'inherit' : 'italic',
              color: item.author ? 'text.secondary' : 'text.disabled',
              lineHeight: 1.4
            }}
          >
            {item.author || '未知作者'}
          </Typography>

          <Typography 
            variant="body2" 
            sx={{ 
              fontSize: '0.875rem',
              color: 'text.secondary',
              display: 'flex',
              alignItems: 'center',
              '&::before': {
                content: '"⏱ "',
                mr: 0.5,
                fontSize: '0.9em'
              }
            }}
          >
            {new Date(item.lastViewed)
              .toLocaleDateString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
              })
              .replace(/\//g, '-')}
          </Typography>
        </CardContent>
      </Card>

      <Dialog open={showReaderDialog} onClose={() => setShowReaderDialog(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>选择阅读模式</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 1 }}>
            检测到PDF文件，请选择阅读方式：
          </Typography>
          <Typography variant="caption" color="textSecondary">
            高级模式支持标注功能，快速模式加载更快
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 2, justifyContent: 'center' }}>
          <Button 
            variant="outlined"
            color="primary"
            onClick={() => handleReaderChoice('pdfjs')}
            sx={{ 
              width: 160,
              height: 48,
              fontWeight: 500
            }}
          >
            PDF.js 高级模式
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleReaderChoice('embedded')}
            sx={{ 
              width: 160,
              height: 48,
              fontWeight: 500
            }}
          >
            内置快速阅读器
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default LastViewedCard;