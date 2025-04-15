import React, { useMemo } from 'react';
import Switch from './Switch';
import './SmartAssistant.css';

const parseMarkdownToTree = (md) => {
  const lines = md.split('\n').filter(line => line.startsWith('#'));
  const root = { id: 'root', label: '', children: [], level: 0 };
  let lastNode = root;
  const stack = [root];
  
  lines.forEach((line, index) => {
    const level = line.match(/^#+/)[0].length;
    const label = line.replace(/^#+\s*/, '').trim();
    
    while (stack.length > level) {
      stack.pop();
    }
    
    const newNode = {
      id: `node-${index}`,
      label,
      children: [],
      parent: stack[stack.length - 1],
      level
    };
    
    stack[stack.length - 1].children.push(newNode);
    
    if (level >= stack.length) {
      stack.push(newNode);
    }
    
    lastNode = newNode;
  });
  
  return root.children[0]; // Return first root node
};

const MindmapNode = ({ node, position, parentPosition }) => {
  const lineStyle = {
    position: 'absolute',
    left: parentPosition ? (position.x + position.width/2) + 'px' : '50%',
    top: parentPosition ? parentPosition.y + parentPosition.height + 'px' : 0,
    width: parentPosition ? '2px' : '0',
    height: parentPosition ? (position.y - parentPosition.y - parentPosition.height) + 'px' : '0',
    backgroundColor: '#4CAF50'
  };
  
  return (
    <div className="mindmap-node-wrapper" style={{ left: position.x + 'px', top: position.y + 'px' }}>
      {parentPosition && <div className="connection-line" style={lineStyle} />}
      <div className="mindmap-node" style={{ width: position.width + 'px' }}>
        {node.label}
        {node.children.length > 0 && (
          <div className="children-container">
            {node.children.map((child, index) => {
              const childX = index * (position.width + 40);
              const childY = position.height + 60;
              return (
                <MindmapNode
                  key={child.id}
                  node={child}
                  position={{ x: childX, y: childY, width: position.width, height: position.height }}
                  parentPosition={{ x: position.x, y: position.y, width: position.width, height: position.height }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

const MindmapMode = ({ isOn, handleToggle, data, width, height }) => {
  const mindmapData = useMemo(() => parseMarkdownToTree(data), [data]);
  
  if (!mindmapData) return null;
  
  return (
    <div className="mode-tab-content">
      <div className="mode-header">
        <h3>脑图模式</h3>
        <Switch
          isOn={isOn}
          handleToggle={handleToggle}
          style={{ marginLeft: 'auto' }}
        />
      </div>
      <div className="mode-content">
        <div className="mindmap-container" style={{ width: width + 'px', height: height + 'px' }}>
          <MindmapNode 
            node={mindmapData}
            position={{ x: width/2 - 100, y: 20, width: 200, height: 40 }}
          />
        </div>
        <div className="mindmap-toolbar">
          <button className="btn-add">导出PNG</button>
          <button className="btn-export">导出SVG</button>
        </div>
      </div>
    </div>
  );
};

export default MindmapMode;