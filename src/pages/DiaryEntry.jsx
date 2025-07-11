import { Box, Typography, TextField, Button, ToggleButton, ToggleButtonGroup, Paper, Snackbar } from '@mui/material';
import { useState } from 'react';

const emotions = [
  { label: '😊', value: 'happy' },
  { label: '😢', value: 'sad' },
  { label: '😡', value: 'angry' },
  { label: '😌', value: 'calm' },
  { label: '😐', value: 'neutral' }
];

function DiaryEntry() {
  const [entry, setEntry] = useState('');
  const [emotion, setEmotion] = useState('');
  const [open, setOpen] = useState(false);
  const wordCount = entry.trim().split(/\s+/).filter(Boolean).length;
  const handleSave = () => {
    const today = new Date().toISOString().slice(0, 10);
    const diaryEntries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
    const newEntry = { id: Date.now().toString(), date: today, entry, emotion };
    const updatedEntries = [newEntry, ...diaryEntries];
    localStorage.setItem('diaryEntries', JSON.stringify(updatedEntries));
    setEntry('');
    setEmotion('');
    setOpen(true);
  };
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 100%)', px: 2 }}>
      <Paper sx={{ p: { xs: 5, sm: 7 }, borderRadius: 6, maxWidth: 700, minHeight: 500, width: '100%', background: '#f3e8ff', boxShadow: 6, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <Typography variant='h4' sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>Write Your Daily Diary Entry</Typography>
        <TextField
          label='Your entry'
          multiline
          minRows={12}
          value={entry}
          onChange={e => setEntry(e.target.value)}
          variant='outlined'
          fullWidth
          sx={{ mb: 2, fontSize: '1.1rem', background: '#fff', borderRadius: 2 }}
        />
        <Typography sx={{ mb: 2, fontSize: '1rem', color: 'text.secondary', textAlign: 'right', width: '100%' }}>Word count: {wordCount}</Typography>
        <Typography sx={{ mb: 2, fontSize: '1.1rem' }}>How are you feeling?</Typography>
        <ToggleButtonGroup
          value={emotion}
          exclusive
          onChange={(e, val) => setEmotion(val)}
          sx={{ mb: 4 }}
        >
          {emotions.map(e => (
            <ToggleButton key={e.value} value={e.value} sx={{ fontSize: 28, px: 2 }}>{e.label}</ToggleButton>
          ))}
        </ToggleButtonGroup>
        <Button variant='contained' color='primary' fullWidth sx={{ py: 2, fontSize: '1.1rem', borderRadius: 3 }} onClick={handleSave} disabled={!entry || !emotion}>
          Save Entry
        </Button>
      </Paper>
      <Snackbar open={open} autoHideDuration={2000} onClose={() => setOpen(false)} message='Diary entry saved!' />
    </Box>
  );
}

export default DiaryEntry; 
