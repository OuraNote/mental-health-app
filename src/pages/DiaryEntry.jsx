import { Box, Typography, TextField, Button, ToggleButton, ToggleButtonGroup, Paper, Snackbar, IconButton, Tooltip, Container } from '@mui/material';
import { useState, useRef, useEffect } from 'react';
import { Mic as MicIcon, Lock as LockIcon } from '@mui/icons-material';
import { analyzeSentiment } from '../utils/sentimentAnalyzer';
import { useAppStore } from '../store';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

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
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  
  const wordCount = entry.trim().split(/\s+/).filter(Boolean).length;
  const addDiaryEntry = useAppStore(state => state.addDiaryEntry);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!user) {
      setOpen(true);
      return;
    }

    try {
      const today = new Date().toISOString().slice(0, 10);
      
      // Analyze sentiment for the diary entry
      const sentimentResult = await analyzeSentiment(entry);
      
      const newEntry = { 
        date: today, 
        entry, 
        emotion,
        sentiment: sentimentResult
      };
      
      await addDiaryEntry(newEntry);
      setEntry('');
      setEmotion('');
      setOpen(true);
    } catch (error) {
      console.error('Error saving diary entry:', error);
      // Fallback to saving without sentiment analysis
      const today = new Date().toISOString().slice(0, 10);
      const newEntry = { date: today, entry, emotion };
      await addDiaryEntry(newEntry);
      setEntry('');
      setEmotion('');
      setOpen(true);
    }
  };

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{
        minHeight: '100vh',
        py: 6,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column'
      }}>
        <Container maxWidth="md">
          <Paper
            elevation={6}
            sx={{ p: 5, borderRadius: 6, mt: 2, boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)', background: '#f3e8ff', textAlign: 'center' }}
          >
            <Typography variant='h4' sx={{ fontWeight: 700, mb: 3, color: 'primary.main' }}>Sign In Required</Typography>
            <Typography sx={{ mb: 4, fontSize: '1.1rem' }}>
              Please sign in to write diary entries and save them to your account.
            </Typography>
            <Button 
              variant='contained' 
              color='primary' 
              onClick={() => window.dispatchEvent(new Event('openSignInDialog'))}
              sx={{ py: 2, px: 4, fontSize: '1.1rem', borderRadius: 3 }}
            >
              Sign In
            </Button>
          </Paper>
        </Container>
      </Box>
    );
  }

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
