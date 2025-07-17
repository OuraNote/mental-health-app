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
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';

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

function Layout({ children, user, onSignOut, onOpenAuthDialog }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [birthdayNotificationOpen, setBirthdayNotificationOpen] = useState(false);
  const { useModernTheme, toggleTheme } = useContext(ThemeToggleContext);
  const loadLetters = useAppStore(state => state.loadLetters);
  const clearLetters = useAppStore(state => state.clearLetters);
  const [moreAnchorEl, setMoreAnchorEl] = useState(null);
  const handleMoreOpen = (event) => setMoreAnchorEl(event.currentTarget);
  const handleMoreClose = () => setMoreAnchorEl(null);



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

    const handleSignOut = async () => {
    try {
      await signOut(auth);
      onSignOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          OuraNote
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
            OuraNote
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
                Hello {user.firstName || user.displayName || user.email}
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
              onClick={onOpenAuthDialog}
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
