import Sentiment from 'sentiment';

const sentiment = new Sentiment();

// Define emotion categories and their associated keywords
const emotionCategories = {
  joy: ['happy', 'joy', 'excited', 'delighted', 'cheerful', 'pleased'],
  sadness: ['sad', 'depressed', 'unhappy', 'miserable', 'gloomy', 'down'],
  anger: ['angry', 'furious', 'annoyed', 'irritated', 'frustrated'],
  fear: ['afraid', 'scared', 'anxious', 'worried', 'nervous', 'terrified'],
  love: ['love', 'adore', 'cherish', 'affection', 'fond'],
  hope: ['hope', 'optimistic', 'positive', 'looking forward', 'excited'],
  calm: ['calm', 'peaceful', 'relaxed', 'serene', 'tranquil'],
  gratitude: ['thankful', 'grateful', 'appreciate', 'blessed'],
};

export async function analyzeSentiment(text) {
  // Calculate base sentiment score
  const result = sentiment.analyze(text);
  const sentimentScore = result.score;

  // Analyze emotion categories
  const emotionScores = {};
  let totalEmotionScore = 0;

  Object.entries(emotionCategories).forEach(([emotion, keywords]) => {
    const score = keywords.reduce((acc, keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      return acc + (matches ? matches.length : 0);
    }, 0);

    emotionScores[emotion] = score;
    totalEmotionScore += score;
  });

  // Calculate emotion percentages
  const emotionPercentages = {};
  Object.entries(emotionScores).forEach(([emotion, score]) => {
    emotionPercentages[emotion] = totalEmotionScore > 0
      ? Math.round((score / totalEmotionScore) * 100)
      : 0;
  });

  // Determine primary mood
  const primaryMood = Object.entries(emotionPercentages)
    .reduce((max, [emotion, percentage]) =>
      percentage > max.percentage ? { emotion, percentage } : max,
      { emotion: 'neutral', percentage: 0 }
    );

  // Calculate confidence based on sentiment score and emotion detection
  const confidence = Math.min(
    Math.round(
      (Math.abs(sentimentScore) * 50 + totalEmotionScore * 10)
    ),
    100
  );

  return {
    mood: primaryMood.emotion,
    confidence,
    sentimentScore,
    emotionBreakdown: emotionPercentages,
  };
} 