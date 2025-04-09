import { useState } from 'react';
import { 
  Button, Card, CardContent, CardMedia, Typography, Chip, Rating, 
  Divider, Stack, Grid, Box, Dialog, DialogTitle, DialogContent, DialogActions,
  useMediaQuery 
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material/styles';
//import { useAuth } from '../contexts/AuthContext';
import FolderMenu from './FolderMenu';
import { useAuth } from '../contexts/AuthContext';


export default function MaterialCard({ material }) {
  //console.log(material.thumbnail_url)
  // console.log(material)
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  //const { user } = useAuth();
  const [showReaderDialog, setShowReaderDialog] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleRead = () => {
    const availableFormats = material.formats || [];
    if (!availableFormats.length) {
      console.error('无可用文件格式', material);
      alert('该书籍暂无可用阅读资源');
      return;
    }

    if (availableFormats.includes('pdf')) {
      setShowReaderDialog(true);
    } else {
      navigate(`/book/${material._id}`);
    }
  };

  const handleReaderChoice = (readerType) => {
    navigate(`/book/${material._id}?reader=${readerType}`);
    setShowReaderDialog(false);
  };

  return (
    <>
      <Card sx={{ 
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        transition: '0.3s',
        '&:hover': { 
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)', 
          transform: 'translateX(-2px)' 
        },
        minHeight: 200,
        mb: 2,
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* 封面图片 */}
        <CardMedia
          component="img"
          sx={{ 
            width: { xs: '100%', sm: 200 },
            height: { xs: 220, sm: '100%' },
            objectFit: 'cover',
            flexShrink: 0
          }}
          image={material.thumbnail_url}
          alt={material.book_title}
          onError={(e) => {
            if (!e.target.src.endsWith('/default-book.jpg')) {
              e.target.src = '/default-book.jpg';
            }
          }}
        />

        {/* 主内容容器 */}
        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          position: 'relative'
        }}>
          <CardContent sx={{ 
            flex: 1,
            p: { xs: 2, sm: 2.5 },
            '&:last-child': { pb: 2.5 }
          }}>
            {/* 标题和评分 */}
            <Stack direction="row" justifyContent="space-between" sx={{ mb: 1.5 }}>
              <Typography variant="h6" sx={{
                fontSize: { xs: '1.1rem', sm: '1.2rem' },
                fontWeight: 600,
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical'
              }}>
                {material.book_title}
              </Typography>
              <Rating 
                value={material.rating || 0} 
                precision={0.5} 
                readOnly 
                size={isMobile ? 'small' : 'medium'}
                sx={{ ml: 1 }}
              />
            </Stack>

            {/* 书籍信息 */}
            <Stack spacing={0.5} sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                作者：{material.author || '未知作者'}
              </Typography>
              {material.press && (
                <Typography variant="body2" color="text.secondary">
                  出版社：{material.press}
                </Typography>
              )}
            </Stack>

            <Divider sx={{ mb: 2 }} />

            {/* 标签和格式 */}
            <Grid container spacing={1}>
              {material.book_tags?.map((tag) => (
                <Grid item key={`tag-${tag}-${material._id}`}>
                  <Chip 
                    label={tag}
                    size="small"
                    color="primary"
                    variant="outlined"
                    sx={{ fontSize: '0.75rem' }}
                  />
                </Grid>
              ))}
              {material.formats?.map((format) => (
                <Grid item key={`format-${format}-${material._id}`}>
                  <Chip 
                    label={format.toUpperCase()}
                    size="small"
                    sx={{ 
                      fontSize: '0.75rem',
                      backgroundColor: 'grey.100',
                      textTransform: 'uppercase'
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </CardContent>

          {/* 操作按钮容器 */}
          <Box sx={{ 
            p: 2,
            pt: 0,
            display: 'flex',
            gap: 1.5,
            flexWrap: 'wrap',
            justifyContent: { xs: 'center', sm: 'flex-end' },
            borderTop: { xs: '1px solid', sm: 'none' },
            borderColor: { xs: 'divider', sm: 'transparent' },
            mt: 'auto'
          }}>
            <Button 
              variant="contained" 
              size={isMobile ? 'small' : 'medium'}
              sx={{ 
                minWidth: 120,
                flex: { xs: '1 1 100%', sm: '0 0 auto' },
                maxWidth: { xs: 'none', sm: 120 }
              }}
              onClick={handleRead}
            >
              立即阅读
            </Button>
            <Button
              variant="outlined"
              size={isMobile ? 'small' : 'medium'}
              sx={{ 
                minWidth: 120,
                flex: { xs: '1 1 100%', sm: '0 0 auto' },
                maxWidth: { xs: 'none', sm: 120 },
                borderWidth: 2
              }}
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              加入书架
            </Button>
            <FolderMenu 
              bookId={material._id}
              userId={user.userId}
              anchorEl={anchorEl}
              onClose={() => setAnchorEl(null)}
            />
          </Box>
        </Box>
      </Card>

      {/* PDF阅读器选择对话框 */}
      <Dialog open={showReaderDialog} onClose={() => setShowReaderDialog(false)}>
        <DialogTitle>选择阅读方式</DialogTitle>
        <DialogContent>
          <Typography variant="body1">请选择PDF阅读方式：</Typography>
        </DialogContent>
        <DialogActions sx={{ 
          p: 2, 
          gap: 2,
          flexWrap: 'nowrap',
          justifyContent: 'center'
        }}>
          <Button 
            variant="outlined"
            onClick={() => handleReaderChoice('pdfjs')}
            sx={{ 
              flex: '1 1 auto',
              minWidth: 'max-content',
              whiteSpace: 'nowrap'
            }}
          >
            高级模式（PDF.js）
          </Button>
          <Button
            variant="contained"
            onClick={() => handleReaderChoice('embedded')}
            sx={{ 
              flex: '1 1 auto',
              minWidth: 'max-content',
              whiteSpace: 'nowrap'
            }}
          >
            快速模式（内置阅读器）
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}