// src/components/MessageBubble.jsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Typography, Box, Paper } from '@mui/material'

export const MessageBubble = ({ message, isAI }) => {
  return (
    <Box sx={{ 
      display: 'flex',
      justifyContent: isAI ? 'flex-start' : 'flex-end',
      mb: 2,
      width: '100%'
    }}>
      <Paper sx={{
        p: 2,
        maxWidth: '70%',
        lineHeight: 1.7,  
        backgroundColor: isAI ? '#f5f5f5' : '#1976d2',
        color: isAI ? '#000' : '#fff',
        borderRadius: isAI ? '20px 20px 20px 4px' : '20px 20px 4px 20px',
        wordBreak: 'break-word',
        '& pre': { 
          backgroundColor: isAI ? '#e0e0e0' : '#1565c0',
          borderRadius: '8px',
          padding: '12px',
          overflowX: 'auto',
          lineHeight: 2.0  // 代码块行距
        },
        '& code': {
          fontFamily: 'monospace',
          fontSize: '0.9em'
        }
      }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({node, ...props}) => <div style={{ 
              marginBottom: '1em',  // 段落间距
              lineHeight: 2.0 
               }} {...props} />,
            strong: ({node, ...props}) => <strong style={{color: isAI ? '#2e7d32' : '#fff'}} {...props} />,
            em: ({node, ...props}) => <em style={{color: isAI ? '#d32f2f' : '#ffcdd2'}} {...props} />,
            code: ({node, ...props}) => <code style={{ 
              backgroundColor: isAI ? 'rgba(0,0,0,0.1)' : 'rgba(255,255,255,0.2)',
              padding: '2px 4px',
              borderRadius: '4px'
            }} {...props} />
          }}
        >
          {message}
        </ReactMarkdown>
      </Paper>
    </Box>
  )
}