import { createContext, useContext, useState, useEffect } from 'react'

export const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth必须在AuthProvider内使用')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [redirectTrigger, setRedirectTrigger] = useState(false)

  useEffect(() => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('user')
      }
    }
  }, [])

  const handleAuthResponse = async (response) => {
    const data = await response.json()
    if (!response.ok) throw new Error(data.detail || '认证失败')
    
    const userData = { 
      user_name: data.user_name,
      userId: data.userId  // 只保留必要字段
    }
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
    return userData
  }

  const login = async (credentials) => {
    const response = await fetch('/api/auth/login/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: credentials.user_name,
        user_pwd: btoa(credentials.user_pwd)
      })
    })
    return handleAuthResponse(response)
  }

  const register = async (userData) => {
    const response = await fetch('/api/auth/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: userData.user_name,
        user_pwd: btoa(userData.user_pwd)
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || '注册失败')
    }
    return login(userData)
  }

  const logout = () => {
    setUser(null)
    setRedirectTrigger(true)
    localStorage.removeItem('user')
  }

  const clearRedirect = () => setRedirectTrigger(false)

  return (
    <AuthContext.Provider 
      value={{ 
        user,
        login,
        logout,
        register,
        redirectTrigger,
        clearRedirect
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}