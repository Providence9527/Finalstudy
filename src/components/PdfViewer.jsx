import { useState, useEffect, useRef } from 'react';
import { Viewer, SpecialZoomLevel } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { Box, CircularProgress, Typography } from '@mui/material';
import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';

const configurePDFJS = () => {
  if (typeof window === 'undefined') return;
  pdfjsLib.GlobalWorkerOptions.workerSrc = `${window.location.origin}/pdf.worker.min.js`;
};
configurePDFJS();

export default function PdfViewer({ url, mode = 'pdfjs', onMaxRetry, onProgressChange }) {
  const [retryCount, setRetryCount] = useState(0);
  const [validationPassed, setValidationPassed] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const defaultLayout = defaultLayoutPlugin();
  const viewerRef = useRef(null);

  // 双模式通用验证逻辑
  useEffect(() => {
    const controller = new AbortController();
    let isMounted = true;

    const validatePdf = async () => {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (!response.ok || !response.headers.get('content-type')?.includes('pdf')) {
          throw new Error('Invalid PDF');
        }
        return true;
      } catch (error) {
        throw new Error('PDF验证失败');
      }
    };

    const loadDocument = async () => {
      try {
        if (mode === 'pdfjs') {
          const loadingTask = pdfjsLib.getDocument({ url });
          
          loadingTask.onProgress = (progressParams) => {
            // console.debug('[PDF.js] 文件加载进度:', {
            //   已加载: `${(progressParams.loaded / 1024).toFixed(1)}KB`,
            //   总大小: progressParams.total ? `${(progressParams.total / 1024).toFixed(1)}KB` : '计算中...'
            // });
          };

          const pdf = await loadingTask.promise;
          if (isMounted) {
            setTotalPages(pdf.numPages);
            setValidationPassed(true);
          }
        } else {
          setValidationPassed(true);
        }
      } catch (error) {
        if (isMounted) setRetryCount(c => (c < 3 ? c + 1 : c));
      }
    };

    const initialize = async () => {
      try {
        await validatePdf();
        loadDocument();
      } catch (error) {
        if (isMounted) setRetryCount(c => (c < 3 ? c + 1 : c));
      }
    };

    initialize();
    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [url, mode]);

  // 处理最大重试次数
  useEffect(() => {
    if (retryCount >= 3) onMaxRetry?.();
  }, [retryCount, onMaxRetry]);

  const handleDocumentLoad = ({ doc }) => {
    setTotalPages(doc.numPages);
    console.log('[PDF.js] 文档结构加载完成，总页数:', doc.numPages);
  };

  // 页面变化处理（增强版监控）
  const handlePageChange = async (current) => {
    if (!current?.doc) {
      console.warn('文档实例未就绪，跳过页面加载监控');
      return;
    }

    try {
      const pageNumber = current.currentPage + 1; // 转换为1-based页码
      const page = await current.doc.getPage(pageNumber).catch(error => {
        throw new Error(`获取第${pageNumber}页失败: ${error.message}`);
      });

      // 安全访问页面属性
      const viewport = page?.viewport || { width: 0, height: 0 };
      const textContent = await page?.getTextContent?.().catch(() => ({ items: [] }));

      console.debug(`[PDF.js] 第 ${pageNumber} 页内容已加载`, {
        页面尺寸: `${viewport.width.toFixed(1)}x${viewport.height.toFixed(1)}px`,
        文本摘要: textContent?.items?.slice(0, 3).map(i => i.str) || [],
        渲染状态: page?._transport?.readyState || 'unknown'
      });

      // 更新阅读进度
      if (mode === 'pdfjs' && totalPages > 0) {
        const safeProgress = Math.min((pageNumber / totalPages), 1).toFixed(2);
        onProgressChange?.(parseFloat(safeProgress));
      }
    } catch (error) {
      console.error('页面监控异常:', error.message, {
        页码: current?.currentPage + 1,
        文档状态: current?.doc?.numPages ? 'ready' : 'loading'
      });
    }
  };

  return (
    <Box sx={{ height: 'calc(100vh - 64px)', position: 'relative' }}>
      {mode === 'pdfjs' ? (
        validationPassed ? (
          <Viewer
            ref={viewerRef}
            fileUrl={url}
            plugins={[defaultLayout]}
            onPageChange={handlePageChange}
            onDocumentLoad={handleDocumentLoad}
            httpHeaders={{ 'Accept-Encoding': 'identity' }}
            onError={(error) => {
              console.error('PDF渲染错误:', error);
              setRetryCount(c => c + 1);
            }}
          />
        ) : (
          <LoadingOverlay retryCount={retryCount} />
        )
      ) : validationPassed ? (
        <Box 
          component="embed" 
          src={url} 
          type="application/pdf"
          sx={{ 
            width: '100%', 
            height: '100%', 
            border: 'none',
            '&::-webkit-scrollbar': { width: '8px' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: '#888' }
          }}
          onError={() => setRetryCount(c => c + 1)}
        />
      ) : (
        <LoadingOverlay retryCount={retryCount} />
      )}
    </Box>
  );
}

function LoadingOverlay({ retryCount }) {
  return (
    <Box sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      gap: 2
    }}>
      <CircularProgress size={60} thickness={4} />
      <Typography color="textSecondary">
        {retryCount > 0 ? `正在重试加载 (${retryCount}/3)` : '正在验证文件'}
      </Typography>
    </Box>
  );
}