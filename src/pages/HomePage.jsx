import { Box, Button, Typography, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 100%)', px: 2 }}>
      <Paper sx={{ p: 4, borderRadius: 4, mb: 4, maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <Typography variant='h4' sx={{ fontWeight: 700, mb: 2 }}>Welcome to Your Time Capsule</Typography>
        <Typography variant='body1' sx={{ mb: 4 }}>Choose how you want to reflect today.</Typography>
        <Button variant='contained' color='primary' sx={{ mb: 2, width: '100%', fontSize: '1.1rem', py: 2, borderRadius: 2 }} onClick={() => navigate('/diary')}>
          Daily Diary
        </Button>
        <Button variant='outlined' color='primary' sx={{ width: '100%', fontSize: '1.1rem', py: 2, borderRadius: 2 }} onClick={() => navigate('/letter')}>
          Letter to Future Self
        </Button>
      </Paper>
    </Box>
  );
}

export default HomePage; 
