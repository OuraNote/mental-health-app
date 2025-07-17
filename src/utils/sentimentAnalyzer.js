import Sentiment from 'sentiment';
import { stemmer } from 'porter-stemmer';

const sentiment = new Sentiment();

// Define emotion categories and their associated keywords with weights
const emotionCategories = {
  joy: [['happy', 2], ['joy', 3], ['excited', 3], ['delighted', 3], ['cheerful', 2], ['pleased', 2], ['grateful', 2], ['thankful', 2], ['blessed', 2], ['thriving', 3], ['beautiful', 2], ['lighter', 2], ['connected', 2], ['grounded', 2], ['happier', 3], ['proud', 2], ['thriving', 3], ['beautiful', 2], ['calm', 2], ['peace', 2], ['balance', 2], ['excited', 3]],
  sadness: [['sad', 1], ['depressed', 2], ['unhappy', 1], ['miserable', 3], ['gloomy', 2], ['down', 1], ['overwhelming', 1], ['setback', 1], ['struggling', 1]],
  anger: [['angry', 2], ['furious', 3], ['annoyed', 1], ['irritated', 1], ['frustrated', 2], ['upset', 2], ['tired', 1], ['dismissed', 2], ['unheard', 2], ['unfair', 2], ['hurt', 2], ['done', 2], ['exhausted', 2]],
  fear: [['afraid', 1], ['scared', 1], ['anxious', 2], ['worried', 1], ['nervous', 1], ['terrified', 3]],
  love: [['love', 2], ['adore', 2], ['cherish', 2], ['affection', 1], ['fond', 1]],
  hope: [['hope', 1], ['optimistic', 2], ['positive', 1], ['looking forward', 1], ['excited', 2]],
  calm: [['calm', 1], ['peaceful', 2], ['relaxed', 1], ['serene', 2], ['tranquil', 2]],
  gratitude: [['thankful', 1], ['grateful', 2], ['appreciate', 1], ['blessed', 2]],
  confident: [
    ['resilience', 3], ['vision', 2], ['capacity', 2], ['create', 1], ['powerful', 2], ['personal', 1], ['lead', 2], ['finish', 2], ['confidence', 3], ['clarity', 2], ['values', 2], ['goals', 2], ['purpose', 2], ['pride', 2], ['focused', 2], ['overcome', 2], ['not afraid', 2], ['break down', 1], ['keep pushing', 2], ['determined', 2], ['strength', 2], ['achievement', 2], ['ambition', 2], ['persistent', 2], ['courage', 2], ['fearless', 2], ['motivated', 2], ['drive', 2], ['success', 2]
  ]
};

export async function analyzeSentiment(text) {
  // Tokenize and stem the input text
  const tokens = text.toLowerCase().split(/\W+/).filter(Boolean);
  const stemmedTokens = tokens.map(token => stemmer(token));

  // Calculate base sentiment score
  const result = sentiment.analyze(text);
  const sentimentScore = result.score;

  // Analyze emotion categories with weights and stemming
  const emotionScores = {};
  let totalEmotionScore = 0;

  Object.entries(emotionCategories).forEach(([emotion, keywords]) => {
    const score = keywords.reduce((acc, [keyword, weight]) => {
      const stemmedKeyword = stemmer(keyword);
      const matches = stemmedTokens.filter(token => token === stemmedKeyword);
      return acc + (matches.length * weight);
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

  // Add a neutral fallback if the primary mood is weak
  let mood = primaryMood.percentage < 35 ? 'neutral' : primaryMood.emotion;
  
  // Special handling for positive emotions - boost detection
  const positiveKeywords = ['happy', 'joy', 'excited', 'delighted', 'grateful', 'thankful', 'blessed', 'thriving', 'beautiful', 'lighter', 'connected', 'grounded', 'happier', 'proud', 'calm', 'peace', 'balance'];
  const hasPositiveKeywords = positiveKeywords.some(keyword => text.toLowerCase().includes(keyword));
  
  if (hasPositiveKeywords && mood === 'neutral') {
    mood = 'happy';
  }

  // Calculate emotional intensity based on language patterns
  let emotionalIntensity = 0;
  
  // Analyze intensity indicators
  const intensityIndicators = {
    high: ['amazing', 'incredible', 'fantastic', 'wonderful', 'excellent', 'perfect', 'best', 'love', 'adore', 'ecstatic', 'thrilled', 'overjoyed', 'elated', 'euphoric', 'blissful', 'radiant', 'vibrant', 'energized', 'passionate', 'enthusiastic'],
    medium: ['good', 'nice', 'pleasant', 'enjoyable', 'satisfied', 'content', 'happy', 'glad', 'pleased', 'comfortable', 'relaxed', 'calm', 'peaceful', 'serene', 'tranquil'],
    low: ['okay', 'fine', 'alright', 'decent', 'manageable', 'tolerable', 'acceptable', 'adequate', 'sufficient', 'moderate', 'mild', 'gentle', 'subtle', 'quiet', 'soft']
  };

  // High intensity negative indicators
  const highIntensityNegative = [
    'furious', 'enraged', 'livid', 'outraged', 'infuriated', 'seething', 'raging', 'incensed', 'irate', 'fuming',
    'devastated', 'crushed', 'heartbroken', 'shattered', 'destroyed', 'overwhelmed', 'desperate', 'hopeless',
    'terrified', 'petrified', 'horrified', 'panicked', 'terrified', 'dread', 'mortified',
    'exhausted', 'drained', 'burned out', 'fed up', 'sick of', 'tired of', 'done with',
    'hurt', 'wounded', 'betrayed', 'abandoned', 'rejected', 'dismissed', 'ignored', 'unheard'
  ];

  const textLower = text.toLowerCase();
  let highIntensityCount = 0;
  let mediumIntensityCount = 0;
  let lowIntensityCount = 0;

  // Count intensity words
  intensityIndicators.high.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) highIntensityCount += matches.length;
  });

  intensityIndicators.medium.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) mediumIntensityCount += matches.length;
  });

  intensityIndicators.low.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) lowIntensityCount += matches.length;
  });

  // Count high intensity negative words
  let highIntensityNegativeCount = 0;
  highIntensityNegative.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    const matches = textLower.match(regex);
    if (matches) highIntensityNegativeCount += matches.length;
  });

  // Calculate intensity score
  const totalIntensityWords = highIntensityCount + mediumIntensityCount + lowIntensityCount + highIntensityNegativeCount;
  if (totalIntensityWords > 0) {
    emotionalIntensity = (highIntensityCount * 3 + mediumIntensityCount * 2 + lowIntensityCount * 1 + highIntensityNegativeCount * 4) / totalIntensityWords;
  }

  // Normalize intensity to 0-1 scale
  emotionalIntensity = Math.min(emotionalIntensity / 4, 1);

  // Adjust intensity based on sentiment score and ensure negative emotions have negative values
  const normalizedSentiment = Math.max(-1, Math.min(1, sentimentScore / 10));
  
  // For negative emotions, ensure the intensity is negative
  const negativeEmotions = ['sad', 'angry', 'anxious', 'worried', 'lonely', 'depressed', 'fear', 'anger'];
  const isNegativeEmotion = negativeEmotions.some(emotion => 
    text.toLowerCase().includes(emotion) || 
    (primaryMood.emotion && negativeEmotions.includes(primaryMood.emotion))
  );
  
  // Special handling for anger - boost intensity
  const hasAngerKeywords = text.toLowerCase().includes('angry') || 
    text.toLowerCase().includes('upset') || 
    text.toLowerCase().includes('furious') ||
    text.toLowerCase().includes('hurt') ||
    text.toLowerCase().includes('dismissed') ||
    text.toLowerCase().includes('unheard');
    
  // Special handling for anger detection
  if (hasAngerKeywords && mood !== 'angry') {
    mood = 'angry';
  }

  // Detect intense negative language patterns
  const intenseNegativePatterns = [
    'i\'m upset', 'i\'m tired', 'i\'m done', 'i\'m exhausted', 'i\'m frustrated',
    'it hurts', 'it\'s frustrating', 'it\'s unfair', 'i deserve', 'i don\'t deserve',
    'holding back', 'can\'t stay silent', 'pattern that keeps repeating',
    'dismissed', 'unheard', 'don\'t seem to matter', 'picking up the pieces',
    'keeping the peace', 'pretending that everything\'s fine',
    'i\'m tired of feeling dismissed', 'i\'m tired of feeling unheard',
    'i deserve respect', 'i deserve effort', 'it\'s gotten to a point',
    'i can\'t stay silent anymore', 'pattern that keeps repeating'
  ];
  
  const hasIntenseNegativePatterns = intenseNegativePatterns.some(pattern => 
    text.toLowerCase().includes(pattern)
  );
  
  if (isNegativeEmotion || hasIntenseNegativePatterns) {
    // For negative emotions or intense negative patterns, make the intensity negative and increase magnitude
    emotionalIntensity = -Math.abs(emotionalIntensity);
    
    // Boost intensity for intense negative patterns
    if (hasIntenseNegativePatterns) {
      emotionalIntensity = Math.max(-1, emotionalIntensity * 1.5);
    }
    
    // Special boost for anger
    if (hasAngerKeywords || primaryMood.emotion === 'anger') {
      emotionalIntensity = Math.max(-1, emotionalIntensity * 2);
    }
  } else {
    // For positive emotions, keep the intensity positive and boost it
    emotionalIntensity = Math.abs(emotionalIntensity);
    
    // Boost intensity for positive emotions
    if (hasPositiveKeywords) {
      emotionalIntensity = Math.min(1, emotionalIntensity * 1.5);
    }
  }
  
  // Combine with sentiment score, but prioritize the calculated intensity for strong emotions
  if (Math.abs(emotionalIntensity) > 0.3) {
    // For strong emotions, let the calculated intensity dominate
    emotionalIntensity = Math.max(-1, Math.min(1, emotionalIntensity * 0.8 + normalizedSentiment * 0.2));
  } else {
    // For weak emotions, use more balanced approach
    emotionalIntensity = Math.max(-1, Math.min(1, (emotionalIntensity + normalizedSentiment) / 2));
  }

  // Calculate confidence with improved logic
  let confidence = Math.min(
    Math.round(
      (Math.min(Math.abs(sentimentScore), 5) * 50 + totalEmotionScore * 10)
    ),
    100
  );
  if (primaryMood.percentage > 50) confidence += 10;
  confidence = Math.min(confidence, 100);

  // Lower confidence if uncertainty words are present
  const lowConfidenceWords = [
    'maybe', 'not sure', 'doubt', 'uncertain', 'second-guess', 'fear', 'try', 'messy', 'slow'
  ];
  const lower = lowConfidenceWords.some(word => text.toLowerCase().includes(word));
  if (lower) confidence = Math.min(confidence, 40);

  return {
    mood,
    confidence,
    sentimentScore,
    emotionalIntensity,
    emotionBreakdown: emotionPercentages,
  };
} 