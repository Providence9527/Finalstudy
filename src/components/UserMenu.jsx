import { useState } from 'react';
import { 
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Typography
} from '@mui/material';
import { ArrowDropDown } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleMenuClose();
  };

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Avatar 
        sx={{ 
          bgcolor: '#1890ff', 
          width: 36, 
          height: 36,
          fontSize: '1rem',
          fontWeight: 500
        }}
      >
        {user?.user_name?.charAt(0)?.toUpperCase()}
      </Avatar>
      <IconButton
        onClick={handleMenuOpen}
        sx={{ 
          color: 'text.primary', 
          padding: '8px',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }}
      >
        <ArrowDropDown />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleMenuClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: {
            mt: 1.5,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            minWidth: '160px',
            borderRadius: '8px'
          }
        }}
      >
        <MenuItem 
          onClick={handleLogout}
          sx={{
            py: 1.5,
            '&:hover': { 
              backgroundColor: '#fff1f0',
              '& .MuiTypography-root': {
                color: '#ff4d4f'
              }
            }
          }}
        >
          <Typography
            variant="body2"
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              width: '100%'
            }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="20" 
              height="20" 
              viewBox="0 0 24 24"
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>
            </svg>
            退出登录
          </Typography>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default UserMenu;