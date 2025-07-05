import { Container, Typography, Box, Grid, Paper, Button, Fade } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  Edit as EditIcon,
  Lock as LockIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import { useEffect, useState, useContext } from 'react';
import Tooltip from '@mui/material/Tooltip';
import { SpotlightTourContext } from '../App';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { useAppStore } from '../store';

function Home() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const { spotlightRefs, startSpotlightTour } = useContext(SpotlightTourContext) || {};
  const [premiumPromptOpen, setPremiumPromptOpen] = useState(false);
  const letters = useAppStore(state => state.letters);
  const isPremium = (() => {
    try {
      return JSON.parse(localStorage.getItem('isPremium') || 'false');
    } catch { return false; }
  })();

  const PROMPTS = [
    'What are you grateful for today?',
    'Write a letter to your future self in 1 year.',
    'Describe a challenge you overcame recently.',
    'What is one thing you want to let go of?',
    'Who inspires you and why?',
    'What is a goal you want to achieve this month?',
    'Reflect on a happy memory.',
    'What advice would you give your younger self?',
    'How do you practice self-care?',
    'What are you looking forward to?'
  ];

  const [promptIdx, setPromptIdx] = useState(() => {
    const today = new Date().toISOString().slice(0, 10);
    const stored = localStorage.getItem('promptIdx_' + today);
    if (stored) return parseInt(stored, 10);
    const idx = Math.floor(Math.random() * PROMPTS.length);
    localStorage.setItem('promptIdx_' + today, idx);
    return idx;
  });

  const handleNewPrompt = () => {
    let idx;
    do {
      idx = Math.floor(Math.random() * PROMPTS.length);
    } while (idx === promptIdx && PROMPTS.length > 1);
    setPromptIdx(idx);
    const today = new Date().toISOString().slice(0, 10);
    localStorage.setItem('promptIdx_' + today, idx);
  };

  useEffect(() => { setShow(true); }, []);

  const features = [
    {
      title: 'Write Letters',
      description: 'Compose heartfelt letters to your future self, with optional image attachments.',
      icon: <EditIcon sx={{ fontSize: 40 }} />,
      path: '/write',
    },
    {
      title: 'Secure Vault',
      description: 'Your letters are safely stored in an encrypted vault until their unlock date.',
      icon: <LockIcon sx={{ fontSize: 40 }} />,
      path: '/vault',
    },
    {
      title: 'Emotional Timeline',
      description: 'Track your emotional journey through time with our sentiment analysis.',
      icon: <TimelineIcon sx={{ fontSize: 40 }} />,
      path: '/timeline',
    },
  ];

  // Real streak calculation
  const getStreak = () => {
    if (!letters || letters.length === 0) return 0;
    // Get all unique valid dates (YYYY-MM-DD) with at least one letter
    const dateSet = new Set(
      letters.map(l => {
        const rawDate = l.date || l.createdAt;
        if (!rawDate) return null;
        const d = new Date(rawDate);
        if (isNaN(d.getTime())) return null;
        return d.toISOString().slice(0, 10);
      }).filter(Boolean)
    );
    // Start from today, count consecutive days with entries
    let streak = 0;
    let current = new Date();
    while (dateSet.has(current.toISOString().slice(0, 10))) {
      streak++;
      current.setDate(current.getDate() - 1);
    }
    return streak;
  };
  const streak = getStreak();

  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#e0f7fa',
      backgroundImage: 'linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      py: 6,
    }}>
      <Fade in={show} timeout={1200}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: 2, color: 'primary.main', letterSpacing: 1 }}>
            Welcome to Your Time Capsule
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: 3 }}>
            Reflect, grow, and connect with your future self in a safe, beautiful space.
          </Typography>
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 4, maxWidth: 500, mx: 'auto', background: '#fffbe7', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <LightbulbIcon sx={{ color: '#FFD600', fontSize: 36, mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>Daily Reflection Prompt</Typography>
            <Typography sx={{ fontSize: '1.15rem', mb: 2, color: '#555' }}>{PROMPTS[promptIdx]}</Typography>
            <Button variant="outlined" size="small" onClick={handleNewPrompt}>New Prompt</Button>
          </Paper>
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 4, maxWidth: 500, mx: 'auto', background: '#e3f2fd', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center' }}>
              Recurring Prompts & Streaks
              {!isPremium && <LockIcon color="warning" sx={{ ml: 1 }} />}
            </Typography>
            {isPremium ? (
              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ mb: 1 }}>You've journaled <b>{streak}</b> days in a row!</Typography>
                <Button variant="outlined" size="small" sx={{ mt: 1 }}>Schedule a Recurring Letter</Button>
                <Button variant="outlined" size="small" sx={{ mt: 1, ml: 2 }}>Browse Prompt Packs</Button>
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', color: '#888' }}>
                <Typography sx={{ mb: 2 }}>Upgrade to Premium to unlock recurring prompts, milestone reminders, streak tracking, and more.</Typography>
                <Button variant="contained" color="warning" onClick={() => setPremiumPromptOpen(true)} startIcon={<LockIcon />}>Go Premium</Button>
              </Box>
            )}
          </Paper>
          <Paper elevation={3} sx={{ p: 3, mb: 4, borderRadius: 4, maxWidth: 500, mx: 'auto', background: '#f3e5f5', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, display: 'flex', alignItems: 'center' }}>
              Mobile Premium Features
            </Typography>
            <Typography sx={{ mb: 2, color: '#888' }}>
              Coming Soon
            </Typography>
            <Typography sx={{ mb: 3, color: '#888' }}>
              Enjoy offline access, push notification prompts, voice-to-letter transcription, and widgets in a future update!
            </Typography>
            <Button variant="outlined" size="small" sx={{ mt: 1, mb: 1 }} disabled>
              ENABLE OFFLINE MODE
            </Button>
            <Button variant="outlined" size="small" sx={{ mb: 1 }} disabled>
              SET UP WIDGETS
            </Button>
          </Paper>
          <Tooltip title="Start your first letter!" arrow>
            <Button
              ref={spotlightRefs?.getStartedBtn}
              variant="contained"
              size="large"
              color="primary"
              sx={{ borderRadius: 32, px: 6, py: 2, fontSize: '1.3rem', fontWeight: 700, boxShadow: 3 }}
              onClick={() => navigate('/write')}
            >
              Get Started
            </Button>
          </Tooltip>
          <Button onClick={startSpotlightTour} sx={{ ml: 2, mt: 2 }} variant="outlined">Start Spotlight Tour</Button>
        </Box>
      </Fade>
      <Grid container spacing={4} justifyContent="center" sx={{ maxWidth: 900, px: { xs: 1, sm: 3 } }}>
        {features.map((feature, idx) => (
          <Grid item xs={12} sm={6} md={4} key={feature.title}>
            <Fade in={show} style={{ transitionDelay: `${400 + idx * 200}ms` }}>
              <Paper elevation={4} sx={{ p: 4, borderRadius: 6, textAlign: 'center', minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 24px 0 rgba(110,198,255,0.10)' }}>
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{feature.title}</Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>{feature.description}</Typography>
                <Tooltip title={`Learn more about ${feature.title}`} arrow>
                  <Button
                    ref={
                      feature.title === 'Write Letters' ? spotlightRefs?.exploreWrite :
                      feature.title === 'Secure Vault' ? spotlightRefs?.exploreVault :
                      feature.title === 'Emotional Timeline' ? spotlightRefs?.exploreTimeline : undefined
                    }
                    variant="outlined" color="primary" sx={{ borderRadius: 24, fontWeight: 600 }} onClick={() => navigate(feature.path)}>
                    Explore
                  </Button>
                </Tooltip>
              </Paper>
            </Fade>
          </Grid>
        ))}
      </Grid>
      <Dialog open={premiumPromptOpen} onClose={() => setPremiumPromptOpen(false)}>
        <DialogTitle>Premium Feature</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LockIcon color="warning" sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Coming Soon</Typography>
          </Box>
          <Typography sx={{ mb: 2 }}>
            This feature will be available in a future update.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPremiumPromptOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Home; 
