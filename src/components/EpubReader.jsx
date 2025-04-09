// src/components/EpubReader.jsx
import { ReactReader } from 'react-reader';
import { useState, useRef, useEffect } from 'react';

export default function EpubReader({ url, onProgressChange }) {
  const [location, setLocation] = useState(null);
  const bookRef = useRef(null);

  // 修复1: 使用useEffect恢复阅读位置
  useEffect(() => {
    const savedPosition = localStorage.getItem(`epub-position-${url}`);
    if (savedPosition) setLocation(savedPosition);
  }, [url]);

  // 修复2: 修正setLocation调用并优化进度计算
  const handleLocationChange = (loc) => {
    console.log("触发epub进度处理,loc是", loc)
    setLocation(loc); // 正确更新位置状态
    
    if (bookRef.current) {
      bookRef.current.locations.generate(1024).then(() => {
        // 修复3: 移除不必要的除以100操作
        const progress = bookRef.current.locations.percentageFromCfi(loc);
        console.log("实际进度:", progress);
        onProgressChange(parseFloat(progress.toFixed(2)));
        
        // 可选: 保存当前位置到本地存储
        localStorage.setItem(`epub-position-${url}`, loc);
      });
    }
  };

  return (
    <div style={{ height: '100vh' }}>
      <ReactReader
        url={url}
        location={location}
        locationChanged={handleLocationChange}
        getRendition={(rendition) => {
          bookRef.current = rendition.book;
        }}
        epubOptions={{
          flow: 'paginated',
          spread: 'none'
        }}
      />
    </div>
  );
}