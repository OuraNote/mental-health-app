import { useState, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Fade,
  Grid,
  Button,
} from '@mui/material';
import {
  People as PeopleIcon,
  Forum as ForumIcon,
  Share as ShareIcon,
  Support as SupportIcon,
} from '@mui/icons-material';
import { SpotlightTourContext } from '../App';

function Community() {
  const [show, setShow] = useState(false);
  const { spotlightRefs } = useContext(SpotlightTourContext) || {};

  useState(() => { setTimeout(() => setShow(true), 200); }, []);

  const features = [
    {
      icon: <PeopleIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Connect with Others',
      description: 'Join a supportive community of people on similar mental health journeys.',
    },
    {
      icon: <ForumIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Share Experiences',
      description: 'Safely share your experiences and learn from others in a moderated environment.',
    },
    {
      icon: <ShareIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Anonymous Support',
      description: 'Get and give support anonymously to protect your privacy.',
    },
    {
      icon: <SupportIcon sx={{ fontSize: 60, color: 'primary.main' }} />,
      title: 'Professional Guidance',
      description: 'Access resources and guidance from mental health professionals.',
    },
  ];

  return (
    <Box sx={{
      minHeight: '100vh',
      background: '#e0f7fa',
      backgroundImage: 'linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 100%)',
      py: 6,
    }}>
      <Container maxWidth="lg">
        <Fade in={show} timeout={1200}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: 'primary.main', letterSpacing: 1, textAlign: 'center' }}>
              Community
            </Typography>
            
            {/* Coming Soon Banner */}
            <Paper 
              elevation={6} 
              sx={{ 
                p: 4, 
                mb: 4, 
                borderRadius: 6, 
                textAlign: 'center', 
                boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)',
                background: 'linear-gradient(135deg, #fff 0%, #f8f9ff 100%)',
                border: '2px solid',
                borderColor: 'primary.main',
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                🚀 Coming Soon
              </Typography>
              <Typography variant="h6" sx={{ mb: 3, color: 'text.secondary' }}>
                We're building a supportive community where you can connect with others on similar mental health journeys.
              </Typography>
              <Button 
                variant="contained" 
                size="large"
                sx={{ 
                  borderRadius: 24, 
                  px: 4, 
                  py: 1.5,
                  fontSize: '1.1rem',
                  fontWeight: 600,
                }}
                disabled
              >
                Join the Waitlist
              </Button>
            </Paper>

            {/* Features Preview */}
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: 'primary.main', textAlign: 'center' }}>
              What's Coming
            </Typography>
            
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item xs={12} sm={6} md={3} key={index}>
                  <Paper 
                    elevation={6} 
                    sx={{ 
                      p: 3, 
                      borderRadius: 6, 
                      textAlign: 'center', 
                      boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      opacity: 0.7,
                    }}
                  >
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Additional Info */}
            <Paper 
              elevation={6} 
              sx={{ 
                p: 4, 
                mt: 4, 
                borderRadius: 6, 
                textAlign: 'center', 
                boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)',
                background: 'linear-gradient(135deg, #f8f9ff 0%, #fff 100%)',
              }}
            >
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2, color: 'primary.main' }}>
                Stay Updated
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
                We're working hard to create a safe, supportive community. Sign up to be notified when we launch!
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                Your privacy and mental health are our top priorities. All community features will include robust privacy controls and professional moderation.
              </Typography>
            </Paper>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}

export default Community;
