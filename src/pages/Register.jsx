import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import RegisterForm from '../components/RegisterForm'
import { Box, Typography } from '@mui/material'

const Register = () => {
  const [error, setError] = useState('')
  const { user, register } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (user) navigate('/') // 已登录用户自动跳转
  }, [user, navigate])

  const handleSubmit = async (userData) => {
    try {
      await register(userData)
      navigate('/login') // 注册成功跳转登录
    } catch (err) {
      setError(err.message || '注册失败，请检查输入')
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
        maxWidth: 500,
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
          创建新账号
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
        <RegisterForm onSubmit={handleSubmit} />
        <Typography 
          variant="body2" 
          sx={{ 
            mt: 3,
            textAlign: 'center',
            color: 'text.secondary'
          }}
        >
          已有账号？{' '}
          <a 
            href="/login" 
            style={{ 
              color: '#1976d2',
              textDecoration: 'none',
              fontWeight: 500,
              '&:hover': {
                textDecoration: 'underline'
              }
            }}
          >
            立即登录
          </a>
        </Typography>
      </Box>
    </Box>
  )
}

export default Register