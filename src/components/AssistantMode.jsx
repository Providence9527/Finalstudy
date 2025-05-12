import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CircularProgress,
  IconButton, 
  Box,
  Avatar,
  Typography,
  List,
  ListItem,
  ListItemAvatar
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import Markdown from '@uiw/react-markdown-preview';
import PersonIcon from '@mui/icons-material/Person';

const AssistantMode = ({ isOn, handleToggle }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest"
      });
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      scrollToBottom();
    }
  }, [messages, isInitialized, scrollToBottom]);

  const getAIResponse = async (message) => {
    try {
      const API_TOKEN = import.meta.env.VITE_API_TOKEN;
      const response = await fetch(import.meta.env.VITE_API_MODEL_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: import.meta.env.VITE_API_MODEL,
          messages: [{ role: "user", content: message }],
          max_tokens: 512,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`请求失败，状态码：${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || "未获取到有效回答";
    } catch (error) {
      console.error("API请求错误:", error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    try {
      setLoading(true);
      setError(null);
      
      const userMessage = { text: inputMessage, isAI: false };
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      if (!isInitialized) setIsInitialized(true);

      const aiResponse = await getAIResponse(inputMessage);
      
      setMessages(prev => [...prev, { 
        text: aiResponse, 
        isAI: true 
      }]);
    } catch (err) {
      setError(err.message);
      setMessages(prev => [...prev, { 
        text: `服务错误：${err.message}`,
        isAI: true 
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleChatAreaClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div style={{ 
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* 聊天内容区域 */}
      <div style={{ 
        height: '40vh',
        position: 'relative', 
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ 
          flex: 1,
          padding: '16px',
          backgroundColor: '#f5f5f5',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0
        }}>
          <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            overflow: 'hidden'
          }}>
            {!isInitialized ? (
              <div 
                style={{
                  display: 'flex',
                  height: '100%',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center'
                }}
              >
                <SmartToyIcon 
                  style={{ 
                    fontSize: 64, 
                    color: '#4CAF50', 
                    marginBottom: 16 
                  }}
                />
                <h2 style={{ color: '#333', margin: '8px 0' }}>智能学习助手</h2>
                <p style={{ color: '#666' }}>输入您的问题开始对话</p>
              </div>
            ) : (
              <div style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: 0,
                overflow: 'hidden'
              }}>
                <Box sx={{
                  flex: 1,
                  overflowY: 'scroll',
                  height: '100%',
                  p: 2,
                  bgcolor: 'background.paper',
                  '& pre': { 
                    bgcolor: 'action.hover', 
                    borderRadius: 1, 
                    p: 2,
                    overflowX: 'auto'
                  },
                  '& code': { 
                    fontFamily: 'monospace',
                    fontSize: '0.875rem'
                  },
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    backgroundColor: '#888',
                    borderRadius: '4px',
                    '&:hover': {
                      backgroundColor: '#555'
                    }
                  }
                }}>
                  <List sx={{ 
                    minHeight: '100%',
                    '& .MuiListItem-root': {
                      alignItems: 'flex-start',
                      animation: 'messageAppear 0.3s ease-out'
                    }
                  }}>
                    {messages.map((msg, index) => (
                      <ListItem 
                        key={index} 
                        disablePadding
                        sx={{
                          display: 'flex',
                          justifyContent: msg.isAI ? 'flex-start' : 'flex-end',
                          mb: 2
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
                        <Box
                          component={Markdown}
                          source={msg.text}
                          sx={{
                            maxWidth: 'min(75%, 600px)',
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: msg.isAI ? 'background.default' : 'primary.main',
                            color: msg.isAI ? 'text.primary' : 'primary.contrastText',
                            boxShadow: 1,
                            '& a': { 
                              color: msg.isAI ? 'primary.main' : '#fff',
                              textDecoration: 'underline'
                            },
                            '& ul': {
                              pl: 2,
                              mb: 1
                            },
                            '& ol': {
                              pl: 2,
                              mb: 1
                            },
                            '& blockquote': {
                              borderLeft: '4px solid',
                              borderColor: msg.isAI ? 'primary.main' : '#fff',
                              pl: 2,
                              ml: 0,
                              color: msg.isAI ? 'text.secondary' : '#fff'
                            }
                          }}
                        />
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
                    ))}
                    <div ref={messagesEndRef} />
                  </List>
                </Box>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 输入区域 */}
      <div 
        style={{
          position: 'sticky', 
          bottom: 0,
          background: '#fff',
          borderTop: '1px solid #e0e0e0',
          padding: '16px',
          zIndex: 1000,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <form 
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center',
            maxWidth: '800px',
            margin: '0 auto'
          }}
        >
          <input
            type="text"
            placeholder="输入您的问题..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            ref={inputRef}
            onClick={handleChatAreaClick}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '24px',
              border: '1px solid #e0e0e0',
              outline: 'none',
              fontSize: '14px',
              backgroundColor: '#fff',
              caretColor: '#2196F3',
              minWidth: '120px',
              '&:focus': {
                boxShadow: '0 0 0 2px rgba(33,150,243,0.2)'
              }
            }}
          />
          <IconButton
            type="submit"
            disabled={loading}
            style={{ 
              backgroundColor: '#2196F3',
              color: '#fff',
              flexShrink: 0,
              '&:hover': {
                backgroundColor: '#1976D2'
              }
            }}
          >
            <SendIcon />
          </IconButton>
        </form>
        
        {error && (
          <div style={{ 
            color: '#f44336',
            fontSize: '12px',
            marginTop: '8px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        
        {loading && (
          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: '8px'
          }}>
            <CircularProgress size={20} style={{ marginRight: 8, color: '#2196F3' }} />
            <span style={{ color: '#666' }}>正在生成回答...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantMode;