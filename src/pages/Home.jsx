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
import { useAppStore } from '../store';

function Home() {
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const { spotlightRefs, startSpotlightTour } = useContext(SpotlightTourContext) || {};
  const letters = useAppStore(state => state.letters);

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
      py: { xs: 2, sm: 6 },
      px: { xs: 2, sm: 0 },
      pb: { xs: 10, sm: 6 },
      boxSizing: 'border-box',
      width: '100%',
    }}>
      <Fade in={show} timeout={1200}>
        <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 6 }, width: '100%', boxSizing: 'border-box' }}>
          <Typography variant="h2" sx={{ fontWeight: 800, mb: { xs: 1, sm: 2 }, color: 'primary.main', letterSpacing: 1, fontSize: { xs: '1.5rem', sm: '2.8rem' }, maxWidth: '100%', overflowWrap: 'break-word', textAlign: 'center' }}>
            Welcome to OuraNote
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ mb: { xs: 2, sm: 3 }, fontSize: { xs: '1rem', sm: '1.5rem' }, maxWidth: '100%', overflowWrap: 'break-word', textAlign: 'center' }}>
            Reflect, grow, and connect with your future self in a safe, beautiful space.
          </Typography>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 4 }, borderRadius: 4, maxWidth: 400, mx: 'auto', background: '#f3e8ff', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, fontSize: { xs: '1rem', sm: '1.25rem' }, maxWidth: '100%', overflowWrap: 'break-word', textAlign: 'center' }}>What would you like to do today?</Typography>
            <Button variant="contained" color="primary" sx={{ mb: 2, width: '100%', fontSize: '1.1rem', py: 2, borderRadius: 2 }} onClick={() => navigate('/diary')}>
              Write Daily Diary Entry
            </Button>
            <Button variant="outlined" color="primary" sx={{ width: '100%', fontSize: '1.1rem', py: 2, borderRadius: 2 }} onClick={() => navigate('/write')}>
              Write Letter to Future Self
            </Button>
          </Paper>
          <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 4 }, borderRadius: 4, maxWidth: 400, mx: 'auto', background: '#f3e5f5', display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', boxSizing: 'border-box' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' }, display: 'flex', alignItems: 'center', maxWidth: '100%', overflowWrap: 'break-word', textAlign: 'center' }}>
              Mobile Premium Features
            </Typography>
            <Typography sx={{ mb: 2, color: '#888', fontSize: { xs: '0.9rem', sm: '1.1rem' }, maxWidth: '100%', overflowWrap: 'break-word', textAlign: 'center' }}>
              Coming Soon
            </Typography>
            <Typography sx={{ mb: 3, color: '#888', fontSize: { xs: '0.9rem', sm: '1.1rem' }, maxWidth: '100%', overflowWrap: 'break-word', textAlign: 'center' }}>
              Enjoy offline access, push notification prompts, voice-to-letter transcription, and widgets in a future update!
            </Typography>
            <Button variant="outlined" size="small" sx={{ mt: 1, mb: 1, fontSize: { xs: '0.9rem', sm: '1.1rem' }, px: { xs: 0, sm: 4 }, py: { xs: 1, sm: 1.5 }, width: '100%', boxSizing: 'border-box', maxWidth: '100%' }} disabled>
              ENABLE OFFLINE MODE
            </Button>
            <Button variant="outlined" size="small" sx={{ mb: 1, fontSize: { xs: '0.9rem', sm: '1.1rem' }, px: { xs: 0, sm: 4 }, py: { xs: 1, sm: 1.5 }, width: '100%', boxSizing: 'border-box', maxWidth: '100%' }} disabled>
              SET UP WIDGETS
            </Button>
          </Paper>
          <Tooltip title="Start your first letter!" arrow>
            <Button
              ref={spotlightRefs?.getStartedBtn}
              variant="contained"
              size="large"
              color="primary"
              sx={{ borderRadius: 32, px: { xs: 3, sm: 6 }, py: { xs: 1.5, sm: 2 }, fontSize: { xs: '1rem', sm: '1.3rem' }, fontWeight: 700, boxShadow: 3, width: '100%', maxWidth: '100%', boxSizing: 'border-box', mb: { xs: 1.5, sm: 0 } }}
              onClick={() => navigate('/write')}
            >
              Get Started
            </Button>
          </Tooltip>
          <Button onClick={startSpotlightTour} sx={{ ml: { xs: 0, sm: 2 }, mt: 2, width: '100%', fontSize: { xs: '0.95rem', sm: '1.1rem' }, maxWidth: '100%', boxSizing: 'border-box' }} variant="outlined">Start Spotlight Tour</Button>
        </Box>
      </Fade>
      <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: 900, px: { xs: 1, sm: 3 }, mt: { xs: 0, sm: 2 }, boxSizing: 'border-box' }}>
        {features.map((feature, idx) => (
          <Grid item xs={12} sm={6} md={4} key={feature.title} sx={{ mb: { xs: 2, sm: 0 } }}>
            <Fade in={show} style={{ transitionDelay: `${400 + idx * 200}ms` }}>
              <Paper elevation={4} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 6, textAlign: 'center', minHeight: { xs: 160, sm: 220 }, display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 24px 0 rgba(110,198,255,0.10)', width: '100%', maxWidth: 400, mx: 'auto', boxSizing: 'border-box', mb: { xs: 2, sm: 0 } }}>
                <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' }, maxWidth: '100%', overflowWrap: 'break-word', textAlign: 'center' }}>{feature.title}</Typography>
                <Typography color="text.secondary" sx={{ mb: 2, fontSize: { xs: '0.95rem', sm: '1.1rem' }, maxWidth: '100%', overflowWrap: 'break-word', textAlign: 'center' }}>{feature.description}</Typography>
                <Tooltip title={`Learn more about ${feature.title}`} arrow>
                  <Button
                    ref={
                      feature.title === 'Write Letters' ? spotlightRefs?.exploreWrite :
                      feature.title === 'Secure Vault' ? spotlightRefs?.exploreVault :
                      feature.title === 'Emotional Timeline' ? spotlightRefs?.exploreTimeline : undefined
                    }
                    variant="outlined" color="primary"
                    sx={{
                      borderRadius: { xs: 2, sm: 24 },
                      fontWeight: 600,
                      fontSize: { xs: '0.95rem', sm: '1.1rem' },
                      width: '100%',
                      px: { xs: 0, sm: 4 },
                      py: { xs: 1, sm: 1.5 },
                      boxSizing: 'border-box',
                      mt: 1,
                      maxWidth: '100%',
                    }}
                    onClick={() => navigate(feature.path)}
                  >
                    Explore
                  </Button>
                </Tooltip>
              </Paper>
            </Fade>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default Home; 
