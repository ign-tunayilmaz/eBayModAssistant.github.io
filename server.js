const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const TRAINING_DATA_FILE = path.join(__dirname, 'AI_assistant_training_data.json');

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
  
  app.listen(PORT, () => {
    console.log(`🚀 eBay Moderation Assistant Server running on port ${PORT}`);
    console.log(`📊 Training data will be stored in: ${TRAINING_DATA_FILE}`);
    console.log(`🌐 Access the app at: http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);

