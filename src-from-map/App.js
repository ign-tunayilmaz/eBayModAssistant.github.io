import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ChevronUp, Copy, Check, Plus, Minus } from 'lucide-react';

const ModerationChecklist = () => {
  const [activeAction, setActiveAction] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [expandedTemplates, setExpandedTemplates] = useState({});
  const [openDropdown, setOpenDropdown] = useState(null);
  const [showEOSReport, setShowEOSReport] = useState(false);
  const [showAdditionalTemplates, setShowAdditionalTemplates] = useState(true);
  const [showBanTooltip, setShowBanTooltip] = useState(false);
  const [showBanTemplates, setShowBanTemplates] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');
  const [expandedFAQs, setExpandedFAQs] = useState({});
  const dropdownRefs = useRef({});
  const banTooltipRef = useRef(null);
  const [templateInputs, setTemplateInputs] = useState({
    friendlyRemovedPost: { username: '', title: '', datetime: '', guidelines: '', quote: '' },
    warningRemovedPost: { username: '', title: '', datetime: '', guidelines: '', quote: '' },
    friendlyEditedPost: { username: '', here: '', guidelines: '', quote: '' },
    warningEditedPost: { username: '', here: '', guidelines: '', quote: '' },
    banInternal: { banPeriod: '1 Day', reasoning: '', username: '', email: '', ip: '', spamUrl: '' }
  });
  const [counters, setCounters] = useState({
    P1: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
    P2: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
    P3: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
    P4: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
    P5: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 }
  });

  const modActionTypes = ['NAR', 'Edit', 'Steer', 'Remove', 'Ban', 'Locked', 'Moved'];

  const faqItems = [
    {
      id: 'ban-process',
      question: 'How do I ban a user?',
      answer: `**Ban User Process:**
• Leave Username, Email and IP with an asterisk icon (*)
• If the ban is permanent, check "Make ban permanent" checkbox
• Most common ban reason is spamming the forum
• Document in admin notes
• Only tag members who receive a 30 day or indefinite ban (use the spammer tag if it's a spammer instead of indefinite ban)

**Ban Tags:** 30 Day, Indefinite, Spammer`
    },
    {
      id: 'ban-internal-reason',
      question: 'What should I write in the internal reason for ban?',
      answer: `**Internal reason for ban:**
Indefinite Login Restriction
Advertising Spam
Username: xxx
Email: xxx@xxx.com
IP: xxx.xxx.xxx.xxx
<a href="URL">Example of Spam</a>`
    },
    {
      id: 'ban-public-reason',
      question: 'What should I write in the public reason for ban?',
      answer: `**Public reason for ban:**
Violating the rules and policies of the eBay US Community, with actions such as "advertising spam". Your restriction is indefinite, effective [DATE].

Important: Creating multiple accounts for use on eBay's boards for the purpose of disruption or to avoid detection may result in permanent sanction or suspension of all associated registrations. If you would like to appeal your suspension, contact askcommunity@ebay.com.`
    },
    {
      id: 'necro-post',
      question: 'How do I handle necro posts (old threads)?',
      answer: `**Necro Post Process:**
• Posts that are older than 6 months can be closed
• Use Necro post macro to reply to the topic
• No need to mention age of the post on reply. Just say "This thread is being closed as it's old"
• Close the thread for new replies`
    },
    {
      id: 'queue-management',
      question: 'How do I manage my queue?',
      answer: `**Managing Your Queue:**
1. Make sure your Smart View is selected (lightbulb icon is blue)
2. Work your way down from top to bottom (oldest content first)
3. If you assign a conversation to yourself, you must take action: respond, escalate, or close
4. If you reply to a post or send a PM it will go to Pending
5. Only close a conversation when completely finished`
    },
    {
      id: 'tagging-actions',
      question: 'When should I add tags to document moderation actions?',
      answer: `**Required Tags for Moderation Actions:**
• **Edited** - use when editing a post
• **Moved** - use when moving a thread to the proper board
• **Moderated** - use when moving a thread/post to moderated content
• **Locked** - use when a topic needs locked to further discussion`
    },
    {
      id: 'abuse-reports',
      question: 'How do I handle abuse and filter reports?',
      answer: `**Abuse & Filter Reports Process:**
1. Claim (Assign to You), look for other reports on same user
2. If NAR: reply to AR and close as NAR (FR doesn't need reply)
3. If needs action:
   • Search for the reported conversation
   • Claim the conversation
   • Take appropriate moderation action
   • Add tag to post (Edited, Moved, Moderated, or Locked)
   • Create a new conversation from the moderated post
   • Close rest of thread as NAR
   • Document action in admin notes
4. Return to AR and reply with actions taken (skip for FR)
5. Close AR/FR as Mod Action Taken or Duplicate Report - No Action Required`
    },
    {
      id: 'ban-spammer',
      question: 'How do I ban spammers?',
      answer: `**Banning Spammers Process:**
1. Claim all reports of same spammer (up to 40 at once)
2. Reply to duplicate reports and close as Duplicate Report - No Action Required
3. Use member username link to go to spammer's profile
4. Mark all posts as spam or move to moderated content
5. Issue ban and add admin notes
6. Reply to remaining AR with actions taken and close as Mod Action Taken
7. Search for username
8. Add Spammer tag to author profile
9. Close conversation as Mod Action Taken
10. Use Open Conversations from Spammers Widget to close all conversations`
    },
    {
      id: 'escalation',
      question: 'When and how should I escalate conversations?',
      answer: `**Escalating Conversations:**

**For Mod Help:**
1. Claim + review thread
2. Action thread as needed
3. Click Request Help
4. Add internal note with reason

**Escalate to Leads for:**
• Help on abuse/filter reports
• Ban approvals for 30 days or indefinite (no approval needed for spam bans)
• Inappropriate usernames/avatars
• Extremely disruptive behavior
• Threats of violence or bomb threats
• Function issues on eBay or Community
• Underage users
• Reporters or Third Party Representatives
• Suspected impersonation of eBay Employees/Moderators
• Employee violations

**Suicide Threats (URGENT):**
• Change priority to P0
• Add EbCT tag
• Click "Request Help"
• Note: "Escalating (username) due to suicide threat"`
    },
    {
      id: 'closing-conversations',
      question: 'When and how should I close conversations?',
      answer: `**Closing Conversations:**

**Abuse Reports:**
• Must be replied to with actions taken
• If requires no action: close as NAR
• If requires action: close as Mod Action Taken
• If duplicate: reply with duplicate and close as Duplicate Report - No Action Required
• If PM'ing from AR: reply but don't close

**Discussion Board Content:**
• If no action required: close as NAR
• If action results in ban: close as Mod Action Taken
• If action results in friendly/warning PM: DON'T close (auto-closes after 7 days)

**Answer Center Content:**
• If no action required: close as NAR
• If removing content: close as Mod Action Taken`
    },
    {
      id: 'templates-macros',
      question: 'How do I use templates (macros)?',
      answer: `**Using Templates:**
1. If steering/locking: toggle to Public Post
2. If PM'ing: toggle to Private Message
3. Click templates button (lower right in agent view)
4. Scroll to find needed template
5. Hover and click plus (+) sign to add to text box

**Note:** Bold italics in templates indicate portions you need to change. You can add multiple templates - the 2nd template appends to the bottom.`
    },
    {
      id: 'voc-tagging',
      question: 'What is VoC tagging and when should I use it?',
      answer: `**VoC (Voice of the Customer) Tagging:**

**What to Tag:**
• Selling topics with many replies or that continue for days
• Something went wrong and many people talking about it
• Insights eBay could use to improve products
• Unusual/unique buyer/seller stories
• Cases where eBay decided in buyer's favor with negative community reaction
• Reactions to eBay media/marketing
• Feedback about marketplace or community platform

**What NOT to Tag:**
• Common/known support issues
• Feedback/complaints about moderation
• Banning and guideline violations`
    },
    {
      id: 'important-notes',
      question: 'What are some important things to remember?',
      answer: `**Important Notes:**
• Do NOT send replies to Mentors after taking action on their Abuse Reports
• Be careful with Abuse Reports - do not move to public board
• Do NOT moderate Mentor Boards and Mentor Content
• Do NOT send warnings to Mentors
• We do not escalate to eBay unless there is threat, child abuse, suicidal thoughts, etc.
• Close threads with no comments in past 6 months as "Necro"
• Be careful not to post comments as "No Action Required" - use "Close as" comment, not "Post Public Reply"
• Base your actions on Community Guidelines`
    },
    {
      id: 'native-tasks',
      question: 'What tasks need to be done natively on Community?',
      answer: `**"Native" Mod Tasks (not available in Response):**
1. Admin Notes
2. Moving individual replies within a thread
3. Answer Center - sending private messages
4. Editing thread titles
5. Spam Quarantine
6. Batch marking blatant spammer posts as spam
7. Banning members
8. Locking threads
9. Image/Video moderation console`
    }
  ];

  const filteredFAQs = faqItems.filter(faq => 
    faq.question.toLowerCase().includes(faqSearch.toLowerCase()) ||
    faq.answer.toLowerCase().includes(faqSearch.toLowerCase())
  );

  const toggleFAQ = (faqId) => {
    setExpandedFAQs({
      ...expandedFAQs,
      [faqId]: !expandedFAQs[faqId]
    });
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdown) {
        const dropdownElement = dropdownRefs.current[openDropdown];
        if (dropdownElement && !dropdownElement.contains(event.target)) {
          setOpenDropdown(null);
        }
      }
      if (showBanTooltip && banTooltipRef.current && !banTooltipRef.current.contains(event.target)) {
        setShowBanTooltip(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdown, showBanTooltip]);

  const templates = {
    friendlyRemovedPost: `Hi [USERNAME],

This is a friendly moderation notice to inform you that your recent post "[TITLE]" from [DATE_TIME] has been removed because it violated the following eBay Community Guidelines:

[GUIDELINES]

You posted the following:

"[QUOTE]"

Please take a moment to review the Community Guidelines to avoid making the same mistake again in the future.

Thank you for your cooperation in keeping the Community a welcoming, helpful, and respectful place for all users.

-- The eBay Community Moderation Team`,

    warningRemovedPost: `Hi [USERNAME],

This is an official moderation warning to inform you that your recent post "[TITLE]" from [DATE_TIME] has been removed because it violated the following eBay Community Guidelines:

[GUIDELINES]

You posted the following:

"[QUOTE]"

Please take a moment to review the Community Guidelines to avoid making the same mistake again in the future.

Thank you for your cooperation in keeping the Community a welcoming, helpful, and respectful place for all users.

-- The eBay Community Moderation Team`,

    friendlyEditedPost: `Hi [USERNAME],

This is a friendly moderation notice to inform you that your recent post [HERE] has been edited because it violated the following eBay Community Guidelines:

[GUIDELINES]

Your post was edited to remove the following:

"[QUOTE]"

Please take a moment to review the Community Guidelines to avoid making the same mistake again in the future.

Thank you for your cooperation in keeping the Community a welcoming, helpful, and respectful place for all users.

-- The eBay Community Moderation Team`,

    warningEditedPost: `Hi [USERNAME],

This is an official moderation warning to inform you that your recent post [HERE] has been edited because it violated the following eBay Community Guidelines:

[GUIDELINES]

Your post was edited to remove the following:

"[QUOTE]"

Please take a moment to review the Community Guidelines to avoid making the same mistake again in the future.

Thank you for your cooperation in keeping the Community a welcoming, helpful, and respectful place for all users.

-- The eBay Community Moderation Team`,

    necroThread: `Hi everyone,

Due to the age of this thread, it has been closed to further replies. Please feel free to start a new thread if you wish to continue to discuss this topic.

Thank you for understanding.`,

    opRequest: `Hi everyone,

This thread has been closed at the request of the OP.

Thank you for understanding.`,

    heatedDiscussion: `Hi everyone,

This discussion has gotten a bit heated. Please remember that, while it is fine to disagree with others, discussion should always remain friendly and respectful as required by the Community Guidelines.

Thank you for your cooperation.`,

    offTopic: `Hi everyone,

This discussion has gotten a bit off topic. Please bring the discussion back to subject established in the original post.

Thank you.`,
    
    giftCardScam: `<p>Hi everyone,<br><br>If you believe that you or someone you know was scammed into buying eBay Gift Cards, visit our <a href="https://pages.ebay.com/ebaygiftcard/">gift card page</a> to contact customer service and find additional information related to gift card scams.<br><br>Thank you.</p>`,
    
    csRedirect: `<p>Hi [USERNAME],</p><p>&nbsp;</p><p>Thank you for submitting an inappropriate content report. However, please be advised that you have reached the eBay Community Moderation Team. Unfortunately, we are unable to assist you with your issue as we only deal with the Community.<br>&nbsp;</p><ol><li>If your issue is regarding an abusive or inappropriate message received through the eBay messaging system, then please visit the <a href="https://www.ebay.com/help/home">Customer Service</a> page as the Moderation Team can only deal with private messages on the Community.</li><li>If your issue is regarding a listing goes against policy, then please use the report link on the listing to report it.</li><li>If your issue is regarding a dispute with a buyer or seller, then you can open a case or contact Customer Support by visiting the CS page linked-to above.</li><li>If your issue is not listed above, then you can look for the answer by visiting eBay's Customer Service page linked-to above. Otherwise, please feel free to post here on the Community for member-to-member help. Please only post your question once on the most relevant board as duplicate posts are not allowed.</li></ol><p>In the future, please keep in mind that the only time you should "report inappropriate content" on the Community is when posts or private messages are in violation of the <a href="https://community.ebay.com/t5/About-the-Community/Community-Guidelines/m-p/26164369#M2">Community Guidelines</a>.</p><p>&nbsp;</p><p>Thank you for your understanding and cooperation, and for being a valued member of the eBay Community.</p><p>&nbsp;</p><p>-- eBay Community Moderation Community Team</p>`,
    
    gg01: `<p><strong>Be respectful.</strong>&nbsp;</p>`,
    gg02: `<p><strong>Share meaningful contributions.</strong>&nbsp;</p>`,
    gg03: `<p><strong>Consequences and considerations:</strong> When posts veer off topic, the eBay Community team may move content at their discretion.</p>`,
    gg04: `<p><strong>Reporting Inappropriate Content:</strong> The eBay Community is built for eBay users, and it is users like you who are likely to be the first to see posts that harm the community and violate Community Guidelines. Please do not confront the other user in these situations; instead use the tools we have in place for your safety. Report inappropriate behavior by clicking the <img class="image_resized" style="width:16px;" src="https://community.ebay.com/html/@37B92553E63D92643B1B9E47A5184895/images/emoticons/chevron-circle-down-o.256x256.png" alt=":options_arrow:"> "arrow dropdown" in the top right-hand corner of any post or private message, then selecting "Report Inappropriate Content." This will alert our moderation team to look into the issue and take appropriate action. Your report will only be viewed by the eBay Community team. Please report a post or message only once.</p>`,
    gg05: `<p><strong>Not allowed:</strong> Publishing personal contact information of any person in any public area of eBay, including emails, phone numbers, name, street address, etc. (<a href="https://www.ebay.com/help/policies/member-behaviour-policies/community-content-policy?id=4265">Community content policy</a>)</p>`,
    sg00: `<p>Refrain from posting content or taking actions that are:</p>`,
    sg01: `<ul><li>adult, pornographic, violent, or mature in nature</li></ul>`,
    sg02: `<ul><li>language or threats prohibited in the&nbsp;<a href="https://www.ebay.com/help/policies/member-behaviour-policies/profanity-policy?id=4258">Threats and offensive language policy</a></li></ul>`,
    sg03: `<ul><li>dishonest, unsubstantiated, or designed to mislead</li></ul>`,
    sg04: `<ul><li>duplicative or repetitive - including forum posts and replies</li></ul>`,
    sg05: `<ul><li>calling for petitions, boycotts, lawsuits, or other calls to activism in either posts or private messages or to otherwise drive traffic elsewhere</li></ul>`,
    sg06: `<ul><li>advertising listings, products, or services in order to solicit sales or otherwise use the Community as a marketing platform</li></ul>`,
    sg07: `<ul><li>promoting off-eBay sites, groups, or forums, or suggestions that encourage users to leave eBay</li></ul>`,
    sg08: `<ul><li>reposted content that has been edited or removed by eBay Community staff</li></ul>`,
    sg09: `<ul><li>about moderation warnings or consequences</li></ul>`,
    sg10: `<ul><li>about another user's listings or user IDs to tarnish their reputation (e.g. "naming & shaming") or otherwise calling the community to action</li></ul>`,
    sg11: `<ul><li>encouraging others to violate the eBay User Agreement,&nbsp;<a href="https://www.ebay.com/help/policies/listing-policies/listing-policies?id=4213">listing policies</a>,&nbsp;<a href="https://www.ebay.com/help/policies/selling-policies/selling-practices-policy?id=4346">selling practices policy</a>, or any other policies</li></ul>`,
    sg12: `<ul><li>of copyrighted content without the permission of the copyright owner</li></ul>`
  };

  const moderationActions = [
    {
      id: 'spam',
      priority: 'P1',
      title: 'Dealing with Spam Messages',
      color: 'bg-red-50 border-red-200',
      steps: [
        { text: 'Move relevant message to "Moderated Content"', type: 'instruction' },
        { text: 'Go to Khoros Care', type: 'instruction' },
        { text: 'Take "Friendly PM or Warning PM" from Additional Templates section below', type: 'instruction' },
        { text: 'Go to user\'s profile link', type: 'instruction' },
        { text: 'Click "Send a message" and paste the template', type: 'instruction' },
        { text: 'Title: Post Removed', type: 'instruction' },
        { text: 'Fill Username of the user, Title of the message and the message sections and send the message', type: 'instruction' },
        { text: 'Add an admin note to user\'s profile "Removed posts <br> <a href="LINK">Here</a><br> For repetitive posts friendly PM sent"', type: 'instruction' },
        { text: 'Close the Care report as "Mod Action Taken"', type: 'instruction' }
      ]
    },
    {
      id: 'ban',
      priority: 'P2',
      title: 'Banning User due to Spam',
      color: 'bg-orange-50 border-orange-200',
      steps: [
        { text: 'Click Ban User', type: 'instruction' },
        { text: 'Get the macro from Khoros Care and paste it to public and ban reason', type: 'instruction' },
        { text: 'Get the URL of the message', type: 'instruction' },
        { text: 'Copy username to internal reason', type: 'instruction' },
        { text: 'Email address to internal reason', type: 'instruction' },
        { text: 'IP to internal reason', type: 'instruction' },
        { text: 'Put * to username, email and IP', type: 'instruction' },
        { text: 'Remove match exact username and match exactly email', type: 'instruction' },
        { text: 'Add relevant tag via Care', type: 'instruction' },
        { text: 'Reply the abuse report', type: 'instruction' },
        { text: 'Close as mod action taken', type: 'instruction' }
      ]
    },
    {
      id: 'move',
      priority: 'P3',
      title: 'Moving a Post',
      color: 'bg-blue-50 border-blue-200',
      steps: [
        { text: 'Go to link of the post', type: 'instruction' },
        { text: 'Down Arrow on the message', type: 'instruction' },
        { text: 'Move Message', type: 'instruction' },
        { text: 'Leave everything checked', type: 'instruction' },
        { text: 'Move to relevant category', type: 'instruction' },
        { text: 'Add "Moved" tag in Care', type: 'instruction' },
        { text: 'Respond to Abuse Report as "Moved to X"', type: 'instruction' },
        { text: 'Close the Abuse Report as Mod Action Taken', type: 'instruction' }
      ]
    },
    {
      id: 'edit',
      priority: 'P4',
      title: 'Dealing with Swearing (Edit)',
      color: 'bg-yellow-50 border-yellow-200',
      steps: [
        { text: 'Use Friendly PM: Edited Post template from Additional Templates section below', type: 'instruction' },
        { text: 'Fill Username, Guidelines, title and the Message that removed from the post', type: 'instruction' },
        { text: 'Add an admin note as', type: 'instruction', isBold: true, boldText: '<a href="(insert link to post)">Edited Post</a> to remove "(insert only the portion removed)". Sent user a friendly PM for: (insert violation).' },
        { text: 'Close as Mod Action Taken', type: 'instruction' },
        { text: 'If we edit the post, add "Steered" and "Edited" tags', type: 'instruction' }
      ]
    },
    {
      id: 'necro',
      priority: 'P5',
      title: 'Topics Older than 6 Months',
      color: 'bg-purple-50 border-purple-200',
      steps: [
        { text: 'Use necro thread macro from Additional Templates section below', type: 'instruction' },
        { text: 'Close the thread for new replies', type: 'instruction' }
      ]
    }
  ];

  const toggleAction = (actionId) => {
    setActiveAction(activeAction === actionId ? null : actionId);
  };

  const toggleTemplate = (templateId) => {
    setExpandedTemplates({
      ...expandedTemplates,
      [templateId]: !expandedTemplates[templateId]
    });
  };

  const copyToClipboard = async (text, id) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const updateTemplateInput = (templateId, field, value) => {
    setTemplateInputs({
      ...templateInputs,
      [templateId]: {
        ...templateInputs[templateId],
        [field]: value
      }
    });
  };

  const clearTemplateInputs = (templateId) => {
    if (templateId === 'friendlyRemovedPost' || templateId === 'warningRemovedPost') {
      setTemplateInputs({
        ...templateInputs,
        [templateId]: { username: '', title: '', datetime: '', guidelines: '', quote: '' }
      });
    } else if (templateId === 'friendlyEditedPost' || templateId === 'warningEditedPost') {
      setTemplateInputs({
        ...templateInputs,
        [templateId]: { username: '', here: '', guidelines: '', quote: '' }
      });
    } else if (templateId === 'banInternal') {
      setTemplateInputs({
        ...templateInputs,
        [templateId]: { banPeriod: '1 Day', reasoning: '', username: '', email: '', ip: '', spamUrl: '' }
      });
    }
  };

  const getPopulatedTemplate = (templateId, baseTemplate) => {
    const inputs = templateInputs[templateId];
    let populated = baseTemplate;
    
    if (templateId === 'friendlyRemovedPost' || templateId === 'warningRemovedPost') {
      populated = populated
        .replace('[USERNAME]', inputs.username || '[USERNAME]')
        .replace('[TITLE]', inputs.title || '[TITLE]')
        .replace('[DATE_TIME]', inputs.datetime || '[DATE_TIME]')
        .replace('[GUIDELINES]', inputs.guidelines || '[GUIDELINES]')
        .replace('[QUOTE]', inputs.quote || '[QUOTE]');
    } else if (templateId === 'friendlyEditedPost' || templateId === 'warningEditedPost') {
      populated = populated
        .replace('[USERNAME]', inputs.username || '[USERNAME]')
        .replace('[HERE]', inputs.here || '[HERE]')
        .replace('[GUIDELINES]', inputs.guidelines || '[GUIDELINES]')
        .replace('[QUOTE]', inputs.quote || '[QUOTE]');
    } else if (templateId === 'banInternal') {
      populated = `${inputs.banPeriod} Login Restriction

Reasoning: ${inputs.reasoning || '[Add reasoning]'}

Username: ${inputs.username || '[Username]'}
Email: ${inputs.email || '[Email]'}
IP: ${inputs.ip || '[IP Address]'}
Example of Spam URL: ${inputs.spamUrl || '[Spam URL]'}`;
    }
    
    return populated;
  };

  const addFlag = (priority, actionType) => {
    setCounters({
      ...counters,
      [priority]: {
        ...counters[priority],
        [actionType]: counters[priority][actionType] + 1
      }
    });
  };

  const removeFlag = (priority, actionType) => {
    if (counters[priority][actionType] > 0) {
      setCounters({
        ...counters,
        [priority]: {
          ...counters[priority],
          [actionType]: counters[priority][actionType] - 1
        }
      });
    }
  };

  const resetCounters = () => {
    setCounters({
      P1: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
      P2: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
      P3: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
      P4: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 },
      P5: { NAR: 0, Edit: 0, Steer: 0, Remove: 0, Ban: 0, Locked: 0, Moved: 0 }
    });
  };

  const getTotalForPriority = (priority) => {
    return Object.values(counters[priority]).reduce((sum, count) => sum + count, 0);
  };

  const getTotalFlags = () => {
    return Object.values(counters).reduce((sum, priority) => 
      sum + Object.values(priority).reduce((pSum, count) => pSum + count, 0), 0
    );
  };

  const generateEOSReport = () => {
    const totalFlags = getTotalFlags();
    let report = `**Posts QAed: ${totalFlags}**\n`;
    
    ['P1', 'P2', 'P3', 'P4', 'P5'].forEach(priority => {
      const total = getTotalForPriority(priority);
      if (total > 0) {
        report += `* ${priority} reports handled: ${total}\n`;
        
        modActionTypes.forEach(actionType => {
          const count = counters[priority][actionType];
          if (count > 0) {
            report += `   * ${count} ${actionType}\n`;
          }
        });
      }
    });
    
    return report;
  };

  const copyEOSReport = async () => {
    const report = generateEOSReport();
    await copyToClipboard(report, 'eos-report');
  };

  const banTemplates = [
    { id: 'banInternal', name: 'Ban Templates: Internal Reason', content: '', isDynamic: true, isBan: true }
  ];

  const templateList = [
    { id: 'friendlyRemovedPost', name: 'Friendly PM: Removed Post', content: templates.friendlyRemovedPost, isDynamic: true },
    { id: 'warningRemovedPost', name: 'Warning PM: Removed Post', content: templates.warningRemovedPost, isDynamic: true },
    { id: 'friendlyEditedPost', name: 'Friendly PM: Edited Post', content: templates.friendlyEditedPost, isDynamic: true },
    { id: 'warningEditedPost', name: 'Warning PM: Edited Post', content: templates.warningEditedPost, isDynamic: true },
    { id: 'necroThread', name: 'Locking: Necro Thread', content: templates.necroThread, isDynamic: false },
    { id: 'opRequest', name: 'Locking: OP Request', content: templates.opRequest, isDynamic: false },
    { id: 'heatedDiscussion', name: 'Steering: Heated Discussion', content: templates.heatedDiscussion, isDynamic: false },
    { id: 'offTopic', name: 'Steering: Off Topic Discussion', content: templates.offTopic, isDynamic: false },
    { id: 'giftCardScam', name: 'Gift Card Scam Reply', content: templates.giftCardScam, isDynamic: false },
    { id: 'csRedirect', name: 'PM: CS Question Redirect', content: templates.csRedirect, isDynamic: false },
    { id: 'gg01', name: 'GG01: Be respectful', content: templates.gg01, isDynamic: false },
    { id: 'gg02', name: 'GG02: Share meaningful contributions', content: templates.gg02, isDynamic: false },
    { id: 'gg03', name: 'GG03: Consequences and considerations', content: templates.gg03, isDynamic: false },
    { id: 'gg04', name: 'GG04: Reporting Inappropriate Content', content: templates.gg04, isDynamic: false },
    { id: 'gg05', name: 'GG05: Publishing personal contact information', content: templates.gg05, isDynamic: false },
    { id: 'sg00', name: 'SG00: Refrain from posting content', content: templates.sg00, isDynamic: false },
    { id: 'sg01', name: 'SG01: Adult/pornographic content', content: templates.sg01, isDynamic: false },
    { id: 'sg02', name: 'SG02: Threats and offensive language', content: templates.sg02, isDynamic: false },
    { id: 'sg03', name: 'SG03: Dishonest/misleading content', content: templates.sg03, isDynamic: false },
    { id: 'sg04', name: 'SG04: Duplicative or repetitive', content: templates.sg04, isDynamic: false },
    { id: 'sg05', name: 'SG05: Petitions/boycotts/activism', content: templates.sg05, isDynamic: false },
    { id: 'sg06', name: 'SG06: Advertising/marketing', content: templates.sg06, isDynamic: false },
    { id: 'sg07', name: 'SG07: Promoting off-eBay sites', content: templates.sg07, isDynamic: false },
    { id: 'sg08', name: 'SG08: Reposted removed content', content: templates.sg08, isDynamic: false },
    { id: 'sg09', name: 'SG09: About moderation warnings', content: templates.sg09, isDynamic: false },
    { id: 'sg10', name: 'SG10: Naming & shaming', content: templates.sg10, isDynamic: false },
    { id: 'sg11', name: 'SG11: Encouraging policy violations', content: templates.sg11, isDynamic: false },
    { id: 'sg12', name: 'SG12: Copyrighted content', content: templates.sg12, isDynamic: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-800">eBay Community Moderation</h1>
              <p className="text-slate-600">Quick reference guide with ready-to-use templates</p>
            </div>
            <a
              href="https://ebay.response.lithium.com/khoros/login"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Care Login
            </a>
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-lg p-4 border-2 border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-slate-800">Today's Flags Resolved</h3>
              <button
                onClick={resetCounters}
                className="text-xs px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors"
              >
                Reset All
              </button>
            </div>
            <div className="grid grid-cols-6 gap-3">
              {['P1', 'P2', 'P3', 'P4', 'P5'].map((priority) => {
                const total = getTotalForPriority(priority);
                const isOpen = openDropdown === priority;
                return (
                  <div 
                    key={priority} 
                    className="bg-white rounded-lg p-3 border-2 border-slate-200 relative"
                    ref={(el) => dropdownRefs.current[priority] = el}
                  >
                    <div className="text-xs font-semibold text-slate-600 mb-1 text-center">{priority}</div>
                    <div className="text-3xl font-bold text-blue-600 mb-2 text-center">{total}</div>
                    
                    <button
                      onClick={() => setOpenDropdown(isOpen ? null : priority)}
                      className="w-full py-2 bg-blue-100 hover:bg-blue-200 rounded transition-colors flex items-center justify-center gap-1"
                    >
                      {isOpen ? (
                        <>
                          <span className="text-xs font-semibold text-blue-700">Close</span>
                          <ChevronUp className="w-3 h-3 text-blue-700" />
                        </>
                      ) : (
                        <Plus className="w-4 h-4 text-blue-700" />
                      )}
                    </button>
                    
                    {isOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white border-2 border-slate-300 rounded-lg shadow-lg z-10 p-2 w-48">
                        <div className="space-y-2">
                          {modActionTypes.map(actionType => {
                            const count = counters[priority][actionType];
                            return (
                              <div key={actionType} className="flex items-center gap-2 bg-slate-50 p-2 rounded">
                                <button
                                  onClick={() => removeFlag(priority, actionType)}
                                  className="w-7 h-7 flex items-center justify-center bg-red-100 hover:bg-red-200 rounded transition-colors flex-shrink-0"
                                >
                                  <Minus className="w-4 h-4 text-red-600" />
                                </button>
                                <div className="flex-1 text-center min-w-0">
                                  <div className="text-xs font-medium text-slate-600">{actionType}</div>
                                  <div className="text-lg font-bold text-slate-800">{count}</div>
                                </div>
                                <button
                                  onClick={() => addFlag(priority, actionType)}
                                  className="w-7 h-7 flex items-center justify-center bg-green-100 hover:bg-green-200 rounded transition-colors flex-shrink-0"
                                >
                                  <Plus className="w-4 h-4 text-green-600" />
                                </button>
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
                <button
                  onClick={() => setShowEOSReport(true)}
                  className="w-full py-2 bg-white hover:bg-blue-50 text-blue-600 rounded font-semibold text-sm transition-colors"
                >
                  EOS
                </button>
              </div>
            </div>
          </div>
        </div>

        {showEOSReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-slate-800">End of Shift Report</h3>
                <button
                  onClick={() => setShowEOSReport(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200 mb-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-slate-700 whitespace-pre-wrap font-mono">
                  {generateEOSReport()}
                </pre>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={copyEOSReport}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  {copiedId === 'eos-report' ? (
                    <>
                      <Check className="w-5 h-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copy Report
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowEOSReport(false)}
                  className="px-6 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {moderationActions.map((action) => {
            const isActive = activeAction === action.id;

            return (
              <div
                key={action.id}
                className={`border-2 rounded-lg overflow-hidden transition-all ${action.color} ${
                  isActive ? 'shadow-lg' : 'shadow'
                }`}
              >
                <button
                  onClick={() => toggleAction(action.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-opacity-80 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl text-slate-600">📋</div>
                    <div className="text-left">
                      <h2 className="text-lg font-semibold text-slate-800">{action.title}</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {isActive ? (
                      <ChevronUp className="w-5 h-5 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-600" />
                    )}
                  </div>
                </button>

                {isActive && (
                  <div className="bg-white border-t-2 p-4">
                    <div className="space-y-3">
                      {action.steps.map((step, index) => (
                        <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <span className="font-semibold text-slate-500 text-sm mt-0.5">
                            {index + 1}.
                          </span>
                          <span className="text-sm text-slate-700 flex-1">
                            {step.isBold ? (
                              <>
                                Add an admin note as <strong>"{step.boldText}"</strong>
                              </>
                            ) : (
                              step.text
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-slate-200">
                      <p className="text-sm text-slate-600 mb-2 text-center">
                        Use the counter dashboard above to track completed flags
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setShowBanTemplates(!showBanTemplates)}
              className="flex-1 flex items-center justify-between"
            >
              <h3 className="font-semibold text-slate-800">Ban Templates</h3>
              <div className="flex items-center gap-2">
                {showBanTemplates ? (
                  <>
                    <span className="text-sm text-slate-600">Hide</span>
                    <ChevronUp className="w-5 h-5 text-slate-600" />
                  </>
                ) : (
                  <>
                    <span className="text-sm text-slate-600">Show</span>
                    <ChevronDown className="w-5 h-5 text-slate-600" />
                  </>
                )}
              </div>
            </button>
            <div className="relative" ref={banTooltipRef}>
              <button
                onClick={() => setShowBanTooltip(!showBanTooltip)}
                className="text-slate-500 hover:text-slate-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              {showBanTooltip && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-slate-800 text-white text-xs rounded-lg p-3 shadow-lg z-20">
                  <div className="absolute -top-2 left-4 w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-slate-800"></div>
                  If you are banning a spammer, use "spammer" tag in Khoros Care. Otherwise, only use tags if you are banning someone for 30 days or indefinitely.
                </div>
              )}
            </div>
          </div>
          
          {showBanTemplates && (
            <div className="space-y-2">
              {banTemplates.map((template) => {
                const isExpanded = expandedTemplates[template.id];
                const populatedContent = getPopulatedTemplate(template.id, template.content);
                
                return (
                  <div key={template.id} className="border border-orange-300 rounded-lg overflow-hidden">
                    <div className="bg-orange-100 px-3 py-2 flex items-center justify-between border-b border-orange-300">
                      <span className="text-sm font-semibold text-slate-700">
                        {template.name}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(populatedContent, template.id)}
                          className="flex items-center gap-2 px-3 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm font-medium transition-colors"
                        >
                          {copiedId === template.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => toggleTemplate(template.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-sm font-medium transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <>
                        <div className="p-3 bg-orange-50 border-b border-orange-300">
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-xs font-semibold text-slate-700">Fill in the ban details:</div>
                            <button
                              onClick={() => clearTemplateInputs(template.id)}
                              className="px-3 py-1 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded text-xs font-medium transition-colors"
                            >
                              Clear All
                            </button>
                          </div>
                          <div className="space-y-2">
                            <div>
                              <label className="text-xs font-medium text-slate-700 block mb-1">Ban Period</label>
                              <select
                                value={templateInputs[template.id].banPeriod}
                                onChange={(e) => updateTemplateInput(template.id, 'banPeriod', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                              >
                                <option value="1 Day">1 Day</option>
                                <option value="3 Days">3 Days</option>
                                <option value="7 Days">7 Days</option>
                                <option value="30 Days">30 Days</option>
                                <option value="Indefinite">Indefinite</option>
                              </select>
                            </div>
                            <textarea
                              placeholder="Reasoning"
                              value={templateInputs[template.id].reasoning}
                              onChange={(e) => updateTemplateInput(template.id, 'reasoning', e.target.value)}
                              rows="3"
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <input
                              type="text"
                              placeholder="Username"
                              value={templateInputs[template.id].username}
                              onChange={(e) => updateTemplateInput(template.id, 'username', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <input
                              type="text"
                              placeholder="Email"
                              value={templateInputs[template.id].email}
                              onChange={(e) => updateTemplateInput(template.id, 'email', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <input
                              type="text"
                              placeholder="IP Address"
                              value={templateInputs[template.id].ip}
                              onChange={(e) => updateTemplateInput(template.id, 'ip', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <input
                              type="text"
                              placeholder="Example of Spam URL"
                              value={templateInputs[template.id].spamUrl}
                              onChange={(e) => updateTemplateInput(template.id, 'spamUrl', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                          </div>
                        </div>
                        
                        <div className="p-3 bg-white">
                          <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono">
                            {populatedContent}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <button
            onClick={() => setShowAdditionalTemplates(!showAdditionalTemplates)}
            className="w-full flex items-center justify-between mb-3"
          >
            <h3 className="font-semibold text-slate-800">Additional Templates & Guidelines</h3>
            <div className="flex items-center gap-2">
              {showAdditionalTemplates ? (
                <>
                  <span className="text-sm text-slate-600">Hide</span>
                  <ChevronUp className="w-5 h-5 text-slate-600" />
                </>
              ) : (
                <>
                  <span className="text-sm text-slate-600">Show</span>
                  <ChevronDown className="w-5 h-5 text-slate-600" />
                </>
              )}
            </div>
          </button>
          
          {showAdditionalTemplates && (
            <div className="space-y-2">
              {templateList.map((template) => {
                const isExpanded = expandedTemplates[template.id];
                const isEditedTemplate = ['friendlyEditedPost', 'warningEditedPost'].includes(template.id);
                const isRemovedTemplate = ['friendlyRemovedPost', 'warningRemovedPost'].includes(template.id);
                const populatedContent = template.isDynamic ? getPopulatedTemplate(template.id, template.content) : template.content;
                
                return (
                  <div key={template.id} className="border border-slate-300 rounded-lg overflow-hidden">
                    <div className="bg-slate-100 px-3 py-2 flex items-center justify-between border-b border-slate-300">
                      <span className="text-sm font-semibold text-slate-700">
                        {template.name}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => copyToClipboard(populatedContent, template.id)}
                          className="flex items-center gap-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                        >
                          {copiedId === template.id ? (
                            <>
                              <Check className="w-4 h-4" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4" />
                              Copy
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => toggleTemplate(template.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-sm font-medium transition-colors"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" />
                              Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" />
                              Show
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <>
                        {template.isDynamic && (
                          <div className="p-3 bg-blue-50 border-b border-slate-300">
                            <div className="flex items-center justify-between mb-2">
                              <div className="text-xs font-semibold text-slate-700">Fill in the template fields:</div>
                              <button
                                onClick={() => clearTemplateInputs(template.id)}
                                className="px-3 py-1 bg-slate-300 hover:bg-slate-400 text-slate-700 rounded text-xs font-medium transition-colors"
                              >
                                Clear All
                              </button>
                            </div>
                            <div className="space-y-2">
                              <input
                                type="text"
                                placeholder="USERNAME"
                                value={templateInputs[template.id].username}
                                onChange={(e) => updateTemplateInput(template.id, 'username', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              {isRemovedTemplate && (
                                <>
                                  <input
                                    type="text"
                                    placeholder="TITLE"
                                    value={templateInputs[template.id].title}
                                    onChange={(e) => updateTemplateInput(template.id, 'title', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                  <input
                                    type="text"
                                    placeholder="DATE_TIME"
                                    value={templateInputs[template.id].datetime}
                                    onChange={(e) => updateTemplateInput(template.id, 'datetime', e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </>
                              )}
                              {isEditedTemplate && (
                                <input
                                  type="text"
                                  placeholder="HERE (link to post)"
                                  value={templateInputs[template.id].here}
                                  onChange={(e) => updateTemplateInput(template.id, 'here', e.target.value)}
                                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                              )}
                              <input
                                type="text"
                                placeholder="GUIDELINES"
                                value={templateInputs[template.id].guidelines}
                                onChange={(e) => updateTemplateInput(template.id, 'guidelines', e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                              <textarea
                                placeholder="QUOTE"
                                value={templateInputs[template.id].quote}
                                onChange={(e) => updateTemplateInput(template.id, 'quote', e.target.value)}
                                rows="3"
                                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        )}
                        
                        <div className="p-3 bg-white">
                          <pre className="text-xs text-slate-600 whitespace-pre-wrap font-mono">
                            {populatedContent}
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-4">
          <button
            onClick={() => setShowFAQ(!showFAQ)}
            className="w-full flex items-center justify-between mb-3"
          >
            <h3 className="font-semibold text-slate-800">Moderation FAQ & Guidelines</h3>
            <div className="flex items-center gap-2">
              {showFAQ ? (
                <>
                  <span className="text-sm text-slate-600">Hide</span>
                  <ChevronUp className="w-5 h-5 text-slate-600" />
                </>
              ) : (
                <>
                  <span className="text-sm text-slate-600">Show</span>
                  <ChevronDown className="w-5 h-5 text-slate-600" />
                </>
              )}
            </div>
          </button>
          
          {showFAQ && (
            <>
              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search FAQ..."
                  value={faqSearch}
                  onChange={(e) => setFaqSearch(e.target.value)}
                  className="w-full px-4 py-2 text-sm border-2 border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="space-y-2">
                {filteredFAQs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No FAQs found matching your search.
                  </div>
                ) : (
                  filteredFAQs.map((faq) => {
                    const isExpanded = expandedFAQs[faq.id];
                    return (
                      <div key={faq.id} className="border border-slate-300 rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleFAQ(faq.id)}
                          className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-between text-left"
                        >
                          <span className="font-semibold text-slate-800 text-sm">{faq.question}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-600 flex-shrink-0 ml-2" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-600 flex-shrink-0 ml-2" />
                          )}
                        </button>
                        {isExpanded && (
                          <div className="p-4 bg-white border-t border-slate-200">
                            <div className="text-sm text-slate-700 whitespace-pre-line">
                              {faq.answer}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        <div className="mt-6 bg-white rounded-lg shadow p-4 text-center text-sm text-slate-600">
          <p>💡 Click "Add/Edit" to log flags. Use "EOS" to generate end-of-shift summary.</p>
        </div>
      </div>
    </div>
  );
};

export default ModerationChecklist;