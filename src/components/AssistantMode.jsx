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
  const containerRef = useRef(null);
  const scrollTimeout = useRef(null);

  // 增强版滚动控制
  const maintainScroll = useCallback((forceScroll = false) => {
    const container = containerRef.current;
    if (!container) return;

    // 计算是否接近底部（保留50px缓冲）
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
    
    // 当强制滚动或接近底部时自动滚动
    if (forceScroll || isNearBottom) {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "nearest"
        });
      }, 50);
    }
  }, []);

  useEffect(() => {
    maintainScroll(true); // 新消息到达时强制滚动
  }, [messages, loading]);

  useEffect(() => {
    return () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
    };
  }, []);

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
    <div 
      className="assistant-container"
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* 可滚动的内容区域 */}
      <div 
        ref={containerRef}
        className="scrollable-content"
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 16px 0',
          position: 'relative',
          scrollBehavior: 'smooth',
          overscrollBehavior: 'contain'
        }}
      >
        {!isInitialized ? (
          <div 
            className="welcome-prompt"
            style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              color: '#666'
            }}
          >
            <SmartToyIcon style={{ fontSize: 64, marginBottom: 16, color: '#4CAF50' }}/>
            <h2 style={{ marginBottom: 8 }}>智能学习助手</h2>
            <p>输入您的问题开始对话</p>
          </div>
        ) : (
          <>
            {/* 消息列表容器 */}
            <div style={{ 
              minHeight: 'calc(100% - 40px)', // 保留输入框高度
              paddingBottom: 40 // 防止底部内容被遮挡
            }}>
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  style={{ 
                    display: 'flex',
                    justifyContent: msg.isAI ? 'flex-start' : 'flex-end',
                    marginBottom: 16,
                    animation: 'messageAppear 0.3s ease-out'
                  }}
                >
                  {/* 消息气泡 */}
                  <div
                    className="message-bubble"
                    style={{
                      maxWidth: 'min(75%, 600px)',
                      padding: '12px 16px',
                      borderRadius: msg.isAI ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                      backgroundColor: msg.isAI ? '#fff' : '#2196F3',
                      color: msg.isAI ? '#333' : '#fff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      wordBreak: 'break-word'
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} style={{ height: 1 }} />
            </div>
          </>
        )}
      </div>

      {/* 固定在底部的输入区域 */}
      <div 
        className="input-container"
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: 'white',
          borderTop: '1px solid #e0e0e0',
          zIndex: 2,
          boxShadow: '0 -4px 12px rgba(0,0,0,0.05)'
        }}
      >
        <form onSubmit={handleSubmit} style={{ padding: 16 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="text"
              placeholder="输入你的问题..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              ref={inputRef}
              onClick={handleChatAreaClick}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 24,
                border: '1px solid #e0e0e0',
                outline: 'none',
                fontSize: 14,
                backgroundColor: '#fff',
                transition: 'box-shadow 0.2s'
              }}
            />
            <IconButton 
              type="submit" 
              color="primary"
              disabled={loading}
              style={{ 
                backgroundColor: '#2196F3',
                color: 'white',
                transition: 'transform 0.2s',
                '&:hover': {
                  backgroundColor: '#1976D2'
                }
              }}
            >
              <SendIcon />
            </IconButton>
          </div>
          {error && (
            <div 
              style={{ 
                color: '#f44336',
                fontSize: 12,
                marginTop: 8,
                textAlign: 'center'
              }}
            >
              {error}
            </div>
          )}
          {loading && (
            <div style={{ 
              display: 'flex',
              alignItems: 'center',
              paddingTop: 8
            }}>
              <CircularProgress size={20} style={{ marginRight: 8 }}/>
              <span>正在生成回答...</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AssistantMode;