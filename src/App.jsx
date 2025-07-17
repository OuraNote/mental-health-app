/**
 * Mental Health Time Capsule
 * Copyright (c) 2025 Aditya Kumar and Akshith Saravanan
 * All rights reserved. This code is proprietary and confidential.
 * Unauthorized copying, distribution, or use is strictly prohibited.
 */

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Layout from './components/Layout';
import Home from './pages/Home';
import WriteLetter from './pages/WriteLetter';
import Vault from './pages/Vault';
import Timeline from './pages/Timeline';
import LetterWall from './pages/LetterWall';
import DiaryEntry from './pages/DiaryEntry';
import DiaryVault from './pages/DiaryVault';
import MediaTest from './pages/MediaTest';
import Community from './pages/Community';
import { useEffect, useState, useRef, useMemo } from 'react';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useAppStore } from './store';
import { decryptLetter, cleanupBlobUrl } from './utils/encryption';
import Box from '@mui/material/Box';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Popover from '@mui/material/Popover';
import React, { createContext } from 'react';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7C3AED', // Soft purple
      contrastText: '#fff',
    },
    secondary: {
      main: '#38BDF8', // Soft blue
    },
    background: {
      default: '#e0e7ff',
      paper: '#fff',
    },
    info: {
      main: '#FBBF24', // Soft yellow
    },
    error: {
      main: '#F87171', // Soft red
    },
  },
  typography: {
    fontFamily: 'Inter, Nunito, Roboto, Helvetica, Arial, sans-serif',
    fontSize: 18,
    h1: { fontSize: '2.8rem', fontWeight: 800 },
    h2: { fontSize: '2.2rem', fontWeight: 700 },
    h3: { fontSize: '1.8rem', fontWeight: 700 },
    h4: { fontSize: '1.5rem', fontWeight: 600 },
    h5: { fontSize: '1.2rem', fontWeight: 500 },
    h6: { fontSize: '1.1rem', fontWeight: 500 },
    body1: { fontSize: '1.1rem' },
    body2: { fontSize: '1rem' },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          fontWeight: 700,
          fontSize: '1.1rem',
          padding: '12px 32px',
          boxShadow: '0 2px 8px 0 rgba(124,58,237,0.10)',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0 4px 16px 0 rgba(124,58,237,0.18)',
            transform: 'translateY(-2px) scale(1.03)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 24px 0 rgba(124,58,237,0.10)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          boxShadow: '0 8px 32px 0 rgba(124,58,237,0.18)',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#A78BFA',
      contrastText: '#18181b',
    },
    secondary: {
      main: '#38BDF8',
    },
    background: {
      default: '#18181b',
      paper: '#232136',
    },
    info: {
      main: '#FBBF24',
    },
    error: {
      main: '#F87171',
    },
  },
  typography: {
    fontFamily: 'Inter, Nunito, Roboto, Helvetica, Arial, sans-serif',
    fontSize: 18,
    h1: { fontSize: '2.8rem', fontWeight: 800 },
    h2: { fontSize: '2.2rem', fontWeight: 700 },
    h3: { fontSize: '1.8rem', fontWeight: 700 },
    h4: { fontSize: '1.5rem', fontWeight: 600 },
    h5: { fontSize: '1.2rem', fontWeight: 500 },
    h6: { fontSize: '1.1rem', fontWeight: 500 },
    body1: { fontSize: '1.1rem' },
    body2: { fontSize: '1rem' },
  },
  shape: {
    borderRadius: 20,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          fontWeight: 700,
          fontSize: '1.1rem',
          padding: '12px 32px',
          boxShadow: '0 2px 8px 0 rgba(167,139,250,0.10)',
          transition: 'all 0.2s',
          '&:hover': {
            boxShadow: '0 4px 16px 0 rgba(167,139,250,0.18)',
            transform: 'translateY(-2px) scale(1.03)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          boxShadow: '0 4px 24px 0 rgba(167,139,250,0.10)',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 28,
          boxShadow: '0 8px 32px 0 rgba(167,139,250,0.18)',
        },
      },
    },
  },
});

export const ThemeToggleContext = createContext();

const originalTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#6EC6FF' },
    secondary: { main: '#A5D6A7' },
    background: {
      default: '#e0f7fa',
      paper: '#ffffff',
    },
    info: { main: '#FFD54F' },
    error: { main: '#FF8A65' },
  },
  typography: {
    fontFamily: 'Nunito, Roboto, Helvetica, Arial, sans-serif',
    fontSize: 18,
    h1: { fontSize: '2.8rem', fontWeight: 700 },
    h2: { fontSize: '2.2rem', fontWeight: 600 },
    h3: { fontSize: '1.8rem', fontWeight: 600 },
    h4: { fontSize: '1.5rem', fontWeight: 600 },
    h5: { fontSize: '1.2rem', fontWeight: 500 },
    h6: { fontSize: '1.1rem', fontWeight: 500 },
    body1: { fontSize: '1.1rem' },
    body2: { fontSize: '1rem' },
  },
  shape: { borderRadius: 18 },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 24, fontWeight: 600, fontSize: '1.1rem', padding: '10px 28px' } } },
    MuiPaper: { styleOverrides: { root: { borderRadius: 18, boxShadow: '0 4px 24px 0 rgba(110,198,255,0.10)' } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 24, boxShadow: '0 8px 32px 0 rgba(110,198,255,0.18)' } } },
  },
});

// Spotlight Tour Context
export const SpotlightTourContext = createContext();

const TOUR_STEPS = [
  {
    title: 'Welcome! Start Your Journey',
    content: 'Welcome to your Mental Health Time Capsule! This app helps you reflect, grow, and connect with your future self. Let’s take a quick tour of the main features. (Tip: Works great on mobile too!)',
    refKey: 'getStartedBtn',
  },
  {
    title: 'Choose Your Path',
    content: 'On the Home page, choose between writing a Daily Diary entry or a Letter to your future self. The navigation is simple: use the bottom bar on mobile or the sidebar on desktop.',
    refKey: 'exploreWrite',
  },
  {
    title: 'Daily Diary',
    content: 'Use the Daily Diary to quickly capture your thoughts and feelings. Pick an emotion, write your entry, and track your mood over time. Entries are saved privately on your device.',
    refKey: 'exploreDiary',
  },
  {
    title: 'Letters to Future Self',
    content: 'Write a letter to your future self. Set an unlock date and revisit your thoughts later. Letters are encrypted and stored in your Vault.',
    refKey: 'exploreVault',
  },
  {
    title: 'Vaults',
    content: 'Access your Diary Vault and Letter Vault to view, reflect, or delete past entries and letters. Everything is private and secure.',
    refKey: 'vaultFirstCard',
  },
  {
    title: 'Emotional Timeline',
    content: 'The Timeline visualizes your emotional journey across both diary entries and letters. Sentiment is shown from -1 (very negative) to 1 (very positive). Track your growth and patterns over time.',
    refKey: 'timelineChart',
  },
  {
    title: 'All Set!',
    content: 'You’re ready to explore! The app is fully mobile-friendly—use the navigation bar to switch between features, and tap the ? button anytime for help or to restart this tour.',
  },
];

function App() {
  const [useModernTheme, setUseModernTheme] = useState(true);
  const theme = useMemo(() => (useModernTheme ? lightTheme : originalTheme), [useModernTheme]);
  const toggleTheme = () => setUseModernTheme((prev) => !prev);

  // EchoDrop state
  const letters = useAppStore(state => state.letters);
  const [echoDropOpen, setEchoDropOpen] = useState(false);
  const [echoDropLetter, setEchoDropLetter] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [onboardingOpen, setOnboardingOpen] = useState(() => {
    return localStorage.getItem('hasSeenOnboarding') !== 'true';
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const onboardingRef = useRef(null);
  const [tourOpen, setTourOpen] = useState(() => localStorage.getItem('hasSeenTour') !== 'true');
  const [tourStep, setTourStep] = useState(0);
  const [spotlightTourOpen, setSpotlightTourOpen] = useState(false);
  const [spotlightStep, setSpotlightStep] = useState(0);
  const spotlightRefs = {
    getStartedBtn: useRef(null),
    exploreWrite: useRef(null),
    exploreVault: useRef(null),
    exploreTimeline: useRef(null),
    writeLetterForm: useRef(null),
    vaultFirstCard: useRef(null),
    vaultOpenBtn: useRef(null),
    vaultShareBtn: useRef(null),
    timelineChart: useRef(null),
    growthWordCloud: useRef(null),
    wallFilterChip: useRef(null),
    wallLikeBtn: useRef(null),
  };

  const handleCloseOnboarding = () => {
    setOnboardingOpen(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  useEffect(() => {
    // EchoDrop logic: meaningful day or tough moment
    if (!letters || letters.length === 0) return;
    const today = new Date();
    const todayKey = 'echoDropShown_' + today.toISOString().slice(0, 10);
    if (localStorage.getItem(todayKey) === 'true') return;
    // Example: meaningful day if today is the same day/month as any letter's unlockDate
    const meaningful = letters.find(l => {
      const d = new Date(l.unlockDate);
      return d.getDate() === today.getDate() && d.getMonth() === today.getMonth();
    });
    // Example: tough moment if last 2 letters are sad/negative
    const last2 = letters.slice(-2).map(l => {
      try { return decryptLetter(l).sentiment.mood; } catch { return null; }
    });
    const tough = last2.length === 2 && last2.every(mood => mood === 'sadness' || mood === 'sad');
    if (meaningful || tough) {
      // Pick a random past letter
      const idx = Math.floor(Math.random() * letters.length);
      let letter = null;
      try { letter = decryptLetter(letters[idx]); } catch { letter = null; }
      if (letter) {
        setEchoDropLetter(letter);
        setSnackbar({ open: true, message: 'EchoDrop! A message from your past self has arrived.' });
        setEchoDropOpen(true);
        localStorage.setItem(todayKey, 'true');
      }
    }
  }, [letters]);

  const startTour = () => {
    setTourStep(0);
    setTourOpen(true);
  };
  const handleNextTour = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      setTourOpen(false);
      localStorage.setItem('hasSeenTour', 'true');
    }
  };
  const handleCloseTour = () => {
    setTourOpen(false);
    localStorage.setItem('hasSeenTour', 'true');
  };

  const startSpotlightTour = () => {
    setSpotlightStep(0);
    setSpotlightTourOpen(true);
  };
  const handleNextSpotlight = () => {
    if (spotlightStep < TOUR_STEPS.length - 1) {
      setSpotlightStep(spotlightStep + 1);
    } else {
      setSpotlightTourOpen(false);
      localStorage.setItem('hasSeenSpotlightTour', 'true');
    }
  };
  const handleCloseSpotlight = () => {
    setSpotlightTourOpen(false);
    localStorage.setItem('hasSeenSpotlightTour', 'true');
  };

  return (
    <ThemeToggleContext.Provider value={{ useModernTheme, toggleTheme }}>
    <SpotlightTourContext.Provider value={{ spotlightRefs, startSpotlightTour }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/write" element={<WriteLetter />} />
              <Route path="/vault" element={<Vault />} />
              <Route path="/timeline" element={<Timeline />} />
              <Route path="/wall" element={<LetterWall />} />
              <Route path="/diary" element={<DiaryEntry />} />
              <Route path="/diary-vault" element={<DiaryVault />} />
              <Route path="/media-test" element={<MediaTest />} />
              <Route path="/community" element={<Community />} />
            </Routes>
          </Layout>
        </Router>
        {/* EchoDrop Snackbar and Dialog */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ open: false, message: '' })}
          message={snackbar.message}
        />
        <Dialog open={echoDropOpen && !!echoDropLetter} onClose={() => {
          if (echoDropLetter?.mediaUrl) {
            cleanupBlobUrl(echoDropLetter.mediaUrl);
          }
          setEchoDropOpen(false);
        }} maxWidth="sm" fullWidth>
          {echoDropLetter && (
            <>
              <DialogTitle>EchoDrop: A Message from Your Past Self</DialogTitle>
              <DialogContent>
                <Typography variant="h6" gutterBottom>{echoDropLetter.title}</Typography>
                <Typography variant="body1" paragraph>{echoDropLetter.content}</Typography>
                {echoDropLetter.mediaUrl && (
                  <Box sx={{ mt: 2 }}>
                    {echoDropLetter.mediaType === 'audio' ? (
                      <audio 
                        controls 
                        src={echoDropLetter.mediaUrl}
                        onError={(e) => {
                          console.error('Audio playback error:', e);
                          setSnackbar({ 
                            open: true, 
                            message: 'Failed to play audio. The file may be corrupted.', 
                            severity: 'error' 
                          });
                        }}
                      />
                    ) : echoDropLetter.mediaType === 'video' ? (
                      <video 
                        controls 
                        src={echoDropLetter.mediaUrl} 
                        style={{ maxWidth: '100%' }}
                        onError={(e) => {
                          console.error('Video playback error:', e);
                          setSnackbar({ 
                            open: true, 
                            message: 'Failed to play video. The file may be corrupted.', 
                            severity: 'error' 
                          });
                        }}
                      />
                    ) : null}
                    {echoDropLetter.transcription && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2">Transcription:</Typography>
                        <Typography sx={{ fontStyle: 'italic' }}>{echoDropLetter.transcription}</Typography>
                        {echoDropLetter.mediaSentiment && (
                          <Typography sx={{ color: 'primary.main' }}>
                            Mood: {echoDropLetter.mediaSentiment.mood} (Confidence: {echoDropLetter.mediaSentiment.confidence}%)
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setEchoDropOpen(false)}>Close</Button>
              </DialogActions>
            </>
          )}
        </Dialog>
        {/* Onboarding Modal */}
        <Dialog open={onboardingOpen} onClose={handleCloseOnboarding} maxWidth="sm" fullWidth>
          <DialogTitle>Welcome to Your Time Capsule!</DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>How to get started:</Typography>
            <ul>
              <li><b>Write a Letter:</b> Express your thoughts, feelings, or goals for your future self.</li>
              <li><b>Lock it in the Vault:</b> Your letter stays private until its unlock date.</li>
              <li><b>Track your journey:</b> See your emotional growth on the Timeline and GrowthLens.</li>
              <li><b>Share anonymously:</b> Inspire others by sharing your story on the Letter Wall.</li>
            </ul>
            <Typography color="text.secondary" sx={{ mt: 2 }}>
              You can always access help using the ? button at the bottom right.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseOnboarding} variant="contained" color="primary">Get Started</Button>
          </DialogActions>
        </Dialog>
        {/* Help Button and Modal */}
        <Tooltip title="Help & FAQs">
          <IconButton
            onClick={() => setHelpOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 32,
              right: 32,
              bgcolor: 'primary.main',
              color: '#fff',
              boxShadow: 3,
              '&:hover': { bgcolor: 'primary.dark' },
              zIndex: 1301,
            }}
            size="large"
          >
            <HelpOutlineIcon fontSize="inherit" />
          </IconButton>
        </Tooltip>
        <Dialog open={helpOpen} onClose={() => setHelpOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Help & FAQs</DialogTitle>
          <DialogContent>
            <Typography variant="h6" gutterBottom>Frequently Asked Questions</Typography>
            <ul>
              <li><b>Is my data private?</b> Yes! All your letters are encrypted and stored only on your device.</li>
              <li><b>How do I unlock a letter?</b> Letters unlock automatically on their set date, or when you complete the linked task.</li>
              <li><b>Can I share my letter?</b> Yes, you can share anonymously to the Letter Wall after unlocking.</li>
              <li><b>What is GrowthLens?</b> It visualizes your emotional and personal growth over time.</li>
            </ul>
            <Typography variant="h6" sx={{ mt: 3 }}>Need more help?</Typography>
            <Typography>Email: support@timecapsule.app</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setHelpOpen(false)} variant="contained">Close</Button>
            <Button onClick={startTour} variant="outlined">Start Tour</Button>
          </DialogActions>
        </Dialog>
        {/* Guided Tour Dialog */}
        <Dialog open={tourOpen} onClose={handleCloseTour} maxWidth="sm" fullWidth>
          <DialogTitle>{TOUR_STEPS[tourStep].title}</DialogTitle>
          <DialogContent>
            <Typography>{TOUR_STEPS[tourStep].content}</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseTour}>Close</Button>
            {tourStep < TOUR_STEPS.length - 1 ? (
              <Button onClick={handleNextTour} variant="contained">Next</Button>
            ) : (
              <Button onClick={handleCloseTour} variant="contained">Finish</Button>
            )}
          </DialogActions>
        </Dialog>
        {/* Spotlight Popover */}
        <Popover
          open={spotlightTourOpen}
          anchorEl={spotlightRefs[TOUR_STEPS[spotlightStep].refKey]?.current}
          onClose={handleCloseSpotlight}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          transformOrigin={{ vertical: 'top', horizontal: 'center' }}
          PaperProps={{ sx: { p: 2, borderRadius: 3, maxWidth: 320 } }}
          disableEnforceFocus
          disableAutoFocus
        >
          <Typography variant="h6" sx={{ mb: 1 }}>{TOUR_STEPS[spotlightStep].title}</Typography>
          <Typography sx={{ mb: 2 }}>{TOUR_STEPS[spotlightStep].content}</Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={handleCloseSpotlight}>Close</Button>
            {spotlightStep < TOUR_STEPS.length - 1 ? (
              <Button onClick={handleNextSpotlight} variant="contained">Next</Button>
            ) : (
              <Button onClick={handleCloseSpotlight} variant="contained">Finish</Button>
            )}
          </Box>
        </Popover>
      </ThemeProvider>
    </SpotlightTourContext.Provider>
    </ThemeToggleContext.Provider>
  );
}

export default App;
// Updated for deployment
