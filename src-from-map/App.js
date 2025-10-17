import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Plus, Minus, Sun, Moon } from 'lucide-react';

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

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedCounters = localStorage.getItem('ebay-mod-counters');
      const savedTemplateInputs = localStorage.getItem('ebay-mod-template-inputs');
      const savedAdminNotes = localStorage.getItem('ebay-mod-admin-notes');
      const savedDarkMode = localStorage.getItem('ebay-mod-dark-mode');
      
      if (savedCounters) setCounters(JSON.parse(savedCounters));
      if (savedTemplateInputs) setTemplateInputs(JSON.parse(savedTemplateInputs));
      if (savedAdminNotes) setAdminNoteInputs(JSON.parse(savedAdminNotes));
      if (savedDarkMode) setDarkMode(JSON.parse(savedDarkMode));
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

  return (
    <div className={bgClass}>
      <div className="max-w-5xl mx-auto">
        <div className={`${cardBg} rounded-lg shadow-lg p-6 mb-6 ${borderColor} border`}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className={`text-3xl font-bold ${textPrimary}`}>eBay Community Moderation</h1>
              <p className={textSecondary}>Quick reference guide with ready-to-use templates</p>
            </div>
            <div className="flex items-center gap-3">
            <a
              href="https://ebay.response.lithium.com/khoros/login"
              target="_blank"
              rel="noopener noreferrer"
                className="px-4 py-2 rounded-lg font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Login to Care
              </a>
              <button 
                onClick={() => setDarkMode(!darkMode)} 
                className={`px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
              >
                {darkMode ? <><Sun className="w-5 h-5" /><span>Light</span></> : <><Moon className="w-5 h-5" /><span>Dark</span></>}
              </button>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-50'} rounded-lg p-4 border-2 ${borderColor}`}>
            <div className="flex items-center justify-between mb-3">
              <h3 className={`font-semibold ${textPrimary}`}>Today's Flags Resolved</h3>
              <button
                onClick={() => setShowResetConfirm(true)}
                className={`text-xs px-3 py-1 rounded ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
              >
                Reset All
              </button>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {['P1', 'P2', 'P3', 'P4'].map((priority) => {
                const total = getTotalForPriority(priority);
                const isOpen = openDropdown === priority;
                return (
                  <div key={priority} className={`${cardBg} rounded-lg p-3 border-2 ${borderColor} relative`} ref={(el) => { if (el) dropdownRefs.current[priority] = el; }}>
                    <div className={`text-xs font-semibold mb-1 text-center ${textSecondary}`}>{priority}</div>
                    <div className="text-3xl font-bold text-blue-600 mb-2 text-center">{total}</div>
                    <button onClick={() => setOpenDropdown(isOpen ? null : priority)} className="w-full py-2 bg-blue-100 hover:bg-blue-200 rounded flex items-center justify-center gap-1">
                      {isOpen ? (<><span className="text-xs font-semibold text-blue-700">Close</span><ChevronUp className="w-3 h-3 text-blue-700" /></>) : (<Plus className="w-4 h-4 text-blue-700" />)}
                    </button>
                    {isOpen && (
                      <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 ${cardBg} border-2 ${borderColor} rounded-lg shadow-lg z-10 p-2 w-48`}>
                        <div className="space-y-2">
                          {modActionTypes.map(actionType => {
                            const count = counters[priority][actionType] || 0;
                            return (
                              <div key={actionType} className={`flex items-center gap-2 ${darkMode ? 'bg-slate-700' : 'bg-slate-50'} p-2 rounded`}>
                                <button onClick={() => removeFlag(priority, actionType)} className="w-7 h-7 flex items-center justify-center bg-red-100 hover:bg-red-200 rounded flex-shrink-0"><Minus className="w-4 h-4 text-red-600" /></button>
                                <div className="flex-1 text-center">
                                  <div className={`text-xs font-medium ${textSecondary}`}>{actionType}</div>
                                  <div className={`text-lg font-bold ${textPrimary}`}>{count}</div>
                                </div>
                                <button onClick={() => addFlag(priority, actionType)} className="w-7 h-7 flex items-center justify-center bg-green-100 hover:bg-green-200 rounded flex-shrink-0"><Plus className="w-4 h-4 text-green-600" /></button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-3 border-2 border-blue-400 text-center">
                <div className="text-xs font-semibold text-blue-100 mb-1">TOTAL</div>
                <div className="text-3xl font-bold text-white mb-3">{getTotalFlags()}</div>
                <button onClick={() => setShowEOSReport(true)} className="w-full py-2 bg-white hover:bg-blue-50 text-blue-600 rounded font-semibold text-sm">EOS</button>
              </div>
            </div>
          </div>
        </div>

        {showEOSReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${cardBg} rounded-lg shadow-xl max-w-2xl w-full p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${textPrimary}`}>End of Shift Report</h3>
                <button onClick={() => setShowEOSReport(false)} className={textSecondary}>✕</button>
              </div>
              <div className={`${darkMode ? 'bg-slate-900' : 'bg-slate-50'} rounded-lg p-4 border-2 ${borderColor} mb-4 max-h-96 overflow-y-auto`}>
                <pre className={`text-sm ${textSecondary} whitespace-pre-wrap font-mono`}>{generateEOSReport()}</pre>
              </div>
              <div className="flex gap-3">
                <button onClick={() => copyToClipboard(generateEOSReport(), 'eos-report')} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center justify-center gap-2">
                  {copiedId === 'eos-report' ? (<><Check className="w-5 h-5" />Copied</>) : (<><Copy className="w-5 h-5" />Copy</>)}
                </button>
                <button onClick={() => setShowEOSReport(false)} className={`px-6 py-3 rounded-lg font-semibold ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>Close</button>
              </div>
              </div>
          </div>
        )}

        {showResetConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`${cardBg} rounded-lg shadow-xl max-w-md w-full p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${textPrimary}`}>Reset All Counters?</h3>
                <button onClick={() => setShowResetConfirm(false)} className={textSecondary}>✕</button>
              </div>
              <p className={`${textSecondary} mb-6`}>
                Are you sure you want to reset all counters? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={resetCounters} 
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold"
                >
                  Yes, Reset All
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)} 
                  className={`flex-1 py-3 rounded-lg font-semibold ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 mb-6">
          {moderationActions.map((action) => {
            const isActive = activeAction === action.id;
            return (
              <div key={action.id} className={`border-2 rounded-lg overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : action.color}${isActive ? ' shadow-lg' : ' shadow'}`}>
                <button onClick={() => setActiveAction(isActive ? null : action.id)} className="w-full p-4 flex items-center justify-between hover:bg-opacity-80">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">📋</div>
                    <h2 className={`text-lg font-semibold ${textPrimary}`}>{action.title}</h2>
                    </div>
                  {isActive ? <ChevronUp className={`w-5 h-5 ${textSecondary}`} /> : <ChevronDown className={`w-5 h-5 ${textSecondary}`} />}
                </button>
                {isActive && (
                  <div className={`${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white'} border-t-2 p-4`}>
                    <div className="space-y-3">
                      {action.steps.map((step, index) => (
                        <div key={index} className={`flex items-start gap-3 p-3 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                          <span className={`font-semibold text-sm ${textSecondary}`}>{index + 1}.</span>
                          <span className={`text-sm flex-1 ${textSecondary}`}>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className={`${cardBg} rounded-lg shadow p-4 mb-6 border ${borderColor}`}>
          <button onClick={() => setShowBanTemplates(!showBanTemplates)} className="w-full flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${textPrimary}`}>Ban Templates</h3>
              <div className="flex items-center gap-2">
              <span className={`text-sm ${textSecondary}`}>{showBanTemplates ? 'Hide' : 'Show'}</span>
              {showBanTemplates ? <ChevronUp className={`w-5 h-5 ${textSecondary}`} /> : <ChevronDown className={`w-5 h-5 ${textSecondary}`} />}
              </div>
            </button>
          {showBanTemplates && (
            <div className={`border rounded-lg overflow-hidden ${borderColor}`}>
              <div className={`${darkMode ? 'bg-orange-900' : 'bg-orange-100'} px-3 py-2 flex items-center justify-between border-b ${borderColor}`}>
                <span className={`text-sm font-semibold ${darkMode ? 'text-orange-100' : 'text-slate-700'}`}>Fill ban details</span>
                      <div className="flex gap-2">
                  <button onClick={() => clearTemplateInputs('banCombined')} className={`px-3 py-1 rounded text-xs font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-300 hover:bg-slate-400 text-slate-700'}`}>Clear</button>
                  <button onClick={() => copyToClipboard(getPopulatedTemplate('banCombined', ''), 'banCombined')} className="flex items-center gap-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium">
                    {copiedId === 'banCombined' ? (<><Check className="w-4 h-4" />Copied</>) : (<><Copy className="w-4 h-4" />Copy</>)}
                        </button>
                      </div>
                    </div>
              <div className={`${darkMode ? 'bg-slate-900' : 'bg-orange-50'} p-3 space-y-2`}>
                <select value={templateInputs.banCombined.banPeriod} onChange={(e) => updateTemplateInput('banCombined', 'banPeriod', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300'}`}>
                                  <option value="1 Day">1 Day</option>
                                  <option value="3 Days">3 Days</option>
                                  <option value="7 Days">7 Days</option>
                                  <option value="30 Days">30 Days</option>
                                  <option value="Indefinite">Indefinite</option>
                                </select>
                <textarea placeholder="Reasoning" value={templateInputs.banCombined.reasoning} onChange={(e) => updateTemplateInput('banCombined', 'reasoning', e.target.value)} rows={3} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
                <input type="text" placeholder="Username" value={templateInputs.banCombined.username} onChange={(e) => updateTemplateInput('banCombined', 'username', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
                <input type="text" placeholder="Email" value={templateInputs.banCombined.email} onChange={(e) => updateTemplateInput('banCombined', 'email', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
                <input type="text" placeholder="IP" value={templateInputs.banCombined.ip} onChange={(e) => updateTemplateInput('banCombined', 'ip', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
                <input type="text" placeholder="Spam URL" value={templateInputs.banCombined.spamUrl} onChange={(e) => updateTemplateInput('banCombined', 'spamUrl', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
                <input type="date" value={templateInputs.banCombined.startDate} onChange={(e) => updateTemplateInput('banCombined', 'startDate', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-300'}`} />
                              </div>
              <div className={`${cardBg} p-3`}>
                <pre className={`text-xs ${textSecondary} whitespace-pre-wrap font-mono`}>{getPopulatedTemplate('banCombined', '')}</pre>
                            </div>
            </div>
          )}
        </div>

        <div className={`${cardBg} rounded-lg shadow p-4 mb-6 border ${borderColor}`}>
          <button onClick={() => setShowAdditionalTemplates(!showAdditionalTemplates)} className="w-full flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${textPrimary}`}>Additional Templates</h3>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${textSecondary}`}>{showAdditionalTemplates ? 'Hide' : 'Show'}</span>
              {showAdditionalTemplates ? <ChevronUp className={`w-5 h-5 ${textSecondary}`} /> : <ChevronDown className={`w-5 h-5 ${textSecondary}`} />}
            </div>
          </button>
          {showAdditionalTemplates && (
            <>
              <div className="mb-3">
                <input 
                  type="text" 
                  placeholder="Search templates..." 
                  value={templateSearch} 
                  onChange={(e) => setTemplateSearch(e.target.value)}
                  className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`}
                />
              </div>
            <div className="space-y-2">
                {templateList.filter(template => 
                  template.name.toLowerCase().includes(templateSearch.toLowerCase())
                ).map((template) => {
                const isExpanded = expandedTemplates[template.id];
                const populatedContent = template.isDynamic ? getPopulatedTemplate(template.id, template.content) : template.content;
                return (
                    <div key={template.id} className={`border rounded-lg overflow-hidden ${borderColor}`}>
                      <div className={`${darkMode ? 'bg-slate-700' : 'bg-slate-100'} px-3 py-2 flex items-center justify-between border-b ${borderColor}`}>
                        <span className={`text-sm font-semibold ${textPrimary}`}>{template.name}</span>
                      <div className="flex gap-2">
                          <button onClick={() => copyToClipboard(populatedContent, template.id)} className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium">
                            {copiedId === template.id ? (<><Check className="w-4 h-4" />Copied</>) : (<><Copy className="w-4 h-4" />Copy</>)}
                        </button>
                          <button onClick={() => setExpandedTemplates({...expandedTemplates, [template.id]: !isExpanded})} className={`flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${darkMode ? 'bg-slate-600 hover:bg-slate-500 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-700'}`}>
                            {isExpanded ? (<><ChevronUp className="w-4 h-4" />Hide</>) : (<><ChevronDown className="w-4 h-4" />Show</>)}
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <>
                        {template.isDynamic && (
                            <div className={`${darkMode ? 'bg-slate-900' : 'bg-blue-50'} p-3 border-b ${borderColor} space-y-2`}>
                            <div className="flex items-center justify-between mb-2">
                                <div className={`text-xs font-semibold ${textSecondary}`}>Fill fields</div>
                                <button onClick={() => clearTemplateInputs(template.id)} className={`px-3 py-1 rounded text-xs font-medium ${darkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-200' : 'bg-slate-300 hover:bg-slate-400 text-slate-700'}`}>Clear</button>
                            </div>
                              <input type="text" placeholder="USERNAME" value={templateInputs[template.id]?.username || ''} onChange={(e) => updateTemplateInput(template.id, 'username', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
                              {template.type === 'removed' && (
                                <>
                                  <input type="text" placeholder="TITLE" value={templateInputs[template.id]?.title || ''} onChange={(e) => updateTemplateInput(template.id, 'title', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
                                  <input type="text" placeholder="DATE_TIME" value={templateInputs[template.id]?.datetime || ''} onChange={(e) => updateTemplateInput(template.id, 'datetime', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
                                </>
                              )}
                              {template.type === 'edited' && (
                                <input type="text" placeholder="HERE (link)" value={templateInputs[template.id]?.here || ''} onChange={(e) => updateTemplateInput(template.id, 'here', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
                              )}
                              {template.type !== 'username' && (
                                <>
                                  <input type="text" placeholder="GUIDELINES" value={templateInputs[template.id]?.guidelines || ''} onChange={(e) => updateTemplateInput(template.id, 'guidelines', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
                                  <textarea placeholder="QUOTE" value={templateInputs[template.id]?.quote || ''} onChange={(e) => updateTemplateInput(template.id, 'quote', e.target.value)} rows={3} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
                                </>
                              )}
                          </div>
                        )}
                          <div className={`${cardBg} p-3`}>
                            <pre className={`text-xs ${textSecondary} whitespace-pre-wrap font-mono`}>{populatedContent}</pre>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>

        <div className={`${cardBg} rounded-lg shadow p-4 mb-6 border ${borderColor}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${textPrimary}`}>Admin Notes</h3>
            <div className="flex items-center gap-2">
              {showAdminNotes && (
                <button onClick={() => copyToClipboard(getPopulatedAdminNote('edited'), 'admin-edited')} className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium">
                  {copiedId === 'admin-edited' ? (<><Check className="w-4 h-4" />Copied</>) : (<><Copy className="w-4 h-4" />Copy</>)}
          </button>
              )}
              <button onClick={() => setShowAdminNotes(!showAdminNotes)} className="flex items-center gap-1">
                <span className={`text-sm ${textSecondary}`}>{showAdminNotes ? 'Hide' : 'Show'}</span>
                {showAdminNotes ? <ChevronUp className={`w-5 h-5 ${textSecondary}`} /> : <ChevronDown className={`w-5 h-5 ${textSecondary}`} />}
                  </button>
                </div>
                </div>
          {showAdminNotes && (
            <div className={`space-y-3 pt-3 border-t ${borderColor}`}>
              <input type="text" placeholder="Link to post" value={adminNoteInputs.edited.link} onChange={(e) => updateAdminNoteInput('edited', 'link', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
              <input type="text" placeholder="Removed portion" value={adminNoteInputs.edited.removed} onChange={(e) => updateAdminNoteInput('edited', 'removed', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
              <input type="text" placeholder="Rule violation" value={adminNoteInputs.edited.violation} onChange={(e) => updateAdminNoteInput('edited', 'violation', e.target.value)} className={`w-full px-3 py-2 text-sm border rounded ${darkMode ? 'bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500' : 'bg-white border-slate-300'}`} />
              <div className={`rounded-lg p-3 border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <pre className={`text-xs whitespace-pre-wrap font-mono ${textSecondary}`}>{getPopulatedAdminNote('edited')}</pre>
              </div>
            </div>
          )}
        </div>

        <div className={`${cardBg} rounded-lg shadow p-4 mb-6 border ${borderColor}`}>
          <button onClick={() => setShowFAQ(!showFAQ)} className="w-full flex items-center justify-between mb-3">
            <h3 className={`font-semibold ${textPrimary}`}>FAQ</h3>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${textSecondary}`}>{showFAQ ? 'Hide' : 'Show'}</span>
              {showFAQ ? <ChevronUp className={`w-5 h-5 ${textSecondary}`} /> : <ChevronDown className={`w-5 h-5 ${textSecondary}`} />}
            </div>
          </button>
          {showFAQ && (
              <div className="space-y-2">
              {faqItems.map((faq) => (
                <div key={faq.id} className={`border rounded-lg overflow-hidden ${borderColor}`}>
                  <button onClick={() => setExpandedFAQ({...expandedFAQ, [faq.id]: !expandedFAQ[faq.id]})} className={`w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-100'} px-3 py-2 flex items-center justify-between hover:bg-opacity-80`}>
                    <span className={`text-sm font-semibold text-left ${textPrimary}`}>{faq.question}</span>
                    {expandedFAQ[faq.id] ? <ChevronUp className={`w-4 h-4 flex-shrink-0 ml-2 ${textSecondary}`} /> : <ChevronDown className={`w-4 h-4 flex-shrink-0 ml-2 ${textSecondary}`} />}
                        </button>
                  {expandedFAQ[faq.id] && (
                    <div className={`p-3 ${darkMode ? 'bg-slate-800' : 'bg-white'} border-t ${borderColor}`}>
                      <p className={`text-sm whitespace-pre-wrap ${textSecondary}`}>{faq.answer}</p>
                          </div>
                        )}
                      </div>
              ))}
              </div>
          )}
        </div>

        <div className={`rounded-lg shadow p-4 text-center text-sm ${cardBg} ${textSecondary} border ${borderColor}`}>
          <p>Contact: <a href="mailto:tuna.yilmaz@ignitetech.ai" className="text-blue-600 underline">tuna.yilmaz@ignitetech.ai</a> or <a href="mailto:c-tuna.yilmaz@khoros.com" className="text-blue-600 underline">c-tuna.yilmaz@khoros.com</a></p>
          <p className="mt-2 text-xs">Version: 1.2.1</p>
        </div>
      </div>
    </div>
  );
};

export default ModerationTool;