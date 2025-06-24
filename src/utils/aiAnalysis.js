import Sentiment from 'sentiment';

import { format } from 'date-fns';

// Initialize sentiment analyzer
const analyzer = new Sentiment();

// Analyze emotional tone of text
export const analyzeEmotionalTone = (text) => {
  const analysis = analyzer.analyze(text);
  
  // Calculate emotional dimensions
  const score = analysis.score;
  const intensity = Math.abs(score) / 5; // Normalize to 0-1
  const positivity = (score + 5) / 10; // Normalize to 0-1
  
  // Determine primary emotion
  let primaryEmotion = 'neutral';
  if (score > 2) primaryEmotion = 'joy';
  else if (score > 0) primaryEmotion = 'contentment';
  else if (score < -2) primaryEmotion = 'sadness';
  else if (score < 0) primaryEmotion = 'anxiety';

  return {
    score,
    intensity,
    positivity,
    primaryEmotion,
    words: analysis.words,
    positive: analysis.positive,
    negative: analysis.negative
  };
};

// Generate insights based on emotional patterns
export const generateInsights = (letters) => {
  if (!letters || letters.length === 0) return [];

  const analyses = letters.map(letter => ({
    ...analyzeEmotionalTone(letter.content),
    date: new Date(letter.date)
  }));

  // Calculate trends
  const recentAnalyses = analyses.slice(-5);
  const emotionalTrend = recentAnalyses.reduce((sum, a) => sum + a.score, 0) / recentAnalyses.length;
  
  const insights = [];

  // Analyze emotional patterns
  if (emotionalTrend > 1) {
    insights.push({
      type: 'positive',
      title: 'Positive Trend',
      message: 'Your recent entries show a positive emotional trend. Keep up the great work!'
    });
  } else if (emotionalTrend < -1) {
    insights.push({
      type: 'support',
      title: 'Support Note',
      message: 'I notice you\'ve been feeling down lately. Consider reaching out to someone you trust or trying some self-care activities.'
    });
  }

  // Analyze writing patterns
  const writingFrequency = analyses.length > 1 
    ? (analyses[analyses.length - 1].date - analyses[0].date) / analyses.length 
    : 0;

  if (writingFrequency > 0) {
    insights.push({
      type: 'habit',
      title: 'Writing Habit',
      message: `You write approximately every ${Math.round(writingFrequency / (1000 * 60 * 60 * 24))} days. Regular journaling can improve mental well-being!`
    });
  }

  // Find common themes
  const allWords = analyses.flatMap(a => [...a.positive, ...a.negative]);
  const wordFrequency = allWords.reduce((acc, word) => {
    acc[word] = (acc[word] || 0) + 1;
    return acc;
  }, {});

  const topThemes = Object.entries(wordFrequency)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 3)
    .map(([word]) => word);

  if (topThemes.length > 0) {
    insights.push({
      type: 'theme',
      title: 'Common Themes',
      message: `You often write about: ${topThemes.join(', ')}. These seem to be important aspects of your life.`
    });
  }

  return insights;
};

// Generate personalized writing prompts
export const generatePrompt = (previousEntries = []) => {
  const basePrompts = [
    "What made you smile today?",
    "What's a challenge you're proud of overcoming?",
    "What's something you're looking forward to?",
    "What's a small thing you're grateful for?",
    "What would you tell your younger self?",
    "What's a dream you'd like to pursue?",
    "What's a recent lesson you've learned?",
    "Who has positively influenced you lately?",
    "What's a goal you're working towards?",
    "What brings you peace?",
  ];

  if (!previousEntries || previousEntries.length === 0) {
    return basePrompts[Math.floor(Math.random() * basePrompts.length)];
  }

  // Analyze recent entries for personalization
  const recentAnalysis = analyzeEmotionalTone(previousEntries[previousEntries.length - 1].content);

  // Personalize prompts based on emotional state
  if (recentAnalysis.score < -1) {
    return [
      "What's a small victory you had today?",
      "Name three things that brought you comfort recently.",
      "What's a positive change you'd like to make?",
      "Who could you reach out to for support?",
      "What activities help you feel better?",
    ][Math.floor(Math.random() * 5)];
  } else if (recentAnalysis.score > 1) {
    return [
      "How can you share your positive energy with others?",
      "What's contributing to your good mood?",
      "What's a way you could build on this positive momentum?",
      "How can you maintain these good feelings?",
      "What's something you're excited about?",
    ][Math.floor(Math.random() * 5)];
  }

  return basePrompts[Math.floor(Math.random() * basePrompts.length)];
};

// Get growth metrics
export const getGrowthMetrics = (letters) => {
  if (!letters || letters.length === 0) return null;

  const analyses = letters.map(letter => ({
    ...analyzeEmotionalTone(letter.content),
    date: new Date(letter.date)
  }));

  // Calculate metrics
  const averageScore = analyses.reduce((sum, a) => sum + a.score, 0) / analyses.length;
  const positiveEntries = analyses.filter(a => a.score > 0).length;
  const totalEntries = analyses.length;
  const positivityRate = (positiveEntries / totalEntries) * 100;

  // Get monthly averages for trend
  const monthlyAverages = analyses.reduce((acc, analysis) => {
    const monthKey = format(analysis.date, 'yyyy-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = { sum: 0, count: 0 };
    }
    acc[monthKey].sum += analysis.score;
    acc[monthKey].count += 1;
    return acc;
  }, {});

  const trend = Object.entries(monthlyAverages)
    .map(([month, data]) => ({
      month,
      average: data.sum / data.count
    }))
    .sort((a, b) => new Date(a.month) - new Date(b.month));

  return {
    averageScore,
    positivityRate,
    totalEntries,
    trend,
    commonThemes: analyses
      .flatMap(a => [...a.positive, ...a.negative])
      .reduce((acc, word) => {
        acc[word] = (acc[word] || 0) + 1;
        return acc;
      }, {})
  };
}; 
