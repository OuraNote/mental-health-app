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

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function Timeline() {
  const letters = useAppStore(state => state.letters);
  const [chartData, setChartData] = useState(null);
  const [show, setShow] = useState(false);
  const { spotlightRefs } = useContext(SpotlightTourContext) || {};

  useState(() => { setTimeout(() => setShow(true), 200); }, []);

  useEffect(() => {
    if (letters.length > 0) {
      const processLetters = async () => {
        try {
          const processedLetters = await Promise.all(
            letters.map(async (letter) => {
              const decrypted = decryptLetter(letter);
              return {
                date: new Date(decrypted.createdAt),
                sentiment: decrypted.sentiment,
              };
            })
          );

          // Sort letters by date
          processedLetters.sort((a, b) => a.date - b.date);

          // Prepare chart data
          const labels = processedLetters.map(letter =>
            letter.date.toLocaleDateString()
          );

          const sentimentData = processedLetters.map(letter =>
            letter.sentiment.sentimentScore
          );

          const emotionData = {
            joy: processedLetters.map(letter =>
              letter.sentiment.emotionBreakdown.joy || 0
            ),
            sadness: processedLetters.map(letter =>
              letter.sentiment.emotionBreakdown.sadness || 0
            ),
            hope: processedLetters.map(letter =>
              letter.sentiment.emotionBreakdown.hope || 0
            ),
          };

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
              {
                label: 'Joy',
                data: emotionData.joy,
                borderColor: '#FFD54F',
                backgroundColor: 'rgba(255,213,79,0.10)',
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#FFD54F',
              },
              {
                label: 'Sadness',
                data: emotionData.sadness,
                borderColor: '#FF8A65',
                backgroundColor: 'rgba(255,138,101,0.10)',
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#FF8A65',
              },
              {
                label: 'Hope',
                data: emotionData.hope,
                borderColor: '#A5D6A7',
                backgroundColor: 'rgba(165,214,167,0.10)',
                tension: 0.3,
                pointRadius: 4,
                pointBackgroundColor: '#A5D6A7',
              },
            ],
          });
        } catch (error) {
          console.error('Error processing letters:', error);
        }
      };

      processLetters();
    }
  }, [letters]);

  // Quick stats
  const totalLetters = letters.length;
  const avgSentiment = chartData && chartData.datasets[0].data.length > 0
    ? (chartData.datasets[0].data.reduce((a, b) => a + b, 0) / chartData.datasets[0].data.length).toFixed(2)
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
      background: 'linear-gradient(135deg, #e0f7fa 0%, #f3e5f5 100%)',
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
                  <Typography variant="h6" color="primary" sx={{ mb: 1 }}>Total Letters: {totalLetters}</Typography>
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
                              beginAtZero: true,
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
                            title: {
                              display: true,
                              text: 'Your Emotional Journey Over Time',
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
            <Paper elevation={6} sx={{ p: 4, borderRadius: 6, mb: 4, boxShadow: '0 8px 32px 0 rgba(110,198,255,0.10)' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>Insights</Typography>
              <Typography paragraph>
                This timeline shows your emotional journey through your letters. The lines represent:
              </Typography>
              <ul>
                <li>
                  <Typography>
                    <strong>Overall Sentiment:</strong> The general emotional tone of your letters
                  </Typography>
                </li>
                <li>
                  <Typography>
                    <strong>Joy:</strong> Moments of happiness and positivity
                  </Typography>
                </li>
                <li>
                  <Typography>
                    <strong>Sadness:</strong> Periods of melancholy or reflection
                  </Typography>
                </li>
                <li>
                  <Typography>
                    <strong>Hope:</strong> Expressions of optimism and future aspirations
                  </Typography>
                </li>
              </ul>
            </Paper>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}

export default Timeline; 