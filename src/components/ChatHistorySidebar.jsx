import { useState, useEffect } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  IconButton, 
  Box, 
  Button, 
  Typography,
  CircularProgress,
  Divider,
  useTheme
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { fetchConversations, createConversation, deleteConversation } from '../api/learning';
import { useAuth } from '../contexts/AuthContext';

export default function ChatHistorySidebar({ 
  currentConversation,
  onConversationChange,
  onNewConversation,
  refreshFlag,
  setRefreshFlag
}) {
  const { user } = useAuth();
  const theme = useTheme();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true);
        const data = await fetchConversations(user.userId);
        setConversations(data);
      } catch (error) {
        console.error('加载对话失败:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConversations();
  }, [refreshFlag]);

  const handleCreateNew = async () => {
    try {
         // 仅在前端创建临时对话
        onNewConversation({
          id: 'temp',
          title: '新对话',
          created_at: new Date(),
          updated_at: new Date()
        });
      
    } catch (error) {
      console.error('创建对话失败:', error);
    }
  };

  const handleDelete = async (conversationId) => {
    try {
      if (!window.confirm('确定要删除此对话吗？')) return;
      setConversations(prev => {
        const newList = prev.filter(c => c.id !== conversationId);
        if (newList.length === 0) onNewConversation();
        return newList;
        });
      await deleteConversation(user.userId, conversationId);
      setRefreshFlag(prev => !prev);
      //setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (currentConversation?.id === conversationId) {
        onNewConversation();
      } 
    } catch (error) {
           setConversations(prev => [...prev]);
           //console.error('删除失败详情:', error.response?.data || error.message);
           
           if (error.code === 'ERR_NETWORK') {
             alert('网络连接异常，请检查网络状态');
           } else {
             //alert(`删除失败: ${error.response?.data?.detail || '未知错误'}`);
           }
    }
  };

  return (
    <Box sx={{ 
      width: 280,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: 'background.paper'
    }}>
      <Box sx={{ 
        p: 2,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>对话历史</Typography>
      </Box>

      <Box sx={{ p: 2 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleCreateNew}
          sx={{
            borderRadius: 1,
            py: 1,
            textTransform: 'none'
          }}
        >
          新建对话
        </Button>
      </Box>

      <Box sx={{ flex: 1, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ 
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CircularProgress size={24} />
          </Box>
        ) : (
          <List sx={{ 
            height: '100%',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: 6
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.action.hover,
              borderRadius: 4
            }
          }}>
            {conversations.map(conv => (
              <ListItem
                key={conv.id}
                button 
                selected={currentConversation?.id === conv.id}
                onClick={() => onConversationChange(conv)}
                sx={{
                  py: 1,
                  px: 2,
                  '&:hover': {
                    backgroundColor: 'action.hover',
                    '& .MuiListItemSecondaryAction-root': {
                      visibility: 'visible'
                    }
                  }
                }}
                secondaryAction={
                  <IconButton 
                    edge="end"
                    size="small"
                   sx={{ 
                         visibility: currentConversation?.id === conv.id ? 'visible' : 'hidden',
                         transition: 'opacity 0.2s' 
                       }}
                    component="div"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(conv.id);
                    }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                }
                
              >
                <ListItemText
                  primary={
                    <Typography 
                      variant="body2" 
                      noWrap
                      sx={{ 
                        fontWeight: currentConversation?.id === conv.id ? 600 : 400,
                        color: currentConversation?.id === conv.id ? 
                          theme.palette.primary.main : 
                          theme.palette.text.primary
                      }}
                    >
                      {conv.title || "新对话"}
                    </Typography>
                  }
                  secondary={
                    <Typography 
                      variant="caption" 
                      color="textSecondary" 
                      noWrap
                    >
                      {new Date(conv.updated_at).toLocaleString('zh-CN')}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Box>
  );
}