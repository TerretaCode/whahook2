/**
 * Whahook Chat Widget Loader v2.0
 * Professional chat widget with full mobile support
 */
(function() {
  'use strict';

  // Check if widget config exists
  if (!window.WhahookWidget) {
    console.error('Whahook Widget: Configuration not found');
    return;
  }

  var config = window.WhahookWidget;
  var widgetId = config.widgetId;
  var apiUrl = config.apiUrl || 'https://whahook2-production.up.railway.app';

  if (!widgetId) {
    console.error('Whahook Widget: widgetId is required');
    return;
  }

  // Prevent double initialization
  if (window.WhahookWidgetLoaded) return;
  window.WhahookWidgetLoaded = true;

  // Detect visitor's language
  function getVisitorLanguage() {
    var lang = navigator.language || navigator.userLanguage || 'en';
    return lang.split('-')[0].toLowerCase();
  }

  // Detect if mobile
  function isMobile() {
    return window.innerWidth <= 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  var visitorLanguage = getVisitorLanguage();

  // Fetch widget configuration
  fetch(apiUrl + '/api/public/chat-widgets/' + widgetId + '/config?lang=' + visitorLanguage)
    .then(function(response) {
      if (!response.ok) throw new Error('Widget not found');
      return response.json();
    })
    .then(function(data) {
      if (!data.success) throw new Error(data.error || 'Failed to load widget');
      initWidget(data.data);
    })
    .catch(function(error) {
      console.error('Whahook Widget Error:', error.message);
    });

  function initWidget(cfg) {
    // Default config values
    var primaryColor = cfg.primary_color || '#10B981';
    var position = cfg.position || 'bottom-right';
    var zIndex = cfg.z_index || 9999;
    var animation = cfg.launcher_animation || 'pulse';
    var soundEnabled = cfg.sound_enabled !== false;
    var proactiveDelay = cfg.proactive_delay || 0; // 0 = disabled

    // Position styles
    var positionStyles = position === 'bottom-left' 
      ? 'left: 20px; right: auto;' 
      : 'right: 20px; left: auto;';
    var chatPosition = position === 'bottom-left'
      ? 'left: 0; right: auto;'
      : 'right: 0; left: auto;';

    // Animation keyframes
    var animationCSS = '';
    if (animation === 'bounce') {
      animationCSS = `
        @keyframes whahook-bounce {
          0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-10px); }
          60% { transform: translateY(-5px); }
        }
        #whahook-widget-bubble { animation: whahook-bounce 2s infinite; }
        #whahook-widget-bubble:hover { animation: none; transform: scale(1.05); }
      `;
    } else if (animation === 'pulse') {
      animationCSS = `
        @keyframes whahook-pulse {
          0% { box-shadow: 0 0 0 0 ${primaryColor}66; }
          70% { box-shadow: 0 0 0 15px ${primaryColor}00; }
          100% { box-shadow: 0 0 0 0 ${primaryColor}00; }
        }
        #whahook-widget-bubble { animation: whahook-pulse 2s infinite; }
        #whahook-widget-bubble:hover { animation: none; }
      `;
    }

    // Create styles
    var styles = document.createElement('style');
    styles.id = 'whahook-widget-styles';
    styles.textContent = `
      /* Container */
      #whahook-widget-container {
        position: fixed;
        bottom: 20px;
        ${positionStyles}
        z-index: ${zIndex};
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      }
      
      /* Bubble/Launcher */
      #whahook-widget-bubble {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: ${primaryColor};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      #whahook-widget-bubble:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
      }
      
      #whahook-widget-bubble svg {
        width: 28px;
        height: 28px;
        fill: white;
      }
      
      #whahook-widget-bubble.hidden {
        display: none;
      }
      
      ${animationCSS}
      
      /* Chat Window */
      #whahook-widget-chat {
        display: none;
        position: absolute;
        bottom: 70px;
        ${chatPosition}
        width: 380px;
        height: 550px;
        max-width: calc(100vw - 40px);
        max-height: calc(100vh - 100px);
        background: white;
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        flex-direction: column;
      }
      
      #whahook-widget-chat.open {
        display: flex;
      }
      
      /* Header */
      #whahook-widget-header {
        background: ${primaryColor};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-shrink: 0;
      }
      
      #whahook-widget-header-logo {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        flex-shrink: 0;
      }
      
      #whahook-widget-header-logo img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 4px;
      }
      
      #whahook-widget-header-text {
        flex: 1;
        min-width: 0;
      }
      
      #whahook-widget-header-title {
        font-weight: 600;
        font-size: 16px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      #whahook-widget-header-status {
        font-size: 12px;
        opacity: 0.9;
        display: flex;
        align-items: center;
        gap: 4px;
      }
      
      #whahook-widget-header-status::before {
        content: '';
        width: 8px;
        height: 8px;
        background: #4ade80;
        border-radius: 50%;
      }
      
      #whahook-widget-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: background 0.2s;
      }
      
      #whahook-widget-close:hover {
        background: rgba(255,255,255,0.1);
      }
      
      /* Messages Area */
      #whahook-widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f9fafb;
        scroll-behavior: smooth;
      }
      
      .whahook-message {
        margin-bottom: 8px;
        display: flex;
        flex-direction: column;
      }
      
      .whahook-message.bot {
        align-items: flex-start;
      }
      
      .whahook-message.user {
        align-items: flex-end;
      }
      
      .whahook-message-content {
        max-width: 85%;
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.5;
        word-wrap: break-word;
      }
      
      .whahook-message.bot .whahook-message-content {
        background: white;
        color: #1f2937;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }
      
      .whahook-message.user .whahook-message-content {
        background: ${primaryColor};
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      /* Markdown support */
      .whahook-message-content strong { font-weight: 600; }
      .whahook-message-content em { font-style: italic; }
      .whahook-message-content a { 
        color: inherit; 
        text-decoration: underline;
        word-break: break-all;
      }
      .whahook-message.bot .whahook-message-content a { color: ${primaryColor}; }
      
      /* Timestamp */
      .whahook-message-time {
        font-size: 10px;
        color: #9ca3af;
        margin-top: 4px;
        padding: 0 4px;
      }
      
      /* Typing Indicator */
      #whahook-typing-indicator {
        display: none;
        padding: 8px 16px;
        color: #6b7280;
        font-size: 13px;
        font-style: italic;
      }
      
      #whahook-typing-indicator.visible {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .whahook-typing-dots {
        display: flex;
        gap: 3px;
      }
      
      .whahook-typing-dot {
        width: 6px;
        height: 6px;
        background: #9ca3af;
        border-radius: 50%;
        animation: whahook-typing 1.4s infinite;
      }
      
      .whahook-typing-dot:nth-child(2) { animation-delay: 0.2s; }
      .whahook-typing-dot:nth-child(3) { animation-delay: 0.4s; }
      
      @keyframes whahook-typing {
        0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
        30% { transform: translateY(-4px); opacity: 1; }
      }
      
      /* Input Area */
      #whahook-widget-input-area {
        padding: 12px 16px;
        background: white;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        align-items: center;
        flex-shrink: 0;
      }
      
      #whahook-emoji-btn {
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        font-size: 20px;
        transition: color 0.2s;
      }
      
      #whahook-emoji-btn:hover {
        color: #6b7280;
      }
      
      #whahook-emoji-picker {
        display: none;
        position: absolute;
        bottom: 60px;
        left: 12px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 8px;
        max-width: 280px;
        flex-wrap: wrap;
        gap: 4px;
        z-index: 10;
      }
      
      #whahook-emoji-picker.open {
        display: flex;
      }
      
      .whahook-emoji {
        font-size: 20px;
        padding: 4px;
        cursor: pointer;
        border-radius: 4px;
        transition: background 0.2s;
      }
      
      .whahook-emoji:hover {
        background: #f3f4f6;
      }
      
      #whahook-widget-input {
        flex: 1;
        border: 1px solid #e5e7eb;
        border-radius: 24px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
        min-width: 0;
      }
      
      #whahook-widget-input:focus {
        border-color: ${primaryColor};
      }
      
      #whahook-widget-send {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${primaryColor};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s, transform 0.2s;
        flex-shrink: 0;
      }
      
      #whahook-widget-send:hover {
        opacity: 0.9;
        transform: scale(1.05);
      }
      
      #whahook-widget-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        transform: none;
      }
      
      #whahook-widget-send svg {
        width: 18px;
        height: 18px;
        fill: white;
      }
      
      /* Footer */
      #whahook-widget-footer {
        padding: 8px 16px;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        flex-shrink: 0;
      }
      
      #whahook-widget-footer a {
        color: #9ca3af;
        font-size: 11px;
        text-decoration: none;
        transition: color 0.2s;
      }
      
      #whahook-widget-footer a:hover {
        color: ${primaryColor};
      }
      
      /* Rating */
      #whahook-rating {
        display: none;
        padding: 12px 16px;
        background: #f9fafb;
        border-top: 1px solid #e5e7eb;
        text-align: center;
        flex-shrink: 0;
      }
      
      #whahook-rating.visible {
        display: block;
      }
      
      #whahook-rating-text {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 8px;
      }
      
      .whahook-rating-btns {
        display: flex;
        justify-content: center;
        gap: 16px;
      }
      
      .whahook-rating-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 24px;
        padding: 8px;
        border-radius: 50%;
        transition: background 0.2s, transform 0.2s;
      }
      
      .whahook-rating-btn:hover {
        background: #e5e7eb;
        transform: scale(1.1);
      }
      
      .whahook-rating-btn.selected {
        background: ${primaryColor}20;
      }
      
      /* Mobile Full Screen */
      @media (max-width: 768px) {
        #whahook-widget-container.chat-open {
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          top: 0 !important;
          width: 100% !important;
          height: 100% !important;
        }
        
        #whahook-widget-container.chat-open #whahook-widget-bubble {
          display: none;
        }
        
        #whahook-widget-container.chat-open #whahook-widget-chat {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: 100%;
          border-radius: 0;
        }
        
        #whahook-widget-container.chat-open #whahook-widget-header {
          padding-top: max(16px, env(safe-area-inset-top));
        }
        
        #whahook-widget-container.chat-open #whahook-widget-input-area {
          padding-bottom: max(12px, env(safe-area-inset-bottom));
        }
        
        #whahook-widget-container.chat-open #whahook-widget-footer {
          padding-bottom: max(8px, env(safe-area-inset-bottom));
        }
      }
      
      /* Proactive message popup */
      #whahook-proactive {
        display: none;
        position: absolute;
        bottom: 70px;
        ${chatPosition}
        background: white;
        padding: 12px 16px;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        max-width: 280px;
        font-size: 14px;
        color: #1f2937;
        cursor: pointer;
        animation: whahook-fadeIn 0.3s ease;
      }
      
      #whahook-proactive.visible {
        display: block;
      }
      
      #whahook-proactive::after {
        content: '';
        position: absolute;
        bottom: -8px;
        ${position === 'bottom-left' ? 'left: 20px;' : 'right: 20px;'}
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid white;
      }
      
      #whahook-proactive-close {
        position: absolute;
        top: 4px;
        right: 4px;
        background: none;
        border: none;
        cursor: pointer;
        color: #9ca3af;
        padding: 4px;
        font-size: 16px;
        line-height: 1;
      }
      
      @keyframes whahook-fadeIn {
        from { opacity: 0; transform: translateY(10px); }
        to { opacity: 1; transform: translateY(0); }
      }
    `;
    document.head.appendChild(styles);

    // Common emojis
    var emojis = ['😊', '👍', '❤️', '😂', '🎉', '🙏', '👋', '✨', '🔥', '💯', '😍', '🤔', '👀', '💪', '🙌', '😅'];

    // Create widget HTML
    var container = document.createElement('div');
    container.id = 'whahook-widget-container';
    container.innerHTML = `
      <div id="whahook-proactive">
        <button id="whahook-proactive-close">&times;</button>
        <span id="whahook-proactive-text">${cfg.welcome_message || 'Hello! How can I help you?'}</span>
      </div>
      <div id="whahook-widget-chat">
        <div id="whahook-widget-header">
          <div id="whahook-widget-header-logo">
            ${cfg.header_logo_url 
              ? '<img src="' + cfg.header_logo_url + '" alt="Logo">' 
              : '<svg viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>'
            }
          </div>
          <div id="whahook-widget-header-text">
            <div id="whahook-widget-header-title">${cfg.header_text || 'Chat Support'}</div>
            <div id="whahook-widget-header-status">Online</div>
          </div>
          <button id="whahook-widget-close">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div id="whahook-widget-messages"></div>
        <div id="whahook-typing-indicator">
          <div class="whahook-typing-dots">
            <div class="whahook-typing-dot"></div>
            <div class="whahook-typing-dot"></div>
            <div class="whahook-typing-dot"></div>
          </div>
          <span>Escribiendo...</span>
        </div>
        <div id="whahook-rating">
          <div id="whahook-rating-text">¿Te ha sido útil esta conversación?</div>
          <div class="whahook-rating-btns">
            <button class="whahook-rating-btn" data-rating="positive">👍</button>
            <button class="whahook-rating-btn" data-rating="negative">👎</button>
          </div>
        </div>
        <div id="whahook-widget-input-area">
          <button id="whahook-emoji-btn">😊</button>
          <div id="whahook-emoji-picker">
            ${emojis.map(function(e) { return '<span class="whahook-emoji">' + e + '</span>'; }).join('')}
          </div>
          <input type="text" id="whahook-widget-input" placeholder="${cfg.placeholder_text || 'Escribe tu mensaje...'}" />
          <button id="whahook-widget-send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
        <div id="whahook-widget-footer">
          <a href="https://whahook2.vercel.app" target="_blank" rel="noopener">Powered by <strong>WhaHook</strong></a>
        </div>
      </div>
      <div id="whahook-widget-bubble">
        <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>
      </div>
    `;
    document.body.appendChild(container);

    // Get elements
    var bubble = document.getElementById('whahook-widget-bubble');
    var chat = document.getElementById('whahook-widget-chat');
    var closeBtn = document.getElementById('whahook-widget-close');
    var messagesContainer = document.getElementById('whahook-widget-messages');
    var input = document.getElementById('whahook-widget-input');
    var sendBtn = document.getElementById('whahook-widget-send');
    var typingIndicator = document.getElementById('whahook-typing-indicator');
    var emojiBtn = document.getElementById('whahook-emoji-btn');
    var emojiPicker = document.getElementById('whahook-emoji-picker');
    var proactive = document.getElementById('whahook-proactive');
    var proactiveClose = document.getElementById('whahook-proactive-close');
    var ratingContainer = document.getElementById('whahook-rating');
    var ratingBtns = document.querySelectorAll('.whahook-rating-btn');

    var conversationId = null;
    var isOpen = false;
    var messageCount = 0;

    // Notification sound (base64 encoded short beep)
    var notificationSound = null;
    if (soundEnabled) {
      try {
        notificationSound = new Audio('data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAABhgC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAAYYNBrv+AAAAAAAAAAAAAAAAAAAAAP/7UMQAA8AAADSAAAAAAAAANIAAAAATEFNRTMuMTAwVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+1DEAYPAAADSAAAAAAAAANIAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVU=');
      } catch(e) {}
    }

    // Format time
    function formatTime(date) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // Parse markdown (basic)
    function parseMarkdown(text) {
      // Escape HTML first
      var escaped = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
      
      // Parse markdown
      return escaped
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/__(.+?)__/g, '<strong>$1</strong>')
        .replace(/_(.+?)_/g, '<em>$1</em>')
        .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
        .replace(/(https?:\/\/[^\s<]+)/g, function(url) {
          if (url.indexOf('</a>') === -1 && url.indexOf('href=') === -1) {
            return '<a href="' + url + '" target="_blank" rel="noopener">' + url + '</a>';
          }
          return url;
        })
        .replace(/\n/g, '<br>');
    }

    // Toggle chat
    function toggleChat() {
      isOpen = !isOpen;
      chat.classList.toggle('open', isOpen);
      container.classList.toggle('chat-open', isOpen);
      
      // Hide proactive message
      proactive.classList.remove('visible');
      
      if (isOpen) {
        if (messagesContainer.children.length === 0) {
          addMessage(cfg.welcome_message || '¡Hola! ¿Cómo puedo ayudarte?', 'bot');
        }
        input.focus();
      }
    }

    // Add message
    function addMessage(text, type, showTime) {
      if (showTime === undefined) showTime = true;
      
      var messageDiv = document.createElement('div');
      messageDiv.className = 'whahook-message ' + type;
      
      var content = '<div class="whahook-message-content">' + parseMarkdown(text) + '</div>';
      if (showTime) {
        content += '<div class="whahook-message-time">' + formatTime(new Date()) + '</div>';
      }
      
      messageDiv.innerHTML = content;
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
      
      messageCount++;
      
      // Play sound for bot messages
      if (type === 'bot' && notificationSound && soundEnabled && messageCount > 1) {
        try { notificationSound.play(); } catch(e) {}
      }
      
      // Show rating after 5 messages
      if (messageCount >= 5 && !ratingContainer.classList.contains('visible') && !ratingContainer.classList.contains('rated')) {
        ratingContainer.classList.add('visible');
      }
    }

    // Show/hide typing
    function showTyping() {
      typingIndicator.classList.add('visible');
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideTyping() {
      typingIndicator.classList.remove('visible');
    }

    // Get visitor ID
    function getVisitorId() {
      var visitorId = localStorage.getItem('whahook_visitor_id');
      if (!visitorId) {
        visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('whahook_visitor_id', visitorId);
      }
      return visitorId;
    }

    // Send message
    function sendMessage() {
      var text = input.value.trim();
      if (!text) return;

      addMessage(text, 'user');
      input.value = '';
      sendBtn.disabled = true;
      showTyping();

      fetch(apiUrl + '/api/public/chat-widgets/' + widgetId + '/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId,
          visitorId: getVisitorId()
        })
      })
      .then(function(response) { return response.json(); })
      .then(function(data) {
        hideTyping();
        sendBtn.disabled = false;
        
        if (data.success) {
          conversationId = data.data.conversation_id;
          addMessage(data.data.response, 'bot');
        } else {
          addMessage('Lo siento, algo salió mal. Por favor, inténtalo de nuevo.', 'bot');
        }
      })
      .catch(function(error) {
        hideTyping();
        sendBtn.disabled = false;
        console.error('Whahook Widget Error:', error);
        addMessage('Lo siento, no pude conectar. Por favor, inténtalo más tarde.', 'bot');
      });
    }

    // Send rating
    function sendRating(rating) {
      ratingBtns.forEach(function(btn) {
        btn.classList.remove('selected');
        if (btn.dataset.rating === rating) {
          btn.classList.add('selected');
        }
      });
      
      ratingContainer.classList.add('rated');
      
      // Send to API
      fetch(apiUrl + '/api/public/chat-widgets/' + widgetId + '/rating', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversationId,
          rating: rating,
          visitorId: getVisitorId()
        })
      }).catch(function() {});
      
      setTimeout(function() {
        ratingContainer.classList.remove('visible');
      }, 1500);
    }

    // Event listeners
    bubble.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);
    sendBtn.addEventListener('click', sendMessage);
    
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') sendMessage();
    });

    // Emoji picker
    emojiBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      emojiPicker.classList.toggle('open');
    });

    emojiPicker.addEventListener('click', function(e) {
      if (e.target.classList.contains('whahook-emoji')) {
        input.value += e.target.textContent;
        emojiPicker.classList.remove('open');
        input.focus();
      }
    });

    document.addEventListener('click', function(e) {
      if (!emojiPicker.contains(e.target) && e.target !== emojiBtn) {
        emojiPicker.classList.remove('open');
      }
    });

    // Rating buttons
    ratingBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        sendRating(btn.dataset.rating);
      });
    });

    // Proactive message
    proactive.addEventListener('click', function(e) {
      if (e.target !== proactiveClose) {
        toggleChat();
      }
    });

    proactiveClose.addEventListener('click', function(e) {
      e.stopPropagation();
      proactive.classList.remove('visible');
    });

    // Show proactive message after delay
    if (proactiveDelay > 0) {
      setTimeout(function() {
        if (!isOpen && !localStorage.getItem('whahook_proactive_closed_' + widgetId)) {
          proactive.classList.add('visible');
        }
      }, proactiveDelay * 1000);
    }

    console.log('Whahook Widget v2.0 loaded successfully');
  }
})();
