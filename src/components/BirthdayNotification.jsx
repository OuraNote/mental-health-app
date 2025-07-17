import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Paper,
  Fade,
} from '@mui/material';
import { Cake as CakeIcon, Favorite as FavoriteIcon, TrendingUp as TrendingUpIcon } from '@mui/icons-material';
import { useAppStore } from '../store';

function BirthdayNotification({ user, open, onClose }) {
  const [message, setMessage] = useState('');
  const letters = useAppStore(state => state.letters);
  const diaryEntries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');

  useEffect(() => {
    if (!user || !open || !user.birthday) return;

    const generateBirthdayMessage = () => {
      const totalEntries = letters.length + diaryEntries.length;
      const userAge = new Date().getFullYear() - new Date(user.birthday).getFullYear();
      
      if (totalEntries >= 10) {
        // User has significant data - show emotional journey reflection
        const positiveEntries = letters.filter(letter => {
          try {
            const decrypted = JSON.parse(atob(letter.data));
            return decrypted.sentiment?.sentimentScore > 0;
          } catch {
            return false;
          }
        }).length;
        
        const growthPercentage = Math.round((positiveEntries / letters.length) * 100);
        
        return {
          title: `Happy ${userAge}th Birthday, ${user.firstName}! 🎉`,
          message: `Looking back at your emotional journey, you've shared ${totalEntries} heartfelt moments with yourself. ${growthPercentage}% of your letters reflect positive growth and self-reflection. Your commitment to mental health and self-discovery is truly inspiring. Keep writing, keep growing, and remember that every entry is a step toward a better understanding of yourself.`,
          icon: <TrendingUpIcon sx={{ fontSize: 60, color: '#FFD700' }} />
        };
      } else if (totalEntries >= 3) {
        // User has some data - show encouraging message
        return {
          title: `Happy ${userAge}th Birthday, ${user.firstName}! 🎂`,
          message: `You've started a beautiful journey of self-reflection with ${totalEntries} entries so far. Each letter and diary entry is a gift to your future self. As you celebrate another year, remember that your mental health journey is just beginning, and every step forward is worth celebrating.`,
          icon: <CakeIcon sx={{ fontSize: 60, color: '#FF6B9D' }} />
        };
      } else {
        // New user - show heartfelt welcome message
        return {
          title: `Happy ${userAge}th Birthday, ${user.firstName}! ✨`,
          message: `Welcome to your Mental Health Time Capsule! As you celebrate your special day, know that this app is here to support your emotional well-being journey. Start by writing your first letter to your future self - it's a beautiful way to begin this new year of your life.`,
          icon: <FavoriteIcon sx={{ fontSize: 60, color: '#FF6B6B' }} />
        };
      }
    };

    const birthdayMessage = generateBirthdayMessage();
    setMessage(birthdayMessage);
  }, [user, open, letters, diaryEntries]);

  if (!message) return null;

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          background: 'linear-gradient(135deg, #fff 0%, #f8f9ff 100%)',
          border: '2px solid',
          borderColor: 'primary.main',
        }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
          {message.icon}
        </Box>
        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
          {message.title}
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Paper elevation={0} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 3 }}>
          <Typography variant="body1" sx={{ lineHeight: 1.8, textAlign: 'center' }}>
            {message.message}
          </Typography>
        </Paper>
      </DialogContent>
      
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button 
          variant="contained" 
          onClick={onClose}
          sx={{ 
            borderRadius: 24, 
            px: 4, 
            py: 1.5,
            fontSize: '1.1rem',
            fontWeight: 600,
          }}
        >
          Thank You! 🎉
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default BirthdayNotification; 