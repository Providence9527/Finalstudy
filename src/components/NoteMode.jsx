// NoteMode.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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

  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);
        const data = await fetchNodeList(user.userId);
        setNotes(data);
      } catch (error) {
        setError('无法加载笔记列表');
        console.error('加载笔记失败:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadNotes();
  }, [user.userId]);

  const handleDelete = async (noteId) => {
    try {
      await deleteNote(user.userId, noteId);
      setNotes(prev => prev.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('删除笔记失败:', error);
    }
  };

  const handleCreate = async () => {
    try {
      setLoading(true);
      const newNote = await createNote(user.userId, newNoteTitle);
      // 跳转到Notepad组件（待实现）
      console.log('进入新笔记:', newNote);
      setIsDialogOpen(false);
      setNewNoteTitle('');
    } catch (error) {
      console.error('创建笔记失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="note-mode-container">
      <div className="note-header">
        <h3>我的笔记</h3>
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => setIsDialogOpen(true)}
        >
          新建笔记
        </Button>
      </div>

      {loading && <div className="loading">加载中...</div>}
      {error && <div className="error">{error}</div>}

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
                onClick={() => handleDelete(note.id)}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>

      {/* 新建笔记弹窗 */}
      <Dialog open={isDialogOpen} onClose={() => setIsDialogOpen(false)}>
        <DialogTitle>新建笔记</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="笔记标题"
            fullWidth
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDialogOpen(false)}>取消</Button>
          <Button 
            onClick={handleCreate}
            disabled={loading}
            startIcon={loading && <CircularProgress size={20} />}
          >
            创建
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default NoteMode;