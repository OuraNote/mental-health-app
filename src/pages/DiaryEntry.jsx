import { Box, Typography, TextField, Button, ToggleButton, ToggleButtonGroup, Paper, Snackbar, IconButton, Tooltip, Container } from '@mui/material';
import { useState, useRef } from 'react';
import { Mic as MicIcon, Lock as LockIcon } from '@mui/icons-material';
import { analyzeSentiment } from '../utils/sentimentAnalyzer';

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





  const handleSave = async () => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const diaryEntries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
      
      // Analyze sentiment for the diary entry
      const sentimentResult = await analyzeSentiment(entry);
      
      const newEntry = { 
        id: Date.now().toString(), 
        date: today, 
        entry, 
        emotion,
        sentiment: sentimentResult
      };
      
      const updatedEntries = [newEntry, ...diaryEntries];
      localStorage.setItem('diaryEntries', JSON.stringify(updatedEntries));
      setEntry('');
      setEmotion('');
      setOpen(true);
    } catch (error) {
      console.error('Error saving diary entry:', error);
      // Fallback to saving without sentiment analysis
      const today = new Date().toISOString().slice(0, 10);
      const diaryEntries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
      const newEntry = { id: Date.now().toString(), date: today, entry, emotion };
      const updatedEntries = [newEntry, ...diaryEntries];
      localStorage.setItem('diaryEntries', JSON.stringify(updatedEntries));
      setEntry('');
      setEmotion('');
      setOpen(true);
    }
  };
  return (
    <Box sx={{
      minHeight: '100vh',
      py: 6,
    }}>
      <Container maxWidth="md">
        <Paper
          elevation={6}
          sx={{ p: 5, borderRadius: 6, mt: 2, boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)', background: '#f3e8ff' }}
        >
        <Typography variant='h4' sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>Write Your Daily Diary Entry</Typography>
        
        {/* Voice Input Section */}
        <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <Typography variant='h6' sx={{ color: 'primary.main', fontWeight: 600, mb: 2 }}>
            Voice Input
          </Typography>
          
                                <Box sx={{ width: '100%' }}>
            {/* Premium Feature Preview */}
                          <Box sx={{ 
                p: 3, 
                bgcolor: '#fafafa', 
                borderRadius: 2, 
                border: '2px dashed #ccc',
                textAlign: 'center',
                width: '100%',
                minHeight: 150,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                cursor: 'not-allowed',
                position: 'relative'
              }}>
                <LockIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  Premium feature coming soon!
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', mt: 1 }}>
                  High-accuracy speech recognition with advanced AI processing
                </Typography>
              </Box>
            </Box>
          

        </Box>
        
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
      </Container>
      <Snackbar open={open} autoHideDuration={2000} onClose={() => setOpen(false)} message='Diary entry saved!' />
    </Box>
  );
}

export default DiaryEntry; 
