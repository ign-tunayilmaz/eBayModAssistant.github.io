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
  const [showAdminNotes, setShowAdminNotes] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [expandedFAQ, setExpandedFAQ] = useState({});
  const [darkMode, setDarkMode] = useState(false);
  const [templateSearch, setTemplateSearch] = useState('');
  const dropdownRefs = useRef({});
  
  const [templateInputs, setTemplateInputs] = useState({
    friendlyRemovedPost: { username: '', title: '', datetime: '', guidelines: '', quote: '' },
    warningRemovedPost: { username: '', title: '', datetime: '', guidelines: '', quote: '' },
    friendlyEditedPost: { username: '', here: '', guidelines: '', quote: '' },
    warningEditedPost: { username: '', here: '', guidelines: '', quote: '' },
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

  // V5 FIX: Schema validation helpers for localStorage data
  const validateCounters = (data) => {
    if (typeof data !== 'object' || data === null) return false;
    const validPriorities = ['P1', 'P2', 'P3', 'P4'];
    const validActions = ['NAR', 'Edit', 'Steer', 'Remove', 'Ban', 'Locked', 'Moved'];
    return validPriorities.every(p => 
      data[p] && typeof data[p] === 'object' &&
      validActions.every(a => typeof data[p][a] === 'number' && data[p][a] >= 0)
    );
  };

  const validateTemplateInputs = (data) => {
    if (typeof data !== 'object' || data === null) return false;
    const requiredKeys = ['friendlyRemovedPost', 'warningRemovedPost', 'friendlyEditedPost', 'warningEditedPost', 'csRedirect', 'banCombined'];
    return requiredKeys.every(key => typeof data[key] === 'object');
  };

  const validateAdminNotes = (data) => {
    if (typeof data !== 'object' || data === null) return false;
    return data.edited && typeof data.edited === 'object';
  };

  const safeParseJSON = (str, validator) => {
    try {
      const parsed = JSON.parse(str);
      if (validator && !validator(parsed)) {
        console.warn('Invalid data structure, using defaults');
        return null;
      }
      return parsed;
    } catch (e) {
      console.warn('Failed to parse JSON:', e.message);
      return null;
    }
  };

  // Load data from localStorage on mount with validation
  useEffect(() => {
    try {
      const savedCounters = localStorage.getItem('ebay-mod-counters');
      const savedTemplateInputs = localStorage.getItem('ebay-mod-template-inputs');
      const savedAdminNotes = localStorage.getItem('ebay-mod-admin-notes');
      const savedDarkMode = localStorage.getItem('ebay-mod-dark-mode');
      
      // V5 FIX: Validate data before setting state
      const parsedCounters = savedCounters ? safeParseJSON(savedCounters, validateCounters) : null;
      const parsedTemplateInputs = savedTemplateInputs ? safeParseJSON(savedTemplateInputs, validateTemplateInputs) : null;
      const parsedAdminNotes = savedAdminNotes ? safeParseJSON(savedAdminNotes, validateAdminNotes) : null;
      const parsedDarkMode = savedDarkMode ? safeParseJSON(savedDarkMode, (v) => typeof v === 'boolean') : null;
      
      if (parsedCounters) setCounters(parsedCounters);
      if (parsedTemplateInputs) setTemplateInputs(parsedTemplateInputs);
      if (parsedAdminNotes) setAdminNoteInputs(parsedAdminNotes);
      if (parsedDarkMode !== null) setDarkMode(parsedDarkMode);
    } catch (error) {
      console.error('Error loading saved data:', error);
      // Clear potentially corrupted localStorage
      localStorage.removeItem('ebay-mod-counters');
      localStorage.removeItem('ebay-mod-template-inputs');
      localStorage.removeItem('ebay-mod-admin-notes');
      localStorage.removeItem('ebay-mod-dark-mode');
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
    { id: 'csRedirect', name: 'PM: CS Redirect', content: templates.csRedirect, isDynamic: true, type: 'username' },
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
    setTemplateInputs(prev => ({
      ...prev,
      [templateId]: { ...prev[templateId], [field]: value }
    }));
  };

  const clearTemplateInputs = (templateId) => {
    const defaults = {
      friendlyRemovedPost: { username: '', title: '', datetime: '', guidelines: '', quote: '' },
      warningRemovedPost: { username: '', title: '', datetime: '', guidelines: '', quote: '' },
      friendlyEditedPost: { username: '', here: '', guidelines: '', quote: '' },
      warningEditedPost: { username: '', here: '', guidelines: '', quote: '' },
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
          h('div', { className: 'grid grid-cols-5 gap-3' },
            ['P1', 'P2', 'P3', 'P4'].map((priority) => {
              const total = getTotalForPriority(priority);
              const isOpen = openDropdown === priority;
              return h('div', { 
                key: priority, 
                className: `${cardBg} rounded-lg p-3 border-2 ${borderColor} relative`,
                ref: (el) => { if (el) dropdownRefs.current[priority] = el; }
              },
                h('div', { className: `text-xs font-semibold mb-1 text-center ${textSecondary}` }, priority),
                h('div', { className: 'text-3xl font-bold text-blue-600 mb-2 text-center' }, total),
                h('button', { 
                  onClick: () => setOpenDropdown(isOpen ? null : priority),
                  className: 'w-full py-2 bg-blue-100 hover:bg-blue-200 rounded flex items-center justify-center gap-1'
                },
                  isOpen ? h(React.Fragment, null, h('span', { className: 'text-xs font-semibold text-blue-700' }, 'Close'), h(ChevronUp, { className: 'w-3 h-3 text-blue-700' })) : h(Plus, { className: 'w-4 h-4 text-blue-700' })
                ),
                isOpen && h('div', { className: `absolute top-full left-1/2 -translate-x-1/2 mt-2 ${cardBg} border-2 ${borderColor} rounded-lg shadow-lg z-10 p-2 w-48` },
                  h('div', { className: 'space-y-2' },
                    modActionTypes.map(actionType => {
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
            h('div', { className: 'bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 border-2 border-blue-400 text-center' },
              h('div', { className: 'text-xs font-semibold text-blue-100 mb-1' }, 'TOTAL'),
              h('div', { className: 'text-3xl font-bold text-white mb-3' }, getTotalFlags()),
              h('button', { 
                onClick: () => setShowEOSReport(true),
                className: 'w-full py-2 bg-white hover:bg-blue-50 text-blue-600 rounded font-semibold text-sm'
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
      h('div', { className: 'space-y-4 mb-6' },
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
                      h('button', { 
                        onClick: () => clearTemplateInputs(template.id),
                        className: `px-3 py-1 rounded text-xs font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-300 hover:bg-slate-400 text-slate-700'}`
                      }, 'Clear')
                    ),
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
                      h('input', { 
                        type: 'text',
                        placeholder: 'GUIDELINES',
                        value: templateInputs[template.id]?.guidelines || '',
                        onChange: (e) => updateTemplateInput(template.id, 'guidelines', e.target.value),
                        className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
                      }),
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
          h('input', { 
            type: 'text',
            placeholder: 'Rule violation',
            value: adminNoteInputs.edited.violation,
            onChange: (e) => updateAdminNoteInput('edited', 'violation', e.target.value),
            className: `w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`
          }),
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
        h('p', null, 'Contact: ', h('a', { href: 'mailto:tuna.yilmaz@ignitetech.ai', className: 'text-blue-600 underline' }, 'tuna.yilmaz@ignitetech.ai'), ' or ', h('a', { href: 'mailto:c-tuna.yilmaz@khoros.com', className: 'text-blue-600 underline' }, 'c-tuna.yilmaz@khoros.com')),
        h('p', { className: 'mt-2 text-xs' }, 'Version: 1.2.1')
      )
    )
  );
};

// Render the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
  const root = createRoot(document.getElementById('root'));
  root.render(h(ModerationTool));
});