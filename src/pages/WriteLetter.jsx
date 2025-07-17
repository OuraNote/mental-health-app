import { useState, useRef, useContext, useEffect } from 'react';
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
import { encryptLetter, getSupportedMediaFormat, validateMediaBlob, debugMediaSupport, uploadMediaAndGetUrl } from '../utils/encryption';
import { useAppStore } from '../store';
import { SpotlightTourContext } from '../App';
import { useLocation, useNavigate } from 'react-router-dom';
import Chip from '@mui/material/Chip';
import DeleteIcon from '@mui/icons-material/Delete';
import { auth } from '../firebase';
import Snackbar from '@mui/material/Snackbar';

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
  const [mediaMimeType, setMediaMimeType] = useState(null); // Store MIME type for proper playback
  const [transcription, setTranscription] = useState('');
  const [mediaSentiment, setMediaSentiment] = useState(null);
  const mediaRecorderRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState('');
  const [show, setShow] = useState(false);
  const [pendingLetterData, setPendingLetterData] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Debug navigation hook
  console.log('Navigation hook initialized:', {
    navigate: typeof navigate,
    location: location?.pathname
  });
  const updateLetter = useAppStore(state => state.updateLetter);
  const loadLetters = useAppStore(state => state.loadLetters);
  const addLetter = useAppStore(state => state.addLetter);
  
  // Debug store access
  console.log('Store access debug:', {
    storeExists: !!useAppStore,
    addLetterFromStore: typeof useAppStore.getState().addLetter,
    addLetterFromHook: typeof addLetter,
    storeState: useAppStore.getState()
  });
  
  // Debug store functions
  console.log('Store functions initialized:', {
    updateLetter: typeof updateLetter,
    loadLetters: typeof loadLetters,
    addLetter: typeof addLetter,
    storeState: useAppStore.getState()
  });
  
  const [editMode, setEditMode] = useState(false);
  const [editLetterId, setEditLetterId] = useState(null);
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [premiumPromptOpen, setPremiumPromptOpen] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [mediaUploadProgress, setMediaUploadProgress] = useState(0);
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState('');
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Debug media support on component mount
  useEffect(() => {
    debugMediaSupport();
  }, []);

  const isPremium = (() => {
    try {
      return JSON.parse(localStorage.getItem('isPremium') || 'false');
    } catch { return false; }
  })();
  const [unlockDateError, setUnlockDateError] = useState(false);

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
      try {
        if (acceptedFiles[0]?.type.startsWith('image/')) {
          setImage(acceptedFiles[0]);
        } else if (acceptedFiles[0]?.type.startsWith('audio/')) {
          setMediaType('audio');
          setMediaBlob(acceptedFiles[0]);
          setMediaUrl(URL.createObjectURL(acceptedFiles[0]));
          setMediaMimeType(acceptedFiles[0].type);
        } else if (acceptedFiles[0]?.type.startsWith('video/')) {
          setMediaType('video');
          setMediaBlob(acceptedFiles[0]);
          setMediaUrl(URL.createObjectURL(acceptedFiles[0]));
          setMediaMimeType(acceptedFiles[0].type);
        }
      } catch (error) {
        console.error('Error processing uploaded file:', error);
        setRecordingError('Failed to process uploaded file. Please try again.');
      }
    }
  });

  // Zustand store
  const tasks = useAppStore(state => state.tasks);
  const addTask = useAppStore(state => state.addTask);
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
    // Always clean up any previous stream before starting a new one
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setMediaType(type);
    setRecordingError('');
    setTranscription('');
    setMediaSentiment(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      mediaStreamRef.current = stream;
      
      // Determine the best MIME type for the browser
      const mimeType = getSupportedMediaFormat(type);
      
      const recorder = new window.MediaRecorder(stream, {
        mimeType: mimeType
      });
      
      let chunks = [];
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = async () => {
        console.log('MediaRecorder stopped, processing recording...');
        try {
          console.log('Chunks collected:', chunks.length);
          const blob = new Blob(chunks, { type: mimeType });
          console.log('Blob created:', {
            size: blob.size,
            type: blob.type,
            mimeType: mimeType
          });
          
          // Validate the blob before using it
          validateMediaBlob(blob, mimeType);
          console.log('Blob validation passed');
          
          console.log('Setting mediaBlob state...');
          setMediaBlob(blob);
          const url = URL.createObjectURL(blob);
          setMediaUrl(url);
          console.log('Media URL created:', url);
          
          // Store the MIME type for later use
          setMediaMimeType(mimeType);
          console.log('MIME type set:', mimeType);
          
          // Transcribe audio
          if (type === 'audio' || type === 'video') {
            transcribeAudio(blob);
          }
        } catch (error) {
          console.error('Error creating media blob:', error);
          setRecordingError('Failed to process recording. Please try again.');
        } finally {
          // Stop the stream after recording is fully done
          if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
          }
        }
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setRecordingError('Recording failed. Please try again.');
        setIsRecording(false);
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Media access error:', err);
      if (err.name === 'NotAllowedError') {
        setRecordingError('Permission denied. Please allow microphone/camera access.');
      } else if (err.name === 'NotFoundError') {
        setRecordingError('No microphone/camera found. Please check your device.');
      } else {
        setRecordingError('Could not access microphone/camera. Please try again.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    // Do NOT stop the stream here! It is stopped in MediaRecorder.onstop
  };

  // Transcription using Web Speech API (for demo, only works for live mic, not file)
  const transcribeAudio = (blob) => {
    // For demo: show a placeholder, real implementation would use a backend or 3rd party API
    setTranscription('[Transcription not available in demo. Use a backend for real transcription.]');
    setMediaSentiment(null);
  };

  const handleMoodToggle = (mood) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? [] : [mood]
    );
  };

  // Upload media as soon as mediaBlob is set and user is available
  useEffect(() => {
    console.log('useEffect triggered - mediaBlob:', !!mediaBlob, 'user:', !!user);
    if (mediaBlob) {
      console.log('MediaBlob details:', {
        size: mediaBlob.size,
        type: mediaBlob.type
      });
    }
    
    if (!mediaBlob) {
      console.log('No mediaBlob, clearing upload state');
      setUploadedMediaUrl('');
      setIsUploadingMedia(false);
      setMediaUploadProgress(0);
      return;
    }
    if (!user) {
      console.log('No user, setting error');
      setRecordingError('You must be signed in to upload media.');
      setIsUploadingMedia(false);
      setMediaUploadProgress(0);
      return;
    }
    
    console.log('Starting automatic media upload...');
    let cancelled = false;
    setIsUploadingMedia(true);
    setMediaUploadProgress(0);
    
    uploadMediaAndGetUrl(mediaBlob, user.uid, (progress) => {
      console.log('Upload progress:', progress + '%');
      if (!cancelled) setMediaUploadProgress(progress);
    })
      .then((url) => {
        console.log('Upload completed successfully, URL:', url);
        if (!cancelled) {
          setUploadedMediaUrl(url);
          setIsUploadingMedia(false);
        }
      })
      .catch((err) => {
        console.error('Upload failed:', err);
        if (!cancelled) {
          setRecordingError('Failed to upload media. Please try again.');
          setUploadedMediaUrl('');
          setIsUploadingMedia(false);
        }
      });
    return () => { 
      console.log('Cleaning up upload effect');
      cancelled = true; 
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaBlob, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting letter save');
    
    // Check if store is properly initialized
    try {
      const storeState = useAppStore.getState();
      console.log('Store state available:', !!storeState);
    } catch (storeError) {
      console.error('Store not initialized:', storeError);
      setSnackbar({ open: true, message: 'Application not ready. Please refresh the page.', severity: 'error' });
      return;
    }
    
    // Check if user is authenticated
    if (!user) {
      setSnackbar({ open: true, message: 'Please sign in to save letters.', severity: 'error' });
      return;
    }
    
    if (!title || !content || !unlockDate) {
      if (!unlockDate) setUnlockDateError(true);
      setSnackbar({ open: true, message: 'Please fill in all required fields.', severity: 'error' });
      return;
    }
    setUnlockDateError(false);
    setIsAnalyzing(true);
    try {
      console.log('Form data:', { title, content, unlockDate, selectedMoods, user: user?.uid });
      
      // Analyze sentiment
      const sentimentResult = await analyzeSentiment(content);
      console.log('Sentiment result:', sentimentResult);
      
      // If a mood is selected, overwrite the sentiment mood
      if (selectedMoods.length > 0) {
        sentimentResult.mood = selectedMoods[selectedMoods.length - 1];
        console.log('Overriding mood with selected mood:', sentimentResult.mood);
      }
      setSentiment(sentimentResult);

      // Encrypt and save letter
      let mediaUrlToSave = uploadedMediaUrl;
      console.log('Current uploadedMediaUrl:', uploadedMediaUrl);
      console.log('Current mediaBlob:', mediaBlob);
      console.log('Current user:', user);
      
      if (!mediaUrlToSave && mediaBlob && user) {
        console.log('No uploaded media URL, attempting to upload media blob...');
        console.log('Media blob details:', {
          size: mediaBlob.size,
          type: mediaBlob.type,
          userId: user.uid
        });
        setIsUploadingMedia(true);
        setMediaUploadProgress(0);
        try {
          console.log('Starting media upload...');
          mediaUrlToSave = await uploadMediaAndGetUrl(mediaBlob, user.uid, setMediaUploadProgress);
          console.log('Media upload successful, URL:', mediaUrlToSave);
        } catch (err) {
          console.error('Media upload failed:', err);
          console.error('Error details:', {
            message: err.message,
            code: err.code,
            stack: err.stack
          });
          setRecordingError('Failed to upload media for letter. Please try again.');
          setUploadedMediaUrl(''); // Revert to empty if upload fails
          // Continue without media rather than failing the entire letter
          mediaUrlToSave = '';
        } finally {
          setIsUploadingMedia(false);
        }
      }

      console.log('Saving letter with media details:', {
        mediaUrl: mediaUrlToSave,
        mediaType,
        mediaMimeType,
        transcription,
        mediaSentiment
      });
      
      // Check if this is a large file that won't persist
      if (mediaUrlToSave && mediaUrlToSave.startsWith('blob:')) {
        setSnackbar({ 
          open: true, 
          message: 'Large video detected. For permanent storage, upgrade to Firebase Blaze plan ($0.026/GB) or record shorter videos. Current video works only in this session.', 
          severity: 'warning' 
        });
      }
      
      console.log('About to encrypt letter with data:', {
        title,
        content,
        unlockDate,
        image: image ? 'present' : 'none',
        sentiment: sentimentResult,
        mediaUrl: mediaUrlToSave,
        mediaType,
        mediaMimeType,
        transcription,
        mediaSentiment,
        moods: selectedMoods,
      });
      
      const encryptedLetter = await encryptLetter({
        title,
        content,
        unlockDate,
        image,
        sentiment: sentimentResult,
        mediaUrl: mediaUrlToSave,
        mediaType,
        mediaMimeType,
        transcription,
        mediaSentiment,
        moods: selectedMoods,
      });
      
      console.log('Encryption successful, encrypted letter:', encryptedLetter);
      if (editMode && editLetterId) {
        console.log('Updating letter:', editLetterId, encryptedLetter);
        await updateLetter(editLetterId, {
          ...encryptedLetter,
          taskId: selectedTaskId || null,
        });
        await loadLetters(); // Ensure state is up to date
        setSnackbar({ open: true, message: 'Letter updated successfully!', severity: 'success' });
      } else {
        console.log('Adding new letter:', encryptedLetter);
        console.log('addLetter function type:', typeof addLetter);
        
        // Try to get addLetter directly from store if hook version fails
        let addLetterFunction = null;
        try {
          addLetterFunction = addLetter || useAppStore.getState().addLetter;
        } catch (storeError) {
          console.error('Error accessing store:', storeError);
          throw new Error('Store is not properly initialized');
        }
        
        if (typeof addLetterFunction !== 'function') {
          console.error('addLetter function type:', typeof addLetterFunction);
          throw new Error('addLetter function is not available');
        }
        
        console.log('About to call addLetter function...');
        await addLetterFunction({
          ...encryptedLetter,
          taskId: selectedTaskId || null,
        });
        await loadLetters();
        setSnackbar({ open: true, message: 'Letter added successfully!', severity: 'success' });
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
      setMediaMimeType(null);
      setTranscription('');
      setMediaSentiment(null);
      setSelectedMoods([]);
      setEditMode(false);
      setEditLetterId(null);
      
      // Ensure navigate is available before calling it
      if (typeof navigate === 'function') {
        navigate('/vault');
      } else {
        console.error('Navigate function is not available');
        // Fallback: reload the page or show success message
        setSnackbar({ open: true, message: 'Letter saved successfully! Navigate to Vault to view it.', severity: 'success' });
      }
      console.log('Letter save success');
    } catch (error) {
      console.error('Letter save error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        user: user?.uid,
        editMode: editMode || false,
        editLetterId: editLetterId || null,
        addLetterFunction: typeof addLetter || 'undefined'
      });
      console.error('Full error object:', error);
      setSnackbar({ open: true, message: `Failed to save letter: ${error.message}`, severity: 'error' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Cleanup blob URLs when component unmounts
  useEffect(() => {
    return () => {
      if (mediaUrl && mediaUrl.startsWith('blob:')) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  useEffect(() => { setTimeout(() => setShow(true), 200); }, []);

  // Prefill form if editing
  useEffect(() => {
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
      setMediaMimeType(l.mediaMimeType || null);
      setTranscription(l.transcription || '');
      setMediaSentiment(l.mediaSentiment || null);
      setSelectedMoods(l.moods || []);
    }
  }, [location.state]);

  if (authLoading) {
    // Optionally show a spinner or nothing
    return <div style={{textAlign: 'center', marginTop: '3rem'}}>Loading...</div>;
  }

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
            {/* Media Recording Section - Premium Feature */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>2. Add a Voice or Video Message (optional)</Typography>
              
              {/* Premium Preview: Disabled Upload Area */}
              <Box sx={{ position: 'relative', opacity: 0.6 }}>
                <Box
                  sx={{
                    border: '2px dashed #ccc',
                    borderRadius: 2,
                    p: 3,
                    textAlign: 'center',
                    cursor: 'not-allowed',
                    position: 'relative',
                    background: '#fafafa',
                  }}
                >
                  <CloudUploadIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1 }} />
                  <Typography>
                    Drag & drop an image, audio, or video here, or click to select
                  </Typography>
                </Box>
                {/* Overlay to block all interaction and show message */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255,255,255,0.7)',
                    zIndex: 2,
                    cursor: 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'all',
                    flexDirection: 'column',
                  }}
                >
                  <LockIcon sx={{ fontSize: 32, color: 'primary.main', mb: 1 }} />
                  <Typography sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    Premium feature coming soon!
                  </Typography>
                </Box>
              </Box>
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
                    color={selectedMoods.length === 1 && selectedMoods[0] === mood ? 'primary' : 'default'}
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
                      onChange={date => { setUnlockDate(date); setUnlockDateError(false); }}
                      minDate={new Date()}
                      renderInput={(params) => <TextField {...params} fullWidth required error={unlockDateError} />}
                    />
                    {unlockDateError && (
                      <Typography color="error" sx={{ mt: 1, fontSize: '0.95rem' }}>
                        Please select an unlock date.
                      </Typography>
                    )}
                  </LocalizationProvider>
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
                  <Tooltip title={user ? (editMode ? 'Update and relock your letter' : 'Lock and save your letter') : 'Sign in to lock your letter'} arrow>
                    <span style={{ width: '100%', display: 'block' }}>
                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        size="large"
                        fullWidth
                        disabled={(!!mediaBlob && isUploadingMedia) || isAnalyzing || !user}
                        sx={{
                          backgroundColor: !user ? '#e0d7fa' : '#7C3AED',
                          color: !user ? '#a39bbf' : '#fff',
                          opacity: !user ? 0.7 : 1,
                          cursor: !user ? 'not-allowed' : 'pointer',
                          '&:hover': {
                            backgroundColor: !user ? '#e0d7fa' : '#6c2ed9',
                          },
                        }}
                      >
                        {isAnalyzing ? (
                          <>
                            <CircularProgress size={24} sx={{ mr: 1 }} />
                            {editMode ? 'Updating...' : 'Analyzing & Saving...'}
                          </>
                        ) : (
                          !user ? 'Need to sign in to lock letter' : (editMode ? 'Update Letter' : 'Lock Letter')
                        )}
                      </Button>
                    </span>
                  </Tooltip>
                </Grid>
                {!user && (
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{ mt: 2 }}
                      onClick={() => window.dispatchEvent(new Event('openSignInDialog'))}
                    >
                      Sign In
                    </Button>
                  </Grid>
                )}
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
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        message={snackbar.message}
      />
    </Box>
  );
}

export default WriteLetter; 
