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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Lock as LockIcon,
  Timeline as TimelineIcon,
  Psychology as PsychologyIcon,
} from '@mui/icons-material';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import GoogleIcon from '@mui/icons-material/Google';
import Switch from '@mui/material/Switch';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useContext } from 'react';
import { ThemeToggleContext } from '../App';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, sendEmailVerification } from 'firebase/auth';
import { useAppStore } from '../store';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

const drawerWidth = 240;

const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Write Letter', icon: <EditIcon />, path: '/write' },
  { text: 'Vault', icon: <LockIcon />, path: '/vault' },
  { text: 'Timeline', icon: <TimelineIcon />, path: '/timeline' },
  { text: 'GrowthLens', icon: <TimelineIcon />, path: '/growthlens' },
  { text: 'Letter Wall', icon: <LockIcon />, path: '/wall' },
  // { text: 'AI Insights', icon: <PsychologyIcon />, path: '/insights' },
];

// Limit bottom nav to 5 main tabs, move others to 'More'
const bottomNavItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Write', icon: <EditIcon />, path: '/write' },
  { text: 'Vault', icon: <LockIcon />, path: '/vault' },
  { text: 'Timeline', icon: <TimelineIcon />, path: '/timeline' },
  { text: 'More', icon: <MoreHorizIcon />, path: '/more' },
];
const moreMenuItems = [
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
  const { useModernTheme, toggleTheme } = useContext(ThemeToggleContext);
  const [authError, setAuthError] = useState('');
  const loadLetters = useAppStore(state => state.loadLetters);
  const clearLetters = useAppStore(state => state.clearLetters);
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const handleMoreOpen = (event) => setMoreAnchorEl(event.currentTarget);
  const handleMoreClose = () => setMoreAnchorEl(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSignIn = async () => {
    setAuthError('');
    try {
      if (authTab === 'signin') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setAuthError('Please verify your email before signing in. A new verification email has been sent.');
          await sendEmailVerification(userCredential.user);
          return;
        }
        setUser({ email: userCredential.user.email });
        localStorage.setItem('user', JSON.stringify({ email: userCredential.user.email }));
        setAuthOpen(false);
        await loadLetters();
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        setAuthError('A verification email has been sent to your email address. Please check your inbox and verify before signing in.');
        setPassword('');
        // Do NOT set user as logged in or close dialog yet
      }
    } catch (error) {
      setAuthError(error.message);
    }
  };
  const handleSignOut = async () => {
    await signOut(auth);
    setUser(null);
    localStorage.removeItem('user');
    clearLetters();
  };
  const handleGoogleSignIn = () => {
    // Mock Google OAuth
    const mockUser = { email: 'googleuser@example.com', name: 'Google User', provider: 'google' };
    setUser(mockUser);
    localStorage.setItem('user', JSON.stringify(mockUser));
    setAuthOpen(false);
  };

  const handlePasswordReset = async () => {
    setAuthError('');
    try {
      await sendPasswordResetEmail(auth, email);
      setAuthError('Password reset email sent!');
    } catch (error) {
      setAuthError(error.message);
    }
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
          pt: { xs: 'env(safe-area-inset-top)', sm: 0 },
          pb: { xs: 0.5, sm: 0 },
        }}
      >
        <Toolbar sx={{ flexWrap: 'wrap', gap: 1, minHeight: { xs: 48, sm: 64 }, px: { xs: 1, sm: 2 } }}>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
            Mental Health Time Capsule
          </Typography>
          {/* Theme switcher - hide on very small screens */}
          <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center' }}>
            <LightModeIcon sx={{ color: useModernTheme ? 'primary.main' : 'grey.500' }} />
            <Switch
              checked={useModernTheme}
              onChange={toggleTheme}
              color="primary"
              inputProps={{ 'aria-label': 'theme switch' }}
              size="small"
            />
            <DarkModeIcon sx={{ color: !useModernTheme ? 'primary.main' : 'grey.500' }} />
          </Box>
          {user ? (
            <>
              <Typography sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                {user.name || user.email}
              </Typography>
              <Button 
                color="inherit" 
                onClick={handleSignOut}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Sign Out
              </Button>
            </>
          ) : (
            <Button 
              color="inherit" 
              onClick={() => setAuthOpen(true)}
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Sign In
            </Button>
          )}
        </Toolbar>
      </AppBar>
      {/* Permanent Drawer for desktop only */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 }, display: { xs: 'none', sm: 'block' } }}>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main content area */}
      <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%', mb: { xs: 7, sm: 0 } }}>
        <Toolbar />
        {children}
      </Box>

      {/* Bottom Navigation for mobile only */}
      <Box sx={{ display: { xs: 'block', sm: 'none' }, position: 'fixed', bottom: 24, left: 0, right: 0, zIndex: 1201, borderTop: 1, borderColor: 'divider', background: '#fff', pb: 1 }}>
        <BottomNavigation
          showLabels={false}
          value={bottomNavItems.findIndex(item => (item.path === '/more' ? moreMenuItems.some(m => m.path === location.pathname) : item.path === location.pathname))}
          onChange={(event, newValue) => {
            if (bottomNavItems[newValue].text === 'More') {
              setMoreAnchorEl(event.currentTarget);
            } else {
              navigate(bottomNavItems[newValue].path);
            }
          }}
          sx={{ height: 60 }}
        >
          {bottomNavItems.map((item, idx) => (
            <BottomNavigationAction key={item.text} icon={item.icon} />
          ))}
        </BottomNavigation>
        <Menu
          anchorEl={moreAnchorEl}
          open={Boolean(moreAnchorEl)}
          onClose={handleMoreClose}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          transformOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          {moreMenuItems.map((item) => (
            <MenuItem key={item.text} onClick={() => { navigate(item.path); handleMoreClose(); }}>
              {item.icon}
              <span style={{ marginLeft: 8 }}>{item.text}</span>
            </MenuItem>
          ))}
        </Menu>
      </Box>
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
          {authError && <Typography color="error" sx={{ mb: 1 }}>{authError}</Typography>}
          {authTab === 'signin' && (
            <Button onClick={handlePasswordReset} sx={{ mb: 1, textTransform: 'none' }}>
              Forgot password?
            </Button>
          )}
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
    </Box>
  );
}

export default Layout; 
