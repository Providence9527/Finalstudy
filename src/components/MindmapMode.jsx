import React from 'react';
import Switch from './Switch';

const MindmapMode = ({ isOn, handleToggle }) => {
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
        <div className="content-item">
          <div className="mindmap-container">
            <div className="mindmap-node root-node">
              核心概念
              <div className="mindmap-branch">
                <div className="mindmap-node">人工智能</div>
                <div className="mindmap-node">机器学习</div>
                <div className="mindmap-node">深度学习</div>
              </div>
            </div>
          </div>
          <div className="mindmap-toolbar">
            <button className="btn-add">添加节点</button>
            <button className="btn-export">导出图片</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MindmapMode;