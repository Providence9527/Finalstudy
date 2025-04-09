import { useState, useEffect, useRef } from 'react';
import { 
  Box, Avatar, TextField, IconButton, 
  CircularProgress, Typography, List, 
  ListItem, ListItemAvatar, useTheme,
  useMediaQuery, Drawer, Dialog,
  DialogTitle, DialogContent, DialogContentText,
  DialogActions, Button
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import SendIcon from '@mui/icons-material/Send';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import { MessageBubble } from '../components/MessageBubble';
import ChatHistorySidebar from '../components/ChatHistorySidebar';
import { useAuth } from '../contexts/AuthContext';
import { 
  fetchConversations,
  fetchConversationMessages,
  saveConversationMessages,
  createConversation
} from '../api/learning';
import { useTimeTracking } from '../hooks/useTimeTracking';

export default function Explore() {
  useTimeTracking();
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const messagesEndRef = useRef(null);
  
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshFlag, setRefreshFlag] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [openHelpDialog, setOpenHelpDialog] = useState(false);

  useEffect(() => {
    const initializeConversation = async () => {
      if (!user?.userId) return;

      try {
        //console.log("用户id:"+user.userId)
        //console.log("对话id:"+user.userId)
        const conversations = await fetchConversations(user.userId);
  
        if (conversations.length > 0) {
          //console.log("有对话")
          const latest = conversations[0];
          const messages = await fetchConversationMessages(user.userId, latest.id);
          setCurrentConversation(latest);
          setMessages(messages);
        } else {
         // 仅初始化空对话，不实际创建文档
         setCurrentConversation({
          id: 'temp',
          title: '新对话',
          created_at: new Date(),
          updated_at: new Date()
        });         
          setMessages([]);
        }
      } catch (error) {
        console.error('初始化失败:', error);
        setError('无法加载对话历史');
      }
    };
    
    initializeConversation();
  }, [user, refreshFlag]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleConversationChange = async (conv) => {
    try {
      //console.log("conv:",conv)
      const messages = await fetchConversationMessages(user.userId, conv.id);
      //console.log("convms后",messages)
      setCurrentConversation(conv);
      setMessages(messages);
      if (isMobile) setIsSidebarOpen(false);
    } catch (error) {
      setError('加载对话失败');
    }
  };

  const handleNewConversation = async () => {
    try {
      const newConv = await createConversation(user.userId, '新对话');
      setCurrentConversation(newConv);
      setMessages([]);
      setRefreshFlag(prev => !prev);
      if (isMobile) setIsSidebarOpen(false);
    } catch (error) {
      setError('创建对话失败');
    }
  };

  const persistMessages = async (updatedMessages) => {
    if (currentConversation?.id) {
      try {
        await saveConversationMessages(user.userId, currentConversation.id, updatedMessages);
        setRefreshFlag(prev => !prev);
      } catch (error) {
        console.error('保存失败:', error);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    try {
      setLoading(true);
      setError(null);
      
// 如果是临时对话则先创建文档
    if (currentConversation?.id === 'temp') {
      const newConv = await createConversation(user.userId, inputMessage);
      setCurrentConversation(newConv);
    }

      const userMessage = { text: inputMessage, isAI: false };
      const tempMessages = [...messages, userMessage];
      setMessages(tempMessages);
      setInputMessage('');

      const API_TOKEN = import.meta.env.VITE_API_TOKEN;
      const response = await fetch(import.meta.env.VITE_API_MODEL_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_API_MODEL,
          messages: [{ role: "user", content: inputMessage }],
          max_tokens: 512,
          temperature: 0.7
        })
      });

      if (!response.ok) throw new Error('请求失败');
      
      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content || "未获取到有效回答";
      
      const finalMessages = [...tempMessages, { text: aiResponse, isAI: true }];
      setMessages(finalMessages);
      await persistMessages(finalMessages);

    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { 
        text: `服务错误：${err.message}`,
        isAI: true 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleHelpOpen = () => setOpenHelpDialog(true);
  const handleHelpClose = () => setOpenHelpDialog(false);

  return (
    <Box sx={{
      display: 'flex',
      height: 'calc(100vh - 64px)',
      width: '100%',
      //bgcolor: 'background.default',
      bgcolor: 'background.default',
      
      overflow: 'hidden',

    }}>
      <Drawer
        variant={isMobile ? "temporary" : "persistent"}
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        sx={{
          width: isSidebarOpen ? 280 : 0,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 280,
            boxSizing: 'border-box',
            borderRight: `1px solid ${theme.palette.divider}`,
            position: 'relative',
            ...(isMobile && { boxShadow: theme.shadows[16] })
          },
        }}
      >
        <ChatHistorySidebar
          currentConversation={currentConversation}
          onConversationChange={handleConversationChange}
          onNewConversation={handleNewConversation}
          refreshFlag={refreshFlag}
          setRefreshFlag={setRefreshFlag}
        />
      </Drawer>

      <Dialog
        open={openHelpDialog}
        onClose={handleHelpClose}
        PaperProps={{
          sx: {
            bgcolor: 'background.paper',
            borderRadius: 2,
            minWidth: isMobile ? '90%' : '400px',
            boxShadow: theme.shadows[6]
          }
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'primary.contrastText',
          py: 2,
          borderRadius: '2px 2px 0 0'
        }}>
          使用指南
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          <DialogContentText component="div" sx={{ color: 'text.primary' }}>
            <Typography variant="body1" gutterBottom>
              欢迎使用智能学习助手，以下是功能说明：
            </Typography>
            <Box component="ul" sx={{ 
              pl: 2.5,
              '& li': { 
                mb: 1.5,
                lineHeight: 1.6,
                color: 'text.secondary'
              }
            }}>
              <li>点击左上角菜单按钮查看对话历史</li>
              <li>支持多行输入（Shift+Enter换行）</li>
              <li>对话数据实时保存云端</li>
              <li>点击「新对话」开始新话题</li>
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 ,bgcolor: 'background.default',
 boxShadow: '0 -2px 8px rgba(0,0,0,0.05)'}}>
          <Button 
            onClick={handleHelpClose}
            color="primary"
            variant="contained"
            size="small"
          >
            开始使用
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{
        flex: 1,
        width: `calc(100% - ${isSidebarOpen ? 280 : 0}px)`,
        height: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <IconButton 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          sx={{ 
            position: 'absolute',
            left: 16,
            top: 16,
            zIndex: theme.zIndex.appBar + 1,
            color: 'text.primary',
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[2],
            '&:hover': {
              backgroundColor: theme.palette.background.paper
            }
          }}
        >
          <MenuIcon />
        </IconButton>

        <Box sx={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          m: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: theme.shadows[1],
          height: 'calc(100% - 32px)'
        }}>
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2,
            '&::-webkit-scrollbar': {
              width: 6
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: theme.palette.action.hover,
              borderRadius: 4
            }
          }}>
            <List sx={{ 
              minHeight: '100%',
              '& .MuiListItem-root': {
                alignItems: 'flex-start'
              }
            }}>
              {messages.length === 0 ? (
                <ListItem sx={{
                  height: '70vh',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    width: '100%',
                    justifyContent: 'center',
                    flexDirection: isMobile ? 'column' : 'row'
                  }}>
                    <SchoolIcon sx={{
                      fontSize: isMobile ? 60 : 80,
                      color: 'primary.main',
                      opacity: 0.8,
                      flexShrink: 0
                    }} />
                    <Typography
                      variant={isMobile ? 'h6' : 'h5'}
                      color="textSecondary"
                      sx={{ 
                        maxWidth: 300,
                        textAlign: isMobile ? 'center' : 'left',
                        flex: 1,
                        fontSize:19,
                        fontWeight:'bold'
                      }}
                    >
                      "路漫漫其修远兮，吾将上下而求索"
                    </Typography>
                  </Box>
                </ListItem>
              ) : (
                messages.map((msg, index) => (
                  <ListItem 
                    key={index} 
                    disablePadding
                    sx={{
                      display: 'flex',
                      justifyContent: msg.isAI ? 'flex-start' : 'flex-end',
                    }}
                  >
                    {msg.isAI && (
                      <ListItemAvatar sx={{ 
                        minWidth: 40,
                        alignSelf: 'flex-start'
                      }}>
                        <Avatar sx={{ 
                          bgcolor: '#4CAF50', 
                          width: 32, 
                          height: 32 
                        }}>
                          <SmartToyIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                    )}
                    <MessageBubble message={msg.text} isAI={msg.isAI} />
                    {!msg.isAI && (
                      <ListItemAvatar sx={{ 
                        minWidth: 40, 
                        ml: 1,
                        alignSelf: 'flex-start'
                      }}>
                        <Avatar sx={{ 
                          bgcolor: '#2196F3', 
                          width: 32, 
                          height: 32 
                        }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                    )}
                  </ListItem>
                ))
              )}
              {loading && (
                <ListItem>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Typography variant="body2">正在生成回答...</Typography>
                </ListItem>
              )}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          <Box component="form" onSubmit={handleSubmit} sx={{
            p: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: 'white'
          }}>
            <Box sx={{
              display: 'flex',
              gap: 1,
              margin: '0 auto',
              alignItems: 'flex-end'
            }}>
              <IconButton
                onClick={handleHelpOpen}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'action.hover'
                  }
                }}
              >
                <HelpOutlineIcon />
              </IconButton>
              
              <TextField
                fullWidth
                variant="outlined"
                placeholder="输入您的问题..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                disabled={loading}
                multiline
                maxRows={4}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 4,
                    alignItems: 'flex-start'
                  }
                }}
              />
              
              <IconButton 
                type="submit" 
                color="primary"
                disabled={loading}
                sx={{ 
                  height: 56,
                  width: 56,
                  bgcolor: 'primary.main',
                  color: 'white',
                  '&:hover': { bgcolor: 'primary.dark' },
                  borderRadius: '50%',
                  flexShrink: 0
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
            
            {error && (
              <Typography 
                color="error" 
                variant="body2" 
                sx={{ 
                  mt: 1,
                  textAlign: 'center'
                }}
              >
                {error.includes('401') ? '认证失败：请检查API密钥有效性' : error}
              </Typography>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}