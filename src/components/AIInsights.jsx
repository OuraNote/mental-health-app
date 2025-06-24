import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, Chip } from '@mui/material';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { format } from 'date-fns';
import { useAppStore } from '../store';
import { generateInsights, getGrowthMetrics, generatePrompt } from '../utils/aiAnalysis';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import CreateIcon from '@mui/icons-material/Create';

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

const AIInsights = () => {
  const letters = useAppStore(state => state.letters);
  const [insights, setInsights] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (letters) {
      // Generate insights and metrics
      const newInsights = generateInsights(letters);
      const newMetrics = getGrowthMetrics(letters);
      const newPrompt = generatePrompt(letters);

      setInsights(newInsights);
      setMetrics(newMetrics);
      setPrompt(newPrompt);
      setLoading(false);
    }
  }, [letters]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  const chartData = metrics?.trend ? {
    labels: metrics.trend.map(t => format(new Date(t.month), 'MMM yyyy')),
    datasets: [
      {
        label: 'Emotional Score',
        data: metrics.trend.map(t => t.average),
        borderColor: '#6EC6FF',
        backgroundColor: 'rgba(110, 198, 255, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  } : null;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Your Emotional Journey'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Emotional Score'
        }
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        AI Insights
      </Typography>

      {/* Metrics Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <TrendingUpIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Positivity Rate</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {metrics?.positivityRate.toFixed(1)}%
              </Typography>
              <Typography variant="body2" color="text.secondary">
                of your entries are positive
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <AutoGraphIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Total Entries</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {metrics?.totalEntries || 0}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                letters written so far
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <EmojiObjectsIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Average Mood</Typography>
              </Box>
              <Typography variant="h4" color="primary">
                {metrics?.averageScore.toFixed(1)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                emotional score average
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Emotional Journey Chart */}
      {chartData && (
        <Card elevation={2} sx={{ mb: 4, p: 2 }}>
          <Line data={chartData} options={chartOptions} />
        </Card>
      )}

      {/* AI Generated Insights */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Personal Insights
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {insights.map((insight, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h6" color="primary" gutterBottom>
                  {insight.title}
                </Typography>
                <Typography variant="body1">
                  {insight.message}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Writing Prompt */}
      <Card elevation={2} sx={{ mb: 4, bgcolor: 'primary.light', color: 'primary.contrastText' }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <CreateIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Today's Writing Prompt</Typography>
          </Box>
          <Typography variant="h5">
            {prompt}
          </Typography>
        </CardContent>
      </Card>

      {/* Common Themes */}
      {metrics?.commonThemes && (
        <Box>
          <Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
            Common Themes in Your Writing
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {Object.entries(metrics.commonThemes)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10)
              .map(([theme, count]) => (
                <Chip
                  key={theme}
                  label={`${theme} (${count})`}
                  color="primary"
                  variant="outlined"
                />
              ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AIInsights; 
