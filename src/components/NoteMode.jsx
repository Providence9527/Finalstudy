import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContentText from '@mui/material/DialogContentText';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { fetchNodeList, deleteNote, createNote } from '../api/learning';
import './SmartAssistant.css';

const NoteMode = () => {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredNoteId, setHoveredNoteId] = useState(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadNotes = async () => {
    try {
      setLoading(true);
      
      const rawData = await fetchNodeList(user.userId);
        
        // 按照最后查看时间倒序排列
        const sortedData = rawData.sort((a, b) => {
          return new Date(b.lastViewed) - new Date(a.lastViewed);
        });
        
        console.log("排序后的笔记数据:", sortedData);
        setNotes(sortedData);

    } catch (error) {
      setError('无法加载笔记列表');
      console.error('加载笔记失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotes();
  }, [user.userId]);

  const handleDelete = async () => {
    if (!noteToDelete) return;
    
    try {
      setDeleteLoading(true);
      await deleteNote(user.userId, noteToDelete);
      setNotes(prev => prev.filter(note => note.id !== noteToDelete));
      setConfirmDeleteOpen(false);
    } catch (error) {
      console.error('删除笔记失败:', error);
      setError('删除失败，请稍后重试');
    } finally {
      setDeleteLoading(false);
      setNoteToDelete(null);
    }
  };

  const handleDeleteClick = (noteId) => {
    setNoteToDelete(noteId);
    setConfirmDeleteOpen(true);
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const newNote = await createNote(user.userId, newNoteTitle);
      setIsDialogOpen(false);
      setNewNoteTitle('');
      await loadNotes();
      setError(null);
    } catch (error) {
      console.error('创建笔记失败:', error);
      setError('创建失败，请检查网络连接');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="note-mode-container" 
    >
      <div className="note-header">
        <h3>我的笔记</h3>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => setIsDialogOpen(true)}
          disabled={loading}
          size="medium"
        >
          新建笔记
        </Button>
      </div>

      {loading && <div className="loading">加载中...</div>}
      {error && <div className="error">{error}</div>}

      <div style={{
          flex: 1,
          maxHeight: '40vh',
          minHeight: 200,
          overflowY: 'auto'
        }}>
          <ul className="note-list">
        {notes.map(note => (
          <li 
            key={note.id}
            onMouseEnter={() => setHoveredNoteId(note.id)}
            onMouseLeave={() => setHoveredNoteId(null)}
          >
            <span className="note-title">{note.title}</span>
            {hoveredNoteId === note.id && (
              <button 
                className="delete-btn"
                onClick={() => handleDeleteClick(note.id)}
                disabled={deleteLoading}
                aria-label="删除笔记"
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>

      {/* 删除确认弹窗 */}
      <Dialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        maxWidth="xs"
        PaperProps={{
          style: {
            width: '60vw',
            maxWidth: 400,
            borderRadius: 12
          }
        }}
      >
        <DialogTitle style={{ textAlign: 'center' }}>确认删除</DialogTitle>
        <DialogContent>
          <DialogContentText style={{ textAlign: 'center' }}>
            确定要永久删除该笔记吗？此操作无法撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button 
            onClick={() => setConfirmDeleteOpen(false)}
            color="primary"
            disabled={deleteLoading}
            variant="outlined"
          >
            取消
          </Button>
          <Button 
            onClick={handleDelete}
            color="secondary"
            variant="contained"
            sx={{ minWidth: 96 }}
            disabled={deleteLoading}
            startIcon={deleteLoading && <CircularProgress size={20} />}
          >
            {deleteLoading ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 新建笔记弹窗 */}
      <Dialog 
        open={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)}
        maxWidth="sm"
        PaperProps={{
          style: {
            width: '60vw',
            maxWidth: 600,
            borderRadius: 12
          }
        }}
      >
        <DialogTitle style={{ paddingBottom: 8 }}>新建笔记</DialogTitle>
        <DialogContent style={{ paddingTop: 8 }}>
          <TextField
            autoFocus
            margin="dense"
            label="笔记标题"
            fullWidth
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
            variant="outlined"
            disabled={loading}
            autoComplete="off"
            inputProps={{
              maxLength: 50
            }}
          />
        </DialogContent>
        <DialogActions style={{ padding: '16px 24px' }}>
          <Button 
            onClick={() => setIsDialogOpen(false)}
            disabled={loading}
            variant="outlined"
          >
            取消
          </Button>
          <Button 
            onClick={handleCreate}
            color="primary"
            variant="contained"
            disabled={loading || !newNoteTitle.trim()}
            startIcon={loading && <CircularProgress size={20} />}
          >
            {loading ? '创建中...' : '创建'}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default NoteMode;