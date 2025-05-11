import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CircularProgress,
  IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';

const AssistantMode = ({ isOn, handleToggle }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    try {
      setLoading(true);
      setError(null);
      inputRef.current.focus();
      
      const userMessage = { text: inputMessage, isAI: false };
      const tempMessages = [...messages, userMessage];
      setMessages(tempMessages);
      setInputMessage('');
      if (!isInitialized) setIsInitialized(true);

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
      
      setMessages([...tempMessages, { text: aiResponse, isAI: true }]);
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

  const handleChatAreaClick = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="mode-tab-content">
      <div className="mode-content" style={{ height: '100%', overflow: 'hidden' }}>
        <div className="content-item">
          <div className="assistant-chat" style={{ 
            height: '100%',
            display: 'flex',
            flexDirection: 'column' 
          }}>
            <div 
              className="chat-history" 
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '16px',
                backgroundColor: '#f5f5f5',
                cursor: 'text'
              }}
              onClick={handleChatAreaClick}
            >
              {!isInitialized ? (
                <div style={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  color: '#666',
                  cursor: 'pointer'
                }}>
                  <SmartToyIcon style={{ fontSize: 64, marginBottom: 16, color: '#4CAF50' }}/>
                  <h2 style={{ marginBottom: 8 }}>智能学习助手</h2>
                  <p>输入您的问题开始对话</p>
                </div>
              ) : (
                <>
                  {messages.map((msg, index) => (
                    <div 
                      key={index} 
                      onClick={handleChatAreaClick}
                      style={{ 
                        display: 'flex',
                        justifyContent: msg.isAI ? 'flex-start' : 'flex-end',
                        marginBottom: 16
                      }}
                    >
                      {msg.isAI && (
                        <div style={{ marginRight: 8 }}>
                          <PersonIcon style={{ 
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            borderRadius: '50%',
                            padding: 4
                          }}/>
                        </div>
                      )}
                      <div style={{
                        maxWidth: '70%',
                        padding: '12px 16px',
                        borderRadius: msg.isAI ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                        backgroundColor: msg.isAI ? '#fff' : '#2196F3',
                        color: msg.isAI ? '#333' : '#fff',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        {msg.text}
                      </div>
                      {!msg.isAI && (
                        <div style={{ marginLeft: 8 }}>
                          <PersonIcon style={{ 
                            backgroundColor: '#2196F3',
                            color: 'white',
                            borderRadius: '50%',
                            padding: 4
                          }}/>
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      padding: 16
                    }}>
                      <CircularProgress size={24} style={{ marginRight: 8 }}/>
                      <span>正在生成回答...</span>
                    </div>
                  )}
                  <div ref={messagesEndRef}/>
                </>
              )}
            </div>
            <form onSubmit={handleSubmit} style={{
              borderTop: '1px solid #e0e0e0',
              padding: '16px',
              backgroundColor: 'white'
            }}>
              <div style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center'
              }}>
                <input
                  type="text"
                  placeholder="输入你的问题..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  ref={inputRef}
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    borderRadius: 24,
                    border: '1px solid #e0e0e0',
                    outline: 'none',
                    fontSize: 14
                  }}
                />
                <IconButton 
                  type="submit" 
                  color="primary"
                  disabled={loading}
                  style={{ 
                    backgroundColor: '#2196F3',
                    color: 'white',
                    '&:hover': { backgroundColor: '#1976D2' }
                  }}
                >
                  <SendIcon />
                </IconButton>
              </div>
              {error && (
                <div style={{ 
                  color: '#f44336',
                  fontSize: 12,
                  marginTop: 8,
                  textAlign: 'center'
                }}>
                  {error}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantMode;