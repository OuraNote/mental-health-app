import { useState, useRef } from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { debugMediaSupport, getSupportedMediaFormat } from '../utils/encryption';

function MediaTest() {
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState('');
  const [error, setError] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);

  const startRecording = async (type) => {
    setError('');
    setMediaType(type);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: type === 'video',
      });
      
      const mimeType = getSupportedMediaFormat(type);
      console.log(`Using MIME type: ${mimeType} for ${type}`);
      
      const recorder = new MediaRecorder(stream, { mimeType });
      let chunks = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setMediaUrl(url);
        console.log('Recording completed:', { blob, url, mimeType });
      };
      
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setError(`Recording failed: ${event.error.message}`);
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Media access error:', err);
      setError(`Failed to access media: ${err.message}`);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const testMediaSupport = () => {
    debugMediaSupport();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Media Test Page
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Button onClick={testMediaSupport} variant="outlined" sx={{ mr: 2 }}>
            Test Browser Support
          </Button>
          <Button 
            onClick={() => isRecording ? stopRecording() : startRecording('audio')}
            variant={isRecording && mediaType === 'audio' ? 'contained' : 'outlined'}
            color="primary"
            sx={{ mr: 2 }}
          >
            {isRecording && mediaType === 'audio' ? 'Stop Audio' : 'Record Audio'}
          </Button>
          <Button 
            onClick={() => isRecording ? stopRecording() : startRecording('video')}
            variant={isRecording && mediaType === 'video' ? 'contained' : 'outlined'}
            color="secondary"
          >
            {isRecording && mediaType === 'video' ? 'Stop Video' : 'Record Video'}
          </Button>
        </Box>

        {error && (
          <Typography color="error" sx={{ mb: 2 }}>
            Error: {error}
          </Typography>
        )}

        {mediaUrl && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recorded Media ({mediaType})
            </Typography>
            {mediaType === 'audio' ? (
              <audio 
                controls 
                src={mediaUrl}
                onError={(e) => {
                  console.error('Audio playback error:', e);
                  setError('Failed to play audio');
                }}
              />
            ) : mediaType === 'video' ? (
              <video 
                controls 
                src={mediaUrl} 
                style={{ maxWidth: '100%' }}
                onError={(e) => {
                  console.error('Video playback error:', e);
                  setError('Failed to play video');
                }}
              />
            ) : null}
          </Box>
        )}
      </Paper>
    </Container>
  );
}

export default MediaTest; 