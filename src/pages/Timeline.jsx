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
    case 'calm': return 0.5;
    case 'neutral': return 0;
    case 'sad': return -1;
    case 'angry': return -0.8;
    default: return 0;
  }
}

function Timeline() {
  const letters = useAppStore(state => state.letters);
  const [chartData, setChartData] = useState(null);
  const [show, setShow] = useState(false);
  const { spotlightRefs } = useContext(SpotlightTourContext) || {};

  useState(() => { setTimeout(() => setShow(true), 200); }, []);

  useEffect(() => {
    const diaryEntries = JSON.parse(localStorage.getItem('diaryEntries') || '[]');
    const allEntries = [];
    // Add letters
    for (const letter of letters) {
      try {
        const decrypted = decryptLetter(letter);
        if (decrypted.sentiment && typeof decrypted.sentiment.sentimentScore === 'number') {
          // Normalize sentimentScore to -1 to 1 range (assuming -5 to 5 is the possible range)
          const normalizedScore = Math.max(-1, Math.min(1, decrypted.sentiment.sentimentScore / 5));
          allEntries.push({
            date: new Date(decrypted.createdAt),
            sentiment: normalizedScore,
            type: 'letter',
          });
        }
      } catch {}
    }
    // Add diary entries
    for (const entry of diaryEntries) {
      if (entry.emotion) {
        allEntries.push({
          date: new Date(entry.date),
          sentiment: mapEmotionToScore(entry.emotion),
          type: 'diary',
        });
      }
    }
    // Sort by date
    allEntries.sort((a, b) => a.date - b.date);
    // Prepare chart data
    const labels = allEntries.map(e => e.date.toLocaleDateString());
    const sentimentData = allEntries.map(e => e.sentiment);
    setChartData({
      labels,
      datasets: [
        {
          label: 'Overall Sentiment',
          data: sentimentData,
          borderColor: '#6EC6FF',
          backgroundColor: 'rgba(110,198,255,0.15)',
          tension: 0.3,
          pointRadius: 5,
          pointBackgroundColor: '#6EC6FF',
        },
      ],
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
                          scales: {
                            y: {
                              min: -1,
                              max: 1,
                              title: {
                                display: true,
                                text: 'Emotional Intensity',
                              },
                            },
                            x: {
                              title: {
                                display: true,
                                text: 'Date',
                              },
                            },
                          },
                          plugins: {
                            legend: {
                              position: 'top',
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
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Insights</Typography>
              <Typography>
                This timeline shows your emotional journey through your letters and diary entries. The lines represent:
              </Typography>
              <ul>
                <li><b>Overall Sentiment</b>: The general emotional tone of your letters and diary entries</li>
                <li><b>Joy</b>: Moments of happiness and positivity</li>
                <li><b>Sadness</b>: Periods of melancholy or reflection</li>
                <li><b>Hope</b>: Expressions of optimism and future aspirations</li>
              </ul>
            </Paper>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}

export default Timeline; 
