import { Container, Typography, Paper, Box, LinearProgress, Fade, Avatar, Button } from '@mui/material';
import { useAppStore } from '../store';
import { decryptLetter } from '../utils/encryption';
import { useMemo, useState, useContext } from 'react';
import Tooltip from '@mui/material/Tooltip';
import SentimentSatisfiedAltIcon from '@mui/icons-material/SentimentSatisfiedAlt';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentNeutralIcon from '@mui/icons-material/SentimentNeutral';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import { SpotlightTourContext } from '../App';
import BarChartIcon from '@mui/icons-material/BarChart';
import { Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from 'chart.js';
import LockIcon from '@mui/icons-material/Lock';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const STOPWORDS = new Set([
  'the','and','to','of','a','i','in','it','is','that','for','on','with','as','was','at','by','an','be','this','have','or','from','but','not','are','my','so','if','me','we','you','your','our','they','their','has','had','do','did','can','will','just','about','like','what','when','who','how','all','would','there','which','more','one','been','because','than','out','up','down','now','then','them','he','she','his','her','were','too','very','get','got','into','no','yes','am','im','its','dont','didnt','cant','could','should','shall','may','might','must','let','lets','us','also','even','still','over','again','back','see','go','going','went','make','made','making','want','wanted','wants','need','needed','needs','know','knew','knows','think','thought','thinks','say','said','says','see','saw','seen','look','looked','looks','looking','feel','felt','feels','feeling','time','times','day','days','year','years','life','lives','way','ways','thing','things','something','anything','everything','nothing','some','any','every','none','much','many','few','lot','lots','most','least','best','worst','good','bad','great','better','worse','new','old','first','last','next','other','another','same','different','big','small','long','short','high','low','right','left','top','bottom','front','back','side','end','start','begin','began','begun','beginning','ending','never','always','sometimes','often','usually','rarely','ever','once','twice','soon','late','early','before','after','during','while','until','since','ago','yet','already','just','still','now','then','here','there','where','home','away','place','places','part','parts','whole','half','quarter','piece','pieces','bit','bits','lot','lots','group','groups','team','teams','family','families','friend','friends','people','person','man','men','woman','women','child','children','kid','kids','boy','boys','girl','girls','guy','guys','gal','gals','someone','anyone','everyone','nobody','somebody','anybody','everybody','self','selves','myself','yourself','ourselves','themselves','himself','herself','itself','who','whom','whose','which','that','these','those','such','each','either','neither','both','few','several','many','much','most','all','some','any','none','one','two','three','four','five','six','seven','eight','nine','ten'
]);

const MOOD_COLORS = {
  joy: '#FFD600',
  hope: '#64DD17',
  calm: '#00B8D4',
  gratitude: '#FF6D00',
  love: '#D500F9',
  sadness: '#2979FF',
  anger: '#D50000',
  fear: '#6D4C41',
  neutral: '#BDBDBD',
};

const MOOD_ICONS = {
  joy: <SentimentVerySatisfiedIcon sx={{ color: '#FFD600' }} />, // yellow
  hope: <EmojiObjectsIcon sx={{ color: '#64DD17' }} />, // green
  calm: <SentimentSatisfiedAltIcon sx={{ color: '#00B8D4' }} />, // blue
  gratitude: <SentimentSatisfiedAltIcon sx={{ color: '#FF6D00' }} />, // orange
  love: <SentimentVerySatisfiedIcon sx={{ color: '#D500F9' }} />, // purple
  sadness: <SentimentVeryDissatisfiedIcon sx={{ color: '#2979FF' }} />, // blue
  anger: <SentimentVeryDissatisfiedIcon sx={{ color: '#D50000' }} />, // red
  fear: <SentimentNeutralIcon sx={{ color: '#6D4C41' }} />, // brown
  neutral: <SentimentNeutralIcon sx={{ color: '#BDBDBD' }} />, // gray
};

const MOOD_DISPLAY = [
  { key: 'Joyful', color: '#FFD600' },
  { key: 'Hopeful', color: '#64DD17' },
  { key: 'Grateful', color: '#FF6D00' },
  { key: 'Calm', color: '#00B8D4' },
  { key: 'Anxious', color: '#FF1744' },
  { key: 'Sad', color: '#2979FF' },
  { key: 'Angry', color: '#D50000' },
  { key: 'Lonely', color: '#6D4C41' },
  { key: 'Confident', color: '#00C853' },
  { key: 'Inspired', color: '#D500F9' },
];

function getWordFrequencies(letters) {
  const freq = {};
  for (const l of letters) {
    let text = '';
    try {
      text = decryptLetter(l).content;
    } catch { continue; }
    text.toLowerCase().replace(/[^a-z\s]/g, '').split(/\s+/).forEach(word => {
      if (!STOPWORDS.has(word) && word.length > 2) {
        freq[word] = (freq[word] || 0) + 1;
      }
    });
  }
  return freq;
}

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, ChartTooltip, ChartLegend);

function GrowthLens() {
  const letters = useAppStore(state => state.letters);
  const tasks = useAppStore(state => state.tasks);
  const [show, setShow] = useState(false);
  const [premiumPromptOpen, setPremiumPromptOpen] = useState(false);
  const isPremium = (() => {
    try {
      return JSON.parse(localStorage.getItem('isPremium') || 'false');
    } catch { return false; }
  })();
  useState(() => { setTimeout(() => setShow(true), 200); }, []);
  const wordFreq = useMemo(() => getWordFrequencies(letters), [letters]);
  const topWords = Object.entries(wordFreq).sort((a, b) => b[1] - a[1]).slice(0, 30);

  // Prepare mood timeline data
  const moodTimeline = useMemo(() => {
    return letters
      .map(l => {
        try {
          const d = decryptLetter(l);
          return {
            date: new Date(d.createdAt),
            mood: d.sentiment?.mood || 'neutral',
            sentimentScore: d.sentiment?.sentimentScore || 0,
          };
        } catch {
          return null;
        }
      })
      .filter(Boolean)
      .sort((a, b) => a.date - b.date);
  }, [letters]);

  // Compute Growth Score
  const growthScore = useMemo(() => {
    if (letters.length === 0) return 0;
    // 1. Mood trend (average sentiment score, normalized to 0-100)
    const avgSentiment = moodTimeline.length > 0 ?
      moodTimeline.reduce((sum, l) => sum + l.sentimentScore, 0) / moodTimeline.length : 0;
    const moodScore = Math.max(0, Math.min(100, 50 + avgSentiment * 10));
    // 2. Task completion
    const completedTasks = tasks.filter(t => t.completed).length;
    const taskScore = tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 50;
    // 3. Letter frequency (capped at 100 for 20+ letters)
    const freqScore = Math.min(100, (letters.length / 20) * 100);
    // Weighted average
    return Math.round((moodScore * 0.5) + (taskScore * 0.3) + (freqScore * 0.2));
  }, [letters, tasks, moodTimeline]);

  // Mood frequency calculation
  const moodFrequency = useMemo(() => {
    const freq = {};
    for (const l of letters) {
      let moods = [];
      try {
        moods = decryptLetter(l).moods || [];
      } catch { continue; }
      moods.forEach(mood => {
        freq[mood] = (freq[mood] || 0) + 1;
      });
    }
    return freq;
  }, [letters]);

  // Find the most frequent mood
  const mostFrequentMood = useMemo(() => {
    let max = 0, mood = null;
    for (const [k, v] of Object.entries(moodFrequency)) {
      if (v > max) { max = v; mood = k; }
    }
    return mood;
  }, [moodFrequency]);

  // Radar chart data for top values/goals
  const radarData = useMemo(() => {
    const top = topWords.slice(0, 5);
    return {
      labels: top.map(([word]) => word.charAt(0).toUpperCase() + word.slice(1)),
      datasets: [
        {
          label: 'Focus on Values/Goals',
          data: top.map(([, count]) => count),
          backgroundColor: 'rgba(110,198,255,0.15)',
          borderColor: '#6EC6FF',
          pointBackgroundColor: '#6EC6FF',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#6EC6FF',
        },
      ],
    };
  }, [topWords]);

  // Example advanced AI insight (mocked)
  const aiFeedback = 'This week, your letters showed increased hope and reflection.';

  const { spotlightRefs } = useContext(SpotlightTourContext) || {};

  return (
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 100%)',
      py: 6,
    }}>
      <Container maxWidth="lg">
        <Fade in={show} timeout={1200}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: 'primary.main', letterSpacing: 1, textAlign: 'center' }}>
              GrowthLens: Your Emotional & Personal Growth Journey
            </Typography>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 6, mb: 4, boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)' }}>
              <Typography variant="h6">Word Cloud (Values & Goals)</Typography>
              <Box
                ref={spotlightRefs?.growthWordCloud}
                sx={{ height: 220, bgcolor: '#f5f5f5', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', p: 2 }}
              >
                {topWords.length === 0 ? (
                  <Typography color="text.secondary">[No words to show yet]</Typography>
                ) : (
                  topWords.map(([word, count], i) => (
                    <span key={word} style={{
                      fontSize: 16 + count * 4,
                      margin: 8,
                      color: `hsl(${(i * 37) % 360}, 70%, 40%)`,
                      fontWeight: 600,
                      opacity: 0.8 + 0.2 * (count / topWords[0][1]),
                      transition: 'all 0.5s',
                      display: 'inline-block',
                      transform: `rotate(${(i % 2 === 0 ? 1 : -1) * (i % 8)}deg)`
                    }}>{word}</span>
                  ))
                )}
              </Box>
            </Paper>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 6, mb: 4, boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)' }}>
              <Typography variant="h6">Emotion Heatmap</Typography>
              <Box sx={{ height: 60, bgcolor: '#f5f5f5', borderRadius: 2, display: 'flex', alignItems: 'center', p: 2, overflowX: 'auto' }}>
                {moodTimeline.length === 0 ? (
                  <Typography color="text.secondary">[No mood data yet]</Typography>
                ) : (
                  moodTimeline.map((entry, i) => (
                    <Tooltip key={i} title={`${entry.date.toLocaleDateString()}: ${entry.mood}`.replace(/\b\w/g, l => l.toUpperCase())}>
                      <Avatar sx={{
                        width: 32,
                        height: 32,
                        bgcolor: MOOD_COLORS[entry.mood] || MOOD_COLORS.neutral,
                        mx: 0.5,
                        border: '2px solid #fff',
                        boxShadow: 1,
                        fontSize: 22,
                      }}>
                        {MOOD_ICONS[entry.mood] || MOOD_ICONS.neutral}
                      </Avatar>
                    </Tooltip>
                  ))
                )}
              </Box>
            </Paper>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 6, mb: 4, boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <BarChartIcon sx={{ mr: 1 }} /> Mood Frequency
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, bgcolor: '#f5f5f5', borderRadius: 2, p: 2, overflowX: 'auto' }}>
                {MOOD_DISPLAY.map(({ key, color }) => {
                  const count = moodFrequency[key] || 0;
                  const isMost = mostFrequentMood === key && count > 0;
                  return (
                    <Tooltip key={key} title={`${key}: ${count} time${count === 1 ? '' : 's'}`.replace(/\b\w/g, l => l.toUpperCase())} arrow>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 40 }}>
                        <Box sx={{
                          width: 28,
                          height: count * 18 + 8,
                          background: color,
                          borderRadius: 2,
                          transition: 'height 0.5s',
                          mb: 1,
                          boxShadow: isMost ? `0 0 12px 2px ${color}` : undefined,
                          outline: isMost ? `2.5px solid ${color}` : undefined,
                        }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: color, mb: 0.5 }}>{key}</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>{count}</Typography>
                      </Box>
                    </Tooltip>
                  );
                })}
                {Object.values(moodFrequency).reduce((a, b) => a + b, 0) === 0 && (
                  <Typography color="text.secondary">[No mood tags yet]</Typography>
                )}
              </Box>
              {mostFrequentMood && (
                <Typography sx={{ mt: 2, textAlign: 'center', fontWeight: 500 }}>
                  Your most frequent mood is <span style={{ color: MOOD_DISPLAY.find(m => m.key === mostFrequentMood)?.color }}>{mostFrequentMood}</span>.
                </Typography>
              )}
            </Paper>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 6, mb: 4, boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                Focus Radar: Your Values & Goals
              </Typography>
              <Box sx={{ height: 320, maxWidth: 480, mx: 'auto' }}>
                <Radar
                  data={radarData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { display: false },
                      tooltip: { enabled: true },
                    },
                    scales: {
                      r: {
                        beginAtZero: true,
                        min: 0,
                        ticks: { stepSize: 1, color: '#888' },
                        pointLabels: { font: { size: 16, weight: 'bold' }, color: '#1976d2' },
                        grid: { color: '#e0f7fa' },
                      },
                    },
                  }}
                />
              </Box>
              <Typography sx={{ mt: 2, textAlign: 'center', color: '#888' }}>
                This chart shows how your writing focuses on different values or goals. A more balanced shape means diverse focus; a spiky shape means strong focus on a few areas.
              </Typography>
            </Paper>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 6, mb: 4, boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)' }}>
              <Typography variant="h6">Growth Score</Typography>
              <Box sx={{ height: 120, bgcolor: '#f5f5f5', borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Box sx={{ position: 'relative', display: 'inline-flex', mb: 1 }}>
                  <svg width="100" height="100">
                    <circle cx="50" cy="50" r="44" fill="#e0f7fa" />
                    <circle
                      cx="50" cy="50" r="44"
                      fill="none"
                      stroke="#6EC6FF"
                      strokeWidth="8"
                      strokeDasharray={2 * Math.PI * 44}
                      strokeDashoffset={2 * Math.PI * 44 * (1 - growthScore / 100)}
                      style={{ transition: 'stroke-dashoffset 1s' }}
                    />
                  </svg>
                  <Typography variant="h2" color="primary" sx={{ fontWeight: 700, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -55%)', fontSize: '2.5rem' }}>{growthScore}</Typography>
                </Box>
                <Typography color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Your growth score reflects your mood trend, goal completion, and journaling consistency.
                </Typography>
              </Box>
            </Paper>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 6, mb: 4, boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)' }}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                AI Reflections & Insights
                {!isPremium && <LockIcon color="warning" sx={{ ml: 1 }} />}
              </Typography>
              {isPremium ? (
                <Box>
                  <Typography sx={{ mb: 2 }}>{aiFeedback}</Typography>
                  <Typography sx={{ color: '#888' }}>
                    (Premium) Burnout/anxiety detection, NLP mood predictions, and more coming soon!
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', color: '#888' }}>
                  <Typography sx={{ mb: 2 }}>Upgrade to Premium to unlock smart mental health analytics, weekly AI feedback, and deeper emotional trends.</Typography>
                  <Button variant="contained" color="warning" onClick={() => setPremiumPromptOpen(true)} startIcon={<LockIcon />}>Go Premium</Button>
                </Box>
              )}
            </Paper>
          </Box>
        </Fade>
      </Container>
      <Dialog open={premiumPromptOpen} onClose={() => setPremiumPromptOpen(false)}>
        <DialogTitle>Premium Feature</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LockIcon color="warning" sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 700 }}>AI Reflections & Insights</Typography>
          </Box>
          <Typography sx={{ mb: 2 }}>
            Upgrade to Premium to unlock advanced analytics, weekly AI feedback, and more.
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

export default GrowthLens; 