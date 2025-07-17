import { Box, Typography, Paper, Stack, IconButton, TextField, Button, Dialog, DialogTitle, DialogContent, DialogActions, ToggleButton, ToggleButtonGroup } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useState, useEffect } from 'react';
import { analyzeSentiment } from '../utils/sentimentAnalyzer';

function DiaryVault() {
  const [entries, setEntries] = useState(() => JSON.parse(localStorage.getItem('diaryEntries') || '[]'));
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editEmotion, setEditEmotion] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const emotions = [
    { label: '😊', value: 'happy' },
    { label: '😢', value: 'sad' },
    { label: '😡', value: 'angry' },
    { label: '😌', value: 'calm' },
    { label: '😐', value: 'neutral' }
  ];

  useEffect(() => {
    const handle = () => setEntries(JSON.parse(localStorage.getItem('diaryEntries') || '[]'));
    window.addEventListener('focus', handle);
    handle();
    return () => window.removeEventListener('focus', handle);
  }, []);

  const handleDelete = (id) => {
    const updated = entries.filter(e => e.id !== id);
    localStorage.setItem('diaryEntries', JSON.stringify(updated));
    setEntries(updated);
  };

  const handleEdit = (entry) => {
    setEditingEntry(entry);
    setEditContent(entry.entry);
    setEditEmotion(entry.emotion);
    setEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim() || !editEmotion) return;
    
    setIsSaving(true);
    try {
      // Analyze sentiment for the updated entry
      const sentimentResult = await analyzeSentiment(editContent);
      
      const updatedEntry = {
        ...editingEntry,
        entry: editContent,
        emotion: sentimentResult.mood, // Use sentiment analysis mood instead of manual selection
        sentiment: sentimentResult
      };

      const updatedEntries = entries.map(entry => 
        entry.id === editingEntry.id ? updatedEntry : entry
      );

      localStorage.setItem('diaryEntries', JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
      setEditDialogOpen(false);
      setEditingEntry(null);
      setEditContent('');
      setEditEmotion('');
    } catch (error) {
      console.error('Error saving edited entry:', error);
      // Fallback without sentiment analysis
      const updatedEntry = {
        ...editingEntry,
        entry: editContent,
        emotion: editEmotion // Fallback to manual selection if sentiment analysis fails
      };

      const updatedEntries = entries.map(entry => 
        entry.id === editingEntry.id ? updatedEntry : entry
      );

      localStorage.setItem('diaryEntries', JSON.stringify(updatedEntries));
      setEntries(updatedEntries);
      setEditDialogOpen(false);
      setEditingEntry(null);
      setEditContent('');
      setEditEmotion('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditDialogOpen(false);
    setEditingEntry(null);
    setEditContent('');
    setEditEmotion('');
  };
  return (
    <Box sx={{ minHeight: '100vh', width: '100vw', background: 'linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 100%)', px: 0, py: 6, display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
      <Typography variant='h4' sx={{ fontWeight: 700, mb: 4, color: 'primary.main', textAlign: 'left', pl: { xs: 2, md: 6 } }}>Diary Vault</Typography>
      <Stack spacing={4} sx={{ width: '100%', maxWidth: 700, alignItems: 'flex-start', pl: { xs: 2, md: 6 } }}>
        {entries.length === 0 ? (
          <Paper sx={{ p: 5, borderRadius: 6, background: '#f3e8ff', boxShadow: 4, textAlign: 'left', width: '100%' }}>
            <Typography color='text.secondary' sx={{ fontSize: '1.2rem' }}>No diary entries yet.</Typography>
          </Paper>
        ) : (
          entries.map((entry) => (
            <Paper key={entry.id} sx={{ p: 5, borderRadius: 6, background: '#fff', boxShadow: 4, position: 'relative', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '1.25rem', mr: 2 }}>{entry.date}</Typography>
                  <Typography sx={{ fontSize: 32 }}>{getEmotionEmoji(entry.emotion)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton aria-label='edit' onClick={() => handleEdit(entry)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton aria-label='delete' onClick={() => handleDelete(entry.id)}>
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </Box>
              <Typography sx={{ whiteSpace: 'pre-line', fontSize: '1.2rem' }}>{entry.entry}</Typography>
            </Paper>
          ))
        )}
      </Stack>

      {/* Edit Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCancelEdit}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            background: '#f3e8ff'
          }
        }}
      >
        <DialogTitle sx={{ color: 'primary.main', fontWeight: 700 }}>
          Edit Diary Entry
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
              Your entry
            </Typography>
            <TextField
              multiline
              rows={8}
              fullWidth
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              variant="outlined"
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#fff',
                  borderRadius: 2
                }
              }}
            />
          </Box>
          
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              How are you feeling?
            </Typography>
            <ToggleButtonGroup
              value={editEmotion}
              exclusive
              onChange={(e, val) => setEditEmotion(val)}
              sx={{ flexWrap: 'wrap', gap: 1 }}
            >
              {emotions.map(emotion => (
                <ToggleButton 
                  key={emotion.value} 
                  value={emotion.value} 
                  sx={{ 
                    fontSize: 28, 
                    px: 2,
                    borderRadius: 2,
                    '&.Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white'
                    }
                  }}
                >
                  {emotion.label}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button 
            onClick={handleCancelEdit}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit}
            variant="contained"
            disabled={!editContent.trim() || !editEmotion || isSaving}
            sx={{ borderRadius: 2 }}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function getEmotionEmoji(emotion) {
  switch (emotion) {
    case 'happy': return '😊';
    case 'sad': return '😢';
    case 'angry': return '😡';
    case 'calm': return '😌';
    case 'neutral': return '😐';
    default: return '';
  }
}

export default DiaryVault; 
