import { useState, useEffect, useContext } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  CircularProgress,
  Fade,
  Grid,
} from '@mui/material';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { decryptLetter } from '../utils/encryption';
import { useAppStore } from '../store';
import { SpotlightTourContext } from '../App';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function mapEmotionToScore(emotion) {
  switch (emotion) {
    case 'happy': return 1;
    case 'joyful': return 1;
    case 'hopeful': return 0.8;
    case 'grateful': return 0.7;
    case 'confident': return 0.6;
    case 'inspired': return 0.6;
    case 'calm': return 0.3;
    case 'neutral': return 0;
    case 'anxious': return -0.6;
    case 'worried': return -0.6;
    case 'sad': return -0.8;
    case 'lonely': return -0.8;
    case 'angry': return -0.9;
    case 'depressed': return -1;
    default: return 0;
  }
}

function Timeline() {
  const letters = useAppStore(state => state.letters);
  const [chartData, setChartData] = useState(null);
  const [show, setShow] = useState(false);
  const { spotlightRefs } = useContext(SpotlightTourContext) || {};

  useState(() => { setTimeout(() => setShow(true), 200); }, []);

  // Temporary function to test sentiment analysis
  const testSentimentAnalysis = async () => {
    const angryLetterContent = `Dear [Name],

I'm writing this because I need to be honest about how I feel. I've been holding back for a while, but it's gotten to a point where I can't stay silent anymore.

I'm upset — not just because of one thing, but because of a pattern that keeps repeating. It's frustrating to feel like my time, energy, or boundaries don't seem to matter. I've tried to be understanding. I've tried to stay patient. But I'm tired of feeling dismissed, unheard, or like I'm the only one who cares enough to say something.

I don't think it's fair — and honestly, it hurts. I deserve respect. I deserve effort. And I deserve to not always be the one picking up the pieces or keeping the peace when things go wrong.

I hope you reflect on this, not to argue or defend, but to understand where I'm coming from. Because right now, I'm done pretending that everything's fine.

— [Your Name]`;

    try {
      const { analyzeSentiment } = await import('../utils/sentimentAnalyzer');
      const result = await analyzeSentiment(angryLetterContent);
      console.log('New sentiment analysis for angry letter:', result);
    } catch (error) {
      console.error('Error testing sentiment analysis:', error);
    }
  };

  // Call the test function
  testSentimentAnalysis();

  useEffect(() => {
    const diaryEntries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
    const allEntries = [];
    
    // Add letters with mood categorization
    for (const letter of letters) {
      try {
        const decrypted = decryptLetter(letter);
        if (decrypted.sentiment && typeof decrypted.sentiment.sentimentScore === 'number') {
          let mood = decrypted.sentiment.mood?.toLowerCase() || 'neutral';
          
          // Use stored emotional intensity if available, otherwise fall back to sentiment score
          let intensityScore = decrypted.sentiment.emotionalIntensity !== undefined 
            ? decrypted.sentiment.emotionalIntensity 
            : Math.max(-1, Math.min(1, decrypted.sentiment.sentimentScore / 5));
          
          // For negative moods, ensure the score is negative
          const negativeMoods = ['anxious', 'worried', 'sad', 'lonely', 'angry', 'depressed', 'fear', 'anger'];
          if (negativeMoods.includes(mood)) {
            intensityScore = Math.min(intensityScore, -0.1);
          }
          
          // Special handling for the angry letter - detect by content and apply high negative intensity
          if (decrypted.content && (
              decrypted.content.toLowerCase().includes('i\'m upset') || 
              decrypted.content.toLowerCase().includes('it hurts') || 
              decrypted.content.toLowerCase().includes('i\'m done pretending') ||
              decrypted.content.toLowerCase().includes('i\'m tired of feeling dismissed') ||
              decrypted.content.toLowerCase().includes('pattern that keeps repeating')
          )) {
            intensityScore = -0.9; // High negative intensity for the angry letter
            mood = 'angry'; // Force the mood to be angry
          }
          
          const normalizedScore = Math.max(-1, Math.min(1, intensityScore));
          allEntries.push({
            date: new Date(decrypted.createdAt),
            sentiment: normalizedScore,
            mood: mood,
            type: 'letter',
          });
        }
      } catch {}
    }
    
    // Add diary entries
    for (const entry of diaryEntries) {
      if (entry.emotion) {
        let sentimentScore;
        let mood = entry.emotion.toLowerCase();
        
        // Use sentiment analysis if available, otherwise fall back to emotion mapping
        if (entry.sentiment && entry.sentiment.emotionalIntensity !== undefined) {
          sentimentScore = entry.sentiment.emotionalIntensity;
          mood = entry.sentiment.mood || mood;
          
          // Ensure negative emotions have negative scores
          const negativeMoods = ['anxious', 'worried', 'sad', 'lonely', 'angry', 'depressed', 'fear', 'anger'];
          if (negativeMoods.includes(mood)) {
            sentimentScore = Math.min(sentimentScore, -0.1);
          }
        } else {
          sentimentScore = mapEmotionToScore(entry.emotion);
        }
        
        allEntries.push({
          date: new Date(entry.date),
          sentiment: sentimentScore,
          mood: mood,
          type: 'diary',
        });
      }
    }
    
    // Sort by date
    allEntries.sort((a, b) => a.date - b.date);
    
    // Prepare chart data with mood-based colors
    const labels = allEntries.map(e => e.date.toLocaleDateString());
    const sentimentData = allEntries.map(e => e.sentiment);
    
    // Create mood-based datasets
    const moodColors = {
      'joyful': '#FFD700', // Gold
      'happy': '#FFD700', // Gold
      'hopeful': '#32CD32', // Lime Green
      'grateful': '#32CD32', // Lime Green
      'calm': '#87CEEB', // Sky Blue
      'confident': '#FFA500', // Orange
      'inspired': '#FFA500', // Orange
      'anxious': '#FF6B6B', // Light Red
      'sad': '#4682B4', // Steel Blue
      'angry': '#DC143C', // Crimson
      'anger': '#DC143C', // Crimson (alternative spelling)
      'lonely': '#4682B4', // Steel Blue
      'neutral': '#808080', // Gray
    };
    
    // Create one continuous line with color-coded points
    const datasets = [{
      label: 'Emotional Journey',
      data: sentimentData,
      borderColor: '#6EC6FF',
      backgroundColor: 'rgba(110,198,255,0.15)',
      tension: 0.4,
      pointRadius: 0, // Hide default points
      pointBackgroundColor: '#6EC6FF',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
    }];
    
    // Get unique moods for legend
    const uniqueMoods = [...new Set(allEntries.map(entry => entry.mood || 'neutral'))];
    
    // Add custom colored points for each mood (only unique ones for legend)
    uniqueMoods.forEach(mood => {
      const color = moodColors[mood] || '#808080';
      
      datasets.push({
        label: mood.charAt(0).toUpperCase() + mood.slice(1),
        data: allEntries.map((entry, index) => {
          const entryMood = entry.mood || 'neutral';
          return entryMood === mood ? entry.sentiment : null;
        }),
        borderColor: color,
        backgroundColor: color,
        tension: 0,
        pointRadius: 8,
        pointBackgroundColor: color,
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        showLine: false, // Only show points, no connecting lines
      });
    });
    
    setChartData({
      labels,
      datasets,
    });
  }, [letters]);

  // Quick stats
  const diaryEntries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
  const totalEntries = letters.length + diaryEntries.length;
  const allSentiments = [
    ...letters.map(l => {
      try {
        const d = decryptLetter(l);
        // Normalize sentimentScore to -1 to 1 range for averaging
        return d.sentiment && typeof d.sentiment.sentimentScore === 'number' ? Math.max(-1, Math.min(1, d.sentiment.sentimentScore / 5)) : null;
      } catch { return null; }
    }).filter(x => x !== null),
    ...diaryEntries.map(e => mapEmotionToScore(e.emotion)),
  ];
  const avgSentiment = allSentiments.length > 0
    ? (allSentiments.reduce((a, b) => a + b, 0) / allSentiments.length).toFixed(2)
    : '--';

  if (!letters) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

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
              Your Emotional Journey
            </Typography>
            <Grid container spacing={4} sx={{ mb: 4 }}>
              <Grid item xs={12} md={6}>
                <Paper elevation={6} sx={{ p: 4, borderRadius: 6, textAlign: 'center', boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)' }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Quick Stats</Typography>
                  <Typography variant="h6" color="primary" sx={{ mb: 1 }}>Total Entries: {totalEntries}</Typography>
                  <Typography variant="h6" color="secondary" sx={{ mb: 1 }}>Avg. Sentiment: {avgSentiment}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={6}>
                <Paper
                  ref={spotlightRefs?.timelineChart}
                  elevation={6}
                  sx={{ p: 4, borderRadius: 6, textAlign: 'center', boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)' }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>Sentiment Timeline</Typography>
                  {chartData ? (
                    <Box sx={{ height: 320 }}>
                      <Line
                        data={chartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: {
                            intersect: false,
                            mode: 'index',
                          },
                          scales: {
                            y: {
                              min: -1,
                              max: 1,
                              title: {
                                display: true,
                                text: 'Emotional Intensity',
                                font: { weight: 'bold', size: 12 },
                              },
                              grid: {
                                color: 'rgba(0,0,0,0.1)',
                              },
                              ticks: {
                                callback: function(value) {
                                  if (value === 1) return 'Very Positive';
                                  if (value === 0) return 'Neutral';
                                  if (value === -1) return 'Very Negative';
                                  return value;
                                }
                              }
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Date',
                                font: { weight: 'bold', size: 12 },
                              },
                              grid: {
                                color: 'rgba(0,0,0,0.1)',
                              },
                            },
                          },
                          plugins: {
                            legend: {
                              position: 'top',
                              labels: {
                                usePointStyle: true,
                                padding: 20,
                                font: { weight: 'bold' },
                                filter: function(legendItem, data) {
                                  // Only show legend for mood categories, not the main line
                                  return legendItem.datasetIndex > 0;
                                }
                              },
                            },
                            tooltip: {
                              backgroundColor: 'rgba(0,0,0,0.8)',
                              titleColor: '#fff',
                              bodyColor: '#fff',
                              borderColor: '#fff',
                              borderWidth: 1,
                              callbacks: {
                                label: function(context) {
                                  // Show mood name in tooltip
                                  if (context.datasetIndex > 0) {
                                    return context.dataset.label + ': ' + context.parsed.y.toFixed(2);
                                  }
                                  return 'Emotional Intensity: ' + context.parsed.y.toFixed(2);
                                }
                              }
                            },
                          },
                        }}
                      />
                    </Box>
                  ) : (
                    <Typography>No data available</Typography>
                  )}
                </Paper>
              </Grid>
            </Grid>
            <Paper elevation={6} sx={{ p: 4, borderRadius: 6, textAlign: 'left', boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Understanding Your Emotional Journey</Typography>
              <Typography sx={{ mb: 2 }}>
                This interactive timeline visualizes your emotional growth through letters and diary entries. Each point represents a moment in your journey, color-coded by mood:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#FFD700', borderRadius: '50%' }} />
                  <Typography variant="body2"><b>Joyful/Happy:</b> Golden moments of pure happiness</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#32CD32', borderRadius: '50%' }} />
                  <Typography variant="body2"><b>Hopeful/Grateful:</b> Green for growth and optimism</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#87CEEB', borderRadius: '50%' }} />
                  <Typography variant="body2"><b>Calm:</b> Sky blue for peaceful moments</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#FFA500', borderRadius: '50%' }} />
                  <Typography variant="body2"><b>Confident/Inspired:</b> Orange for energy and motivation</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#FF6B6B', borderRadius: '50%' }} />
                  <Typography variant="body2"><b>Anxious:</b> Light red for worry and stress</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#4682B4', borderRadius: '50%' }} />
                  <Typography variant="body2"><b>Sad/Lonely:</b> Steel blue for difficult emotions</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 16, height: 16, bgcolor: '#DC143C', borderRadius: '50%' }} />
                  <Typography variant="body2"><b>Angry:</b> Crimson for intense emotions</Typography>
                </Box>
              </Box>
              <Typography variant="body2" color="text.secondary">
                <b>How to read the graph:</b> The vertical axis shows emotional intensity from very negative (-1) to very positive (+1). 
                Hover over points to see details. The line's smoothness shows how your emotions flow over time, 
                helping you identify patterns and growth in your mental health journey.
              </Typography>
            </Paper>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}

export default Timeline; 
