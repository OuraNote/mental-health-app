import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  Chip,
  Fab,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import GoogleIcon from '@mui/icons-material/Google';
import StarIcon from '@mui/icons-material/Star';
import ChatIcon from '@mui/icons-material/Chat';

const drawerWidth = 240;

const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Write Letter', icon: <EditIcon />, path: '/write' },
  { text: 'Vault', icon: <LockIcon />, path: '/vault' },
  { text: 'Timeline', icon: <TimelineIcon />, path: '/timeline' },
  { text: 'GrowthLens', icon: <TimelineIcon />, path: '/growthlens' },
  { text: 'Letter Wall', icon: <LockIcon />, path: '/wall' },
];

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch { return null; }
  });
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [isPremium, setIsPremium] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('isPremium') || 'false');
    } catch { return false; }
  });
  const [aiCoachOpen, setAiCoachOpen] = useState(false);
  const [aiCoachPromptOpen, setAiCoachPromptOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSignIn = () => {
    if (!email) return;
    const mockUser = { email, name: email.split('@')[0] };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    setAuthOpen(false);
  };
  const handleSignOut = () => {
    setUser(null);
    localStorage.removeItem('user');
  };
  const handleGoogleSignIn = () => {
    // Mock Google OAuth
    const mockUser = { email: 'googleuser@example.com', name: 'Google User', provider: 'google' };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    setAuthOpen(false);
  };

  const handleUpgrade = () => {
    setIsPremium(true);
    localStorage.setItem('isPremium', 'true');
    setPremiumOpen(false);
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Time Capsule
        </Typography>
      </Toolbar>
      <List>
        {menuItems.map((item) => (
          <ListItem
            button
            key={item.text}
            onClick={() => {
              navigate(item.path);
              setMobileOpen(false);
            }}
            selected={location.pathname === item.path}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Mental Health Time Capsule
          </Typography>
          {isPremium && (
            <Chip icon={<StarIcon sx={{ color: '#FFD600' }} />} label="Premium" color="warning" sx={{ mr: 2, fontWeight: 700 }} />
          )}
          <Button color="inherit" onClick={() => setPremiumOpen(true)} sx={{ mr: 1 }}>
            Go Premium
          </Button>
          {user ? (
            <>
              <Typography sx={{ mr: 2 }}>{user.name || user.email}</Typography>
              <Button color="inherit" onClick={handleSignOut}>Sign Out</Button>
            </>
          ) : (
            <Button color="inherit" onClick={() => setAuthOpen(true)}>Sign In / Sign Up</Button>
          )}
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 1, sm: 3 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        {children}
      </Box>
      <Fab
        color="primary"
        aria-label="AI Coach"
        sx={{ position: 'fixed', bottom: 32, right: 32, zIndex: 1200 }}
        onClick={() => {
          if (!isPremium) {
            setAiCoachPromptOpen(true);
            return;
          }
          setAiCoachOpen(true);
        }}
      >
        <ChatIcon />
      </Fab>
      <Dialog open={authOpen} onClose={() => setAuthOpen(false)}>
        <DialogTitle>{authTab === 'signin' ? 'Sign In' : 'Sign Up'}</DialogTitle>
        <DialogContent sx={{ minWidth: 320 }}>
          <Button
            variant="outlined"
            fullWidth
            startIcon={<GoogleIcon />}
            sx={{ mb: 2, textTransform: 'none', fontWeight: 600 }}
            onClick={handleGoogleSignIn}
          >
            Continue with Google
          </Button>
          <Typography align="center" sx={{ my: 1, color: '#888' }}>or</Typography>
          <TextField
            label="Email"
            type="email"
            fullWidth
            value={email}
            onChange={e => setEmail(e.target.value)}
            sx={{ mb: 2 }}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            value={password}
            onChange={e => setPassword(e.target.value)}
            sx={{ mb: 2 }}
          />
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          <Button onClick={() => setAuthTab(authTab === 'signin' ? 'signup' : 'signin')}>
            {authTab === 'signin' ? 'Need an account? Sign Up' : 'Already have an account? Sign In'}
          </Button>
          <Button variant="contained" onClick={handleSignIn}>
            {authTab === 'signin' ? 'Sign In' : 'Sign Up'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={premiumOpen} onClose={() => setPremiumOpen(false)}>
        <DialogTitle>Unlock Premium Features</DialogTitle>
        <DialogContent sx={{ minWidth: 350 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <StarIcon sx={{ color: '#FFD600', fontSize: 32, mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>Premium Benefits</Typography>
          </Box>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#444', fontSize: '1.08rem' }}>
            <li>Unlimited storage & attachments</li>
            <li>Memory Capsule collections</li>
            <li>Export to PDF/video time capsule</li>
            <li>AI reflections & insights</li>
            <li>Recurring prompts & reminders</li>
            <li>Premium Letter Wall categories</li>
            <li>Offline access & mobile widgets</li>
            <li>And more!</li>
          </ul>
          <Box sx={{ mt: 3, mb: 1, textAlign: 'center' }}>
            <Typography variant="h5" color="primary" sx={{ fontWeight: 800 }}>$4.99/mo</Typography>
            <Typography color="text.secondary">or $39.99/year • $14.99 lifetime</Typography>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPremiumOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={handleUpgrade} startIcon={<StarIcon />}>
            Upgrade Now
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={aiCoachOpen} onClose={() => setAiCoachOpen(false)}>
        <DialogTitle>AI Coach (Premium)</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>This is your AI-powered journaling assistant. Ask for suggestions, affirmations, or guidance!</Typography>
          <Box sx={{ bgcolor: '#f5f5f5', p: 2, borderRadius: 2, minHeight: 120, mb: 2 }}>
            <Typography color="text.secondary">[Mock chat interface coming soon]</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiCoachOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog open={aiCoachPromptOpen} onClose={() => setAiCoachPromptOpen(false)}>
        <DialogTitle>Premium Feature</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LockIcon color="warning" sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Coach Add-On</Typography>
          </Box>
          <Typography sx={{ mb: 2 }}>
            Upgrade to Premium to chat with your AI-powered journaling assistant for real-time suggestions and affirmations.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAiCoachPromptOpen(false)}>Cancel</Button>
          <Button variant="contained" color="warning" onClick={() => {
            setAiCoachPromptOpen(false);
            window.dispatchEvent(new Event('openPremiumModal'));
          }}>
            Go Premium
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default Layout; 