import { useState, useRef, useContext } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Checkbox,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Fade,
  Divider,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { CloudUpload as CloudUploadIcon, Add as AddIcon, Lock as LockIcon } from '@mui/icons-material';
import { analyzeSentiment } from '../utils/sentimentAnalyzer';
import { encryptLetter } from '../utils/encryption';
import { useAppStore } from '../store';
import { SpotlightTourContext } from '../App';
import { useLocation, useNavigate } from 'react-router-dom';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';

const MOOD_OPTIONS = [
  'Joyful', 'Hopeful', 'Grateful', 'Calm', 'Anxious', 'Sad', 'Angry', 'Lonely', 'Confident', 'Inspired'
];

function WriteLetter() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [unlockDate, setUnlockDate] = useState(null);
  const [image, setImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sentiment, setSentiment] = useState(null);
  const [newTask, setNewTask] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [mediaType, setMediaType] = useState('none'); // 'none' | 'audio' | 'video'
  const [mediaBlob, setMediaBlob] = useState(null);
  const [mediaUrl, setMediaUrl] = useState('');
  const [transcription, setTranscription] = useState('');
  const [mediaSentiment, setMediaSentiment] = useState(null);
  const mediaRecorderRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const [show, setShow] = useState(false);
  const [pendingLetterData, setPendingLetterData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const updateLetter = useAppStore(state => state.updateLetter);
  const [editMode, setEditMode] = useState(false);
  const [editLetterId, setEditLetterId] = useState(null);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [premiumPromptOpen, setPremiumPromptOpen] = useState(false);
  const isPremium = (() => {
    try {
      return JSON.parse(localStorage.getItem('isPremium') || 'false');
    } catch { return false; }
  })();

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png'],
      'audio/*': ['.mp3', '.wav'],
      'video/*': ['.mp4', '.webm']
    },
    maxFiles: isPremium ? 10 : 1,
    onDrop: acceptedFiles => {
      if (!isPremium && (image || mediaBlob)) {
        setPremiumPromptOpen(true);
        return;
      }
      if (acceptedFiles[0]?.type.startsWith('image/')) {
        setImage(acceptedFiles[0]);
      } else if (acceptedFiles[0]?.type.startsWith('audio/')) {
        setMediaType('audio');
        setMediaBlob(acceptedFiles[0]);
        setMediaUrl(URL.createObjectURL(acceptedFiles[0]));
      } else if (acceptedFiles[0]?.type.startsWith('video/')) {
        setMediaType('video');
        setMediaBlob(acceptedFiles[0]);
        setMediaUrl(URL.createObjectURL(acceptedFiles[0]));
      }
    }
  });

  // Zustand store
  const tasks = useAppStore(state => state.tasks);
  const addTask = useAppStore(state => state.addTask);
  const addLetter = useAppStore(state => state.addLetter);
  const deleteTask = useAppStore(state => state.deleteTask);

  const { spotlightRefs } = useContext(SpotlightTourContext) || {};

  const handleAddTask = () => {
    if (newTask.trim()) {
      const id = addTask(newTask.trim());
      setSelectedTaskId(id);
      setNewTask('');
    }
  };

  // Media recording logic
  const startRecording = async (type) => {
    setMediaType(type);
    setRecordingError('');
    setTranscription('');
    setMediaSentiment(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      const recorder = new window.MediaRecorder(stream);
      let chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: type === 'video' ? 'video/webm' : 'audio/webm' });
        setMediaBlob(blob);
        setMediaUrl(URL.createObjectURL(blob));
        // Transcribe audio
        if (type === 'audio' || type === 'video') {
          transcribeAudio(blob);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      setRecordingError('Could not access microphone/camera.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Transcription using Web Speech API (for demo, only works for live mic, not file)
  const transcribeAudio = (blob) => {
    // For demo: show a placeholder, real implementation would use a backend or 3rd party API
    setTranscription('[Transcription not available in demo. Use a backend for real transcription.]');
    setMediaSentiment(null);
  };

  const handleMoodToggle = (mood) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter(m => m !== mood) : [...prev, mood]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !content || !unlockDate) return;
    setIsAnalyzing(true);
    try {
      // Analyze sentiment
      const sentimentResult = await analyzeSentiment(content);
      setSentiment(sentimentResult);
      // Encrypt and save letter
      const encryptedLetter = await encryptLetter({
        title,
        content,
        unlockDate,
        image,
        sentiment: sentimentResult,
        mediaType,
        mediaUrl,
        transcription,
        mediaSentiment,
        moods: selectedMoods,
      });
      if (editMode && editLetterId) {
        updateLetter(editLetterId, {
          ...encryptedLetter,
          taskId: selectedTaskId || null,
        });
      } else {
        addLetter({
          ...encryptedLetter,
          taskId: selectedTaskId || null,
        });
      }
      // Reset form
      setTitle('');
      setContent('');
      setUnlockDate(null);
      setImage(null);
      setSentiment(null);
      setSelectedTaskId('');
      setMediaType('none');
      setMediaBlob(null);
      setMediaUrl('');
      setTranscription('');
      setMediaSentiment(null);
      setSelectedMoods([]);
      setEditMode(false);
      setEditLetterId(null);
      navigate('/vault');
    } catch (error) {
      // Optionally show error
    } finally {
      setIsAnalyzing(false);
    }
  };

  useState(() => { setTimeout(() => setShow(true), 200); }, []);

  // Prefill form if editing
  useState(() => {
    if (location.state && location.state.edit && location.state.letterData) {
      const l = location.state.letterData;
      setEditMode(true);
      setEditLetterId(location.state.letterId);
      setTitle(l.title || '');
      setContent(l.content || '');
      setUnlockDate(l.unlockDate ? new Date(l.unlockDate) : null);
      setImage(null); // For security, don't prefill image
      setSentiment(l.sentiment || null);
      setSelectedTaskId(l.taskId || '');
      setMediaType(l.mediaType || 'none');
      setMediaBlob(null);
      setMediaUrl(l.mediaUrl || '');
      setTranscription(l.transcription || '');
      setMediaSentiment(l.mediaSentiment || null);
      setSelectedMoods(l.moods || []);
    }
  }, [location.state]);

  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#e0f7fa',
      backgroundImage: 'linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 100%)',
      py: 6,
    }}>
      <Container maxWidth="md">
        <Fade in={show} timeout={1200}>
          <Paper
            ref={spotlightRefs?.writeLetterForm}
            elevation={6}
            sx={{ p: 5, borderRadius: 6, mt: 2, boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)' }}
          >
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: 'primary.main', letterSpacing: 1, textAlign: 'center' }}>
              {editMode ? 'Edit Your Letter' : 'Write a Letter to Your Future Self'}
            </Typography>
            <Typography variant="h6" color="text.secondary" sx={{ mb: 4, textAlign: 'center' }}>
              Reflect, express, and lock your thoughts for the future. Add a goal, voice, or image for a richer memory!
            </Typography>
            <Divider sx={{ mb: 4 }} />
            {/* Task Linking Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>1. Link to a Goal or Task (optional)</Typography>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={8} sm={10}>
                  <TextField
                    fullWidth
                    label="Create a new task/goal"
                    value={newTask}
                    onChange={e => setNewTask(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddTask(); } }}
                  />
                </Grid>
                <Grid item xs={4} sm={2}>
                  <Tooltip title="Add this task/goal" arrow>
                    <Button
                      variant="outlined"
                      startIcon={<AddIcon />}
                      onClick={handleAddTask}
                      fullWidth
                    >
                      Add
                    </Button>
                  </Tooltip>
                </Grid>
              </Grid>
              <List dense sx={{ mt: 2, maxHeight: 120, overflow: 'auto', bgcolor: '#fafafa', borderRadius: 1 }}>
                {tasks.filter(task => !task.completed).length === 0 && (
                  <ListItem>
                    <ListItemText primary="No tasks yet. Add one above!" />
                  </ListItem>
                )}
                {tasks.filter(task => !task.completed).map(task => (
                  <ListItem
                    key={task.id}
                    button
                    selected={selectedTaskId === task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    disabled={task.completed}
                  >
                    <Checkbox checked={selectedTaskId === task.id} tabIndex={-1} disableRipple />
                    <ListItemText
                      primary={task.description}
                      secondary={task.completed ? 'Completed' : ''}
                    />
                    <IconButton edge="end" aria-label="delete" onClick={e => { e.stopPropagation(); deleteTask(task.id); }}>
                      <DeleteIcon />
                    </IconButton>
                  </ListItem>
                ))}
              </List>
            </Box>
            <Divider sx={{ mb: 4 }} />
            {/* Media Recording Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>2. Add a Voice or Video Message (optional)</Typography>
              <Tooltip title="Record an audio message" arrow>
                <Button
                  variant={mediaType === 'audio' && isRecording ? 'contained' : 'outlined'}
                  color="primary"
                  onClick={() => (isRecording ? stopRecording() : startRecording('audio'))}
                  sx={{ mr: 2 }}
                >
                  {isRecording && mediaType === 'audio' ? 'Stop Audio Recording' : 'Record Audio'}
                </Button>
              </Tooltip>
              <Tooltip title="Record a video message" arrow>
                <Button
                  variant={mediaType === 'video' && isRecording ? 'contained' : 'outlined'}
                  color="secondary"
                  onClick={() => (isRecording ? stopRecording() : startRecording('video'))}
                >
                  {isRecording && mediaType === 'video' ? 'Stop Video Recording' : 'Record Video'}
                </Button>
              </Tooltip>
              {recordingError && <Typography color="error">{recordingError}</Typography>}
              {mediaUrl && (
                <Box sx={{ mt: 2 }}>
                  {mediaType === 'audio' ? (
                    <audio controls src={mediaUrl} />
                  ) : mediaType === 'video' ? (
                    <video controls src={mediaUrl} style={{ maxWidth: '100%' }} />
                  ) : null}
                  <Button
                    variant="outlined"
                    color="error"
                    sx={{ mt: 1, ml: 1 }}
                    onClick={() => {
                      setMediaBlob(null);
                      setMediaUrl('');
                      setMediaType('none');
                      setTranscription('');
                      setMediaSentiment(null);
                    }}
                  >
                    Remove {mediaType === 'audio' ? 'Audio' : 'Video'}
                  </Button>
                  {transcription && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="subtitle2">Transcription:</Typography>
                      <Typography sx={{ fontStyle: 'italic' }}>{transcription}</Typography>
                      {mediaSentiment && (
                        <Typography sx={{ color: 'primary.main' }}>
                          Mood: {mediaSentiment.mood} (Confidence: {mediaSentiment.confidence}%)
                        </Typography>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
            <Divider sx={{ mb: 4 }} />
            {/* Mood Tagging Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>3. Tag Your Mood(s)</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {MOOD_OPTIONS.map(mood => (
                  <Chip
                    key={mood}
                    label={mood}
                    color={selectedMoods.includes(mood) ? 'primary' : 'default'}
                    onClick={() => handleMoodToggle(mood)}
                    sx={{ cursor: 'pointer', fontWeight: 600 }}
                  />
                ))}
              </Box>
            </Box>
            <Divider sx={{ mb: 4 }} />
            {/* Letter Form Section */}
            <form onSubmit={handleSubmit}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>4. Write and Lock Your Letter</Typography>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Your Letter"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    required
                  />
                </Grid>

                <Grid item xs={12}>
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                      label="Unlock Date"
                      value={unlockDate}
                      onChange={setUnlockDate}
                      minDate={new Date()}
                      renderInput={(params) => <TextField {...params} fullWidth required />}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12}>
                  <Tooltip title={isPremium ? 'Upload images, audio, or video' : 'Upgrade to Premium for unlimited attachments'} arrow>
                    <Box
                      {...getRootProps()}
                      sx={{
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        cursor: isPremium || (!image && !mediaBlob) ? 'pointer' : 'not-allowed',
                        position: 'relative',
                        '&:hover': {
                          borderColor: isPremium ? 'primary.main' : '#ccc',
                        },
                      }}
                    >
                      <input {...getInputProps()} />
                      <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                      <Typography>
                        {image
                          ? `Selected: ${image.name}`
                          : mediaBlob
                          ? `Selected: ${mediaType} file`
                          : 'Drag & drop an image, audio, or video here, or click to select'}
                      </Typography>
                      {!isPremium && (image || mediaBlob) && (
                        <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', alignItems: 'center' }}>
                          <LockIcon color="warning" />
                          <Typography variant="caption" color="warning.main" sx={{ ml: 0.5, fontWeight: 600 }}>
                            Premium
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </Tooltip>
                </Grid>

                <Grid item xs={12}>
                  {image && (
                    <Box sx={{ mt: 2 }}>
                      <Typography>Selected: {image.name}</Typography>
                      <Button
                        variant="outlined"
                        color="error"
                        sx={{ mt: 1, ml: 1 }}
                        onClick={() => setImage(null)}
                      >
                        Remove Image
                      </Button>
                    </Box>
                  )}
                </Grid>

                <Grid item xs={12}>
                  <Tooltip title={editMode ? 'Update and relock your letter' : 'Lock and save your letter'} arrow>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      fullWidth
                      disabled={isAnalyzing}
                    >
                      {isAnalyzing ? (
                        <>
                          <CircularProgress size={24} sx={{ mr: 1 }} />
                          {editMode ? 'Updating...' : 'Analyzing & Saving...'}
                        </>
                      ) : (
                        editMode ? 'Update Letter' : 'Lock Letter'
                      )}
                    </Button>
                  </Tooltip>
                </Grid>
              </Grid>
            </form>
            {sentiment && (
              <Fade in={!!sentiment} timeout={800}>
                <Box sx={{ mt: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Emotional Analysis
                  </Typography>
                  <Typography>
                    Mood: {sentiment.mood}
                  </Typography>
                  <Typography>
                    Confidence: {sentiment.confidence}%
                  </Typography>
                </Box>
              </Fade>
            )}
          </Paper>
        </Fade>
      </Container>
      <Dialog open={premiumPromptOpen} onClose={() => setPremiumPromptOpen(false)}>
        <DialogTitle>Premium Feature</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LockIcon color="warning" sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Unlimited Attachments</Typography>
          </Box>
          <Typography sx={{ mb: 2 }}>
            Upgrade to Premium to add multiple images, audio, or video files to your letters.
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

export default WriteLetter; 
