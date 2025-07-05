import { useState, useContext } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  TextField,
  Paper,
  Fade,
} from '@mui/material';
import { Lock as LockIcon, LockOpen as LockOpenIcon } from '@mui/icons-material';
import { decryptLetter, isLetterUnlocked } from '../utils/encryption';
import { useAppStore } from '../store';
import Snackbar from '@mui/material/Snackbar';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import { SpotlightTourContext } from '../App';
import { useNavigate } from 'react-router-dom';
import DeleteIcon from '@mui/icons-material/Delete';

// Mock data - In a real app, this would come from a backend
const mockLetters = [
  {
    id: '1',
    data: 'encrypted-data-1',
    unlockDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
  },
  {
    id: '2',
    data: 'encrypted-data-2',
    unlockDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
  },
];

function Vault() {
  const letters = useAppStore(state => state.letters);
  const tasks = useAppStore(state => state.tasks);
  const completeTask = useAppStore(state => state.completeTask);
  const getTask = useAppStore(state => state.getTask);
  const getLetter = useAppStore(state => state.getLetter);

  const [selectedLetter, setSelectedLetter] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [reflection, setReflection] = useState('');
  const [showResponseForm, setShowResponseForm] = useState(false);
  const [responseContent, setResponseContent] = useState('');
  const addLetter = useAppStore(state => state.addLetter);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const addSharedLetter = useAppStore(state => state.addSharedLetter);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareTags, setShareTags] = useState([]);
  const [shareLoading, setShareLoading] = useState(false);
  const TAG_OPTIONS = ['Heartbreak', 'Self-Doubt', 'New Beginnings', 'Growth', 'Hope', 'Gratitude'];
  const [show, setShow] = useState(false);
  const navigate = useNavigate();
  const [premiumPromptOpen, setPremiumPromptOpen] = useState(false);
  const isPremium = (() => {
    try {
      return JSON.parse(localStorage.getItem('isPremium') || 'false');
    } catch { return false; }
  })();

  const { spotlightRefs } = useContext(SpotlightTourContext) || {};

  const deleteLetter = useAppStore(state => state.deleteLetter);

  useState(() => { setTimeout(() => setShow(true), 200); }, []);

  // Helper: is letter unlocked (date) and task (if any) completed
  const isFullyUnlocked = (letter) => {
    const dateUnlocked = isLetterUnlocked(letter);
    if (!letter.taskId) return dateUnlocked;
    const task = getTask(letter.taskId);
    return dateUnlocked && task && task.completed;
  };

  // Find previous letter for mood comparison
  const getPreviousLetterSentiment = (currentId) => {
    const idx = letters.findIndex(l => l.id === currentId);
    if (idx > 0) {
      try {
        const prev = letters[idx - 1];
        const prevDecrypted = decryptLetter(prev);
        return prevDecrypted.sentiment;
      } catch {
        return null;
      }
    }
    return null;
  };

  const handleOpenLetter = (letter) => {
    if (!isFullyUnlocked(letter)) {
      alert('This letter is still locked! Complete the task and/or wait for the unlock date.');
      return;
    }
    try {
      const decryptedLetter = decryptLetter(letter);
      setSelectedLetter({ ...decryptedLetter, id: letter.id, taskId: letter.taskId });
      setOpenDialog(true);
    } catch (error) {
      alert('Error opening letter: ' + error.message);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedLetter(null);
  };

  // Save reflection to the original letter
  const saveReflection = (letterId, reflectionText) => {
    useAppStore.setState(state => ({
      letters: state.letters.map(l =>
        l.id === letterId ? { ...l, reflection: reflectionText } : l
      ),
    }));
  };

  // Save response letter with new sentiment and encryption
  const handleSaveResponse = async () => {
    if (!responseContent.trim()) return;
    const sentimentResult = await import('../utils/sentimentAnalyzer').then(m => m.analyzeSentiment(responseContent));
    const encryptedLetter = await import('../utils/encryption').then(m => m.encryptLetter({
      title: `Response to Letter #${selectedLetter.id}`,
      content: responseContent,
      unlockDate: new Date(),
      image: null,
      sentiment: sentimentResult,
    }));
    addLetter({
      ...encryptedLetter,
      responseTo: selectedLetter.id,
    });
    setShowResponseForm(false);
    setResponseContent('');
    setSnackbar({ open: true, message: 'Response letter saved!' });
  };

  const handleShareLetter = async () => {
    setShareLoading(true);
    // Compose shared letter object
    addSharedLetter({
      id: selectedLetter.id + '-' + Date.now(),
      content: selectedLetter.content,
      tags: shareTags,
      date: new Date().toISOString(),
      mood: selectedLetter.sentiment?.mood || '',
    });
    setShareLoading(false);
    setShareDialogOpen(false);
    setSnackbar({ open: true, message: 'Letter shared anonymously!' });
  };

  function isWithinGracePeriod(letter) {
    if (!letter.lockedAt) return false;
    const lockedAt = new Date(letter.lockedAt);
    const now = new Date();
    const diffMs = now - lockedAt;
    return diffMs < 30 * 60 * 1000; // 30 minutes in ms
  }

  const handleEditLetter = (letter) => {
    try {
      const decryptedLetter = decryptLetter(letter);
      // Navigate to WriteLetter with edit mode and decrypted data
      navigate('/write', { state: { edit: true, letterId: letter.id, letterData: decryptedLetter } });
    } catch (error) {
      alert('Error decrypting letter for editing: ' + error.message);
    }
  };

  const handleDeleteLetter = async (letterId) => {
    if (window.confirm('Are you sure you want to delete this letter? This cannot be undone.')) {
      await deleteLetter(letterId);
      setSnackbar({ open: true, message: 'Letter deleted.' });
    }
  };

  if (!letters) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#e0f7fa',
      backgroundImage: 'linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 100%)',
      py: 6,
    }}>
      <Container maxWidth="lg">
        <Fade in={true} timeout={1200}>
          <Paper elevation={6} sx={{ p: 5, borderRadius: 6, mb: 4, boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)' }}>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: 'primary.main', letterSpacing: 1, textAlign: 'center' }}>
              Your Time Capsule Vault
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
              All your letters are safe and private until their unlock date. Open, reflect, and grow!
            </Typography>
            <Grid container spacing={4}>
              {letters.length === 0 && (
                <Grid item xs={12}>
                  <Typography>No letters yet. Write one!</Typography>
                </Grid>
              )}
              {letters.map((letter, idx) => {
                const unlocked = isFullyUnlocked(letter);
                const task = letter.taskId ? getTask(letter.taskId) : null;
                const canEdit = isWithinGracePeriod(letter);
                return (
                  <Grid item xs={12} sm={6} md={4} key={letter.id}>
                    <Fade in={show} style={{ transitionDelay: `${200 + idx * 120}ms` }}>
                      <Card
                        ref={idx === 0 ? spotlightRefs?.vaultFirstCard : undefined}
                        elevation={unlocked ? 8 : 2}
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          position: 'relative',
                          opacity: unlocked ? 1 : 0.7,
                          borderRadius: 4,
                          boxShadow: unlocked ? '0 8px 32px 0 rgba(110,198,255,0.13)' : '0 2px 8px 0 rgba(110,198,255,0.06)',
                          transition: 'transform 0.2s, box-shadow 0.2s',
                          '&:hover': {
                            transform: unlocked ? 'translateY(-6px) scale(1.03)' : 'none',
                            boxShadow: unlocked ? '0 12px 36px 0 rgba(110,198,255,0.18)' : undefined,
                          },
                          background: unlocked ? 'linear-gradient(135deg, #e3fcec 0%, #e0f7fa 100%)' : '#f5f5f5',
                        }}
                      >
                        <CardContent>
                          <Box
                            sx={{
                              position: 'absolute',
                              top: 16,
                              right: 16,
                              color: unlocked ? 'success.main' : 'text.secondary',
                              fontSize: 32,
                            }}
                          >
                            {unlocked ? <LockOpenIcon fontSize="inherit" /> : <LockIcon fontSize="inherit" />}
                          </Box>
                          <Typography variant="h6" gutterBottom sx={{ fontWeight: 700 }}>
                            Letter #{letter.id}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Unlocks: {new Date(letter.unlockDate).toLocaleDateString()}
                          </Typography>
                          {task && (
                            <Box sx={{ mt: 1, mb: 1 }}>
                              <Typography variant="body2" color="primary">
                                Task: {task.description}
                              </Typography>
                              <List dense>
                                <ListItem disablePadding>
                                  <Checkbox
                                    checked={task.completed}
                                    onChange={() => completeTask(task.id)}
                                    disabled={task.completed}
                                  />
                                  <ListItemText
                                    primary={task.completed ? 'Completed' : 'Mark as complete to unlock'}
                                  />
                                </ListItem>
                              </List>
                            </Box>
                          )}
                          <Tooltip title="Open this letter" arrow>
                            <Button
                              ref={idx === 0 ? spotlightRefs?.vaultOpenBtn : undefined}
                              variant="contained"
                              fullWidth
                              sx={{ mt: 2, borderRadius: 24, fontWeight: 700, fontSize: '1.1rem', py: 1.2, boxShadow: 2 }}
                              onClick={() => handleOpenLetter(letter)}
                              disabled={!unlocked}
                            >
                              {unlocked ? 'Open Letter' : 'Locked'}
                            </Button>
                          </Tooltip>
                          {canEdit && (
                            <Tooltip title="Edit this letter (within 30 min grace period)" arrow>
                              <Button
                                variant="outlined"
                                color="secondary"
                                fullWidth
                                sx={{ mt: 1, borderRadius: 24, fontWeight: 600 }}
                                onClick={() => handleEditLetter(letter)}
                              >
                                Edit
                              </Button>
                            </Tooltip>
                          )}
                          <Tooltip title={isPremium ? 'Gift this letter' : 'Go Premium to gift letters'} arrow>
                            <span>
                              <Button
                                variant="outlined"
                                color="secondary"
                                size="small"
                                sx={{ mt: 1, borderRadius: 24, fontWeight: 600 }}
                                onClick={() => {
                                  if (!isPremium) {
                                    setPremiumPromptOpen(true);
                                    return;
                                  }
                                  // Mock: show alert for now
                                  alert('Gift a Letter: This feature is coming soon!');
                                }}
                                disabled={!isPremium}
                                startIcon={!isPremium ? <LockIcon fontSize="small" color="warning" /> : undefined}
                              >
                                Gift a Letter
                              </Button>
                            </span>
                          </Tooltip>
                          <Button
                            variant="outlined"
                            color="error"
                            startIcon={<DeleteIcon />}
                            sx={{ mt: 1 }}
                            onClick={() => handleDeleteLetter(letter.id)}
                          >
                            Delete
                          </Button>
                        </CardContent>
                      </Card>
                    </Fade>
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Fade>
        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{ sx: { borderRadius: 4, p: 2 } }}
        >
          {selectedLetter && (
            <>
              <DialogTitle sx={{ fontWeight: 700, fontSize: '1.5rem', pb: 1 }}>{selectedLetter.responseTo ? `Response to Letter #${selectedLetter.responseTo}` : selectedLetter.title}</DialogTitle>
              <DialogContent sx={{ p: 3 }}>
                {/* Mood Change Highlight */}
                {(() => {
                  const prev = getPreviousLetterSentiment(selectedLetter.id);
                  if (prev && prev.mood !== selectedLetter.sentiment.mood) {
                    return (
                      <Box sx={{ mb: 2, p: 2, bgcolor: '#e3f2fd', borderRadius: 1 }}>
                        <Typography color="primary">
                          Mood change: <b>{prev.mood}</b> → <b>{selectedLetter.sentiment.mood}</b>
                        </Typography>
                      </Box>
                    );
                  }
                  return null;
                })()}

                {/* Letter Summary */}
                <Typography variant="subtitle1" sx={{ fontStyle: 'italic', mb: 1 }}>
                  {selectedLetter.content.split('.').slice(0, 2).join('.') + '.'}
                </Typography>

                {/* Full Letter */}
                <Typography variant="body1" paragraph>
                  {selectedLetter.content}
                </Typography>
                {selectedLetter.image && (
                  <Box sx={{ mt: 2 }}>
                    <img
                      src={selectedLetter.image}
                      alt="Letter attachment"
                      style={{ maxWidth: '100%', borderRadius: 8 }}
                    />
                  </Box>
                )}
                {selectedLetter.sentiment && (
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                    <Typography variant="h6" gutterBottom>
                      Emotional Analysis
                    </Typography>
                    <Typography>
                      Mood: {selectedLetter.sentiment.mood}
                    </Typography>
                    <Typography>
                      Confidence: {selectedLetter.sentiment.confidence}%
                    </Typography>
                  </Box>
                )}

                {selectedLetter.mediaUrl && (
                  <Box sx={{ mt: 2 }}>
                    {selectedLetter.mediaType === 'audio' ? (
                      <audio controls src={selectedLetter.mediaUrl} />
                    ) : selectedLetter.mediaType === 'video' ? (
                      <video controls src={selectedLetter.mediaUrl} style={{ maxWidth: '100%' }} />
                    ) : null}
                    {selectedLetter.transcription && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="subtitle2">Transcription:</Typography>
                        <Typography sx={{ fontStyle: 'italic' }}>{selectedLetter.transcription}</Typography>
                        {selectedLetter.mediaSentiment && (
                          <Typography sx={{ color: 'primary.main' }}>
                            Mood: {selectedLetter.mediaSentiment.mood} (Confidence: {selectedLetter.mediaSentiment.confidence}%)
                          </Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                )}

                {/* Reflection Questions */}
                <Box sx={{ mt: 3, mb: 2 }}>
                  <Typography variant="h6">Reflection</Typography>
                  <Typography sx={{ mb: 1 }}>
                    Did your predictions come true? Or how do you feel now?
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder="Share your thoughts..."
                    value={reflection}
                    onChange={e => setReflection(e.target.value)}
                    onBlur={() => saveReflection(selectedLetter.id, reflection)}
                  />
                </Box>

                {/* Prompt for Response Letter */}
                <Box sx={{ mt: 2 }}>
                  {!showResponseForm ? (
                    <Tooltip title="Write a response to your past self" arrow>
                      <Button variant="outlined" onClick={() => setShowResponseForm(true)}>
                        Write a response to your past self
                      </Button>
                    </Tooltip>
                  ) : (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        minRows={3}
                        label="Response to your past self"
                        value={responseContent}
                        onChange={e => setResponseContent(e.target.value)}
                      />
                      <Button
                        sx={{ mt: 1 }}
                        variant="contained"
                        onClick={handleSaveResponse}
                        disabled={!responseContent.trim()}
                      >
                        Save Response
                      </Button>
                    </Box>
                  )}
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseDialog}>Close</Button>
                <Tooltip title="Share this letter anonymously on the Letter Wall" arrow>
                  <Button
                    ref={spotlightRefs?.vaultShareBtn}
                    variant="outlined"
                    color="secondary"
                    onClick={() => setShareDialogOpen(true)}
                    disabled={!selectedLetter}
                  >
                    Share Anonymously
                  </Button>
                </Tooltip>
              </DialogActions>
            </>
          )}
        </Dialog>
        <Dialog open={shareDialogOpen} onClose={() => setShareDialogOpen(false)}>
          <DialogTitle>Share Letter Anonymously</DialogTitle>
          <DialogContent>
            <Typography gutterBottom>Select up to 3 tags for your letter:</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              {TAG_OPTIONS.map(tag => (
                <Chip
                  key={tag}
                  label={tag}
                  color={shareTags.includes(tag) ? 'primary' : 'default'}
                  onClick={() => {
                    if (shareTags.includes(tag)) {
                      setShareTags(shareTags.filter(t => t !== tag));
                    } else if (shareTags.length < 3) {
                      setShareTags([...shareTags, tag]);
                    }
                  }}
                  sx={{ cursor: 'pointer' }}
                />
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShareDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleShareLetter}
              disabled={shareTags.length === 0 || shareLoading}
            >
              {shareLoading ? 'Sharing...' : 'Share'}
            </Button>
          </DialogActions>
        </Dialog>
        <Dialog open={premiumPromptOpen} onClose={() => setPremiumPromptOpen(false)}>
          <DialogTitle>Premium Feature</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LockIcon color="warning" sx={{ mr: 1 }} />
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Gift a Letter</Typography>
            </Box>
            <Typography sx={{ mb: 2 }}>
              Upgrade to Premium to send digital letters to others as a special gift.
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
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ open: false, message: '' })}
          message={snackbar.message}
        />
      </Container>
    </Box>
  );
}

export default Vault; 
