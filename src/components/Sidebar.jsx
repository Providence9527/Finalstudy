import { Link, useLocation } from 'react-router-dom'
import { useEffect, useRef } from 'react'
import { FiHome, FiChevronLeft } from 'react-icons/fi'
import { FaWpexplorer } from "react-icons/fa6"
import { GiGiftOfKnowledge } from "react-icons/gi"
import { MdOutlineSelfImprovement } from "react-icons/md"
import { FaLaptopHouse } from "react-icons/fa"
import { SiMagento } from "react-icons/si"

export default function Sidebar({ isCollapsed, onToggle }) {
  const sidebarRef = useRef(null)
  const location = useLocation()

  // 自动折叠逻辑
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!isCollapsed && 
          sidebarRef.current && 
          !sidebarRef.current.contains(e.target)) {
        onToggle()
      }
    }

    const handleEscape = (e) => {
      if (e.key === 'Escape' && !isCollapsed) {
        onToggle()
      }
    }

    // 仅在展开状态添加监听
    if (!isCollapsed) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isCollapsed]) // 移除location依赖

  return (
    <div 
      ref={sidebarRef}
      style={{
        width: isCollapsed ? '80px' : '250px',
        height: '100vh',
        backgroundColor: '#1a1a1a',
        padding: '20px',
        position: 'fixed',
        left: 0,
        top: 0,
        transition: 'width 0.3s ease',
        zIndex: 1000
      }}>
      <div style={{ 
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '40px'
      }}>
        <SiMagento style={logoIconStyle(isCollapsed)} />
        {!isCollapsed && <div style={logoStyle}>终点学习</div>}
        <button
          onClick={(e) => {
            e.stopPropagation() // 阻止事件冒泡
            onToggle()
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '8px'
          }}
        >
          {isCollapsed ? 
            <FiChevronLeft size={24} style={{ transform: 'rotate(180deg)' }} /> : 
            <FiChevronLeft size={24} />}
        </button>
      </div>

      <nav>
        <Link to="/" style={getLinkStyle(isCollapsed)}>
          <FiHome style={getIconStyle(isCollapsed)} />
          {!isCollapsed && '主页'}
        </Link>
        <Link to="/explore" style={getLinkStyle(isCollapsed)}>
          <FaWpexplorer style={getIconStyle(isCollapsed)} />
          {!isCollapsed && '资源探索'}
        </Link>
        <Link to="/plaza" style={getLinkStyle(isCollapsed)}>
          <GiGiftOfKnowledge style={getIconStyle(isCollapsed)} />
          {!isCollapsed && '知识广场'}
        </Link>
        <Link to="/diy" style={getLinkStyle(isCollapsed)}>
          <MdOutlineSelfImprovement style={getIconStyle(isCollapsed)} />
          {!isCollapsed && '自学天地'}
        </Link>
        <Link to="/garden" style={getLinkStyle(isCollapsed)}>
          <FaLaptopHouse style={getIconStyle(isCollapsed)} />
          {!isCollapsed && '个性学苑'}
        </Link>
      </nav>
    </div>
  )
}

// 样式函数保持不变
const getLinkStyle = (isCollapsed) => ({
  display: 'flex',
  alignItems: 'center',
  color: 'white',
  textDecoration: 'none',
  padding: '12px',
  borderRadius: '8px',
  marginBottom: '8px',
  transition: 'background 0.3s',
  justifyContent: isCollapsed ? 'center' : 'flex-start',
  overflow: 'hidden',
  whiteSpace: 'nowrap'
})

const logoIconStyle = (isCollapsed) => ({
  color: '#2196F3',
  marginRight: isCollapsed ? 0 : '12px',
  fontSize: isCollapsed ? '2rem' : '2.5rem',
  width: '1em',
  height: '1em',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  flexShrink: 0,
  filter: 'drop-shadow(0 2px 4px rgba(33, 150, 243, 0.3))'
})

const getIconStyle = (isCollapsed) => ({
  marginRight: isCollapsed ? 0 : '12px',
  fontSize: isCollapsed ? '28px' : '35px',
  transition: 'all 0.3s ease',
  flexShrink: 0
})

const logoStyle = {
  fontFamily: "'STHupo', sans-serif",
  color: 'white',
  fontSize: '24px',
  transition: 'opacity 0.3s ease'
}