// EpubReader.jsx
import { ReactReader } from 'react-reader';
import { useState, useRef, useEffect } from 'react';

export default function EpubReader({ url, onProgressChange }) {
  const [location, setLocation] = useState(null);
  const bookRef = useRef(null);

  const handleReaderEvents = (e) => {
    if (e.type === 'mousedown' && e.button !== 0) return;
    e.stopPropagation();
  };

  useEffect(() => {
    const savedPosition = localStorage.getItem(`epub-position-${url}`);
    if (savedPosition) setLocation(savedPosition);
  }, [url]);

  const handleLocationChange = (loc) => {
    setLocation(loc);
    if (bookRef.current) {
      bookRef.current.locations.generate(1024).then(() => {
        const progress = bookRef.current.locations.percentageFromCfi(loc);
        onProgressChange(parseFloat(progress.toFixed(2)));
        localStorage.setItem(`epub-position-${url}`, loc);
      });
    }
  };

  return (
    <div 
      style={{ 
        height: '100%',
        width: '100%',
        position: 'relative'
      }}
      onMouseDown={handleReaderEvents}
      onTouchStart={handleReaderEvents}
      onDragStart={handleReaderEvents}
    >
      <ReactReader
        style={{ height: '100%' }}
        url={url}
        location={location}
        locationChanged={handleLocationChange}
        getRendition={(rendition) => {
          rendition.hooks.content.register((contents) => {
            contents.document.addEventListener('mousedown', handleReaderEvents);
          });
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