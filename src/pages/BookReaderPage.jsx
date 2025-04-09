// BookReaderPage.jsx
import { useState, useEffect } from 'react';
import { 
  useParams, useNavigate, useSearchParams 
} from 'react-router-dom';
import { 
  Box, CircularProgress, Typography, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { fetchBookContent } from '../api/learning';
import { saveReadingProgress } from '../api/learning';
import { useAuth } from '../contexts/AuthContext';
import EpubReader from '../components/EpubReader';
import PdfViewer from '../components/PdfViewer';
import TextReader from '../components/TextReader';
import MobiViewer from '../components/MobiViewer';
import { useTimeTracking } from '../hooks/useTimeTracking';
import SmartAssistant from '../components/SmartAssistant';

const SUPPORTED_TYPES = ['pdf', 'epub', 'txt', 'mobi'];

export default function BookReaderPage() {
  useTimeTracking();
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const [readingProgress, setReadingProgress] = useState(0.0);
  const [state, setState] = useState({
    loading: true,
    error: null,
    content: { type: null, url: null, meta: {} },
    bookMeta: null
  });

  const [showFallbackDialog, setShowFallbackDialog] = useState(false);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const response = await fetchBookContent(id);
        if (!SUPPORTED_TYPES.includes(response.type)) {
          throw new Error(`不支持的文件格式: ${response.type}`);
        }

        setState({
          loading: false,
          error: null,
          content: {
            type: response.type,
            url: response.url,
            meta: {
              title: response.meta?.title || '未知文档',
              size: response.meta?.fileSize || 0
            }
          },
          bookMeta: response.meta,
        });
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message
        }));
      }
    };

    loadContent();
  }, [id]);

  useEffect(() => {
    const setAppHeight = () => {
      document.documentElement.style.setProperty('--app-height', `${window.innerHeight}px`);
    };
    window.addEventListener('resize', setAppHeight);
    setAppHeight();
    return () => window.removeEventListener('resize', setAppHeight);
  }, []);

  const saveProgress = async (progressValue) => {
    try {
      if (user?.userId && state.bookMeta) {
        await saveReadingProgress({
          userId: user.userId,
          bookId: id,
          title: state.bookMeta.title || '未知文档',
          author: state.bookMeta.author || '未知作者',
          fmt: state.bookMeta.fmt,
          progress: progressValue,
          lastViewed: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('进度保存失败:', error);
    }
  };

  const handleGoBack = async () => {
    const returnPath = searchParams.get('returnPath') || '/plaza';
    await saveProgress(readingProgress);
    navigate(returnPath, { replace: true });
  };

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      saveProgress(readingProgress);
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, state.bookMeta, id, readingProgress]);

  if (state.loading) {
    return (
      <Box sx={{ 
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'var(--app-height, 100vh)'
      }}>
        <CircularProgress size={80} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3 }}>
          正在初始化阅读器...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ 
      height: 'var(--app-height, 100vh)',
      position: 'relative',
      overflow: 'hidden',
      isolation: 'isolate',
      '& *': {
        touchAction: 'manipulation'
      }
    }}>
      <Box sx={{ 
        position: 'fixed',
        zIndex: 10001,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        '& > *': { 
          pointerEvents: 'auto',
          touchAction: 'none'
        }
      }}>
        <SmartAssistant />
      </Box>

      <IconButton
        sx={{ 
          position: 'absolute',
          right: 16,
          top: 16,
          zIndex: 10002,
          backgroundColor: 'rgba(255,255,255,0.9)',
          '&:hover': { backgroundColor: '#fff' }
        }}
        onClick={handleGoBack}
      >
        <CloseIcon fontSize="large" />
      </IconButton>

      {state.error ? (
        <Box sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: 'var(--app-height, 100vh)'
        }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            文档加载失败
          </Typography>
          <Typography variant="body2">{state.error}</Typography>
        </Box>
      ) : (
        <Box sx={{
          position: 'relative',
          zIndex: 9999,
          height: '100%',
          width: '100%',
          '& > *': {
            height: '100%',
            width: '100%',
            touchAction: 'pan-y'
          }
        }}>
          {state.content.type === 'pdf' && (
            <PdfViewer 
              url={state.content.url}
              mode={searchParams.get('reader')}
              onMaxRetry={() => setShowFallbackDialog(true)}
              onProgressChange={setReadingProgress}
            />
          )}
          {state.content.type === 'epub' && (
            <EpubReader 
              url={state.content.url}
              onProgressChange={setReadingProgress}
            />
          )}
          {state.content.type === 'txt' && (
            <TextReader 
              url={state.content.url}
              onProgressChange={setReadingProgress}
            />
          )}
          {state.content.type === 'mobi' && (
            <MobiViewer 
              url={state.content.url}
              onProgressChange={setReadingProgress}
            />
          )}
        </Box>
      )}

      <Dialog open={showFallbackDialog} onClose={() => setShowFallbackDialog(false)}>
        <DialogTitle>PDF加载失败</DialogTitle>
        <DialogContent>
          <Typography>是否切换到内置阅读器？</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowFallbackDialog(false)}>取消</Button>
          <Button 
            onClick={() => {
              navigate(`/book/${id}?reader=embedded`, { replace: true });
              setShowFallbackDialog(false);
            }}
            variant="contained"
          >
            立即切换
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}