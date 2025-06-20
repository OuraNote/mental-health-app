import { Container, Typography, Paper, Box, Chip, Grid, IconButton, Fade } from '@mui/material';
import { useAppStore } from '../store';
import { useState, useMemo, useContext } from 'react';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import Tooltip from '@mui/material/Tooltip';
import { SpotlightTourContext } from '../App';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LockIcon from '@mui/icons-material/Lock';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

const SENTIMENT_OPTIONS = ['All', 'Joyful', 'Hopeful', 'Grateful', 'Calm', 'Anxious', 'Sad', 'Angry', 'Lonely', 'Confident', 'Inspired'];
const PREMIUM_TAGS = ['Healing from Loss', 'Overcoming Depression'];

function LetterWall() {
  const sharedLetters = useAppStore(state => state.sharedLetters);
  const [selectedTag, setSelectedTag] = useState('All');
  const [show, setShow] = useState(false);
  const { spotlightRefs } = useContext(SpotlightTourContext) || {};
  const [search, setSearch] = useState('');
  const [sentiment, setSentiment] = useState('All');
  const [likes, setLikes] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('letterWallLikes') || '{}');
    } catch { return {}; }
  });
  const [premiumPromptOpen, setPremiumPromptOpen] = useState(false);
  const isPremium = (() => {
    try {
      return JSON.parse(localStorage.getItem('isPremium') || 'false');
    } catch { return false; }
  })();
  useState(() => { setTimeout(() => setShow(true), 200); }, []);

  // Collect all unique tags
  const allTags = useMemo(() => {
    const tags = new Set();
    sharedLetters.forEach(l => l.tags?.forEach(t => tags.add(t)));
    PREMIUM_TAGS.forEach(t => tags.add(t));
    return ['All', ...Array.from(tags)];
  }, [sharedLetters]);

  // Like handler
  const handleLike = (id) => {
    setLikes(prev => {
      const updated = { ...prev, [id]: (prev[id] || 0) + 1 };
      localStorage.setItem('letterWallLikes', JSON.stringify(updated));
      return updated;
    });
  };

  // Filter letters by tag, sentiment, and search
  const filteredLetters = useMemo(() => {
    let result = sharedLetters;
    if (selectedTag !== 'All') {
      result = result.filter(l => l.tags?.includes(selectedTag));
    }
    if (sentiment !== 'All') {
      result = result.filter(l => (l.mood || '').toLowerCase() === sentiment.toLowerCase());
    }
    if (search.trim()) {
      const s = search.trim().toLowerCase();
      result = result.filter(l => l.content.toLowerCase().includes(s));
    }
    return result;
  }, [sharedLetters, selectedTag, sentiment, search]);

  // Pastel colors for tags
  const pastelColors = ['#B2EBF2', '#F8BBD0', '#FFF9C4', '#C8E6C9', '#D1C4E9', '#FFE0B2', '#B3E5FC'];

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 100%)',
      py: 6,
    }}>
      <Container maxWidth="lg">
        <Fade in={show} timeout={1200}>
          <Paper elevation={6} sx={{ p: 5, borderRadius: 6, mb: 4, boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: 'primary.main', letterSpacing: 1, textAlign: 'center' }}>
              Anonymous Letter Wall
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
              Read and share anonymous letters from people around the world. Filter by theme to find stories that resonate with you.
            </Typography>
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center', alignItems: 'center' }}>
              <TextField
                label="Search letters"
                size="small"
                value={search}
                onChange={e => setSearch(e.target.value)}
                sx={{ minWidth: 180 }}
              />
              <TextField
                label="Sentiment"
                size="small"
                select
                value={sentiment}
                onChange={e => setSentiment(e.target.value)}
                sx={{ minWidth: 140 }}
              >
                {SENTIMENT_OPTIONS.map(opt => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>
            </Box>
            <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
              {allTags.map((tag, idx) => {
                const isPremiumTag = PREMIUM_TAGS.includes(tag);
                return (
                  <Tooltip title={tag === 'All' ? 'Show all letters' : `Filter by ${tag}`} arrow key={tag}>
                    <span>
                      <Chip
                        ref={idx === 0 ? spotlightRefs?.wallFilterChip : undefined}
                        label={tag}
                        color={selectedTag === tag ? 'primary' : 'default'}
                        onClick={() => {
                          if (isPremiumTag && !isPremium) {
                            setPremiumPromptOpen(true);
                            return;
                          }
                          setSelectedTag(tag);
                        }}
                        sx={{ cursor: isPremiumTag && !isPremium ? 'not-allowed' : 'pointer', bgcolor: selectedTag === tag ? pastelColors[idx % pastelColors.length] : undefined, fontWeight: 600, fontSize: '1.1rem', opacity: isPremiumTag && !isPremium ? 0.5 : 1 }}
                        icon={isPremiumTag ? <LockIcon fontSize="small" color="warning" /> : undefined}
                      />
                    </span>
                  </Tooltip>
                );
              })}
            </Box>
            <Grid container spacing={4} justifyContent="center" alignItems="stretch">
              {filteredLetters.length === 0 ? (
                <Grid item xs={12}>
                  <Paper elevation={2} sx={{ p: 3, mb: 2 }}>
                    <Typography color="text.secondary">[No anonymous letters yet]</Typography>
                  </Paper>
                </Grid>
              ) : (
                filteredLetters.map((letter, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={letter.id + idx} sx={{ display: 'flex' }}>
                    <Fade in={show} style={{ transitionDelay: `${200 + idx * 120}ms` }}>
                      <Paper elevation={4} sx={{ p: 4, borderRadius: 6, mb: 2, width: '100%', display: 'flex', flexDirection: 'column', minHeight: 220, boxShadow: '0 4px 24px 0 rgba(110,198,255,0.10)', position: 'relative', transition: 'transform 0.2s, box-shadow 0.2s', '&:hover': { transform: 'translateY(-6px) scale(1.03)', boxShadow: '0 12px 36px 0 rgba(110,198,255,0.18)' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                          {letter.tags?.map((tag, i) => (
                            <Chip key={tag} label={tag} size="small" sx={{ bgcolor: pastelColors[i % pastelColors.length], fontWeight: 600 }} />
                          ))}
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {new Date(letter.date).toLocaleDateString()}
                          </Typography>
                          {letter.mood && (
                            <Chip label={letter.mood} size="small" color="secondary" sx={{ ml: 1 }} />
                          )}
                          <Tooltip title={isPremium ? 'Like this letter' : 'Go Premium to favorite letters'} arrow>
                            <span>
                              <IconButton
                                ref={idx === 0 ? spotlightRefs?.wallLikeBtn : undefined}
                                size="small"
                                sx={{ ml: 'auto', color: likes[letter.id] ? '#FF1744' : '#FF8A65' }}
                                onClick={() => {
                                  if (!isPremium) {
                                    setPremiumPromptOpen(true);
                                    return;
                                  }
                                  handleLike(letter.id);
                                }}
                                disabled={!isPremium}
                              >
                                {likes[letter.id] ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Typography variant="caption" sx={{ ml: 0.5, color: '#FF1744', fontWeight: 600 }}>
                            {likes[letter.id] || 0}
                          </Typography>
                        </Box>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-line', flexGrow: 1 }}>
                          {letter.content}
                        </Typography>
                      </Paper>
                    </Fade>
                  </Grid>
                ))
              )}
            </Grid>
          </Paper>
        </Fade>
      </Container>
      <Dialog open={premiumPromptOpen} onClose={() => setPremiumPromptOpen(false)}>
        <DialogTitle>Premium Feature</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LockIcon color="warning" sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Premium Letter Wall</Typography>
          </Box>
          <Typography sx={{ mb: 2 }}>
            Upgrade to Premium to access special categories and save letters to your favorites.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPremiumPromptOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={() => {
            setPremiumPromptOpen(false);
            window.dispatchEvent(new Event('openPremiumModal'));
          }}>
            Go Premium
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default LetterWall; 