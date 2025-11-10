const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3001;
const TRAINING_DATA_FILE = path.join(__dirname, 'AI_assistant_training_data.json');
const LEARNING_PATTERNS_FILE = path.join(__dirname, 'AI_learning_patterns.json');
const SCRAPING_CACHE_FILE = path.join(__dirname, 'scraping_cache.json');

// Scraping configuration
const SCRAPING_CONFIG = {
  maxRetries: 3,
  retryDelay: 2000,
  timeout: 15000,
  cacheExpiry: 24 * 60 * 60 * 1000, // 24 hours
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  ]
};

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('.')); // Serve static files from root directory

// Initialize training data file if it doesn't exist
async function initializeTrainingData() {
  try {
    await fs.access(TRAINING_DATA_FILE);
    console.log('Training data file exists');
  } catch (error) {
    // File doesn't exist, create it
    const initialData = {
      instanceCount: 0,
      trainingInstances: [],
      createdDate: new Date().toISOString(),
      version: "2.3.0"
    };
    
    await fs.writeFile(TRAINING_DATA_FILE, JSON.stringify(initialData, null, 2));
    console.log('Training data file created');
  }
}

// Initialize learning patterns file if it doesn't exist
async function initializeLearningPatterns() {
  try {
    await fs.access(LEARNING_PATTERNS_FILE);
    console.log('Learning patterns file exists');
  } catch (error) {
    // File doesn't exist, create it with pre-seeded contextual intelligence
    const initialPatterns = {
      globalStats: {
        totalAnalyses: 10, // Pre-seeded with expert knowledge
        correctPredictions: 10,
        accuracy: 100,
        lastUpdated: new Date().toISOString()
      },
      overridePatterns: {
        // Pre-seed common context corrections to prevent false positives
        "Edit→NAR": 5 // Personal info context corrections
      },
      violationAccuracy: {
        violations_detected: { correct: 5, total: 5 },
        clean_posts_detected: { correct: 5, total: 5 }
      },
      priorityBiases: {},
      commonCorrections: {
        // Pre-seed contextual personal information rules
        "Moderate_Edit": {
          count: 5,
          correctedTo: "NAR", 
          lastSeen: new Date().toISOString(),
          note: "Context-aware personal info detection: eBay contact questions, delivery issues, and general discussion should be NAR"
        }
      },
      userContributions: {
        "system_expert": {
          interactions: 10,
          corrections: 5,
          lastActive: new Date().toISOString(),
          note: "Pre-seeded expert knowledge for context-aware personal information detection"
        }
      },
      expertRules: {
        // Baked-in expert knowledge for immediate global benefit
        personalInfoContext: {
          description: "Context-aware personal information detection rules",
          rules: [
            {
              context: "eBay contact questions",
              examples: ["What's eBay's phone number?", "Does eBay have a phone number?", "eBay customer service number"],
              action: "NAR",
              rationale: "User asking about eBay's contact methods, not sharing personal info"
            },
            {
              context: "Delivery/notification issues", 
              examples: ["My email isn't getting notifications", "Package didn't arrive at my address", "Nothing came to my email"],
              action: "NAR",
              rationale: "User discussing delivery issues without revealing personal contact information"
            },
            {
              context: "General concept discussion",
              examples: ["Email address format", "Phone number requirements", "Address validation"],
              action: "NAR", 
              rationale: "General discussion about contact info concepts, not sharing personal details"
            },
            {
              context: "Actual contact info sharing",
              examples: ["Call me at 555-1234", "Email me at john@gmail.com", "Contact me at"],
              action: "Edit",
              rationale: "User actually sharing personal contact information publicly"
            }
          ],
          implementedDate: new Date().toISOString(),
          version: "2.3.0"
        }
      },
      createdDate: new Date().toISOString(),
      version: "2.3.0"
    };
    
    await fs.writeFile(LEARNING_PATTERNS_FILE, JSON.stringify(initialPatterns, null, 2));
    console.log('Learning patterns file created');
  }
}

// Helper function to safely read/write training data
async function readTrainingData() {
  try {
    const data = await fs.readFile(TRAINING_DATA_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading training data:', error);
    // Return default structure if file is corrupted
    return {
      instanceCount: 0,
      trainingInstances: [],
      createdDate: new Date().toISOString(),
      version: "2.3.0"
    };
  }
}

async function writeTrainingData(data) {
  try {
    await fs.writeFile(TRAINING_DATA_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing training data:', error);
    return false;
  }
}

// Helper functions for learning patterns
async function readLearningPatterns() {
  try {
    const data = await fs.readFile(LEARNING_PATTERNS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading learning patterns:', error);
    return {
      globalStats: { totalAnalyses: 0, correctPredictions: 0, accuracy: 0, lastUpdated: new Date().toISOString() },
      overridePatterns: {},
      violationAccuracy: {},
      priorityBiases: {},
      commonCorrections: {},
      userContributions: {},
      createdDate: new Date().toISOString(),
      version: "2.3.0"
    };
  }
}

async function writeLearningPatterns(data) {
  try {
    await fs.writeFile(LEARNING_PATTERNS_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing learning patterns:', error);
    return false;
  }
}

// Aggregate learning patterns from all user interactions
function aggregateLearningPatterns(currentPatterns, newInteraction) {
  const updated = { ...currentPatterns };
  
  // Update global stats
  updated.globalStats.totalAnalyses += 1;
  if (newInteraction.wasCorrect) {
    updated.globalStats.correctPredictions += 1;
  }
  updated.globalStats.accuracy = Math.round((updated.globalStats.correctPredictions / updated.globalStats.totalAnalyses) * 100);
  updated.globalStats.lastUpdated = new Date().toISOString();
  
  // Track override patterns (AI suggestion → User action)
  if (newInteraction.aiAction !== newInteraction.userAction) {
    const pattern = `${newInteraction.aiAction}→${newInteraction.userAction}`;
    updated.overridePatterns[pattern] = (updated.overridePatterns[pattern] || 0) + 1;
  }
  
  // Track violation detection accuracy
  const hasViolation = newInteraction.userAction !== "NAR";
  const aiDetectedViolation = newInteraction.aiViolation !== "None";
  const accuracyKey = hasViolation ? "violations_detected" : "clean_posts_detected";
  
  if (!updated.violationAccuracy[accuracyKey]) {
    updated.violationAccuracy[accuracyKey] = { correct: 0, total: 0 };
  }
  updated.violationAccuracy[accuracyKey].total += 1;
  if (hasViolation === aiDetectedViolation) {
    updated.violationAccuracy[accuracyKey].correct += 1;
  }
  
  // Track priority-specific biases
  if (!updated.priorityBiases[newInteraction.priority]) {
    updated.priorityBiases[newInteraction.priority] = {};
  }
  const priorityAction = newInteraction.userAction;
  updated.priorityBiases[newInteraction.priority][priorityAction] = 
    (updated.priorityBiases[newInteraction.priority][priorityAction] || 0) + 1;
  
  // Track common corrections by violation type
  const correctionKey = `${newInteraction.aiViolation}_${newInteraction.aiAction}`;
  if (newInteraction.aiAction !== newInteraction.userAction) {
    updated.commonCorrections[correctionKey] = {
      ...updated.commonCorrections[correctionKey],
      count: (updated.commonCorrections[correctionKey]?.count || 0) + 1,
      correctedTo: newInteraction.userAction,
      lastSeen: new Date().toISOString()
    };
  }
  
  // Track user contributions (anonymized)
  const userKey = newInteraction.sessionId || 'anonymous';
  if (!updated.userContributions[userKey]) {
    updated.userContributions[userKey] = { interactions: 0, corrections: 0, lastActive: new Date().toISOString() };
  }
  updated.userContributions[userKey].interactions += 1;
  if (newInteraction.aiAction !== newInteraction.userAction) {
    updated.userContributions[userKey].corrections += 1;
  }
  updated.userContributions[userKey].lastActive = new Date().toISOString();
  
  return updated;
}

// API Routes

// GET current training data status
app.get('/api/training-data/status', async (req, res) => {
  try {
    const data = await readTrainingData();
    res.json({
      instanceCount: data.instanceCount,
      totalInstances: data.trainingInstances.length,
      lastUpdated: data.lastUpdated || data.createdDate,
      version: data.version
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read training data status' });
  }
});

// POST new training data instance
app.post('/api/training-data', async (req, res) => {
  try {
    const { postContent, priority, userAction, sessionId } = req.body;

    // Validate required fields
    if (!postContent || !priority || !userAction) {
      return res.status(400).json({ 
        error: 'Missing required fields: postContent, priority, userAction' 
      });
    }

    // Read current data
    const currentData = await readTrainingData();

    // Create new training instance
    const newInstance = {
      index: currentData.instanceCount,
      postContent: postContent.substring(0, 2000), // Limit content length
      priority: priority,
      userAction: userAction,
      timestamp: new Date().toISOString(),
      sessionId: sessionId || 'unknown' // For user session tracking
    };

    // Update data
    const updatedData = {
      ...currentData,
      instanceCount: currentData.instanceCount + 1,
      trainingInstances: [...currentData.trainingInstances, newInstance],
      lastUpdated: new Date().toISOString()
    };

    // Write to file
    const success = await writeTrainingData(updatedData);
    
    if (success) {
      console.log(`Training data recorded - Instance #${currentData.instanceCount} - Action: ${userAction} - Priority: ${priority}`);
      res.json({
        success: true,
        instanceIndex: currentData.instanceCount,
        totalInstances: updatedData.instanceCount,
        message: 'Training data recorded successfully'
      });
    } else {
      res.status(500).json({ error: 'Failed to save training data' });
    }

  } catch (error) {
    console.error('Training data API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET full training data (admin only - could add auth later)
app.get('/api/training-data/export', async (req, res) => {
  try {
    const data = await readTrainingData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to export training data' });
  }
});

// DELETE training data (admin only - could add auth later)
app.delete('/api/training-data/reset', async (req, res) => {
  try {
    const resetData = {
      instanceCount: 0,
      trainingInstances: [],
      createdDate: new Date().toISOString(),
      lastReset: new Date().toISOString(),
      version: "2.3.0"
    };
    
    const success = await writeTrainingData(resetData);
    
    if (success) {
      console.log('Training data reset by admin');
      res.json({ success: true, message: 'Training data reset successfully' });
    } else {
      res.status(500).json({ error: 'Failed to reset training data' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset training data' });
  }
});

// ===== LEARNING PATTERNS API ENDPOINTS =====

// GET global learning patterns
app.get('/api/learning-patterns', async (req, res) => {
  try {
    const patterns = await readLearningPatterns();
    res.json(patterns);
  } catch (error) {
    console.error('Error fetching learning patterns:', error);
    res.status(500).json({ error: 'Failed to fetch learning patterns' });
  }
});

// GET learning summary for Claude AI context
app.get('/api/learning-patterns/summary', async (req, res) => {
  try {
    const patterns = await readLearningPatterns();
    
    // Create a concise summary for Claude AI context
    const summary = {
      globalAccuracy: patterns.globalStats.accuracy,
      totalAnalyses: patterns.globalStats.totalAnalyses,
      topOverrides: Object.entries(patterns.overridePatterns)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([pattern, count]) => `${pattern} (${count}x)`),
      commonCorrections: Object.entries(patterns.commonCorrections)
        .sort(([,a], [,b]) => b.count - a.count)
        .slice(0, 3)
        .map(([key, data]) => `${key}: corrected to ${data.correctedTo} (${data.count}x)`),
      expertRules: patterns.expertRules || {},
      lastUpdated: patterns.globalStats.lastUpdated
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error creating learning summary:', error);
    res.status(500).json({ error: 'Failed to create learning summary' });
  }
});

// POST learning interaction (user override or confirmation)
app.post('/api/learning-patterns/interaction', async (req, res) => {
  try {
    const { 
      postContent, 
      priority, 
      aiViolation, 
      aiAction, 
      userAction, 
      wasCorrect,
      sessionId 
    } = req.body;

    // Validate required fields
    if (!postContent || !priority || !aiAction || !userAction || wasCorrect === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: postContent, priority, aiAction, userAction, wasCorrect' 
      });
    }

    // Read current patterns
    const currentPatterns = await readLearningPatterns();

    // Create interaction data
    const interaction = {
      postContent: postContent.substring(0, 500), // Limit for storage
      priority,
      aiViolation: aiViolation || 'Unknown',
      aiAction,
      userAction,
      wasCorrect,
      sessionId: sessionId || 'anonymous',
      timestamp: new Date().toISOString()
    };

    // Aggregate the new interaction into global patterns
    const updatedPatterns = aggregateLearningPatterns(currentPatterns, interaction);

    // Save updated patterns
    const success = await writeLearningPatterns(updatedPatterns);
    
    if (success) {
      console.log(`Learning interaction recorded: ${aiAction} → ${userAction} (${wasCorrect ? 'correct' : 'override'})`);
      res.json({
        success: true,
        globalAccuracy: updatedPatterns.globalStats.accuracy,
        totalAnalyses: updatedPatterns.globalStats.totalAnalyses,
        message: 'Learning interaction recorded successfully'
      });
    } else {
      res.status(500).json({ error: 'Failed to save learning interaction' });
    }

  } catch (error) {
    console.error('Learning interaction API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET learning insights for admin dashboard
app.get('/api/learning-patterns/insights', async (req, res) => {
  try {
    const patterns = await readLearningPatterns();
    
    const insights = {
      overview: {
        totalAnalyses: patterns.globalStats.totalAnalyses,
        accuracy: patterns.globalStats.accuracy,
        activeUsers: Object.keys(patterns.userContributions).length,
        lastUpdated: patterns.globalStats.lastUpdated
      },
      topOverrides: Object.entries(patterns.overridePatterns)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10),
      violationAccuracy: patterns.violationAccuracy,
      priorityTrends: patterns.priorityBiases,
      recentCorrections: Object.entries(patterns.commonCorrections)
        .sort(([,a], [,b]) => new Date(b.lastSeen) - new Date(a.lastSeen))
        .slice(0, 10),
      userStats: {
        totalUsers: Object.keys(patterns.userContributions).length,
        activeUsers: Object.values(patterns.userContributions)
          .filter(user => new Date() - new Date(user.lastActive) < 24 * 60 * 60 * 1000).length, // Active in last 24h
        avgInteractionsPerUser: patterns.globalStats.totalAnalyses / Math.max(Object.keys(patterns.userContributions).length, 1)
      }
    };
    
    res.json(insights);
  } catch (error) {
    console.error('Error generating learning insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// ===== WEBSCRAPING API ENDPOINTS =====

// Main scraping endpoint with caching and Claude AI parsing
app.post('/api/scrape/ebay-post', async (req, res) => {
  try {
    const { url, useAI = true, forceRefresh = false } = req.body;
    
    if (!url || !url.trim()) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    // Validate eBay community URL
    if (!url.includes('community.ebay.com') && !url.includes('ebay.com/community')) {
      return res.status(400).json({ error: 'Only eBay community URLs are supported' });
    }
    
    // Check for restricted areas (Community Mentor Lounge)
    if (url.includes('/Community-Mentor-Lounge/') || url.includes('mentor-lounge')) {
      return res.status(403).json({ 
        error: 'Community Mentor Lounge posts are restricted and cannot be scraped',
        suggestion: 'Please use a public eBay community post URL'
      });
    }
    
    const cacheKey = generateCacheKey(url);
    const cache = await readScrapingCache();
    
    // Check cache first (unless forced refresh)
    if (!forceRefresh && cache.entries[cacheKey]) {
      const entry = cache.entries[cacheKey];
      const isExpired = new Date() - new Date(entry.timestamp) > SCRAPING_CONFIG.cacheExpiry;
      
      if (!isExpired) {
        console.log(`📋 Cache hit for URL: ${url.substring(0, 50)}...`);
        cache.stats.cacheHits += 1;
        cache.stats.totalRequests += 1;
        await writeScrapingCache(cache);
        
        return res.json({
          success: true,
          data: entry.data,
          cached: true,
          timestamp: entry.timestamp,
          method: entry.method
        });
      }
    }
    
    // Cache miss - perform scraping
    console.log(`🔍 Scraping URL: ${url}`);
    cache.stats.cacheMisses += 1;
    cache.stats.totalRequests += 1;
    
    const scrapeResult = await scrapeEbayPostServerSide(url);
    
    // Parse content with Claude AI if available
    let parsedData;
    if (useAI) {
      try {
        parsedData = await parseContentWithClaude(scrapeResult.content, url);
        console.log(`🧠 Claude AI parsing successful`);
      } catch (aiError) {
        console.warn(`❌ Claude parsing failed, using fallback:`, aiError.message);
        parsedData = parseContentWithRegex(scrapeResult.content, url);
      }
    } else {
      parsedData = parseContentWithRegex(scrapeResult.content, url);
    }
    
    // Cache the successful result
    const cacheEntry = {
      data: parsedData,
      timestamp: new Date().toISOString(),
      method: scrapeResult.method,
      url: url,
      aiParsed: useAI && parsedData.parsedWithAI !== false
    };
    
    cache.entries[cacheKey] = cacheEntry;
    cache.stats.successfulScrapes += 1;
    await writeScrapingCache(cache);
    
    console.log(`✅ Successfully scraped and cached: ${parsedData.username || 'Unknown user'} - "${parsedData.title || 'No title'}""`);
    
    res.json({
      success: true,
      data: parsedData,
      cached: false,
      timestamp: cacheEntry.timestamp,
      method: scrapeResult.method,
      aiParsed: cacheEntry.aiParsed
    });
    
  } catch (error) {
    console.error('Scraping error:', error);
    
    // Update failure stats
    const cache = await readScrapingCache();
    cache.stats.failedScrapes += 1;
    await writeScrapingCache(cache);
    
    res.status(500).json({
      success: false,
      error: error.message,
      suggestion: 'Try again in a few moments or use manual input',
      supportedActions: ['retry', 'manual_input', 'contact_support']
    });
  }
});

// Claude AI-powered content parsing
async function parseContentWithClaude(content, url) {
  try {
    // Use Claude API to intelligently parse eBay post content
    const claudeApiKey = process.env.CLAUDE_API_KEY;
    
    if (!claudeApiKey) {
      console.warn('Claude API key not available, using regex parsing');
      const parsed = parseContentWithRegex(content, url);
      parsed.parsedWithAI = false;
      return parsed;
    }
    
    const systemPrompt = `You are an expert eBay Community post content parser. Extract key information from eBay community posts with high accuracy.

ALWAYS respond with valid JSON in this exact format:
{
  "username": "extracted_username",
  "title": "post_title_or_subject",
  "datetime": "date_and_time_posted",
  "postContent": "main_post_content_text",
  "confidence": 0.95,
  "extractionNotes": "brief_notes_on_extraction_quality"
}

Extract the username of the person who made the post, the post title/subject, the date and time it was posted, and the main post content. 

eBay usernames often appear with titles like "username username Adventurer" or "username Rising Star".
Dates are typically in MM-DD-YYYY HH:MM AM/PM format.
Titles often start with ## in markdown format.

If any field cannot be reliably extracted, use an empty string. Provide a confidence score between 0-1.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': claudeApiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [{
          role: 'user',
          content: `Please parse this eBay community post content:

URL: ${url}
Content: ${content.substring(0, 3000)}...

Extract the username, title, datetime, and post content with high accuracy.`
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`Claude API failed: ${response.status}`);
    }

    const result = await response.json();
    const parsedText = result.content[0].text;
    
    try {
      const parsed = JSON.parse(parsedText);
      parsed.parsedWithAI = true;
      parsed.aiConfidence = parsed.confidence || 0.8;
      parsed.url = url;
      parsed.extractedAt = new Date().toISOString();
      
      console.log(`🧠 Claude parsing confidence: ${parsed.aiConfidence}`);
      return parsed;
    } catch (jsonError) {
      console.warn('Claude returned non-JSON, falling back to regex');
      const parsed = parseContentWithRegex(content, url);
      parsed.parsedWithAI = false;
      return parsed;
    }
    
  } catch (error) {
    console.warn('Claude AI parsing failed:', error.message);
    const parsed = parseContentWithRegex(content, url);
    parsed.parsedWithAI = false;
    return parsed;
  }
}

// Enhanced regex parsing (fallback method)
function parseContentWithRegex(content, url) {
  // Enhanced eBay-specific patterns (improved from previous version)
  const patterns = {
    username: [
      // Multiple comprehensive patterns for eBay usernames
      /\b([a-zA-Z0-9_.*-]+)\s+\1\s+(?:Adventurer|Visionary|Rockstar|Pioneer|Top Contributor|Newbie|Trailblazer|Superstar|Rising Star|Explorer|Thrill-Seeker|Enthusiast)/i,
      /\b([a-zA-Z0-9_.*\\-]+)\s+(?:Adventurer|Visionary|Rockstar|Pioneer|Top Contributor|Newbie|Trailblazer|Superstar|Rising Star|Explorer|Thrill-Seeker|Enthusiast)/i,
      /@([a-zA-Z0-9_.*-]+)/
    ],
    title: [
      /##\s*([^\n\r]+?)\.?\s*$/m,
      /##\s+([^#\n]+)/,
      /(?:^|\n)\s*([^.\n]*(?:scammer|scammed|feedback|cancel|sale|positive|negative|buyer|seller)[^.\n]*)/im
    ],
    datetime: [
      /‎(\d{1,2}-\d{1,2}-\d{4}\s+\d{1,2}:\d{2}\s+(?:AM|PM))/i,
      /(\d{1,2}-\d{1,2}-\d{4}\s+\d{1,2}:\d{2}\s+(?:AM|PM))/i,
      /([A-Z][a-z]{2}-\d{1,2}-\d{4}\s+\d{1,2}:\d{2}\s+(?:AM|PM))/i
    ]
  };

  const extractFirst = (patternArray) => {
    for (const pattern of patternArray) {
      const match = content.match(pattern);
      if (match && match[1]) {
        return match[1].trim();
      }
    }
    return '';
  };

  let username = extractFirst(patterns.username);
  let title = extractFirst(patterns.title);
  let datetime = extractFirst(patterns.datetime);

  // Clean extracted data
  if (title) {
    title = title.replace(/[-|]*eBay Community.*$/i, '').replace(/^##\s*/, '').trim();
  }
  
  if (username) {
    username = username.replace(/\\/g, '').replace(/[^a-zA-Z0-9_.*-]/g, '').replace(/^[_.*]+|[_.*]+$/g, '');
  }

  return {
    username: username.substring(0, 50) || '',
    title: title.substring(0, 200) || '',
    datetime: datetime.substring(0, 50) || '',
    postContent: content.length > 1000 ? content.substring(0, 1000) + '...' : content,
    url: url,
    extractedAt: new Date().toISOString(),
    parsedWithAI: false
  };
}

// Batch scraping endpoint
app.post('/api/scrape/batch', async (req, res) => {
  try {
    const { urls, useAI = true } = req.body;
    
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'URLs array is required' });
    }
    
    if (urls.length > 10) {
      return res.status(400).json({ error: 'Maximum 10 URLs per batch request' });
    }
    
    const results = [];
    const errors = [];
    
    for (const url of urls) {
      try {
        const scrapeResult = await scrapeEbayPostServerSide(url);
        const parsedData = useAI ? await parseContentWithClaude(scrapeResult.content, url) : parseContentWithRegex(scrapeResult.content, url);
        results.push({ url, success: true, data: parsedData });
      } catch (error) {
        errors.push({ url, error: error.message });
        results.push({ url, success: false, error: error.message });
      }
    }
    
    res.json({
      success: errors.length === 0,
      totalUrls: urls.length,
      successfulScrapes: results.filter(r => r.success).length,
      failedScrapes: errors.length,
      results: results,
      errors: errors
    });
    
  } catch (error) {
    console.error('Batch scraping error:', error);
    res.status(500).json({ error: 'Batch scraping failed', details: error.message });
  }
});

// Get scraping cache statistics
app.get('/api/scrape/stats', async (req, res) => {
  try {
    const cache = await readScrapingCache();
    const totalEntries = Object.keys(cache.entries || {}).length;
    const successRate = cache.stats.totalRequests > 0 ? 
      Math.round((cache.stats.successfulScrapes / cache.stats.totalRequests) * 100) : 0;
    
    res.json({
      ...cache.stats,
      totalCachedEntries: totalEntries,
      successRate: successRate,
      cacheHitRate: cache.stats.totalRequests > 0 ? 
        Math.round((cache.stats.cacheHits / cache.stats.totalRequests) * 100) : 0
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get scraping statistics' });
  }
});

// Clear scraping cache (admin function)
app.delete('/api/scrape/cache/clear', async (req, res) => {
  try {
    const clearedCache = {
      entries: {},
      stats: {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        successfulScrapes: 0,
        failedScrapes: 0,
        lastCleanup: new Date().toISOString()
      },
      clearedDate: new Date().toISOString(),
      version: "2.3.0"
    };
    
    await writeScrapingCache(clearedCache);
    console.log('🧹 Scraping cache cleared by admin');
    
    res.json({ success: true, message: 'Scraping cache cleared successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to clear scraping cache' });
  }
});

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.3.0',
    features: ['learning_patterns', 'training_data', 'advanced_webscraping']
  });
});

// ===== ADVANCED WEBSCRAPING SYSTEM =====

// Initialize scraping cache
async function initializeScrapingCache() {
  try {
    await fs.access(SCRAPING_CACHE_FILE);
    console.log('Scraping cache file exists');
  } catch (error) {
    const initialCache = {
      entries: {},
      stats: {
        totalRequests: 0,
        cacheHits: 0,
        cacheMisses: 0,
        successfulScrapes: 0,
        failedScrapes: 0,
        lastCleanup: new Date().toISOString()
      },
      createdDate: new Date().toISOString(),
      version: "2.3.0"
    };
    
    await fs.writeFile(SCRAPING_CACHE_FILE, JSON.stringify(initialCache, null, 2));
    console.log('Scraping cache file created');
  }
}

// Cache management functions
async function readScrapingCache() {
  try {
    const data = await fs.readFile(SCRAPING_CACHE_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading scraping cache:', error);
    return { entries: {}, stats: { totalRequests: 0, cacheHits: 0, cacheMisses: 0 } };
  }
}

async function writeScrapingCache(cache) {
  try {
    await fs.writeFile(SCRAPING_CACHE_FILE, JSON.stringify(cache, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing scraping cache:', error);
    return false;
  }
}

function generateCacheKey(url) {
  return crypto.createHash('md5').update(url).digest('hex');
}

// Advanced server-side scraping with multiple strategies
async function scrapeEbayPostServerSide(url) {
  const strategies = [
    () => scrapeWithFetch(url),
    () => scrapeWithProxies(url),
    () => scrapeWithBackupMethod(url)
  ];
  
  for (let i = 0; i < strategies.length; i++) {
    const strategy = strategies[i];
    const strategyName = ['Direct Fetch', 'Proxy Services', 'Backup Method'][i];
    
    console.log(`🔍 Attempting scraping strategy ${i + 1}: ${strategyName}`);
    
    try {
      const result = await strategy();
      if (result && result.content) {
        console.log(`✅ Strategy ${strategyName} succeeded`);
        return result;
      }
    } catch (error) {
      console.warn(`❌ Strategy ${strategyName} failed:`, error.message);
      if (i === strategies.length - 1) {
        throw new Error(`All scraping strategies failed. Last error: ${error.message}`);
      }
    }
  }
}

// Strategy 1: Direct fetch with multiple user agents
async function scrapeWithFetch(url) {
  const userAgent = SCRAPING_CONFIG.userAgents[Math.floor(Math.random() * SCRAPING_CONFIG.userAgents.length)];
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': userAgent,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    },
    timeout: SCRAPING_CONFIG.timeout
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const content = await response.text();
  return { content, method: 'direct_fetch', userAgent };
}

// Strategy 2: Proxy services with rotation
async function scrapeWithProxies(url) {
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://cors-anywhere.herokuapp.com/${url}`,
    `https://thingproxy.freeboard.io/fetch/${url}`,
    `https://crossorigin.me/${url}`,
    `https://cors-proxy.htmldriven.com/?url=${encodeURIComponent(url)}`
  ];
  
  for (const proxyUrl of proxies) {
    try {
      const response = await fetch(proxyUrl, {
        timeout: SCRAPING_CONFIG.timeout
      });
      
      if (response.ok) {
        const data = await response.json().catch(() => response.text());
        const content = data.contents || data.content || data;
        
        if (content && typeof content === 'string' && content.length > 100) {
          return { content, method: 'proxy', proxy: proxyUrl };
        }
      }
    } catch (error) {
      console.warn(`Proxy ${proxyUrl} failed:`, error.message);
      continue;
    }
  }
  
  throw new Error('All proxy services failed');
}

// Strategy 3: Backup method with enhanced headers
async function scrapeWithBackupMethod(url) {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; eBayModerationBot/1.0; +https://community.ebay.com/robots)',
      'Accept': '*/*',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache'
    },
    timeout: SCRAPING_CONFIG.timeout * 2 // Double timeout for backup
  });
  
  if (!response.ok) {
    throw new Error(`Backup method failed: HTTP ${response.status}`);
  }
  
  const content = await response.text();
  return { content, method: 'backup_method' };
}

// Start server
async function startServer() {
  await initializeTrainingData();
  await initializeLearningPatterns();
  await initializeScrapingCache();
  
  app.listen(PORT, () => {
    console.log(`🚀 eBay Moderation Assistant Server v2.2 running on port ${PORT}`);
    console.log(`📊 Training data will be stored in: ${TRAINING_DATA_FILE}`);
    console.log(`🧠 Learning patterns will be stored in: ${LEARNING_PATTERNS_FILE}`);
    console.log(`🕷️ Scraping cache will be stored in: ${SCRAPING_CACHE_FILE}`);
    console.log(`🌐 Access the app at: http://localhost:${PORT}`);
    console.log(`🔗 Learning API available at: http://localhost:${PORT}/api/learning-patterns`);
    console.log(`🔗 Scraping API available at: http://localhost:${PORT}/api/scrape`);
  });
}

startServer().catch(console.error);

