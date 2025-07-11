import { Box, Typography, Paper, Stack, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';

function DiaryVault() {
  const [entries, setEntries] = useState(() => JSON.parse(localStorage.getItem('diaryEntries') || '[]'));
  const handleDelete = (id) => {
    const updated = entries.filter(e => e.id !== id);
    localStorage.setItem('diaryEntries', JSON.stringify(updated));
    setEntries(updated);
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
                <IconButton aria-label='delete' onClick={() => handleDelete(entry.id)}>
                  <DeleteIcon />
                </IconButton>
              </Box>
              <Typography sx={{ whiteSpace: 'pre-line', fontSize: '1.2rem' }}>{entry.entry}</Typography>
            </Paper>
          ))
        )}
      </Stack>
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
