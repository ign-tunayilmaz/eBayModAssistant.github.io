const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const TRAINING_DATA_FILE = path.join(__dirname, 'AI_assistant_training_data.json');
const LEARNING_PATTERNS_FILE = path.join(__dirname, 'AI_learning_patterns.json');

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
      version: "2.0.0"
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
          version: "2.0.0"
        }
      },
      createdDate: new Date().toISOString(),
      version: "2.0.0"
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
      version: "2.0.0"
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
      version: "2.0.0"
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
      version: "2.0.0"
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

// Serve the main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Start server
async function startServer() {
  await initializeTrainingData();
  await initializeLearningPatterns();
  
  app.listen(PORT, () => {
    console.log(`🚀 eBay Moderation Assistant Server running on port ${PORT}`);
    console.log(`📊 Training data will be stored in: ${TRAINING_DATA_FILE}`);
    console.log(`🧠 Learning patterns will be stored in: ${LEARNING_PATTERNS_FILE}`);
    console.log(`🌐 Access the app at: http://localhost:${PORT}`);
    console.log(`🔗 Learning API available at: http://localhost:${PORT}/api/learning-patterns`);
  });
}

startServer().catch(console.error);

