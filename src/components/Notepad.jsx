// src/components/Notepad.jsx
import React, { useState, useEffect } from 'react';
import { Box, IconButton, TextField, Button, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';



const Notepad = ({ content, onSave, onClose, title }) => {
  const [editorContent, setEditorContent] = useState(content);
  const [isSaved, setIsSaved] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = React.useRef(null);
  const editorContentRef = React.useRef(content);

  useEffect(() => {
    setEditorContent(content);
    setIsSaved(true);
  }, [content]);

  const handleContentChange = (e) => {
    if (isSaved) setIsSaved(false);
    editorContentRef.current = e.target.value; 
    setEditorContent(e.target.value);
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await onSave(editorContent);
      editorContentRef.current = editorContent;
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

  // 正确的关闭处理逻辑
  const handleCloseClick = () => {
    const hasChanges = editorContent !== content;
    onClose(hasChanges, editorContent);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      right: 0,
      bottom: 0,
      backgroundColor: '#fff',
      zIndex: 1500,
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* 工具栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '8px 16px',
        borderBottom: '1px solid #e0e0e0',
        backgroundColor: '#f5f5f5'
      }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={isSaving ? <CircularProgress size={20} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={isSaving || isSaved}
          size="small"
        >
          {isSaving ? '保存中...' : '保存'}
        </Button>
        
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{ marginRight: 16 }}>{title}</span>
          <IconButton 
            onClick={handleCloseClick}
            aria-label="关闭"
          >
            <CloseIcon />
          </IconButton>
        </div>
      </div>

      {/* 编辑区域 */}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <TextField
          fullWidth
          autoFocus
          multiline
          value={editorContent}
          onChange={handleContentChange}
          variant="outlined"
          inputRef={textareaRef}
          InputProps={{
            style: {
              height: '100%',
              alignItems: 'flex-start',
              padding: 16,
              fontSize: '14px',
              lineHeight: 1.6,
              fontFamily: 'Monaco, monospace'
            }
          }}
          style={{
            height: '100%',
            '& textarea': {
              resize: 'none'
            }
          }}
        />
      </div>
    </div>
  );
};

// 保存确认弹窗组件
const SaveConfirmDialog = ({ open, onClose, onConfirm }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>未保存的更改</DialogTitle>
    <DialogContent>
      您有未保存的更改，确定要离开吗？
    </DialogContent>
    <DialogActions>
      <Button onClick={() => onConfirm(false)} color="primary">
        不保存
      </Button>
      <Button onClick={() => onConfirm(true)} color="primary" variant="contained">
        保存
      </Button>
    </DialogActions>
  </Dialog>
);

export default Notepad;
export { SaveConfirmDialog }; 