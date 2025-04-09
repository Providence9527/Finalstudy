import { useState, useRef, useEffect } from 'react';
import { DraggableCore } from 'react-draggable';
import { Resizable } from 're-resizable';
import Slider from '@mui/material/Slider';
import Switch from './Switch';
import '../styles/main.css';

const MODE_TABS = {
  noteMode: { id: 'note', label: '笔记模式', component: <div className="content-item">笔记内容</div> },
  mindmapMode: { id: 'mindmap', label: '脑图模式', component: <div className="content-item">脑图内容</div> },
  assistantMode: { id: 'assistant', label: '助手模式', component: <div className="content-item">助手内容</div> }
};

const SmartAssistant = () => {
  const dragRef = useRef(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState('settings');
  const [position, setPosition] = useState({ 
    x: typeof window !== 'undefined' ? window.innerWidth/2 - 25 : 0,
    y: typeof window !== 'undefined' ? window.innerHeight/2 - 25 : 0 
  });
  const [size, setSize] = useState({ width: 300, height: 400 });
  const [opacity, setOpacity] = useState(1);
  const [modes, setModes] = useState({
    noteMode: false,
    mindmapMode: false,
    assistantMode: false
  });
  const [visibleTabs, setVisibleTabs] = useState(new Set());
  const [scale, setScale] = useState(1);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });

  // 窗口边界限制
  const clampPosition = (x, y) => ({
    x: Math.max(10, Math.min(x, window.innerWidth - 50)),
    y: Math.max(10, Math.min(y, window.innerHeight - 50))
  });

  // 视口尺寸监听
  useEffect(() => {
    const handleResize = () => {
      setPosition(prev => clampPosition(prev.x, prev.y));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 拖拽处理
  const handleDrag = (_, data) => {
    const newX = position.x + data.deltaX;
    const newY = position.y + data.deltaY;
    const newPos = clampPosition(newX, newY);
    setPosition(newPos);
  };

  const handleDragStart = (e, data) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragStartPosition({ x: data.x, y: data.y });
  };

  // 尺寸调整
  const handleResize = (e, direction, ref, delta) => {
    const newWidth = size.width + delta.width;
    const newHeight = size.height + delta.height;
    const validWidth = Math.max(200, Math.min(newWidth, window.innerWidth - 100));
    const validHeight = Math.max(200, Math.min(newHeight, window.innerHeight - 100));
    
    setScale(Math.min(validWidth/300, validHeight/400));
    setSize({ width: validWidth, height: validHeight });
  };

  // 模式切换
  const toggleMode = (modeKey) => {
    setModes(prev => {
      const newState = !prev[modeKey];
      setVisibleTabs(prevTabs => {
        const newTabs = new Set(prevTabs);
        newState ? newTabs.add(modeKey) : newTabs.delete(modeKey);
        return newTabs;
      });
      return { ...prev, [modeKey]: newState };
    });
  };

  // 生成标签页
  const generateTabs = () => {
    return [
      { id: 'settings', label: '模式设置', component: null },
      ...Array.from(visibleTabs).map(modeKey => MODE_TABS[modeKey])
    ];
  };

  return (
    <div className="smart-assistant-container">
      {!isExpanded ? (
        <DraggableCore 
          nodeRef={dragRef}
          onStart={handleDragStart}
          onDrag={handleDrag}
          bounds="parent"
        >
          <div
            ref={dragRef}
            className="floating-ball"
            style={{ 
              transform: `translate(${position.x}px, ${position.y}px)`,
              opacity: opacity,
              position: 'fixed',
              cursor: 'grab',
              zIndex: 10000,
              
            }}
            onClick={(e) => {
              const test = 1;
              // 检查是否为有效点击（非拖拽操作）
              const dx = Math.abs(e.clientX - dragStartPosition.x);
              const dy = Math.abs(e.clientY - dragStartPosition.y);
              if (dx < 5 && dy < 5) {
                setIsExpanded(true);
              }
             }}    
          >
            🦾
          </div>
        </DraggableCore>
      ) : (
        <Resizable
          size={size}
          onResize={handleResize}
          enable={{
            top: true, right: true, bottom: true, left: true,
            topRight: true, bottomRight: true, bottomLeft: true, topLeft: true
          }}
          bounds="window"
        >
          <DraggableCore 
            nodeRef={dragRef}
            onStart={handleDragStart}
            onDrag={handleDrag}
            bounds="parent"
          >
            <div
              ref={dragRef}
              className="assistant-window"
              style={{ 
                transform: `translate(${position.x}px, ${position.y}px)`,
                opacity: opacity,
                width: size.width,
                height: size.height,
                zIndex: 10000,
                position: 'fixed',
                cursor: 'grab'
              }}
            >
              <div className="window-header" onMouseDown={(e) => e.stopPropagation()}>
                <div className="tabs">
                  {generateTabs().map(tab => (
                    <button
                      key={tab.id}
                      className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                      onClick={() => setActiveTab(tab.id)}
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
                  onClick={() => setIsExpanded(false)}
                >
                  ×
                </button>
              </div>

              <div 
                className="window-content" 
                style={{ 
                  transform: `scale(${scale})`, 
                  transformOrigin: '0 0',
                  width: `${300}px`,
                  height: `${400}px`
                }}
              >
                {activeTab === 'settings' ? (
                  <div className="settings-panel">
                    {Object.entries(MODE_TABS).map(([modeKey, config]) => (
                      <div key={modeKey} className="mode-item">
                        <label>{config.label}</label>
                        <Switch
                          isOn={modes[modeKey]}
                          handleToggle={() => toggleMode(modeKey)}
                        />
                      </div>
                    ))}
                    <div className="opacity-control">
                      <label>窗口透明度：{Math.round(opacity * 100)}%</label>
                      <Slider
                        value={opacity * 100}
                        onChange={(e, value) => setOpacity(value / 100)}
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
          </DraggableCore>
        </Resizable>
      )}
    </div>
  );
};

export default SmartAssistant;