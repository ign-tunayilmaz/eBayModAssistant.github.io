// React and Lucide icons are loaded globally
const { createElement: h, useState, useEffect, useRef } = React;
const { createRoot } = ReactDOM;
const { ChevronDown, ChevronUp, Copy, Check, Plus, Minus, Sun, Moon } = LucideReact;

const ModerationTool = () => {
  const [activeAction, setActiveAction] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedTemplates, setExpandedTemplates] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showEOSReport, setShowEOSReport] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showAdditionalTemplates, setShowAdditionalTemplates] = useState(false);
  const [showBanTemplates, setShowBanTemplates] = useState(false);
  const [showGuidelines, setShowGuidelines] = useState(false);
  const [showWorkflows, setShowWorkflows] = useState(false);
  const [showAdminNotes, setShowAdminNotes] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState({});
  const [expandedGuidelines, setExpandedGuidelines] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const [guidelinesSearch, setGuidelinesSearch] = useState('');
  
  // AI Assistant state
  const [showAIAssistant, setShowAIAssistant] = useState(false);
  const [showAIHistory, setShowAIHistory] = useState(false);
  
  const [aiSettings, setAiSettings] = useState({
    apiKey: '',
    baseUrl: 'https://api.anthropic.com/v1',
    model: 'claude-3-5-sonnet-20241022',
    isActive: false
  });
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [testContent, setTestContent] = useState('');
  const [testPriority, setTestPriority] = useState('P3');
  const [aiHistory, setAiHistory] = useState([]);
  const [learningData, setLearningData] = useState({
    totalAnalyses: 0,
    correctPredictions: 0,
    overrides: [],
    patterns: {}
  });


  // Training data collection state
  const [trainingData, setTrainingData] = useState({
    instanceCount: 0,
    trainingInstances: []
  });
  const dropdownRefs = useRef({});
  
  const [templateInputs, setTemplateInputs] = useState({
    friendlyRemovedPost: { url: '', username: '', title: '', datetime: '', guidelines: '', quote: '' },
    warningRemovedPost: { url: '', username: '', title: '', datetime: '', guidelines: '', quote: '' },
    friendlyEditedPost: { url: '', username: '', here: '', guidelines: '', quote: '' },
    warningEditedPost: { url: '', username: '', here: '', guidelines: '', quote: '' },
    csRedirect: { username: '' },
    banCombined: { banPeriod: '1 Day', reasoning: '', username: '', email: '', ip: '', spamUrl: '', startDate: '' }
  });
  
  const [counters, setCounters] = useState({
    P1: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
    P2: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
    P3: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
    P4: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 }
  });

  const [adminNoteInputs, setAdminNoteInputs] = useState({
    edited: { link: '', removed: '', violation: '' }
  });

  const modActionTypes = ['NAR', 'Edit', 'Steer', 'Remove', 'Ban', 'Locked', 'Moved'];
  const dropdownActionTypes = modActionTypes.filter(actionType => actionType !== 'NAR');
  const AI_ACTIONS = ['NAR', 'Edit', 'Steer', 'Remove', 'Ban', 'Locked', 'Moved']; // Aligned with EOS report actions

  // Global Learning System Functions
      const getGlobalLearningContext = async () => {
    try {
      const response = await fetch('/api/learning-patterns/summary');
      if (response.ok) {
        const summary = await response.json();
        if (summary.totalAnalyses > 0) {
          let context = `\nGlobal Learning Context (from ${summary.totalAnalyses} team interactions):
- Team accuracy: ${summary.globalAccuracy}%
- Common corrections: ${summary.commonCorrections.join(', ')}
- Top override patterns: ${summary.topOverrides.join(', ')}`;
          
          // Include expert rules for immediate intelligence
          if (summary.expertRules?.personalInfoContext) {
            context += `\n- EXPERT RULE - Personal Info Context: When users mention "phone number", "email", or "address" - check if they're sharing actual contact details (Edit) or just discussing eBay contact info, delivery issues, or general concepts (NAR)`;
          }
          
          context += `\n- Last updated: ${new Date(summary.lastUpdated).toLocaleString()}`;
          return context;
        }
      }
    } catch (error) {
      console.warn('Could not fetch global learning context:', error);
    }
    return '';
  };

  const recordGlobalLearningInteraction = async (postContent, priority, aiAnalysis, userAction, wasCorrect) => {
    try {
      const sessionId = localStorage.getItem('ebay-mod-session-id') || 
        `user_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      
      if (!localStorage.getItem('ebay-mod-session-id')) {
        localStorage.setItem('ebay-mod-session-id', sessionId);
      }

      const response = await fetch('/api/learning-patterns/interaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          postContent,
          priority,
          aiViolation: aiAnalysis?.violation || 'Unknown',
          aiAction: aiAnalysis?.action || 'Unknown',
          userAction,
          wasCorrect,
          sessionId
        })
      });

      if (response.ok) {
        const result = await response.json();
        console.log(`✅ Global learning updated: Team accuracy now ${result.globalAccuracy}% (${result.totalAnalyses} total)`);
        
        // Update local learning data with global stats
        setLearningData(prev => ({
          ...prev,
          globalAccuracy: result.globalAccuracy,
          globalAnalyses: result.totalAnalyses
        }));
      } else {
        console.warn('Failed to record global learning interaction');
      }
    } catch (error) {
      console.warn('Could not record global learning interaction:', error);
      // Continue with local learning as fallback
    }
  };

  // Claude AI Assistant Functions
  const analyzePost = async (content, priority) => {
    if (!aiSettings.apiKey || !aiSettings.isActive) {
      alert('Claude AI not configured. Please check API Settings.');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Claude system prompt for eBay moderation
      const systemPrompt = `You are an expert eBay Community Moderation Assistant trained on official eBay Community Guidelines, professional moderation practices, and eBay community standards.

Your role is to analyze user posts and provide structured moderation recommendations that help moderators make quick, accurate decisions while ensuring consistent enforcement of community guidelines.

ALWAYS respond with valid JSON in this exact format:
{
  "violation": "Severe|Moderate|Minor|None",
  "action": "NAR|Edit|Steer|Remove|Ban|Locked|Moved",
  "sentiment": "😠|😐|😊",
  "rationale": "Brief explanation of why this action is recommended",
  "ban_length": "1 Day|3 Days|7 Days|30 Days|Indefinite|None",
  "message_to_user": "Template message for user notification",
  "admin_note": "Internal note for moderation log"
}

eBay Community Guidelines - Key Violations:
- Spam, advertising, or promotional content
- Profanity, harassment, or offensive language  
- Personal information sharing (emails, phones, addresses) - CONTEXT MATTERS
- Off-topic discussions or necroposting (6+ months old)
- Duplicate posts or repetitive content
- Threats, adult content, or illegal activities
- Misinformation or misleading content

IMPORTANT CONTEXT RULES FOR PERSONAL INFORMATION:
- EDIT when users share actual contact details: "Call me at 555-1234", "Email me at john@gmail.com"
- NAR when discussing eBay's contact info: "What's eBay's phone number?", "eBay doesn't have a phone number"
- NAR when describing delivery issues: "Nothing came to my email address", "Package didn't arrive at my address"
- NAR when asking about notifications: "My email isn't getting eBay alerts", "Address confirmation emails"
- NAR when discussing general concepts: "phone number format", "email address requirements"

AVAILABLE MODERATION ACTIONS (match EOS report tracking):
- NAR: No Action Required (post complies with guidelines)
- Edit: Edit post to remove violating content but preserve main message
- Steer: Redirect discussion, lock heated threads, guide behavior
- Remove: Delete post entirely (spam, severe violations)
- Ban: Temporarily or permanently restrict user access
- Locked: Lock thread from further replies (use for necroposting, heated discussions)
- Moved: Move post/thread to appropriate board or category

CRITICAL P1 PRIORITY RULES - REAL-WORLD WORKFLOW:
1. NECROPOSTING TAKES PRECEDENCE: Thread >6 months old → action=Locked, use "Locking: Necro Thread" template, ignore all other violations
2. PRIVACY VIOLATIONS: Screenshots/images with personal info → action=Edit, QUOTE="A screenshot containing buyer's full address" (descriptive for non-text)
3. HOSTILE INSULTS: Personal attacks/sarcastic hostility → action=Remove, use Friendly PM for first offense (not Warning unless repeat)
4. MISPLACED CONTENT: Posts in wrong board → action=Moved, note target board in rationale
5. MULTIPLE VIOLATIONS: Prioritize necro > privacy > hostility > content quality

P1 RESOLUTION WORKFLOW:
Step 1: Check thread age first (>6 months = Locked, done)
Step 2: Check for privacy exposure (personal info in screenshots/images = Edit)
Step 3: Assess hostility level (insults/attacks = Remove with Friendly PM)
Step 4: Check placement (wrong board = Moved)
Step 5: Apply standard violation rules

TEMPLATE POPULATION RULES (CRITICAL):
- USERNAME = violator's username (NOT the reporter who filed the abuse report)
- TITLE = full post title in quotes for "Edited Post" templates, no [HERE] placeholder
- DATE_TIME = exact format from post (e.g., "‎11-09-2025 08:03 PM")
- GUIDELINES = description text ONLY (remove "GG01:", "SG10:" etc - just the text)
- QUOTE = actual removed text OR descriptive for images: "A screenshot containing buyer's full address"

P1 TONE GUIDELINES:
- First offense hostile language → Friendly PM (educational, not punitive)
- Unintentional privacy violations → Friendly PM (user likely didn't realize)
- Self-reports (user flagging their own mistake) → still apply standard action
- Repeat violations or severe content → Warning PM or escalate to ban

Consider context, user intent, and severity when making recommendations. Priority levels (P1-P5) indicate urgency, with P1 being most critical.`;

      // Direct Claude API call
      const response = await fetch(`${aiSettings.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': aiSettings.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: aiSettings.model,
          max_tokens: 1000,
          system: systemPrompt,
          messages: [{
            role: 'user',
            content: `Priority Level: ${priority}
            
Post Content: "${content}"

Learning Context: ${await getGlobalLearningContext()}

Analyze this eBay community post and provide a moderation recommendation. Consider the priority level and any patterns from previous moderation decisions.`
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Claude API failed: ${response.status} - ${errorData}`);
      }

      const result = await response.json();
      const analysisText = result.content[0].text;
      
      let analysis;
          try {
            analysis = JSON.parse(analysisText);
          } catch (e) {
            // Fallback if not proper JSON
            analysis = {
              violation: 'Moderate',
              action: 'Edit',
              sentiment: '😐',
              rationale: analysisText,
              ban_length: 'None',
          message_to_user: 'Please review Community Guidelines',
          admin_note: 'Claude analysis - manual review needed'
            };
          }

          const analysisRecord = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            content: content,
            priority: priority,
            analysis: analysis,
            userOverride: null,
            isCorrect: null
          };

          setAiHistory(prev => [analysisRecord, ...prev.slice(0, 49)]); // Keep last 50
          setAiAnalysis(analysis);
          
          // Update learning data
          setLearningData(prev => ({
            ...prev,
            totalAnalyses: prev.totalAnalyses + 1
          }));

          // Record this AI analysis globally (will be confirmed/overridden later)
          await recordGlobalLearningInteraction(
            content,
            priority,
            analysis,
            analysis.action, // Initially assume AI is correct
            true // Will be updated if user overrides
          );

    } catch (error) {
      console.error('Claude Analysis Error:', error);
      alert(`Claude AI Analysis failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const recordUserOverride = async (analysisId, userAction, wasCorrect) => {
    // Update local history
    setAiHistory(prev => prev.map(record => 
      record.id === analysisId 
        ? { ...record, userOverride: userAction, isCorrect: wasCorrect }
        : record
    ));

    // Update local learning data
    setLearningData(prev => ({
      ...prev,
      correctPredictions: wasCorrect ? prev.correctPredictions + 1 : prev.correctPredictions,
      overrides: [...prev.overrides, { analysisId, userAction, timestamp: new Date().toISOString() }].slice(-100)
    }));

    // Record globally for cross-user learning
    const record = aiHistory.find(r => r.id === analysisId);
    if (record) {
      await recordGlobalLearningInteraction(
        record.content,
        record.priority, 
        record.analysis,
        userAction,
        wasCorrect
      );
    }
  };


  // Training data collection for AI improvement (simple localStorage approach)
  const recordTrainingData = (postContent, priority, userAction) => {
    // Generate session ID for user tracking
    let sessionId = localStorage.getItem('ebay-mod-session-id');
    if (!sessionId) {
      sessionId = 'user_' + Date.now() + '_' + Math.random().toString(36).slice(2);
      localStorage.setItem('ebay-mod-session-id', sessionId);
    }

    const newInstance = {
      index: trainingData.instanceCount,
      postContent: postContent,
      priority: priority,
      userAction: userAction,
      timestamp: new Date().toISOString(),
      sessionId: sessionId
    };

    setTrainingData(prev => ({
      instanceCount: prev.instanceCount + 1,
      trainingInstances: [...prev.trainingInstances, newInstance]
    }));

    console.log(`Training data recorded - Instance #${trainingData.instanceCount} - Action: ${userAction}`);
  };

  // Export training data (simple download)
  const exportTrainingData = () => {
    const dataToExport = {
      instanceCount: trainingData.instanceCount,
      trainingInstances: trainingData.trainingInstances,
      exportDate: new Date().toISOString(),
      version: "2.1.0",
      sessionId: localStorage.getItem('ebay-mod-session-id')
    };

    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `AI_assistant_training_data_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();

    console.log(`Exported ${trainingData.instanceCount} training instances from this session`);
  };

  const getAiAccuracy = () => {
    if (learningData.totalAnalyses === 0) return 0;
    return Math.round((learningData.correctPredictions / learningData.totalAnalyses) * 100);
  };

  const testCases = [
    {
      name: 'Threat Detection',
      content: "I'll beat you up if you outbid me again!",
      priority: 'P1',
      expected: 'Major violation, Ban action'
    },
    {
      name: 'Personal Info',
      content: "Please call me at 555-123-4567 about this item",
      priority: 'P3',
      expected: 'Moderate violation, Edit action'  
    },
    {
      name: 'Off-topic Discussion',
      content: "Has anyone tried the new iPhone? It's amazing!",
      priority: 'P4',
      expected: 'Minor violation, Steer action'
    }
  ];






  // Guidelines for dropdown
  const guidelineOptions = [
    { id: 'gg01', name: 'GG01: Be respectful', text: templates.gg01 },
    { id: 'gg02', name: 'GG02: Meaningful contributions', text: templates.gg02 },
    { id: 'gg03', name: 'GG03: Consequences', text: templates.gg03 },
    { id: 'gg04', name: 'GG04: Reporting Content', text: templates.gg04 },
    { id: 'gg05', name: 'GG05: Personal info', text: templates.gg05 },
    { id: 'sg00', name: 'SG00: Refrain from', text: templates.sg00 },
    { id: 'sg01', name: 'SG01: Adult content', text: templates.sg01 },
    { id: 'sg02', name: 'SG02: Threats', text: templates.sg02 },
    { id: 'sg03', name: 'SG03: Dishonest', text: templates.sg03 },
    { id: 'sg04', name: 'SG04: Duplicative', text: templates.sg04 },
    { id: 'sg05', name: 'SG05: Activism', text: templates.sg05 },
    { id: 'sg06', name: 'SG06: Advertising', text: templates.sg06 },
    { id: 'sg07', name: 'SG07: Off-eBay sites', text: templates.sg07 },
    { id: 'sg08', name: 'SG08: Reposted content', text: templates.sg08 },
    { id: 'sg09', name: 'SG09: Mod warnings', text: templates.sg09 },
    { id: 'sg10', name: 'SG10: Naming/shaming', text: templates.sg10 },
    { id: 'sg11', name: 'SG11: Policy violations', text: templates.sg11 },
    { id: 'sg12', name: 'SG12: Copyright', text: templates.sg12 }
  ];

  const selectGuideline = (templateId, guidelineId) => {
    if (guidelineId === 'other') {
      // Clear the field and focus on the text input for custom entry
      updateTemplateInput(templateId, 'guidelines', '');
      // Small delay to ensure the input is cleared before focusing
      setTimeout(() => {
        const guidelinesInput = document.querySelector(`[data-template-id="${templateId}"][data-field="guidelines"]`);
        if (guidelinesInput) {
          guidelinesInput.focus();
        }
      }, 50);
    } else {
      const guideline = guidelineOptions.find(g => g.id === guidelineId);
      if (guideline) {
        updateTemplateInput(templateId, 'guidelines', guideline.text);
      }
    }
  };

  // Admin Notes specific function - populates with clean violation name only
  const selectAdminNoteViolation = (guidelineId) => {
    if (guidelineId === 'other') {
      // Clear the field and focus on the text input for custom entry
      updateAdminNoteInput('edited', 'violation', '');
      setTimeout(() => {
        const violationInput = document.querySelector('[data-admin-field="violation"]');
        if (violationInput) {
          violationInput.focus();
        }
      }, 50);
    } else {
      const guideline = guidelineOptions.find(g => g.id === guidelineId);
      if (guideline) {
        // Extract clean name from "GG01: Be respectful" -> "Be respectful"
        const cleanName = guideline.name.replace(/^[SG]+\d+:\s*/, '');
        updateAdminNoteInput('edited', 'violation', cleanName);
      }
    }
  };

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedCounters = localStorage.getItem('ebay-mod-counters');
      const savedTemplateInputs = localStorage.getItem('ebay-mod-template-inputs');
      const savedAdminNotes = localStorage.getItem('ebay-mod-admin-notes');
      const savedDarkMode = localStorage.getItem('ebay-mod-dark-mode');
      const savedAiSettings = localStorage.getItem('ebay-mod-ai-settings');
      const savedAiHistory = localStorage.getItem('ebay-mod-ai-history');
      const savedLearningData = localStorage.getItem('ebay-mod-learning-data');
      const savedTrainingData = localStorage.getItem('ebay-mod-training-data');
      
      if (savedCounters) setCounters(JSON.parse(savedCounters));
      if (savedTemplateInputs) setTemplateInputs(JSON.parse(savedTemplateInputs));
      if (savedAdminNotes) setAdminNoteInputs(JSON.parse(savedAdminNotes));
      if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
      if (savedAiSettings) setAiSettings(JSON.parse(savedAiSettings));
      if (savedAiHistory) setAiHistory(JSON.parse(savedAiHistory));
      if (savedLearningData) setLearningData(JSON.parse(savedLearningData));
      if (savedTrainingData) setTrainingData(JSON.parse(savedTrainingData));
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, []);

  // Save counters to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ebay-mod-counters', JSON.stringify(counters));
    } catch (error) {
      console.error('Error saving counters:', error);
    }
  }, [counters]);

  // Save template inputs to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ebay-mod-template-inputs', JSON.stringify(templateInputs));
    } catch (error) {
      console.error('Error saving template inputs:', error);
    }
  }, [templateInputs]);

  // Save admin notes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ebay-mod-admin-notes', JSON.stringify(adminNoteInputs));
    } catch (error) {
      console.error('Error saving admin notes:', error);
    }
  }, [adminNoteInputs]);

  // Save dark mode preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ebay-mod-dark-mode', JSON.stringify(darkMode));
    } catch (error) {
      console.error('Error saving dark mode:', error);
    }
  }, [darkMode]);

  // Save AI settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ebay-mod-ai-settings', JSON.stringify(aiSettings));
    } catch (error) {
      console.error('Error saving AI settings:', error);
    }
  }, [aiSettings]);

  // Save AI history to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ebay-mod-ai-history', JSON.stringify(aiHistory));
    } catch (error) {
      console.error('Error saving AI history:', error);
    }
  }, [aiHistory]);

  // Save learning data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ebay-mod-learning-data', JSON.stringify(learningData));
    } catch (error) {
      console.error('Error saving learning data:', error);
    }
  }, [learningData]);

  // Save training data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ebay-mod-training-data', JSON.stringify(trainingData));
    } catch (error) {
      console.error('Error saving training data:', error);
    }
  }, [trainingData]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown && dropdownRefs.current[openDropdown]) {
        if (!dropdownRefs.current[openDropdown].contains(event.target)) {
          setOpenDropdown(null);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Admin keyboard shortcuts for training data access
  useEffect(() => {
    const handleKeyDown = (event) => {
      // Ctrl+Shift+T = Export Training Data (admin only)
      if (event.ctrlKey && event.shiftKey && event.key === 'T') {
        event.preventDefault();
        exportTrainingData();
        console.log('Training data exported. Current instance count:', trainingData.instanceCount);
      }
      // Ctrl+Shift+C = Log training data to console (admin only)
      if (event.ctrlKey && event.shiftKey && event.key === 'C') {
        event.preventDefault();
        console.log('AI Training Data:', trainingData);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [trainingData]);

  // Expose training data functions to console for admin access
  useEffect(() => {
    window.adminTools = {
      exportTrainingData,
      getTrainingData: () => trainingData,
      getInstanceCount: () => trainingData.instanceCount,
      clearTrainingData: () => setTrainingData({ instanceCount: 0, trainingInstances: [] }),
      // Note: Server files are available if you want to implement server-side collection later
      serverInfo: "Server implementation available in server.js - currently using simple localStorage approach"
    };
  }, [trainingData]);

  const templates = {
    friendlyRemovedPost: 'Hi [USERNAME],\n \nThis is a friendly moderation notice to inform you that your recent post "[TITLE]" from [DATE_TIME] has been removed because it violated the following eBay Community Guidelines:\n \n[GUIDELINES]\n \nYou posted the following:\n \n"[QUOTE]"\n \nPlease take a moment to review the Community Guidelines to avoid making the same mistake again in the future.\n \nThank you for your cooperation in keeping the Community a welcoming, helpful, and respectful place for all users.\n \n-- The eBay Community Moderation Team',
    warningRemovedPost: 'Hi [USERNAME],\n \nThis is an official moderation warning to inform you that your recent post "[TITLE]" from [DATE_TIME] has been removed because it violated the following eBay Community Guidelines:\n \n[GUIDELINES]\n \nYou posted the following:\n \n"[QUOTE]"\n \nPlease take a moment to review the Community Guidelines to avoid making the same mistake again in the future.\n \nThank you for your cooperation in keeping the Community a welcoming, helpful, and respectful place for all users.\n \n-- The eBay Community Moderation Team',
    friendlyEditedPost: 'Hi [USERNAME],\n \nThis is a friendly moderation notice to inform you that your recent post [HERE] has been edited because it violated the following eBay Community Guidelines:\n \n[GUIDELINES]\n \nYour post was edited to remove the following:\n \n"[QUOTE]"\n \nPlease take a moment to review the Community Guidelines to avoid making the same mistake again in the future.\n \nThank you for your cooperation in keeping the Community a welcoming, helpful, and respectful place for all users.\n \n-- The eBay Community Moderation Team',
    warningEditedPost: 'Hi [USERNAME],\n \nThis is an official moderation warning to inform you that your recent post [HERE] has been edited because it violated the following eBay Community Guidelines:\n \n[GUIDELINES]\n \nYour post was edited to remove the following:\n \n"[QUOTE]"\n \nPlease take a moment to review the Community Guidelines to avoid making the same mistake again in the future.\n \nThank you for your cooperation in keeping the Community a welcoming, helpful, and respectful place for all users.\n \n-- The eBay Community Moderation Team',
    necroThread: 'Hi everyone,\n \nDue to the age of this thread, it has been closed to further replies. Please feel free to start a new thread if you wish to continue to discuss this topic.\n \nThank you for understanding.',
    opRequest: 'Hi everyone,\n \nThis thread has been closed at the request of the OP.\n \nThank you for understanding.',
    lockingOffTopic: 'Hi everyone,\n \nWe appreciate your participation in this discussion. However, the conversation has gone off-topic and has become a bit too heated. To help keep the community welcoming and constructive for all members, we\'re locking this thread from further replies.\n \nPlease remember to keep future discussions respectful and on-topic per our Community Guidelines.\n \nThank you for your understanding and for helping us keep the forums friendly and productive.\n \n— eBay Community Team',
    heatedDiscussion: 'Hi everyone,\n \nThis discussion has gotten a bit heated. Please remember that, while it is fine to disagree with others, discussion should always remain friendly and respectful as required by the Community Guidelines.\n \nThank you for your cooperation.',
    offTopic: 'Hi everyone,\n \nThis discussion has gotten a bit off topic. Please bring the discussion back to subject established in the original post.\n \nThank you.',
    bullying: 'Removed for not following our Community Guidelines: Please keep discussions respectful and open-minded. Differences of opinion are welcome, but conversations must remain friendly, inclusive, and considerate toward all members.',
    giftCardScam: 'Hi everyone, If you believe that you or someone you know was scammed into buying eBay Gift Cards, visit our gift card page to contact customer service and find additional information related to gift card scams. Thank you.',
    csRedirect: 'Hi [USERNAME], Thank you for submitting an inappropriate content report. However, please be advised that you have reached the eBay Community Moderation Team. Unfortunately, we are unable to assist you with your issue as we only deal with the Community.',
    gg01: 'Be respectful.',
    gg02: 'Share meaningful contributions.',
    gg03: 'Consequences and considerations: When posts veer off topic, the eBay Community team may move content at their discretion.',
    gg04: 'Reporting Inappropriate Content: The eBay Community is built for eBay users, and it is users like you who are likely to be the first to see posts that harm the community and violate Community Guidelines.',
    gg05: 'Not allowed: Publishing personal contact information of any person in any public area of eBay, including emails, phone numbers, name, street address, etc.',
    sg00: 'Refrain from posting content or taking actions that are:',
    sg01: 'adult, pornographic, violent, or mature in nature',
    sg02: 'language or threats prohibited in the Threats and offensive language policy',
    sg03: 'dishonest, unsubstantiated, or designed to mislead',
    sg04: 'duplicative or repetitive - including forum posts and replies',
    sg05: 'calling for petitions, boycotts, lawsuits, or other calls to activism',
    sg06: 'advertising listings, products, or services in order to solicit sales',
    sg07: 'promoting off-eBay sites, groups, or forums',
    sg08: 'reposted content that has been edited or removed by eBay Community staff',
    sg09: 'about moderation warnings or consequences',
    sg10: 'about another user listings or user IDs to tarnish their reputation',
    sg11: 'encouraging others to violate the eBay User Agreement or policies',
    sg12: 'of copyrighted content without the permission of the copyright owner'
  };

  const moderationActions = [
    { id: 'spam', priority: 'P1', title: 'Dealing with Spam Messages', color: 'bg-red-50 border-red-200', steps: ['Move relevant message to Moderated Content', 'Go to Khoros Care', 'Take Friendly PM or Warning PM from Additional Templates', 'Go to user profile link', 'Click Send a message and paste the template', 'Title: Post Removed', 'Fill Username, Title, and message sections', 'Add admin note to user profile', 'Close Care report as Mod Action Taken'] },
    { id: 'ban', priority: 'P2', title: 'Banning - Spammers', color: 'bg-orange-50 border-orange-200', steps: ['Claim multiple reports of same spammer', 'Reply to duplicate reports and close all but one', 'Use member username link to go to spammer profile', 'Mark all posts as spam or move to moderated content', 'Reply to remaining AR and close as Mod Action Taken', 'Search for username', 'Add Spammer tag to author profile', 'Close conversation as Mod Action Taken'] },
    { id: 'ban-non', priority: 'P3', title: 'Banning - Non Spammers', color: 'bg-pink-50 border-pink-200', steps: ['Use Response author profile to link to member profile', 'Ban using current process', 'Document admin notes', 'Add appropriate ban tag to author profile', 'Close original conversation as Mod Action Taken'] },
    { id: 'move', priority: 'P4', title: 'Moving a Post', color: 'bg-blue-50 border-blue-200', steps: ['Go to link of the post', 'Click down arrow on message', 'Select Move Message', 'Leave everything checked', 'Move to relevant category', 'Add Moved tag in Care', 'Close Abuse Report as Mod Action Taken'] },
    { id: 'edit', priority: 'P5', title: 'Dealing with Swearing', color: 'bg-yellow-50 border-yellow-200', steps: ['Use Friendly PM: Edited Post template', 'Fill Username, Guidelines, and removed message', 'Add admin note', 'Close as Mod Action Taken', 'Add Steered and Edited tags'] },
    { id: 'bullying', priority: 'P6', title: 'Dealing with Bullying', color: 'bg-rose-50 border-rose-200', steps: ['Edit the bullying message with [Removed by Moderator]', 'Reply to the bully with: Removed for not following our Community Guidelines: Please keep discussions respectful and open-minded. Differences of opinion are welcome, but conversations must remain friendly, inclusive, and considerate toward all members.'] },
    { id: 'necro', priority: 'P7', title: 'Topics Older than 6 Months', color: 'bg-purple-50 border-purple-200', steps: ['Use necro thread macro from Additional Templates', 'Close the thread for new replies'] },
    { id: 'abuse', priority: 'P8', title: 'Abuse & Filter Reports', color: 'bg-teal-50 border-teal-200', steps: ['Claim and look for other reports on same user', 'If NAR, reply and close as NAR', 'If action needed, search for reported conversation', 'Claim the conversation', 'Take appropriate moderation action', 'Add tag for Edited, Moved, Moderated or Locked', 'Document action in admin notes', 'Reply to AR with actions taken', 'Close as Mod Action Taken'] },
    { id: 'closing', priority: 'P9', title: 'Closing Reports', color: 'bg-indigo-50 border-indigo-200', steps: ['If no action needed, close as NAR', 'If action needed, close as Mod Action Taken', 'Reply to AR, no need for FR', 'If PM from AR, reply but do not close', 'If duplicate, reply and close as Duplicate Report'] },
    { id: 'merging', priority: 'P10', title: 'Merging Topics', color: 'bg-cyan-50 border-cyan-200', steps: ['Topics can be moved to another forum', 'To merge, use Post ID from url', 'Navigate to post to move', 'Click down arrow, select Move Message', 'Select Merge with existing topic', 'Enter Destination Post ID', 'Configure options: Leave placeholder, Do not notify, Clear mutes', 'Click Move Post'] }
  ];

  const faqItems = [
    { id: 'spam', question: 'How do I identify spam posts?', answer: 'Spam posts typically include:\n- Repetitive content posted multiple times\n- Links to external websites for commercial purposes\n- Unsolicited advertising or promotion\n- Off-topic promotional material\n- Posts from newly created accounts with suspicious patterns' },
    { id: 'naming', question: 'What is naming and shaming?', answer: 'Naming and shaming occurs when a user publicly calls out another user by username or references their listings in a negative way. This violates community guidelines as it can lead to harassment and does not contribute to constructive discussion.' },
    { id: 'escalation', question: 'When should I escalate to a ban?', answer: 'Consider escalation to a ban when:\n- User has received multiple warnings without behavior change\n- Severe violation of community guidelines\n- Spam account with clear malicious intent\n- User continues posting after removal of content\n- Pattern of persistent policy violations' },
    { id: 'editing', question: 'When should I edit vs. remove a post?', answer: 'Edit posts when: Only a portion violates guidelines, Main content is valuable, Minor profanity can be removed\n\nRemove posts when: Entire post violates guidelines, Post is spam, Content cannot be salvaged, Multiple violations' },
    { id: 'priority', question: 'How do I determine flag priority?', answer: 'P1: Immediate threats, explicit content, severe harassment\nP2: Spam accounts, repeated violations, ban-worthy offenses\nP3: Posts in wrong category\nP4: Minor violations, profanity, posts needing editing' },
    { id: 'response', question: 'What are response times?', answer: 'P1: Within 1 hour\nP2: Within 4 hours\nP3: Within 24 hours\nP4: Within 48 hours\n\nThese are guidelines; use judgment based on severity.' }
  ];

  const templateList = [
    { id: 'friendlyRemovedPost', name: 'Friendly PM: Removed Post', content: templates.friendlyRemovedPost, isDynamic: true, type: 'removed' },
    { id: 'warningRemovedPost', name: 'Warning PM: Removed Post', content: templates.warningRemovedPost, isDynamic: true, type: 'removed' },
    { id: 'friendlyEditedPost', name: 'Friendly PM: Edited Post', content: templates.friendlyEditedPost, isDynamic: true, type: 'edited' },
    { id: 'warningEditedPost', name: 'Warning PM: Edited Post', content: templates.warningEditedPost, isDynamic: true, type: 'edited' },
    { id: 'necroThread', name: 'Locking: Necro Thread', content: templates.necroThread },
    { id: 'opRequest', name: 'Locking: OP Request', content: templates.opRequest },
    { id: 'lockingOffTopic', name: 'Locking: Off Topic', content: templates.lockingOffTopic },
    { id: 'heatedDiscussion', name: 'Steering: Heated Discussion', content: templates.heatedDiscussion },
    { id: 'offTopic', name: 'Steering: Off Topic', content: templates.offTopic },
    { id: 'bullying', name: 'Bullying Reply', content: templates.bullying },
    { id: 'giftCardScam', name: 'Gift Card Scam Reply', content: templates.giftCardScam },
    { id: 'csRedirect', name: 'PM: CS Redirect', content: templates.csRedirect, isDynamic: true, type: 'username' }
  ];

  const guidelinesList = [
    { id: 'gg01', name: 'GG01: Be respectful', content: templates.gg01 },
    { id: 'gg02', name: 'GG02: Meaningful contributions', content: templates.gg02 },
    { id: 'gg03', name: 'GG03: Consequences', content: templates.gg03 },
    { id: 'gg04', name: 'GG04: Reporting Content', content: templates.gg04 },
    { id: 'gg05', name: 'GG05: Personal info', content: templates.gg05 },
    { id: 'sg00', name: 'SG00: Refrain from', content: templates.sg00 },
    { id: 'sg01', name: 'SG01: Adult content', content: templates.sg01 },
    { id: 'sg02', name: 'SG02: Threats', content: templates.sg02 },
    { id: 'sg03', name: 'SG03: Dishonest', content: templates.sg03 },
    { id: 'sg04', name: 'SG04: Duplicative', content: templates.sg04 },
    { id: 'sg05', name: 'SG05: Activism', content: templates.sg05 },
    { id: 'sg06', name: 'SG06: Advertising', content: templates.sg06 },
    { id: 'sg07', name: 'SG07: Off-eBay sites', content: templates.sg07 },
    { id: 'sg08', name: 'SG08: Reposted content', content: templates.sg08 },
    { id: 'sg09', name: 'SG09: Mod warnings', content: templates.sg09 },
    { id: 'sg10', name: 'SG10: Naming/shaming', content: templates.sg10 },
    { id: 'sg11', name: 'SG11: Policy violations', content: templates.sg11 },
    { id: 'sg12', name: 'SG12: Copyright', content: templates.sg12 }
  ];

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy');
    }
  };

  const updateTemplateInput = (templateId, field, value) => {
    setTemplateInputs(prev => {
      const updates = { [field]: value };
      
      // Auto-populate "here" field with URL for edited post templates
      if (field === 'url' && value && (templateId === 'friendlyEditedPost' || templateId === 'warningEditedPost')) {
        updates.here = value;
      }
      
      return {
        ...prev,
        [templateId]: { ...prev[templateId], ...updates }
      };
    });
  };

  const clearTemplateInputs = (templateId) => {
    const defaults = {
      friendlyRemovedPost: { url: '', username: '', title: '', datetime: '', guidelines: '', quote: '' },
      warningRemovedPost: { url: '', username: '', title: '', datetime: '', guidelines: '', quote: '' },
      friendlyEditedPost: { url: '', username: '', here: '', guidelines: '', quote: '' },
      warningEditedPost: { url: '', username: '', here: '', guidelines: '', quote: '' },
      csRedirect: { username: '' },
      banCombined: { banPeriod: '1 Day', reasoning: '', username: '', email: '', ip: '', spamUrl: '', startDate: '' }
    };
    if (defaults[templateId]) {
      setTemplateInputs(prev => ({ ...prev, [templateId]: defaults[templateId] }));
    }
  };

  const getPopulatedTemplate = (templateId, baseTemplate) => {
    const inputs = templateInputs[templateId] || {};
    let populated = baseTemplate;
    
    if (templateId.includes('Removed')) {
      populated = populated
        .replace('[USERNAME]', inputs.username || '[USERNAME]')
        .replace('[TITLE]', inputs.title || '[TITLE]')
        .replace('[DATE_TIME]', inputs.datetime || '[DATE_TIME]')
        .replace('[GUIDELINES]', inputs.guidelines || '[GUIDELINES]')
        .replace('[QUOTE]', inputs.quote || '[QUOTE]');
    } else if (templateId.includes('Edited')) {
      populated = populated
        .replace('[USERNAME]', inputs.username || '[USERNAME]')
        .replace('[HERE]', inputs.here || '[HERE]')
        .replace('[GUIDELINES]', inputs.guidelines || '[GUIDELINES]')
        .replace('[QUOTE]', inputs.quote || '[QUOTE]');
    } else if (templateId === 'csRedirect') {
      populated = populated.replace('[USERNAME]', inputs.username || '[USERNAME]');
    } else if (templateId === 'banCombined') {
      const banLength = inputs.banPeriod === '1 Day' ? '1 day' : 
                        inputs.banPeriod === '3 Days' ? '3 days' :
                        inputs.banPeriod === '7 Days' ? '7 days' :
                        inputs.banPeriod === '30 Days' ? '30 days' : 'indefinite';
      populated = 'Internal Reason\n\n' + inputs.banPeriod + ' Login Restriction\n\nReasoning: ' + (inputs.reasoning || '[Reasoning]') + '\nUsername: ' + (inputs.username || '[Username]') + '\nEmail: ' + (inputs.email || '[Email]') + '\nIP: ' + (inputs.ip || '[IP]') + '\nSpam URL: ' + (inputs.spamUrl || '[URL]') + '\nStart Date: ' + (inputs.startDate || '[DATE]') + '\nBan Length: ' + banLength + '\n\n---\n\nPublic Reason\n\nViolating the rules and policies of the eBay Community with actions such as ' + (inputs.reasoning || '[Reasoning]') + '. Your ban is effective from ' + (inputs.startDate || '[DATE]') + ' and will last ' + banLength + '.';
    }
    return populated;
  };

  const addFlag = (priority, actionType) => {
    setCounters(prev => ({
      ...prev,
      [priority]: { ...prev[priority], [actionType]: prev[priority][actionType] + 1 }
    }));
  };

  const removeFlag = (priority, actionType) => {
    setCounters(prev => ({
      ...prev,
      [priority]: { ...prev[priority], [actionType]: Math.max(0, prev[priority][actionType] - 1) }
    }));
  };

  const resetCounters = () => {
    const emptyCounters = {
      P1: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
      P2: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
      P3: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
      P4: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 }
    };
    setCounters(emptyCounters);
    setShowResetConfirm(false);
  };

  const getTotalForPriority = (priority) => {
    return Object.values(counters[priority] || {}).reduce((sum, count) => sum + count, 0);
  };

  const getTotalFlags = () => {
    return Object.keys(counters).reduce((sum, priority) => sum + getTotalForPriority(priority), 0);
  };

  const generateEOSReport = () => {
    const totalFlags = getTotalFlags();
    let report = '**Posts QAed: ' + totalFlags + '**\n';
    ['P1', 'P2', 'P3', 'P4'].forEach(priority => {
      const total = getTotalForPriority(priority);
      if (total > 0) {
        report += '* ' + priority + ' reports: ' + total + '\n';
        modActionTypes.forEach(actionType => {
          const count = counters[priority][actionType];
          if (count > 0) {
            report += '   * ' + count + ' ' + actionType + '\n';
          }
        });
      }
    });
    return report;
  };

  const updateAdminNoteInput = (noteId, field, value) => {
    setAdminNoteInputs(prev => ({
      ...prev,
      [noteId]: { ...prev[noteId], [field]: value }
    }));
  };

  const getPopulatedAdminNote = (noteId) => {
    const inputs = adminNoteInputs[noteId];
    return '<a href="' + (inputs.link || '[link]') + '">Edited Post</a> to remove "' + (inputs.removed || '[removed portion]') + '".\nSent user a friendly PM for: ' + (inputs.violation || '[violation]');
  };

  const getAdminNoteFromTemplate = (templateId) => {
    const inputs = templateInputs[templateId] || {};
    const isEdited = templateId.includes('Edited');
    const isFriendly = templateId.includes('friendly');
    
    if (isEdited) {
      const postUrl = inputs.url || inputs.here || '[link]';
      const removedText = inputs.quote || '[removed portion]';
      const violation = inputs.guidelines || '[violation]';
      const pmType = isFriendly ? 'friendly PM' : 'warning PM';
      
      return '<a href="' + postUrl + '">Edited Post</a> to remove "' + removedText + '".\nSent user a ' + pmType + ' for: ' + violation;
    } else {
      // Removed post
      const postUrl = inputs.url || '[link]';
      const removedText = inputs.quote || '[removed portion]';
      const violation = inputs.guidelines || '[violation]';
      const pmType = isFriendly ? 'friendly PM' : 'warning PM';
      
      return '<a href="' + postUrl + '">Removed Post</a> - "' + removedText + '".\nSent user a ' + pmType + ' for: ' + violation;
    }
  };

  const bgClass = darkMode ? 'min-h-screen bg-slate-900 p-6' : 'min-h-screen bg-slate-50 p-6';
  const cardBg = darkMode ? 'bg-slate-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-slate-100' : 'text-slate-800';
  const textSecondary = darkMode ? 'text-slate-400' : 'text-slate-600';
  const borderColor = darkMode ? 'border-slate-700' : 'border-slate-200';

  return h('div', { className: bgClass },
    h('div', { className: 'max-w-5xl mx-auto' },
      h('div', { className: `${cardBg} rounded-lg shadow-lg p-6 mb-6 ${borderColor} border` },
        h('div', { className: 'flex items-center gap-3 mb-4' },
          h('div', { className: 'w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center' },
            h('svg', { className: 'w-7 h-7 text-white', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
              h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' })
            )
          ),
          h('div', { className: 'flex-1' },
            h('h1', { className: `text-3xl font-bold ${textPrimary}` }, 'eBay Community Moderation'),
            h('p', { className: textSecondary }, 'Quick reference guide with ready-to-use templates')
          ),
          h('div', { className: 'flex items-center gap-3' },
            h('a', { 
              href: 'https://ebay.response.lithium.com/khoros/login', 
              target: '_blank', 
              rel: 'noopener noreferrer',
              className: 'px-4 py-2 rounded-lg font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors'
            }, 'Login to Care'),
            h('button', { 
              onClick: () => setDarkMode(!darkMode),
              className: `px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`
            },
              darkMode ? h(React.Fragment, null, h(Sun, { className: 'w-5 h-5' }), h('span', null, 'Light')) : h(React.Fragment, null, h(Moon, { className: 'w-5 h-5' }), h('span', null, 'Dark'))
            )
          )
        ),
        h('div', { className: `${darkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-lg p-4 border-2 ${borderColor}` },
          h('div', { className: 'flex items-center justify-between mb-3' },
            h('h3', { className: `font-semibold ${textPrimary}` }, 'Today\'s Flags Resolved'),
            h('button', {
              onClick: () => setShowResetConfirm(true),
              className: `text-xs px-3 py-1 rounded ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`
            }, 'Reset All')
          ),
          h('div', { className: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3' },
            ['P1', 'P2', 'P3', 'P4'].map((priority) => {
              const total = getTotalForPriority(priority);
              const isOpen = openDropdown === priority;
              const narCount = (counters[priority] && counters[priority].NAR) || 0;
              return h('div', { 
                key: priority, 
                className: `${cardBg} rounded-lg p-2 sm:p-3 border-2 ${borderColor} relative min-w-0`,
                ref: (el) => { if (el) dropdownRefs.current[priority] = el; }
              },
                h('div', { className: `text-xs font-semibold mb-1 text-center ${textSecondary}` }, priority),
                h('div', { className: 'text-2xl sm:text-3xl font-bold text-blue-600 mb-2 text-center' }, total),
                h('button', { 
                  onClick: () => setOpenDropdown(isOpen ? null : priority),
                  className: 'w-full py-1.5 sm:py-2 bg-blue-100 hover:bg-blue-200 rounded flex items-center justify-center gap-1 mb-2'
                },
                  isOpen 
                    ? h(React.Fragment, null, h('span', { className: 'text-xs font-semibold text-blue-700' }, 'Close'), h(ChevronUp, { className: 'w-3 h-3 text-blue-700' }))
                    : h(Plus, { className: 'w-4 h-4 text-blue-700' })
                ),
                h('div', { className: 'flex items-center justify-center gap-1' },
                  h('button', { 
                    onClick: () => removeFlag(priority, 'NAR'),
                    className: 'w-6 h-6 flex items-center justify-center rounded flex-shrink-0 transition-colors',
                    style: { backgroundColor: 'rgb(254, 226, 226)' }
                  }, h(Minus, { className: 'w-3 h-3 text-red-600' })),
                  h('div', { className: `px-1.5 py-0.5 rounded ${darkMode ? 'bg-gray-800' : 'bg-gray-800'} text-center flex-shrink-0` },
                    h('span', { className: 'text-xs font-medium text-gray-300 whitespace-nowrap' }, 'NAR '),
                    h('span', { className: 'text-xs font-bold text-white' }, narCount)
                  ),
                  h('button', { 
                    onClick: () => addFlag(priority, 'NAR'),
                    className: 'w-6 h-6 flex items-center justify-center rounded flex-shrink-0 transition-colors',
                    style: { backgroundColor: 'rgb(220, 252, 231)' }
                  }, h(Plus, { className: 'w-3 h-3 text-green-600' }))
                ),
                isOpen && h('div', { className: `absolute top-full left-1/2 -translate-x-1/2 mt-2 ${cardBg} border-2 ${borderColor} rounded-lg shadow-lg z-10 p-2 w-48` },
                  h('div', { className: 'space-y-2' },
                    dropdownActionTypes.map(actionType => {
                      const count = counters[priority][actionType] || 0;
                      return h('div', { 
                        key: actionType, 
                        className: `flex items-center gap-2 ${darkMode ? 'bg-slate-700' : 'bg-slate-50'} p-2 rounded`
                      },
                        h('button', { 
                          onClick: () => removeFlag(priority, actionType),
                          className: 'w-7 h-7 flex items-center justify-center bg-red-100 hover:bg-red-200 rounded flex-shrink-0'
                        }, h(Minus, { className: 'w-4 h-4 text-red-600' })),
                        h('div', { className: 'flex-1 text-center' },
                          h('div', { className: `text-xs font-medium ${textSecondary}` }, actionType),
                          h('div', { className: `text-lg font-bold ${textPrimary}` }, count)
                        ),
                        h('button', { 
                          onClick: () => addFlag(priority, actionType),
                          className: 'w-7 h-7 flex items-center justify-center bg-green-100 hover:bg-green-200 rounded flex-shrink-0'
                        }, h(Plus, { className: 'w-4 h-4 text-green-600' }))
                      );
                    })
                  )
                )
              );
            }),
            h('div', { className: 'bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-2 sm:p-3 border-2 border-blue-400 text-center min-w-0' },
              h('div', { className: 'text-xs font-semibold text-blue-100 mb-1' }, 'TOTAL'),
              h('div', { className: 'text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3' }, getTotalFlags()),
              h('button', { 
                onClick: () => setShowEOSReport(true),
                className: 'w-full py-1.5 sm:py-2 bg-white hover:bg-blue-50 text-blue-600 rounded font-semibold text-sm'
              }, 'EOS')
            )
          )
        )
      ),
      showEOSReport && h('div', { className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4' },
        h('div', { className: `${cardBg} rounded-lg shadow-xl max-w-2xl w-full p-6` },
          h('div', { className: 'flex items-center justify-between mb-4' },
            h('h3', { className: `text-xl font-bold ${textPrimary}` }, 'End of Shift Report'),
            h('button', { onClick: () => setShowEOSReport(false), className: textSecondary }, '✕')
          ),
          h('div', { className: `${darkMode ? 'bg-slate-900' : 'bg-slate-50'} rounded-lg p-4 border-2 ${borderColor} mb-4 max-h-96 overflow-y-auto` },
            h('pre', { className: `text-sm ${textSecondary} whitespace-pre-wrap font-mono` }, generateEOSReport())
          ),
          h('div', { className: 'flex gap-3' },
            h('button', { 
              onClick: () => copyToClipboard(generateEOSReport(), 'eos-report'),
              className: 'flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2'
            },
              copiedId === 'eos-report' ? h(React.Fragment, null, h(Check, { className: 'w-5 h-5' }), 'Copied') : h(React.Fragment, null, h(Copy, { className: 'w-5 h-5' }), 'Copy')
            ),
            h('button', { 
              onClick: () => setShowEOSReport(false),
              className: `px-6 py-3 rounded-lg font-semibold ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`
            }, 'Close')
          )
        )
      ),
      showResetConfirm && h('div', { className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4' },
        h('div', { className: `${cardBg} rounded-lg shadow-xl max-w-md w-full p-6` },
          h('div', { className: 'flex items-center justify-between mb-4' },
            h('h3', { className: `text-xl font-bold ${textPrimary}` }, 'Reset All Counters?'),
            h('button', { onClick: () => setShowResetConfirm(false), className: textSecondary }, '✕')
          ),
          h('p', { className: `${textSecondary} mb-6` },
            'Are you sure you want to reset all counters? This action cannot be undone.'
          ),
          h('div', { className: 'flex gap-3' },
            h('button', { 
              onClick: resetCounters,
              className: 'flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold'
            }, 'Yes, Reset All'),
            h('button', { 
              onClick: () => setShowResetConfirm(false),
              className: `flex-1 py-3 rounded-lg font-semibold ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`
            }, 'Cancel')
          )
        )
      ),
      // Moderation Processes and Workflows Section
      h('div', { className: `${cardBg} rounded-lg shadow p-4 mb-6 border ${borderColor}` },
        h('button', { 
          onClick: () => setShowWorkflows(!showWorkflows),
          className: 'w-full flex items-center justify-between mb-3'
        },
          h('div', { className: 'flex items-center gap-3' },
            h('div', { className: 'w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center' },
              h('svg', { className: 'w-6 h-6 text-white', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' })
              )
            ),
            h('h3', { className: `font-bold text-lg ${textPrimary}` }, 'Moderation Processes and Workflows')
          ),
          h('div', { className: 'flex items-center gap-2' },
            h('span', { className: `text-sm ${textSecondary}` }, showWorkflows ? 'Hide' : 'Show'),
            showWorkflows ? h(ChevronUp, { className: `w-5 h-5 ${textSecondary}` }) : h(ChevronDown, { className: `w-5 h-5 ${textSecondary}` })
          )
        ),
        showWorkflows && h('div', { className: 'space-y-4 mt-4' },
        moderationActions.map((action) => {
          const isActive = activeAction === action.id;
          return h('div', { 
            key: action.id, 
            className: `border-2 rounded-lg overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : action.color}${isActive ? ' shadow-lg' : ' shadow'}`
          },
            h('button', { 
              onClick: () => setActiveAction(isActive ? null : action.id),
              className: 'w-full p-4 flex items-center justify-between hover:bg-opacity-80'
            },
              h('div', { className: 'flex items-center gap-3' },
                h('div', { className: 'text-2xl' }, '📋'),
                h('h2', { className: `text-lg font-semibold ${textPrimary}` }, action.title)
              ),
              isActive ? h(ChevronUp, { className: `w-5 h-5 ${textSecondary}` }) : h(ChevronDown, { className: `w-5 h-5 ${textSecondary}` })
            ),
            isActive && h('div', { className: `${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white'} border-t-2 p-4` },
              h('div', { className: 'space-y-3' },
                action.steps.map((step, index) => 
                  h('div', { 
                    key: index, 
                    className: `flex items-start gap-3 p-3 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`
                  },
                    h('span', { className: `font-semibold text-sm ${textSecondary}` }, `${index + 1}.`),
                    h('span', { className: `text-sm flex-1 ${textSecondary}` }, step)
                  )
                )
              )
            )
          );
        })
        )
      ),
      // AI Moderation Assistant Section
      h('div', { className: `${cardBg} rounded-lg shadow p-4 mb-6 border ${borderColor}` },
        h('div', { className: 'flex items-center justify-between mb-4' },
          h('div', { className: 'flex items-center gap-3' },
            h('div', { className: 'w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center' },
              h('svg', { className: 'w-6 h-6 text-white', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' },
                h('path', { strokeLinecap: 'round', strokeLinejoin: 'round', strokeWidth: 2, d: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z' })
              )
            ),
            h('div', null,
              h('h3', { className: `font-bold text-lg ${textPrimary}` }, 'AI Moderation Assistant'),
              h('p', { className: `text-sm ${textSecondary}` }, 'Advanced moderation tools and automation for eBay community management')
            )
          )
        ),


        // AI History Panel (hidden from users, kept for development)
        false && showAIHistory && h('div', { className: `mb-4 p-4 rounded-lg border-2 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-green-50 border-green-200'}` },
          h('div', { className: 'flex items-center justify-between mb-3' },
            h('h4', { className: `font-semibold ${textPrimary}` }, `AI Analysis History (${aiHistory.length})`),
            h('div', { className: `text-sm ${textSecondary}` }, `${getAiAccuracy()}% Accuracy`)
          ),
          aiHistory.length === 0 
            ? h('p', { className: `text-sm ${textSecondary} text-center py-4` }, 'No AI analyses yet. Run some tests to see history here.')
            : h('div', { className: 'space-y-2 max-h-96 overflow-y-auto' },
                aiHistory.slice(0, 10).map(record => 
                  h('div', { 
                    key: record.id,
                    className: `p-3 rounded border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`
                  },
                    h('div', { className: 'flex items-center justify-between mb-2' },
                      h('div', { className: 'flex items-center gap-2' },
                        h('span', { className: `px-2 py-1 text-xs rounded font-medium ${record.priority === 'P1' ? 'bg-red-100 text-red-700' : record.priority === 'P2' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}` }, record.priority),
                        h('span', { className: record.analysis.sentiment }, record.analysis.sentiment),
                        record.isCorrect !== null && (record.isCorrect 
                          ? h('span', { className: 'text-green-600 text-sm' }, '✅')
                          : h('span', { className: 'text-yellow-600 text-sm' }, '🔄'))
                      ),
                      h('span', { className: `text-xs ${textSecondary}` }, new Date(record.timestamp).toLocaleTimeString())
                    ),
                    h('p', { className: `text-sm ${textSecondary} mb-2` }, `"${record.content.slice(0, 60)}${record.content.length > 60 ? '...' : ''}"`),
                    h('div', { className: 'flex items-center justify-between text-xs' },
                      h('span', { className: `font-medium ${record.analysis.action === 'Ban' ? 'text-red-600' : record.analysis.action === 'NAR' ? 'text-green-600' : 'text-blue-600'}` }, 
                        `${record.analysis.violation} → ${record.analysis.action}`
                      ),
                      record.userOverride && h('span', { className: 'text-yellow-600' }, `Override: ${record.userOverride}`)
                    )
                  )
                )
              )
        ),


        // Main AI Assistant Interface (hidden from users - dev only)
        false && showAIAssistant && h('div', { className: `p-4 rounded-lg border-2 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-purple-50 border-purple-200'}` },
          h('p', { className: `text-center ${textSecondary}` }, 'AI Assistant interface hidden for production use')
        )
      ),
      
      h('div', { className: `${cardBg} rounded-lg shadow p-4 mb-6 border ${borderColor}` },
        h('button', { 
          onClick: () => setShowBanTemplates(!showBanTemplates),
          className: 'w-full flex items-center justify-between mb-3'
        },
          h('h3', { className: `font-semibold ${textPrimary}` }, 'Ban Templates'),
          h('div', { className: 'flex items-center gap-2' },
            h('span', { className: `text-sm ${textSecondary}` }, showBanTemplates ? 'Hide' : 'Show'),
            showBanTemplates ? h(ChevronUp, { className: `w-5 h-5 ${textSecondary}` }) : h(ChevronDown, { className: `w-5 h-5 ${textSecondary}` })
          )
        ),
        showBanTemplates && h('div', { className: `border rounded-lg overflow-hidden ${borderColor}` },
          h('div', { className: `${darkMode ? 'bg-orange-900' : 'bg-orange-100'} px-3 py-2 flex items-center justify-between border-b ${borderColor}` },
            h('span', { className: `text-sm font-semibold ${darkMode ? 'text-orange-100' : 'text-slate-700'}` }, 'Fill ban details'),
            h('div', { className: 'flex gap-2' },
              h('button', { 
                onClick: () => clearTemplateInputs('banCombined'),
                className: `px-3 py-1 rounded text-xs font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-300 hover:bg-slate-400 text-slate-700'}`
              }, 'Clear'),
              h('button', { 
                onClick: () => copyToClipboard(getPopulatedTemplate('banCombined', ''), 'banCombined'),
                className: 'flex items-center gap-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium'
              },
                copiedId === 'banCombined' ? h(React.Fragment, null, h(Check, { className: 'w-4 h-4' }), 'Copied') : h(React.Fragment, null, h(Copy, { className: 'w-4 h-4' }), 'Copy')
              )
            )
          ),
          h('div', { className: `${darkMode ? 'bg-slate-900' : 'bg-orange-50'} p-3 space-y-2` },
            h('select', { 
              value: templateInputs.banCombined.banPeriod,
              onChange: (e) => updateTemplateInput('banCombined', 'banPeriod', e.target.value),
              className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300'}`
            },
              h('option', { value: '1 Day' }, '1 Day'),
              h('option', { value: '3 Days' }, '3 Days'),
              h('option', { value: '7 Days' }, '7 Days'),
              h('option', { value: '30 Days' }, '30 Days'),
              h('option', { value: 'Indefinite' }, 'Indefinite')
            ),
            h('textarea', { 
              placeholder: 'Reasoning',
              value: templateInputs.banCombined.reasoning,
              onChange: (e) => updateTemplateInput('banCombined', 'reasoning', e.target.value),
              rows: 3,
              className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
            }),
            h('input', { 
              type: 'text',
              placeholder: 'Username',
              value: templateInputs.banCombined.username,
              onChange: (e) => updateTemplateInput('banCombined', 'username', e.target.value),
              className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
            }),
            h('input', { 
              type: 'text',
              placeholder: 'Email',
              value: templateInputs.banCombined.email,
              onChange: (e) => updateTemplateInput('banCombined', 'email', e.target.value),
              className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
            }),
            h('input', { 
              type: 'text',
              placeholder: 'IP',
              value: templateInputs.banCombined.ip,
              onChange: (e) => updateTemplateInput('banCombined', 'ip', e.target.value),
              className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
            }),
            h('input', { 
              type: 'text',
              placeholder: 'Spam URL',
              value: templateInputs.banCombined.spamUrl,
              onChange: (e) => updateTemplateInput('banCombined', 'spamUrl', e.target.value),
              className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
            }),
            h('input', { 
              type: 'date',
              value: templateInputs.banCombined.startDate,
              onChange: (e) => updateTemplateInput('banCombined', 'startDate', e.target.value),
              className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300'}`
            })
          ),
          h('div', { className: `${cardBg} p-3` },
            h('pre', { className: `text-xs ${textSecondary} whitespace-pre-wrap font-mono` }, getPopulatedTemplate('banCombined', ''))
          )
        )
      ),
      h('div', { className: `${cardBg} rounded-lg shadow p-4 mb-6 border ${borderColor}` },
        h('button', { 
          onClick: () => setShowAdditionalTemplates(!showAdditionalTemplates),
          className: 'w-full flex items-center justify-between mb-3'
        },
          h('h3', { className: `font-semibold ${textPrimary}` }, 'Additional Templates'),
          h('div', { className: 'flex items-center gap-2' },
            h('span', { className: `text-sm ${textSecondary}` }, showAdditionalTemplates ? 'Hide' : 'Show'),
            showAdditionalTemplates ? h(ChevronUp, { className: `w-5 h-5 ${textSecondary}` }) : h(ChevronDown, { className: `w-5 h-5 ${textSecondary}` })
          )
        ),
        showAdditionalTemplates && h(React.Fragment, null,
          h('div', { className: 'mb-3' },
            h('input', { 
              type: 'text',
              placeholder: 'Search templates...',
              value: templateSearch,
              onChange: (e) => setTemplateSearch(e.target.value),
              className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
            })
          ),
          h('div', { className: 'space-y-2' },
            templateList.filter(template => 
              template.name.toLowerCase().includes(templateSearch.toLowerCase())
            ).map((template) => {
              const isExpanded = expandedTemplates[template.id];
              const populatedContent = template.isDynamic ? getPopulatedTemplate(template.id, template.content) : template.content;
              return h('div', { 
                key: template.id, 
                className: `border rounded-lg overflow-hidden ${borderColor}`
              },
                h('div', { className: `${darkMode ? 'bg-slate-700' : 'bg-slate-100'} px-3 py-2 flex items-center justify-between border-b ${borderColor}` },
                  h('span', { className: `text-sm font-semibold ${textPrimary}` }, template.name),
                  h('div', { className: 'flex gap-2' },
                    h('button', { 
                      onClick: () => copyToClipboard(populatedContent, template.id),
                      className: 'flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium'
                    },
                      copiedId === template.id ? h(React.Fragment, null, h(Check, { className: 'w-4 h-4' }), 'Copied') : h(React.Fragment, null, h(Copy, { className: 'w-4 h-4' }), 'Copy')
                    ),
                    h('button', { 
                      onClick: () => setExpandedTemplates({...expandedTemplates, [template.id]: !isExpanded}),
                      className: `flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`
                    },
                      isExpanded ? h(React.Fragment, null, h(ChevronUp, { className: 'w-4 h-4' }), 'Hide') : h(React.Fragment, null, h(ChevronDown, { className: 'w-4 h-4' }), 'Show')
                    )
                  )
                ),
                isExpanded && h(React.Fragment, null,
                  template.isDynamic && h('div', { className: `${darkMode ? 'bg-slate-900' : 'bg-blue-50'} p-3 border-b ${borderColor} space-y-2` },
                    h('div', { className: 'flex items-center justify-between mb-2' },
                      h('div', { className: `text-xs font-semibold ${textSecondary}` }, 'Fill fields'),
                      h('div', { className: 'flex gap-2' },
                        template.type !== 'username' && h('button', { 
                          onClick: () => copyToClipboard(getAdminNoteFromTemplate(template.id), 'admin-' + template.id),
                          className: `px-3 py-1 rounded text-xs font-medium flex items-center gap-1 ${darkMode ? 'bg-green-700 hover:bg-green-600 text-slate-200' : 'bg-green-600 hover:bg-green-700 text-white'}`
                        },
                          copiedId === 'admin-' + template.id ? h(React.Fragment, null, h(Check, { className: 'w-3 h-3' }), 'Copied!') : h(React.Fragment, null, h(Copy, { className: 'w-3 h-3' }), 'Admin Notes')
                        ),
                        h('button', { 
                          onClick: () => clearTemplateInputs(template.id),
                          className: `px-3 py-1 rounded text-xs font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-300 hover:bg-slate-400 text-slate-700'}`
                        }, 'Clear')
                      )
                    ),
                    template.type !== 'username' && h('input', { 
                      type: 'text',
                      placeholder: 'Post URL',
                      value: templateInputs[template.id]?.url || '',
                      onChange: (e) => updateTemplateInput(template.id, 'url', e.target.value),
                      className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
                    }),
                    h('input', { 
                      type: 'text',
                      placeholder: 'USERNAME',
                      value: templateInputs[template.id]?.username || '',
                      onChange: (e) => updateTemplateInput(template.id, 'username', e.target.value),
                      className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
                    }),
                    template.type === 'removed' && h(React.Fragment, null,
                      h('input', { 
                        type: 'text',
                        placeholder: 'TITLE',
                        value: templateInputs[template.id]?.title || '',
                        onChange: (e) => updateTemplateInput(template.id, 'title', e.target.value),
                        className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
                      }),
                      h('input', { 
                        type: 'text',
                        placeholder: 'DATE_TIME',
                        value: templateInputs[template.id]?.datetime || '',
                        onChange: (e) => updateTemplateInput(template.id, 'datetime', e.target.value),
                        className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
                      })
                    ),
                    template.type === 'edited' && h('input', { 
                      type: 'text',
                      placeholder: 'HERE (link)',
                      value: templateInputs[template.id]?.here || '',
                      onChange: (e) => updateTemplateInput(template.id, 'here', e.target.value),
                      className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
                    }),
                    template.type !== 'username' && h(React.Fragment, null,
                      h('div', { className: 'space-y-2' },
                        h('div', { className: 'flex gap-2' },
                          h('select', {
                            onChange: (e) => {
                              if (e.target.value) {
                                selectGuideline(template.id, e.target.value);
                                e.target.value = ''; // Reset dropdown after selection
                              }
                            },
                            defaultValue: '',
                            className: `flex-1 px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300'}`
                          },
                            h('option', { value: '' }, 'Select Violated Guideline...'),
                            h('optgroup', { label: 'General Guidelines' },
                              guidelineOptions.filter(g => g.id.startsWith('gg')).map(guideline =>
                                h('option', { key: guideline.id, value: guideline.id }, guideline.name)
                              )
                            ),
                            h('optgroup', { label: 'Specific Guidelines' },
                              guidelineOptions.filter(g => g.id.startsWith('sg')).map(guideline =>
                                h('option', { key: guideline.id, value: guideline.id }, guideline.name)
                              )
                            ),
                            h('optgroup', { label: 'Custom' },
                              h('option', { value: 'other' }, '✏️ Other (type custom violation)')
                            )
                          ),
                          h('button', {
                            onClick: () => updateTemplateInput(template.id, 'guidelines', ''),
                            className: `px-3 py-2 text-sm rounded border ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600' : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'}`
                          }, 'Clear')
                        ),
                      h('input', { 
                        type: 'text',
                          placeholder: 'GUIDELINES (select from dropdown or type custom violation)',
                        value: templateInputs[template.id]?.guidelines || '',
                        onChange: (e) => updateTemplateInput(template.id, 'guidelines', e.target.value),
                          'data-template-id': template.id,
                          'data-field': 'guidelines',
                        className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
                        })
                      ),
                      h('textarea', { 
                        placeholder: 'QUOTE',
                        value: templateInputs[template.id]?.quote || '',
                        onChange: (e) => updateTemplateInput(template.id, 'quote', e.target.value),
                        rows: 3,
                        className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
                      })
                    )
                  ),
                  h('div', { className: `${cardBg} p-3` },
                    h('pre', { className: `text-xs ${textSecondary} whitespace-pre-wrap font-mono` }, populatedContent)
                  )
                )
              );
            })
          )
        )
      ),
      // Guidelines Section
      h('div', { className: `${cardBg} rounded-lg shadow p-4 mb-6 border ${borderColor}` },
        h('button', { 
          onClick: () => setShowGuidelines(!showGuidelines),
          className: 'w-full flex items-center justify-between mb-3'
        },
          h('h3', { className: `font-semibold ${textPrimary}` }, 'Guidelines'),
          h('div', { className: 'flex items-center gap-2' },
            h('span', { className: `text-sm ${textSecondary}` }, showGuidelines ? 'Hide' : 'Show'),
            showGuidelines ? h(ChevronUp, { className: `w-5 h-5 ${textSecondary}` }) : h(ChevronDown, { className: `w-5 h-5 ${textSecondary}` })
          )
        ),
        showGuidelines && h(React.Fragment, null,
          h('div', { className: 'mb-3' },
            h('input', { 
              type: 'text',
              placeholder: 'Search guidelines...',
              value: guidelinesSearch,
              onChange: (e) => setGuidelinesSearch(e.target.value),
              className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
            })
          ),
          h('div', { className: 'space-y-2' },
            guidelinesList.filter(guideline => 
              guideline.name.toLowerCase().includes(guidelinesSearch.toLowerCase())
            ).map((guideline) => {
              const isExpanded = expandedGuidelines[guideline.id];
              return h('div', { 
                key: guideline.id, 
                className: `border rounded-lg overflow-hidden ${borderColor}`
              },
                h('div', { className: `${darkMode ? 'bg-slate-700' : 'bg-slate-100'} px-3 py-2 flex items-center justify-between border-b ${borderColor}` },
                  h('span', { className: `text-sm font-semibold ${textPrimary}` }, guideline.name),
                  h('div', { className: 'flex gap-2' },
                    h('button', { 
                      onClick: () => copyToClipboard(guideline.content, guideline.id),
                      className: 'flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium'
                    },
                      copiedId === guideline.id ? h(React.Fragment, null, h(Check, { className: 'w-4 h-4' }), 'Copied') : h(React.Fragment, null, h(Copy, { className: 'w-4 h-4' }), 'Copy')
                    ),
                    h('button', { 
                      onClick: () => setExpandedGuidelines({...expandedGuidelines, [guideline.id]: !isExpanded}),
                      className: `flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`
                    },
                      isExpanded ? h(React.Fragment, null, h(ChevronUp, { className: 'w-4 h-4' }), 'Hide') : h(React.Fragment, null, h(ChevronDown, { className: 'w-4 h-4' }), 'Show')
                    )
                  )
                ),
                isExpanded && h('div', { className: `${cardBg} p-3` },
                  h('pre', { className: `text-xs ${textSecondary} whitespace-pre-wrap font-mono` }, guideline.content)
                )
              );
            })
          )
        )
      ),
      h('div', { className: `${cardBg} rounded-lg shadow p-4 mb-6 border ${borderColor}` },
        h('div', { className: 'flex items-center justify-between mb-3' },
          h('h3', { className: `font-semibold ${textPrimary}` }, 'Admin Notes'),
          h('div', { className: 'flex items-center gap-2' },
            showAdminNotes && h('button', { 
              onClick: () => copyToClipboard(getPopulatedAdminNote('edited'), 'admin-edited'),
              className: 'flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium'
            },
              copiedId === 'admin-edited' ? h(React.Fragment, null, h(Check, { className: 'w-4 h-4' }), 'Copied') : h(React.Fragment, null, h(Copy, { className: 'w-4 h-4' }), 'Copy')
            ),
            h('button', { 
              onClick: () => setShowAdminNotes(!showAdminNotes),
              className: 'flex items-center gap-1'
            },
              h('span', { className: `text-sm ${textSecondary}` }, showAdminNotes ? 'Hide' : 'Show'),
              showAdminNotes ? h(ChevronUp, { className: `w-5 h-5 ${textSecondary}` }) : h(ChevronDown, { className: `w-5 h-5 ${textSecondary}` })
            )
          )
        ),
        showAdminNotes && h('div', { className: `space-y-3 pt-3 border-t ${borderColor}` },
          h('input', { 
            type: 'text',
            placeholder: 'Link to post',
            value: adminNoteInputs.edited.link,
            onChange: (e) => updateAdminNoteInput('edited', 'link', e.target.value),
            className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
          }),
          h('input', { 
            type: 'text',
            placeholder: 'Removed portion',
            value: adminNoteInputs.edited.removed,
            onChange: (e) => updateAdminNoteInput('edited', 'removed', e.target.value),
            className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
          }),
          h('div', { className: 'space-y-2' },
            h('div', { className: 'flex gap-2' },
              h('select', {
                onChange: (e) => {
                  if (e.target.value) {
                    selectAdminNoteViolation(e.target.value);
                    e.target.value = ''; // Reset dropdown after selection
                  }
                },
                defaultValue: '',
                className: `flex-1 px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300'}`
              },
                h('option', { value: '' }, 'Select Violated Guideline...'),
                h('optgroup', { label: 'General Guidelines' },
                  guidelineOptions.filter(g => g.id.startsWith('gg')).map(guideline =>
                    h('option', { key: guideline.id, value: guideline.id }, guideline.name)
                  )
                ),
                h('optgroup', { label: 'Specific Guidelines' },
                  guidelineOptions.filter(g => g.id.startsWith('sg')).map(guideline =>
                    h('option', { key: guideline.id, value: guideline.id }, guideline.name)
                  )
                ),
                h('optgroup', { label: 'Custom' },
                  h('option', { value: 'other' }, '✏️ Other (type custom violation)')
                )
              ),
              h('button', {
                onClick: () => updateAdminNoteInput('edited', 'violation', ''),
                className: `px-3 py-2 text-sm rounded border ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200 border-slate-600' : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'}`
              }, 'Clear')
            ),
            h('input', { 
              type: 'text',
              placeholder: 'Rule violation (select from dropdown or type custom)',
              value: adminNoteInputs.edited.violation,
              onChange: (e) => updateAdminNoteInput('edited', 'violation', e.target.value),
              'data-admin-field': 'violation',
              className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
            })
          ),
          h('div', { className: `rounded-lg p-3 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}` },
            h('pre', { className: `text-xs whitespace-pre-wrap font-mono ${textSecondary}` }, getPopulatedAdminNote('edited'))
          )
        )
      ),
      h('div', { className: `${cardBg} rounded-lg shadow p-4 mb-6 border ${borderColor}` },
        h('button', { 
          onClick: () => setShowFAQ(!showFAQ),
          className: 'w-full flex items-center justify-between mb-3'
        },
          h('h3', { className: `font-semibold ${textPrimary}` }, 'FAQ'),
          h('div', { className: 'flex items-center gap-2' },
            h('span', { className: `text-sm ${textSecondary}` }, showFAQ ? 'Hide' : 'Show'),
            showFAQ ? h(ChevronUp, { className: `w-5 h-5 ${textSecondary}` }) : h(ChevronDown, { className: `w-5 h-5 ${textSecondary}` })
          )
        ),
        showFAQ && h('div', { className: 'space-y-2' },
          faqItems.map((faq) => 
            h('div', { 
              key: faq.id, 
              className: `border rounded-lg overflow-hidden ${borderColor}`
            },
              h('button', { 
                onClick: () => setExpandedFAQ({...expandedFAQ, [faq.id]: !expandedFAQ[faq.id]}),
                className: `w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-100'} px-3 py-2 flex items-center justify-between hover:bg-opacity-80`
              },
                h('span', { className: `text-sm font-semibold text-left ${textPrimary}` }, faq.question),
                expandedFAQ[faq.id] ? h(ChevronUp, { className: `w-4 h-4 flex-shrink-0 ml-2 ${textSecondary}` }) : h(ChevronDown, { className: `w-4 h-4 flex-shrink-0 ml-2 ${textSecondary}` })
              ),
              expandedFAQ[faq.id] && h('div', { className: `p-3 ${darkMode ? 'bg-slate-800' : 'bg-white'} border-t ${borderColor}` },
                h('p', { className: `text-sm whitespace-pre-wrap ${textSecondary}` }, faq.answer)
              )
            )
          )
        )
      ),
      h('div', { className: `rounded-lg shadow p-4 text-center text-sm ${cardBg} ${textSecondary} border ${borderColor}` },
        h('p', null, 'Contact: ', h('a', { href: 'mailto:tuna.yilmaz@ignitetech.ai', className: 'text-blue-600 underline' }, 'tuna.yilmaz@ignitetech.ai'), ', ', h('a', { href: 'mailto:c-tuna.yilmaz@khoros.com', className: 'text-blue-600 underline' }, 'c-tuna.yilmaz@khoros.com'), ', ', h('a', { href: 'mailto:lightattah@ignitetech.com', className: 'text-blue-600 underline' }, 'lightattah@ignitetech.com'), ' or ', h('a', { href: 'mailto:c-light.attah@khoros.com', className: 'text-blue-600 underline' }, 'c-light.attah@khoros.com')),
        h('p', { className: 'mt-2 text-xs' }, 'Version 2.3.3')
      )
    )
  );
};

// Render the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const root = createRoot(document.getElementById('root'));
  root.render(h(ModerationTool));
});