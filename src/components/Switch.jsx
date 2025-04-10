// components/Switch.jsx
import React from 'react';

const Switch = ({ isOn, handleToggle }) => {
  return (
    <div 
      className="Switch-switch-container"
      onClick={handleToggle}
      role="switch"
      aria-checked={isOn}
    >
      <div className={`Switch-track ${isOn ? 'Switch-active' : ''}`}>
        <div className="Switch-thumb" />
      </div>
      <style jsx>{`
        .Switch-switch-container {
          display: inline-block;
          cursor: pointer;
          user-select: none;
          touch-action: pan-y;
        }

        .Switch-track {
          position: relative;
          width: 48px;
          height: 24px;
          border-radius: 12px;
          background-color: rgba(0, 0, 0, 0.24);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .Switch-track.Switch-active {
          background-color: #2196f3;
          opacity: 0.5;
        }

        .Switch-thumb {
          position: absolute;
          left: 2px;
          top: 2px;
          width: 20px;
          height: 20px;
          background-color: #fff;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .Switch-track.Switch-active .Switch-thumb {
          transform: translateX(24px);
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        }

        @media (prefers-reduced-motion: reduce) {
          .Switch-track,
          .Switch-thumb {
            transition: none;
          }
        }
      `}</style>
    </div>
  );
};

export default Switch;