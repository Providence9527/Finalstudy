import React from 'react';
import Switch from './Switch';

const NoteMode = ({ isOn, handleToggle }) => {
  return (
    <div className="mode-tab-content">
      <div className="mode-header">
        <h3>笔记模式</h3>
        <Switch
          isOn={isOn}
          handleToggle={handleToggle}
          style={{ marginLeft: 'auto' }}
        />
      </div>
      <div className="mode-content">
        <div className="content-item">
          <h4>我的学习笔记</h4>
          <ul className="note-list">
            <li>人工智能基础概念整理</li>
            <li>机器学习算法总结</li>
            <li>深度学习框架对比</li>
          </ul>
          <div className="note-toolbar">
            <button className="btn-new">新建笔记</button>
            <button className="btn-save">保存修改</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NoteMode;