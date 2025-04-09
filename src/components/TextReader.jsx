import React, { useState, useEffect, useRef, useCallback } from 'react';

const SUPPORTED_ENCODINGS = ['gb18030', 'utf-8', 'iso-8859-1'];
const BOM_MARKERS = {
  'utf-8': [0xEF, 0xBB, 0xBF],
  'utf-16le': [0xFF, 0xFE],
  'utf-16be': [0xFE, 0xFF]
};

const progressStorage = {
  get: (url) => {
    try {
      const value = localStorage.getItem(`reader::${btoa(url)}`);
      return value ? Math.min(Math.max(parseFloat(value), 0), 1) : 0;
    } catch {
      return 0;
    }
  },
  set: (url, value) => {
    try {
      localStorage.setItem(`reader::${btoa(url)}`, value);
    } catch (error) {
      console.warn('本地存储失败:', error);
    }
  }
};

export default function TextReader({ url, onProgressChange }) {
  const [text, setText] = useState('');
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);
  const lastProgress = useRef(progressStorage.get(url));
  const rafId = useRef(null);

  const decodeText = useCallback(async (buffer) => {
    try {
      const view = new DataView(buffer);
      const detectedEncoding = Object.entries(BOM_MARKERS).find(([, markers]) =>
        markers.every((marker, i) => view.getUint8(i) === marker)
      )?.[0];

      if (detectedEncoding) {
        return new TextDecoder(detectedEncoding).decode(buffer.slice(detectedEncoding === 'utf-8' ? 3 : 2));
      }

      for (const encoding of ['utf-8', ...SUPPORTED_ENCODINGS]) {
        try {
          return new TextDecoder(encoding, { fatal: true }).decode(buffer);
        } catch {
          continue;
        }
      }
      throw new Error('无法识别的编码格式');
    } catch (error) {
      setError(`解码失败: ${error.message}`);
      return '';
    }
  }, []);

  const calculateScrollProgress = useCallback(() => {
    const container = containerRef.current;
    if (!container) return 0;
    
    const scrollTop = container.scrollTop;
    const scrollHeight = container.scrollHeight;
    const clientHeight = container.clientHeight;
    const maxScroll = Math.max(scrollHeight - clientHeight, 0);
    
    return maxScroll > 0 
      ? Math.min(Math.max(scrollTop / maxScroll, 0), 1)
      : 0;
  }, []);

  const handleScroll = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    
    rafId.current = requestAnimationFrame(() => {
      const newProgress = calculateScrollProgress();
      setProgress(newProgress);
      onProgressChange?.(newProgress);
    });
  }, [onProgressChange, calculateScrollProgress]);

  const handleProgressChange = useCallback((e) => {
    const newProgress = parseFloat(e.target.value);
    setProgress(newProgress);
    
    if (rafId.current) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      const container = containerRef.current;
      if (container) {
        const scrollHeight = container.scrollHeight - container.clientHeight;
        container.scrollTop = newProgress * scrollHeight;
      }
    });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    
    const loadTextContent = async () => {
      try {
        const response = await fetch(url, { signal: controller.signal });
        const buffer = await response.arrayBuffer();
        const content = await decodeText(buffer);
        if (!controller.signal.aborted) {
          setText(content);
          setIsLoading(false);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setError(error instanceof Error ? error.message : '未知错误');
          setIsLoading(false);
        }
      }
    };

    loadTextContent();
    return () => controller.abort();
  }, [url, decodeText]);

  useEffect(() => {
    if (isLoading) return;

    const container = containerRef.current;
    if (!container) return;

    // 恢复滚动位置
    requestAnimationFrame(() => {
      const scrollHeight = container.scrollHeight - container.clientHeight;
      container.scrollTop = lastProgress.current * scrollHeight;
      setProgress(lastProgress.current);
    });

    const handler = () => handleScroll();
    container.addEventListener('scroll', handler, { passive: true });
    
    return () => {
      container.removeEventListener('scroll', handler);
      if (rafId.current) cancelAnimationFrame(rafId.current);
      progressStorage.set(url, lastProgress.current);
    };
  }, [isLoading, handleScroll, url]);

  useEffect(() => {
    lastProgress.current = progress;
  }, [progress]);

  if (error) return <div className="error-message">{error}</div>;
  if (isLoading) return <div className="loading-indicator">加载中...</div>;

  return (
    <div className="text-reader-container">
      <div 
        ref={containerRef} 
        className="scroll-viewport"
        style={{ overflowY: isLoading ? 'hidden' : 'auto' }}
      >
        <article className="text-content">
          {text.split('\n').map((line, index) => (
            <div 
              key={index}
              className={`text-line ${/^第[\u4e00-\u9fa5\d]+章/.test(line) ? 'chapter' : ''}`}
            >
              {line.replace(/[\u3000 ]{2}/g, '\u3000')}
            </div>
          ))}
        </article>
      </div>
      
      <div className="progress-container">
        <div className="progress-info">
          <span>{(progress * 100).toFixed(1)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.001"
          value={progress}
          onChange={handleProgressChange}
          className="progress-bar"
        />
      </div>
    </div>
  );
}

const styles = `
.text-reader-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgb(231, 228, 178);
  font-family: system-ui, -apple-system, sans-serif;
}

.scroll-viewport {
  height: calc(100vh - 60px);
  overflow-y: auto;
  padding: 2rem calc(50% - 400px);
  scrollbar-width: none;
  scroll-behavior: smooth;
}

.scroll-viewport::-webkit-scrollbar {
  display: none;
}

.text-content {
  max-width: 800px;
  margin: 0 auto;
  white-space: pre-line;
  line-height: 1.7;
  padding-bottom: 20px;
}

.text-line {
  padding: 0.4rem 0;
  color: #333;
  font-size: 1.1rem;
  letter-spacing: 0.05em;
  user-select: none;
}

.text-line.chapter {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 2rem 0 1rem;
  border-bottom: 2px solid #eee;
}

.error-message,
.loading-indicator {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.2rem;
  padding: 16px 24px;
  border-radius: 8px;
  background: white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.error-message {
  color: #c92a2a;
  border: 1px solid #ffc9c9;
}

.loading-indicator {
  color: #495057;
}

.progress-container {
  position: fixed;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 4rem);
  max-width: 800px;
  z-index: 100;
  padding: 10px 0;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  backdrop-filter: blur(2px);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.progress-info {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border-radius: 4px;
  font-size: 0.9rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0.9;
  transition: opacity 0.3s;
}

.progress-info::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 12px;
  border-width: 4px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.8) transparent transparent;
}

.progress-bar {
  width: calc(100% - 40px);
  height: 4px;
  margin: 0 20px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 2px;
  outline: none;
  transition: background 0.3s;
  -webkit-appearance: none;
}

.progress-bar:hover {
  background: rgba(0, 0, 0, 0.15);
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #2c3e50;
  border-radius: 50%;
  cursor: grab;
  transition: transform 0.2s, box-shadow 0.2s;
}

.progress-bar::-webkit-slider-thumb:active {
  transform: scale(1.2);
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  cursor: grabbing;
}
`;

document.head.insertAdjacentHTML('beforeend', `<style>${styles}</style>`);