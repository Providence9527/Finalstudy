import { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate,
  useNavigate 
} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles'; // 添加ThemeProvider
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Explore from './pages/Explore';
import Plaza from './pages/Plaza';
import Diy from './pages/Diy';
import Garden from './pages/Garden';
import Login from './pages/Login';
import Register from './pages/Register';
import BookReaderPage from './pages/BookReaderPage';

// 创建基础主题
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

const BASENAME = '/';

const ProtectedRoute = ({ children }) => {
  const { user, redirectTrigger, clearRedirect } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (redirectTrigger) {
      navigate('/login');
      clearRedirect();
    }
  }, [redirectTrigger, navigate, clearRedirect]);

  return user ? children : <Navigate to="/login" replace />;
};

const MainLayout = ({ children, isSidebarCollapsed, onToggle }) => {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        onToggle={onToggle}
      />
      <main style={{
        flex: 1,
        marginLeft: isSidebarCollapsed ? '80px' : '250px',
        transition: 'margin 0.3s ease',
        padding: '20px',
        width: `calc(100% - ${isSidebarCollapsed ? 80 : 250}px)`,
        maxWidth: '100vw',
        boxSizing: 'border-box'
      }}>
        {children}
      </main>
    </div>
  );
};

const AppRoutes = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      <Route path="/*" element={
        <ProtectedRoute>
          <MainLayout 
            isSidebarCollapsed={isSidebarCollapsed}
            onToggle={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          >
            <Routes>
              <Route path="/" element={
                <Dashboard 
                  sidebarCollapsed={isSidebarCollapsed} 
                  setIsSidebarCollapsed={setIsSidebarCollapsed}
                />
              } />
              <Route path="/explore" element={<Explore />} />
              <Route path="/plaza" element={<Plaza />} />
              <Route path="/book/:id" element={<BookReaderPage />} />
              <Route path="/diy" element={<Diy />} />
              <Route path="/garden" element={<Garden />} />
            </Routes>
          </MainLayout>
        </ProtectedRoute>
      } />
    </Routes>
  );
};

export default function App() {
  return (
    <ThemeProvider theme={theme}> {/* 包裹整个应用 */}
      <AuthProvider>
        <Router basename={BASENAME}>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}