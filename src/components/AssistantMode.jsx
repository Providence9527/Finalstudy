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

  // 修复滚动逻辑
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: containerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  }, []);

  useEffect(() => {
    if (isInitialized) {
      scrollToBottom();
    }
  }, [messages, isInitialized, scrollToBottom]);

  // 完整的API请求
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
      
      // 添加用户消息
      const userMessage = { text: inputMessage, isAI: false };
      setMessages(prev => [...prev, userMessage]);
      setInputMessage('');
      if (!isInitialized) setIsInitialized(true);

      // 获取AI响应
      const aiResponse = await getAIResponse(inputMessage);
      
      // 添加AI消息
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
    <div 
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* 主内容区域 */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          position: 'relative'
        }}
      >
        {!isInitialized ? (
          <div 
            style={{
              height: '100%',
              display: 'flex',
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
            <h2 style={{ color: '#333', marginBottom: 8 }}>智能学习助手</h2>
            <p style={{ color: '#666' }}>输入您的问题开始对话</p>
          </div>
        ) : (
          <div style={{ minHeight: '100%' }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  marginBottom: 16,
                  display: 'flex',
                  justifyContent: msg.isAI ? 'flex-start' : 'flex-end',
                  animation: 'messageAppear 0.3s ease-out'
                }}
              >
                <div
                  style={{
                    maxWidth: '75%',
                    padding: '12px 16px',
                    borderRadius: msg.isAI ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                    backgroundColor: msg.isAI ? '#ffffff' : '#2196F3',
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
        )}
      </div>

      {/* 输入区域 */}
      <div 
        style={{
          padding: '16px',
          backgroundColor: '#fff',
          borderTop: '1px solid #e0e0e0',
          boxShadow: '0 -2px 8px rgba(0,0,0,0.05)'
        }}
      >
        <form 
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: '8px',
            alignItems: 'center'
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
              caretColor: '#2196F3'
            }}
          />
          <IconButton
            type="submit"
            disabled={loading}
            style={{
              backgroundColor: '#2196F3',
              color: '#fff',
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
            paddingTop: '8px'
          }}>
            <CircularProgress size={20} style={{ marginRight: 8 }} />
            <span>正在生成回答...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantMode;