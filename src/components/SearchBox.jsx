import { useState } from 'react';
import { TextField, Button, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

export default function SearchBox({ value, onChange, onSearch }) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextField
      fullWidth
      variant="outlined"
      placeholder="搜索教材..."
      value={value}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(e) => onChange(e.target.value)}
      InputProps={{
        sx: { 
          pr: 0,
          transition: 'all 0.3s ease',
          height: isFocused ? 48 : 56, // 整体高度变化
        },
        endAdornment: (
          <InputAdornment position="end">
            <Button
              variant="contained"
              color="primary"
              onClick={onSearch}
              sx={{
                height: isFocused ? 40 : 56, // 按钮高度同步变化
                px: 3,
                transition: 'all 0.3s ease',
                background: 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1565c0 30%, #1976d2 90%)'
                }
              }}
            >
              <SearchIcon sx={{ 
                mr: 1,
                fontSize: isFocused ? '1rem' : '1.25rem',
                transition: 'all 0.3s ease'
              }} />
              搜索
            </Button>
          </InputAdornment>
        )
      }}
      sx={{
        '& .MuiOutlinedInput-root': {
          height: '100%',
          borderRadius: 2,
          fontSize: '0.875rem',
          transition: 'all 0.3s ease',
        },
        '& .MuiOutlinedInput-input': {
          padding: isFocused ? '12px 14px' : '16px 14px', // 输入框内边距变化
          transition: 'all 0.3s ease'
        }
      }}
    />
  );
}