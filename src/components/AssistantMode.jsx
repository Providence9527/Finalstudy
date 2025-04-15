import React from 'react';
import Switch from './Switch';

const AssistantMode = ({ isOn, handleToggle }) => {
  return (
    <div className="mode-tab-content">
      <div className="mode-header">
        <h3>助手模式</h3>
        <Switch
          isOn={isOn}
          handleToggle={handleToggle}
          style={{ marginLeft: 'auto' }}
        />
      </div>
      <div className="mode-content">
        <div className="content-item">
          <div className="assistant-chat">
            <div className="chat-history">
              <div className="message-bubble assistant">你好，需要什么帮助？</div>
              <div className="message-bubble user">请解释下迁移学习</div>
            </div>
            <div className="chat-input">
              <input type="text" placeholder="输入你的问题..." />
              <button className="btn-send">发送</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantMode;