import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import LoginForm from '../components/LoginForm'
import { Box, Typography } from '@mui/material'
import { SiMagento } from "react-icons/si"

const Login = () => {
  const [error, setError] = useState('')
  const { user, login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/') // 登录成功跳转主页
  }, [user, navigate])

  const handleSubmit = async (credentials) => {
    try {
      await login(credentials)
    } catch (err) {
      setError(err.message || '登录失败，请检查用户名和密码')
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(/login.jpg)`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <Box sx={{
        width: '100%',
        maxWidth: 450,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 4,
        boxShadow: '0 12px 24px rgba(0,0,0,0.2)',
        padding: { xs: 3, sm: 4 },
        margin: 2,
        backdropFilter: 'blur(8px)'
      }}>
        <Typography 
          variant="h4" 
          sx={{ 
            mb: 3, 
            fontWeight: 700,
            color: 'primary.main',
            textAlign: 'center'
          }}
        >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <SiMagento style={logoIconStyle} />
  <div style={logoStyle}>终点学习</div>
</div>
        
        </Typography>
        {error && (
          <Typography 
            color="error" 
            sx={{ 
              mb: 2,
              p: 1.5,
              borderRadius: 1,
              backgroundColor: 'error.light',
              textAlign: 'center'
            }}
          >
            {error}
          </Typography>
        )}
        <LoginForm onSubmit={handleSubmit} />
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 3,
            textAlign: 'center',
            color: 'text.secondary'
          }}
        >
          还没有账号？{' '}
          <a 
            href="/register" 
            style={{ 
              color: '#1976d2',
              textDecoration: 'none',
              fontWeight: 500,
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            立即注册
          </a>
        </Typography>
      </Box>
    </Box>
  )
}
const logoIconStyle = {
  color: '#2196F3',  // 使用Material Design标准蓝色
  marginRight: '12px',
  fontSize: '2.5rem',  // 使用rem单位保持响应式
  width: '1em',      // 保证图标容器尺寸稳定
  height: '1em',     // 根据字体大小自动适配
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', // 平滑过渡曲线
  flexShrink: 0,
  filter: 'drop-shadow(0 2px 4px rgba(33, 150, 243, 0.3))' // 添加微光效
}
const logoStyle = {
  fontFamily: "'STHupo', sans-serif",
  color: 'black',
  fontSize: '32px',
  transition: 'opacity 0.3s ease',

}
export default Login