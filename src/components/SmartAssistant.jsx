import { useState, useRef, useEffect, useCallback } from 'react';
import { DraggableCore } from 'react-draggable';
import Slider from '@mui/material/Slider';
import Switch from './Switch';
import NoteMode from './NoteMode';
import MindmapMode from './MindmapMode';
import AssistantMode from './AssistantMode';
import './SmartAssistant.css';

const mockData = `核心概念
  ## 人工智能
  ### 机器学习
  ### 深度学习
  ## 应用领域
  ### 自然语言处理
  ### 计算机视觉
  ## 发展历史
  ### 符号主义
  ### 连接主义
  ### 行为主义`
  
const MODE_TABS = {
  noteMode: { 
    id: 'note', 
    label: '笔记模式',
    component: (props) => <NoteMode {...props} />
  },
  mindmapMode: { 
    id: 'mindmap', 
    label: '脑图模式',
    component: (props) => <MindmapMode {...props} />,
    data:mockData
  },
  assistantMode: { 
    id: 'assistant', 
    label: '助手模式',
    component: (props) => <AssistantMode {...props} />
  }
};

const SmartAssistant = () => {
  const dragRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [position, setPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth/2 - 25 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight/2 - 25 : 0 
  });
  const baseSize = useRef({ width: 300, height: 400 });
  const [size, setSize] = useState({ width: baseSize.current.width, height: baseSize.current.height });
  const [opacity, setOpacity] = useState(1);
  const [modes, setModes] = useState({
    noteMode: false,
    mindmapMode: false,
    assistantMode: false
  });
  const [visibleTabs, setVisibleTabs] = useState(new Set());
  const [scale, setScale] = useState(1);
  const offset = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPosition = useRef({ x: 0, y: 0 });
  
  const resizeData = useRef({
    isResizing: false,
    direction: null,
    startX: 0,
    startY: 0,
    startWidth: 0,
    startHeight: 0,
    startLeft: 0,
    startTop: 0
  });

  const clampPosition = useCallback((x, y) => ({
    x: Math.max(10, Math.min(x, window.innerWidth - 50)),
    y: Math.max(10, Math.min(y, window.innerHeight - 50))
  }), []);

  useEffect(() => {
    const handleResize = () => setPosition(prev => clampPosition(prev.x, prev.y));
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [clampPosition]);

  const handleDragStart = useCallback((e) => {
    if (e.type === 'mousedown' && e.button !== 0) return;
    
    const rect = e.target.getBoundingClientRect();
    offset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    setIsDragging(true);
    dragStartPosition.current = { x: e.clientX, y: e.clientY };
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrag = useCallback((e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - offset.current.x;
    const newY = e.clientY - offset.current.y;
    setPosition(clampPosition(newX, newY));
  }, [isDragging, clampPosition]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, []);

  const handleResizeMouseDown = (direction) => (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = dragRef.current.getBoundingClientRect();
    resizeData.current = {
      isResizing: true,
      direction,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      startLeft: rect.left,
      startTop: rect.top
    };

    document.addEventListener('mousemove', handleResizeMouseMove);
    document.addEventListener('mouseup', handleResizeMouseUp);
  };

  const handleResizeMouseMove = useCallback((e) => {
    if (!resizeData.current.isResizing) return;

    const { direction, startX, startY, startWidth, startHeight, startLeft, startTop } = resizeData.current;
    const deltaX = e.clientX - startX;
    const deltaY = e.clientY - startY;
    
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newX = position.x;
    let newY = position.y;

    const MIN_SIZE = 200;
    const MAX_WIDTH = window.innerWidth - 100;
    const MAX_HEIGHT = window.innerHeight - 100;

    switch (direction) {
      case 'right':
        newWidth = Math.min(Math.max(startWidth + deltaX, MIN_SIZE), MAX_WIDTH);
        break;
      case 'left':
        newWidth = Math.min(Math.max(startWidth - deltaX, MIN_SIZE), MAX_WIDTH);
        newX = Math.max(Math.min(position.x + deltaX, startLeft + startWidth - MIN_SIZE), 10);
        break;
      case 'bottom':
        newHeight = Math.min(Math.max(startHeight + deltaY, MIN_SIZE), MAX_HEIGHT);
        break;
      case 'top':
        newHeight = Math.min(Math.max(startHeight - deltaY, MIN_SIZE), MAX_HEIGHT);
        newY = Math.max(Math.min(position.y + deltaY, startTop + startHeight - MIN_SIZE), 10);
        break;
      case 'top-right':
        newHeight = Math.min(Math.max(startHeight - deltaY, MIN_SIZE), MAX_HEIGHT);
        newWidth = Math.min(Math.max(startWidth + deltaX, MIN_SIZE), MAX_WIDTH);
        newY = Math.max(Math.min(position.y + deltaY, startTop + startHeight - MIN_SIZE), 10);
        break;
      case 'bottom-right':
        newHeight = Math.min(Math.max(startHeight + deltaY, MIN_SIZE), MAX_HEIGHT);
        newWidth = Math.min(Math.max(startWidth + deltaX, MIN_SIZE), MAX_WIDTH);
        break;
      case 'bottom-left':
        newHeight = Math.min(Math.max(startHeight + deltaY, MIN_SIZE), MAX_HEIGHT);
        newWidth = Math.min(Math.max(startWidth - deltaX, MIN_SIZE), MAX_WIDTH);
        newX = Math.max(Math.min(position.x + deltaX, startLeft + startWidth - MIN_SIZE), 10);
        break;
      case 'top-left':
        newHeight = Math.min(Math.max(startHeight - deltaY, MIN_SIZE), MAX_HEIGHT);
        newWidth = Math.min(Math.max(startWidth - deltaX, MIN_SIZE), MAX_WIDTH);
        newX = Math.max(Math.min(position.x + deltaX, startLeft + startWidth - MIN_SIZE), 10);
        newY = Math.max(Math.min(position.y + deltaY, startTop + startHeight - MIN_SIZE), 10);
        break;
    }

    const widthRatio = newWidth / baseSize.current.width;
    const heightRatio = newHeight / baseSize.current.height;
    const newScale = Math.min(widthRatio, heightRatio);

    setSize({ width: newWidth, height: newHeight });
    setScale(newScale);
    setPosition(clampPosition(newX, newY));
  }, [position, clampPosition]);

  const handleResizeMouseUp = useCallback(() => {
    resizeData.current.isResizing = false;
    document.removeEventListener('mousemove', handleResizeMouseMove);
    document.removeEventListener('mouseup', handleResizeMouseUp);
  }, []);

  const handleOpacityChange = useCallback((e, value) => {
    e.stopPropagation();
    setOpacity(value / 100);
  }, []);

  const toggleMode = useCallback((modeKey) => {
    setModes(prev => {
      const newState = !prev[modeKey];
      setVisibleTabs(prevTabs => {
        const newTabs = new Set(prevTabs);
        if (newState) {
          setActiveTab(MODE_TABS[modeKey].id);
        }
        newState ? newTabs.add(modeKey) : newTabs.delete(modeKey);
        if (!newState && activeTab === MODE_TABS[modeKey].id) {
          setActiveTab('settings');
        }
        return newTabs;
      });
      return { ...prev, [modeKey]: newState };
    });
  }, [activeTab]);

  const generateTabs = useCallback(() => [
    { id: 'settings', label: '模式设置', component: null },
    ...[...visibleTabs].map(modeKey => ({
      ...MODE_TABS[modeKey],
      component: (
        <div className="mode-tab-content" key={`content-${modeKey}`}>
          {MODE_TABS[modeKey].component({
            data: MODE_TABS[modeKey].data,
            width: baseSize.current.width - 40,
            eight: size.height - 120,
            handleToggle: () => toggleMode(modeKey)
          })}
        </div>
      )
    }))
  ], [visibleTabs, modes, toggleMode]);

  return (
    <div className="smart-assistant-container">
      {!isExpanded ? (
        <DraggableCore 
          nodeRef={dragRef}
          onStart={handleDragStart}
          onDrag={handleDrag}
          onStop={handleDragEnd}
          bounds="parent"
          enableUserSelectHack={false}
        >
          <div
            ref={dragRef}
            className="floating-ball"
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px)`,
              opacity,
              position: 'fixed',
              cursor: isDragging ? 'grabbing' : 'grab',
              zIndex: 10000,
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28)'
            }}
            onClick={(e) => {
              const dx = Math.abs(e.clientX - dragStartPosition.current.x);
              const dy = Math.abs(e.clientY - dragStartPosition.current.y);
              if (dx < 5 && dy < 5) setIsExpanded(true);
            }}
          >
            🦾
          </div>
        </DraggableCore>
      ) : (
        <DraggableCore 
          nodeRef={dragRef}
          onStart={handleDragStart}
          onDrag={handleDrag}
          onStop={handleDragEnd}
          bounds="parent"
          enableUserSelectHack={false}
        >
          <div
            ref={dragRef}
            className="assistant-window"
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px)`,
              opacity,
              width: size.width,
              height: size.height,
              zIndex: 10001,
              position: 'fixed',
              cursor: isDragging ? 'grabbing' : 'grab',
              transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              left: 0,
              top: 0,
              transformOrigin: '0 0'
            }}
          >
            {/* 调整大小手柄 */}
            <div className="resize-handle top" onMouseDown={handleResizeMouseDown('top')} />
            <div className="resize-handle right" onMouseDown={handleResizeMouseDown('right')} />
            <div className="resize-handle bottom" onMouseDown={handleResizeMouseDown('bottom')} />
            <div className="resize-handle left" onMouseDown={handleResizeMouseDown('left')} />
            <div className="resize-handle top-right" onMouseDown={handleResizeMouseDown('top-right')} />
            <div className="resize-handle bottom-right" onMouseDown={handleResizeMouseDown('bottom-right')} />
            <div className="resize-handle bottom-left" onMouseDown={handleResizeMouseDown('bottom-left')} />
            <div className="resize-handle top-left" onMouseDown={handleResizeMouseDown('top-left')} />

            <div className="window-header">
              <div className="tabs">
                {generateTabs().map(tab => (
                  <button
                    key={tab.id}
                    className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveTab(tab.id);
                    }}
                  >
                    {tab.label}
                    {tab.id !== 'settings' && (
                      <span 
                        className="close-tab"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMode(Object.keys(MODE_TABS).find(k => MODE_TABS[k].id === tab.id));
                        }}
                      >
                        ×
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <button 
                className="close-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsExpanded(false);
                }}
              >
                ×
              </button>
            </div>

            <div 
              className="window-content-wrapper"
              style={{
                width: '100%',
                height: 'calc(100% - 40px)',
                overflow: 'hidden',
              }}
            >
              <div
                className="window-content"
                style={{ 
                  transform: `scale(${scale})`,
                  transformOrigin: '0 0',
                  width: baseSize.current.width,
                  height: baseSize.current.height,
                }}
              >
                {activeTab === 'settings' ? (
                  <div className="settings-panel">
                    {Object.entries(MODE_TABS).map(([modeKey, config]) => (
                      <div key={modeKey} className="mode-item">
                        <label>{config.label}</label>
                        <Switch
                          isOn={modes[modeKey]}
                          handleToggle={() => modes[modeKey] ? toggleMode(modeKey) : toggleMode(modeKey)}
                        />
                      </div>
                    ))}
                    <div 
                      className="opacity-control"
                      onMouseDown={e => e.stopPropagation()}
                    >
                      <label>窗口透明度：{Math.round(opacity * 100)}%</label>
                      <Slider
                        value={opacity * 100}
                        onChange={handleOpacityChange}
                        onMouseDown={e => e.stopPropagation()}
                        min={30}
                        max={100}
                      />
                    </div>
                  </div>
                ) : (
                  generateTabs().find(t => t.id === activeTab)?.component
                )}
              </div>
            </div>
          </div>
        </DraggableCore>
      )}
    </div>
  );
};

export default SmartAssistant;