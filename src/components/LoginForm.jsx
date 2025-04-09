import { useState } from 'react'
import { 
  TextField, 
  Button, 
  InputAdornment,
  IconButton
} from '@mui/material'
import { 
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material'

export default function LoginForm({ onSubmit }) {
  const [credentials, setCredentials] = useState({
    user_name: '',
    user_pwd: '',
    showPassword: false
  })

  const handleChange = (prop) => (event) => {
    setCredentials({ ...credentials, [prop]: event.target.value })
  }

  const handleClickShowPassword = () => {
    setCredentials({ ...credentials, showPassword: !credentials.showPassword })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit({
      user_name: credentials.user_name,
      user_pwd: credentials.user_pwd
    }).catch(err => {})
  }

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        fullWidth
        margin="normal"
        label="用户名"
        variant="outlined"
        value={credentials.user_name}
        onChange={handleChange('user_name')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <PersonIcon color="action" />
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            '& fieldset': {
              borderColor: '#e0e0e0'
            }
          }
        }}
      />
      
      <TextField
        fullWidth
        margin="normal"
        label="密码"
        type={credentials.showPassword ? 'text' : 'password'}
        value={credentials.user_pwd}
        onChange={handleChange('user_pwd')}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color="action" />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClickShowPassword}
                edge="end"
              >
                {credentials.showPassword ? <VisibilityOff /> : <Visibility />}
              </IconButton>
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2
          }
        }}
      />

      <Button
        fullWidth
        variant="contained"
        size="large"
        type="submit"
        sx={{
          mt: 3,
          py: 1.5,
          borderRadius: 2,
          fontSize: 16,
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.3)'
          }
        }}
      >
        立即登录
      </Button>
    </form>
  )
}