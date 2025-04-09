// components/Switch.jsx
import React from 'react';

const Switch = ({ isOn, handleToggle }) => {
  console.log("[Debug] 渲染开关组件，状态:", isOn);
  return (
    <div className="switch" onClick={handleToggle}>
      <div className={`slider ${isOn ? 'on' : 'off'}`} />
    </div>
  );
};

export default Switch;