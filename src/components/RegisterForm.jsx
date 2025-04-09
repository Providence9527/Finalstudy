import { useState, useEffect } from 'react'
import { 
  TextField, 
  Button, 
  InputAdornment,
  IconButton,
  FormHelperText
} from '@mui/material'
import { 
  Lock as LockIcon,
  Person as PersonIcon,
  Visibility,
  VisibilityOff
} from '@mui/icons-material'

export default function RegisterForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    user_name: '',
    user_pwd: '',
    confirm_pwd: '',
    showPassword: false
  })
  const [passwordError, setPasswordError] = useState('')
  const [confirmError, setConfirmError] = useState('')

  // 实时密码校验
  useEffect(() => {
    const validatePassword = () => {
      const password = formData.user_pwd
      if (password.length === 0) {
        setPasswordError('密码需包含：8位以上，数字、字母和特殊字符')
        return
      }
      
      const errors = []
      if (password.length < 8) errors.push('至少8位')
      if (!/[0-9]/.test(password)) errors.push('包含数字')
      if (!/[a-zA-Z]/.test(password)) errors.push('包含字母')
      if (!/[\W_]/.test(password)) errors.push('包含特殊字符')
      
      setPasswordError(errors.length > 0 ? `需要满足：${errors.join('，')}` : '')
    }
    
    validatePassword()
  }, [formData.user_pwd])

  // 确认密码校验
  useEffect(() => {
    if (formData.confirm_pwd && formData.user_pwd !== formData.confirm_pwd) {
      setConfirmError('两次密码输入不一致')
    } else {
      setConfirmError('')
    }
  }, [formData.confirm_pwd, formData.user_pwd])

  const handleChange = (prop) => (event) => {
    setFormData({ ...formData, [prop]: event.target.value })
  }

  const handleClickShowPassword = () => {
    setFormData({ ...formData, showPassword: !formData.showPassword })
  }

  const validate = () => {
    // 最终提交校验
    const password = formData.user_pwd
    const isValid = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)
    
    if (!isValid) {
      throw new Error('密码需要包含数字、字母和特殊字符，且至少8位')
    }
    if (formData.user_pwd !== formData.confirm_pwd) {
      throw new Error('两次密码输入不一致')
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    try {
      validate()
      onSubmit({
        user_name: formData.user_name,
        user_pwd: formData.user_pwd
      })
    } catch (err) {
      onSubmit({ error: err.message })
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        fullWidth
        margin="normal"
        label="用户名"
        variant="outlined"
        value={formData.user_name}
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
            borderRadius: 2
          }
        }}
      />

      <TextField
        fullWidth
        margin="normal"
        label="密码"
        type={formData.showPassword ? 'text' : 'password'}
        value={formData.user_pwd}
        onChange={handleChange('user_pwd')}
        error={!!passwordError}
        helperText={passwordError || ' '} // 保留占位空间
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color={passwordError ? 'error' : 'action'} />
            </InputAdornment>
          )
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2
          }
        }}
      />

      <TextField
        fullWidth
        margin="normal"
        label="确认密码"
        type={formData.showPassword ? 'text' : 'password'}
        value={formData.confirm_pwd}
        onChange={handleChange('confirm_pwd')}
        error={!!confirmError}
        helperText={confirmError || ' '}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <LockIcon color={confirmError ? 'error' : 'action'} />
            </InputAdornment>
          ),
          endAdornment: (
            <InputAdornment position="end">
              <IconButton
                onClick={handleClickShowPassword}
                edge="end"
              >
                {formData.showPassword ? <VisibilityOff /> : <Visibility />}
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
        disabled={!!passwordError || !!confirmError}
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
        立即注册
      </Button>
    </form>
  )
}