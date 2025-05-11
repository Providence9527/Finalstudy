import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  CircularProgress,
  IconButton
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const AssistantMode = ({ isOn, handleToggle }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  // 滚动控制逻辑
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
        height: '100vh', // 确保占满整个视口
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* 聊天内容区域 */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          backgroundColor: '#f5f5f5',
          position: 'relative',
          '&::-webkit-scrollbar': {
            width: '8px'
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px'
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#888',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: '#555'
            }
          }
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
            <h2 style={{ color: '#333', margin: '8px 0' }}>智能学习助手</h2>
            <p style={{ color: '#666' }}>输入您的问题开始对话</p>
          </div>
        ) : (
          <div style={{ minHeight: '100%', paddingBottom: '80px' }}> {/* 底部留出输入区域空间 */}
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
                    maxWidth: 'min(75%, 600px)',
                    padding: '12px 16px',
                    borderRadius: msg.isAI ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                    backgroundColor: msg.isAI ? '#ffffff' : '#2196F3',
                    color: msg.isAI ? '#333' : '#fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                    wordBreak: 'break-word',
                    lineHeight: 1.5
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

      {/* 固定输入区域 */}
      <div 
        style={{
          position: 'sticky',
          bottom: 0,
          backgroundColor: '#fff',
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