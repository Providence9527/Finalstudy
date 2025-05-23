import React, { useState, useEffect } from 'react';
import { IconButton, TextField, Button, CircularProgress } from '@mui/material';
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
      console.log("触发保存")
      setIsSaving(true);
      await onSave(editorContent);
      editorContentRef.current = editorContent;
      setIsSaved(true);
    } finally {
      setIsSaving(false);
    }
  };

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

      
        <TextField
          fullWidth
          autoFocus
          multiline
          value={editorContent}
          onChange={handleContentChange}
          variant="standard"
          inputRef={textareaRef}
          InputProps={{
            style: {
              height: '40vh',
              alignItems: 'flex-start',
              
              fontSize: '14px',
              lineHeight: 1.6,
              fontFamily: 'Monaco, monospace',
              whiteSpace: 'pre-wrap',
              overflowY: 'auto',
              overflowX: 'auto',
              border: '1px solidrgb(196, 196, 196)',
              borderRadius: '4px',
              transition: 'border-color 0.3s ease',
              boxSizing: 'border-box'
            },
            disableUnderline: true
          }}
          sx={{
            '& .MuiInputBase-root': {
              height: '100%',
              '&:before, &:after': {
                display: 'none'
              }
            },
            '&:focus-within': {
              '& .MuiInputBase-input': {
                border: '2px solid #1976d2',
                borderRadius: '10px',
                padding: '15px' // 补偿边框变粗导致的布局变化
              }
            }
          }}
        />
      
    </div>
  );
};

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