import { useState, useEffect } from 'react';
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
  BorderColor as BorderColorIcon,
  Lock as LockIcon,
  LockOpen as LockOpenIcon,
  ShowChart as ShowChartIcon,
  Psychology as PsychologyIcon,
  MoreHoriz as MoreHorizIcon,
  People as PeopleIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
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
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, signOut, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useAppStore } from '../store';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Tooltip from '@mui/material/Tooltip';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import BirthdayNotification from './BirthdayNotification';

const drawerWidth = 240;

const menuItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Write Diary', icon: <EditIcon />, path: '/diary' },
  { text: 'Write Letter', icon: <BorderColorIcon />, path: '/write' },
  { text: 'Diary Vault', icon: <LockIcon />, path: '/diary-vault' },
  { text: 'Letter Vault', icon: <LockOpenIcon />, path: '/vault' },
  { text: 'Timeline', icon: <ShowChartIcon />, path: '/timeline' },
  { text: 'Community', icon: <PeopleIcon />, path: '/community' },
];

// Limit bottom nav to 4 main tabs, move vaults to 'More'
const bottomNavItems = [
  { text: 'Home', icon: <HomeIcon />, path: '/' },
  { text: 'Diary', icon: <EditIcon />, path: '/diary' },
  { text: 'Letter', icon: <BorderColorIcon />, path: '/write' },
  { text: 'Timeline', icon: <ShowChartIcon />, path: '/timeline' },
  { text: 'More', icon: <MoreHorizIcon />, path: '/more' },
];
const moreMenuItems = [
  { text: 'Diary Vault', icon: <LockIcon />, path: '/diary-vault' },
  { text: 'Letter Vault', icon: <LockOpenIcon />, path: '/vault' },
];
// No moreMenuItems needed since all features are in main nav

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleNames, setMiddleNames] = useState('');
  const [surname, setSurname] = useState('');
  const [birthday, setBirthday] = useState(null);
  const [birthdayNotificationOpen, setBirthdayNotificationOpen] = useState(false);
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

  useEffect(() => {
    const handler = () => setAuthOpen(true);
    window.addEventListener('openSignInDialog', handler);
    return () => window.removeEventListener('openSignInDialog', handler);
  }, []);

  // Check for birthday notifications
  useEffect(() => {
    if (!user || !user.birthday) return;

    const checkBirthday = () => {
      const today = new Date();
      const birthday = new Date(user.birthday);
      
      // Check if today is the user's birthday (same month and day)
      const isBirthday = today.getMonth() === birthday.getMonth() && 
                        today.getDate() === birthday.getDate();
      
      if (isBirthday) {
        // Check if we've already shown the notification today
        const lastNotification = localStorage.getItem(`birthday-${user.uid}-${today.getFullYear()}`);
        if (!lastNotification) {
          setBirthdayNotificationOpen(true);
          localStorage.setItem(`birthday-${user.uid}-${today.getFullYear()}`, 'true');
        }
      }
    };

    checkBirthday();
    
    // Check every hour for birthday
    const interval = setInterval(checkBirthday, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [user]);

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
        
        // Load user profile from Firestore
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        const userData = userDoc.exists() ? userDoc.data() : { email: userCredential.user.email };
        
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        setAuthOpen(false);
        await loadLetters();
      } else {
        // Validate required fields for sign-up
        if (!firstName.trim() || !surname.trim() || !birthday) {
          setAuthError('Please fill in all required fields (First Name, Surname, and Birthday).');
          return;
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Save user profile to Firestore
        const userProfile = {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          firstName: firstName.trim(),
          middleNames: middleNames.trim(),
          surname: surname.trim(),
          fullName: `${firstName.trim()} ${middleNames.trim() ? middleNames.trim() + ' ' : ''}${surname.trim()}`.trim(),
          birthday: birthday.toISOString(),
          createdAt: new Date().toISOString(),
        };
        
        await setDoc(doc(db, 'users', userCredential.user.uid), userProfile);
        
        await sendEmailVerification(userCredential.user);
        setAuthError('A verification email has been sent to your email address. Please check your inbox and verify before signing in.');
        setPassword('');
        setFirstName('');
        setMiddleNames('');
        setSurname('');
        setBirthday(null);
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
  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setAuthError(''); // Clear any previous errors
      
      // Test storage access before proceeding
      try {
        sessionStorage.setItem('test', 'test');
        sessionStorage.removeItem('test');
      } catch (storageError) {
        console.warn('Storage access issue detected:', storageError);
        setAuthError('Browser storage access is restricted. Please allow cookies and try again.');
        return;
      }
      
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      // Check if user profile exists in Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        // User profile exists, load it
        const userData = userDoc.data();
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        // Create user profile from Google data
        const userProfile = {
          uid: user.uid,
          email: user.email,
          firstName: user.displayName?.split(' ')[0] || 'User',
          surname: user.displayName?.split(' ').slice(-1)[0] || '',
          fullName: user.displayName || 'User',
          provider: 'google',
          createdAt: new Date().toISOString(),
        };
        
        await setDoc(doc(db, 'users', user.uid), userProfile);
        setUser(userProfile);
        localStorage.setItem('user', JSON.stringify(userProfile));
      }
      
      setAuthOpen(false);
      await loadLetters();
    } catch (error) {
      console.error('Google sign-in error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Sign-in failed. Please try again.';
      
      if (error.code === 'auth/operation-not-allowed') {
        errorMessage = 'Google sign-in is not enabled. Please contact support.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in was cancelled. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many sign-in attempts. Please wait a moment and try again.';
      } else if (error.message.includes('sessionStorage')) {
        errorMessage = 'Browser storage access is restricted. Please allow cookies and try again.';
      }
      
      setAuthError(errorMessage);
    }
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
            <Tooltip title={useModernTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton
                onClick={toggleTheme}
                sx={{
                  ml: 2,
                  bgcolor: useModernTheme ? '#333' : '#fff',
                  color: useModernTheme ? '#FFD700' : '#333',
                  border: '2px solid',
                  borderColor: useModernTheme ? '#FFD700' : '#333',
                  boxShadow: 2,
                  '&:hover': {
                    bgcolor: useModernTheme ? '#444' : '#f0f0f0',
                  },
                }}
                size="large"
              >
                {useModernTheme ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
          </Box>
          {user ? (
            <>
              <Typography sx={{ mr: 1, display: { xs: 'none', sm: 'block' } }}>
                Hello {user.firstName || user.name || user.email}
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
      <Box sx={{ display: { xs: 'block', sm: 'none' }, position: 'fixed', bottom: 16, left: 0, right: 0, zIndex: 1201, borderTop: 1, borderColor: 'divider', background: '#fff', pb: 3 }}>
        <BottomNavigation
          showLabels={true}
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
            <BottomNavigationAction key={item.text} label={item.text} icon={item.icon} />
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
            sx={{ 
              mb: 2, 
              textTransform: 'none', 
              fontWeight: 600,
              py: 1.5,
              borderColor: '#4285F4',
              color: '#4285F4',
              '&:hover': {
                borderColor: '#3367D6',
                backgroundColor: 'rgba(66, 133, 244, 0.04)',
              }
            }}
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
          
          {/* Additional fields for sign-up */}
          {authTab === 'signup' && (
            <>
              <TextField
                label="First Name"
                fullWidth
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <TextField
                label="Middle Names (optional)"
                fullWidth
                value={middleNames}
                onChange={e => setMiddleNames(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                label="Surname"
                fullWidth
                value={surname}
                onChange={e => setSurname(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Birthday"
                  value={birthday}
                  onChange={setBirthday}
                  renderInput={(params) => <TextField {...params} fullWidth sx={{ mb: 2 }} required />}
                  maxDate={new Date()}
                />
              </LocalizationProvider>
            </>
          )}
          
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
      
      {/* Birthday Notification */}
      <BirthdayNotification 
        user={user}
        open={birthdayNotificationOpen}
        onClose={() => setBirthdayNotificationOpen(false)}
      />
    </Box>
  );
}

export default Layout; 
