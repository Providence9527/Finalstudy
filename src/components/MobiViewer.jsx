// src/components/MobiViewer.jsx
import { useState, useEffect, useRef,useCallback } from 'react';
import { Box, CircularProgress } from '@mui/material';

export default function MobiViewer({ url, onProgressChange }) {
  const iframeRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // MOBI进度跟踪
  const handleScroll = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      const doc = iframe.contentDocument;
      const scrollTop = doc.documentElement.scrollTop;
      const totalHeight = doc.documentElement.scrollHeight - doc.documentElement.clientHeight;
      const progress = totalHeight > 0 ? (scrollTop / totalHeight) : 0;
      onProgressChange(parseFloat(progress.toFixed(2)));
    } catch (error) {
      console.error('MOBI进度跟踪错误:', error);
    }
  }, [onProgressChange]);

  // 加载完成后初始化
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const handleLoad = () => {
      setLoading(false);
      iframe.contentWindow.addEventListener('scroll', debounce(handleScroll, 100));
    };

    iframe.addEventListener('load', handleLoad);
    return () => {
      iframe.removeEventListener('load', handleLoad);
      iframe.contentWindow?.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <Box sx={{ height: '100vh', position: 'relative' }}>
      {loading && (
        <CircularProgress sx={{ 
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }} />
      )}
      <iframe
        ref={iframeRef}
        src={url}
        title="mobi-viewer"
        style={{ 
          width: '100%',
          height: '100%',
          border: 'none',
          visibility: loading ? 'hidden' : 'visible'
        }}
      />
    </Box>
  );
}

const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
};