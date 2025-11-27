/**
 * Whahook Chat Widget Loader
 * This script loads the chat widget on external websites
 */
(function() {
  'use strict';

  // Check if widget config exists
  if (!window.WhahookWidget) {
    console.error('Whahook Widget: Configuration not found. Make sure WhahookWidget is defined before loading this script.');
    return;
  }

  var config = window.WhahookWidget;
  var widgetId = config.widgetId;
  var apiUrl = config.apiUrl || 'https://whahook2.vercel.app';

  if (!widgetId) {
    console.error('Whahook Widget: widgetId is required');
    return;
  }

  // Prevent double initialization
  if (window.WhahookWidgetLoaded) {
    return;
  }
  window.WhahookWidgetLoaded = true;

  // Detect visitor's language from browser
  function getVisitorLanguage() {
    var lang = navigator.language || navigator.userLanguage || 'en';
    // Get primary language code (e.g., 'es' from 'es-ES')
    return lang.split('-')[0].toLowerCase();
  }

  var visitorLanguage = getVisitorLanguage();

  // Fetch widget configuration from API with language parameter
  fetch(apiUrl + '/api/public/chat-widgets/' + widgetId + '/config?lang=' + visitorLanguage)
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Widget not found or inactive');
      }
      return response.json();
    })
    .then(function(data) {
      if (!data.success) {
        throw new Error(data.error || 'Failed to load widget');
      }
      initWidget(data.data);
    })
    .catch(function(error) {
      console.error('Whahook Widget Error:', error.message);
    });

  function initWidget(widgetConfig) {
    // Create styles
    var styles = document.createElement('style');
    styles.textContent = `
      #whahook-widget-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 999999;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
      }
      
      #whahook-widget-bubble {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: ${widgetConfig.primary_color || '#10B981'};
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      
      #whahook-widget-bubble:hover {
        transform: scale(1.05);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
      }
      
      #whahook-widget-bubble svg {
        width: 28px;
        height: 28px;
        fill: white;
      }
      
      #whahook-widget-chat {
        display: none;
        position: absolute;
        bottom: 70px;
        right: 0;
        width: 380px;
        max-width: calc(100vw - 40px);
        height: 520px;
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
      
      #whahook-widget-header {
        background-color: ${widgetConfig.primary_color || '#10B981'};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      
      #whahook-widget-header-logo {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(255,255,255,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }
      
      #whahook-widget-header-logo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      
      #whahook-widget-header-text {
        flex: 1;
      }
      
      #whahook-widget-header-title {
        font-weight: 600;
        font-size: 16px;
      }
      
      #whahook-widget-header-status {
        font-size: 12px;
        opacity: 0.9;
      }
      
      #whahook-widget-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      #whahook-widget-close:hover {
        opacity: 0.8;
      }
      
      #whahook-widget-messages {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f9fafb;
      }
      
      .whahook-message {
        margin-bottom: 12px;
        display: flex;
      }
      
      .whahook-message.bot {
        justify-content: flex-start;
      }
      
      .whahook-message.user {
        justify-content: flex-end;
      }
      
      .whahook-message-content {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: 16px;
        font-size: 14px;
        line-height: 1.4;
      }
      
      .whahook-message.bot .whahook-message-content {
        background: white;
        color: #1f2937;
        border-bottom-left-radius: 4px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.05);
      }
      
      .whahook-message.user .whahook-message-content {
        background: ${widgetConfig.primary_color || '#10B981'};
        color: white;
        border-bottom-right-radius: 4px;
      }
      
      #whahook-widget-input-area {
        padding: 12px 16px;
        background: white;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
      }
      
      #whahook-widget-input {
        flex: 1;
        border: 1px solid #e5e7eb;
        border-radius: 24px;
        padding: 10px 16px;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      
      #whahook-widget-input:focus {
        border-color: ${widgetConfig.primary_color || '#10B981'};
      }
      
      #whahook-widget-send {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: ${widgetConfig.primary_color || '#10B981'};
        border: none;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: opacity 0.2s;
      }
      
      #whahook-widget-send:hover {
        opacity: 0.9;
      }
      
      #whahook-widget-send:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
      
      #whahook-widget-send svg {
        width: 18px;
        height: 18px;
        fill: white;
      }
      
      .whahook-typing {
        display: flex;
        gap: 4px;
        padding: 10px 14px;
      }
      
      .whahook-typing-dot {
        width: 8px;
        height: 8px;
        background: #9ca3af;
        border-radius: 50%;
        animation: whahook-typing 1.4s infinite;
      }
      
      .whahook-typing-dot:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      .whahook-typing-dot:nth-child(3) {
        animation-delay: 0.4s;
      }
      
      @keyframes whahook-typing {
        0%, 60%, 100% { transform: translateY(0); }
        30% { transform: translateY(-4px); }
      }
      
      @media (max-width: 480px) {
        #whahook-widget-chat {
          width: calc(100vw - 20px);
          height: calc(100vh - 100px);
          right: -10px;
          bottom: 70px;
        }
      }
    `;
    document.head.appendChild(styles);

    // Create widget HTML
    var container = document.createElement('div');
    container.id = 'whahook-widget-container';
    container.innerHTML = `
      <div id="whahook-widget-chat">
        <div id="whahook-widget-header">
          <div id="whahook-widget-header-logo">
            ${widgetConfig.header_logo_url 
              ? '<img src="' + widgetConfig.header_logo_url + '" alt="Logo">' 
              : '<svg viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/></svg>'
            }
          </div>
          <div id="whahook-widget-header-text">
            <div id="whahook-widget-header-title">${widgetConfig.header_text || 'Chat Support'}</div>
            <div id="whahook-widget-header-status">Online</div>
          </div>
          <button id="whahook-widget-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>
        <div id="whahook-widget-messages"></div>
        <div id="whahook-widget-input-area">
          <input type="text" id="whahook-widget-input" placeholder="${widgetConfig.placeholder_text || 'Type your message...'}" />
          <button id="whahook-widget-send">
            <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
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

    var conversationId = null;
    var isOpen = false;

    // Toggle chat
    function toggleChat() {
      isOpen = !isOpen;
      chat.classList.toggle('open', isOpen);
      if (isOpen && messagesContainer.children.length === 0) {
        // Show welcome message
        addMessage(widgetConfig.welcome_message || 'Hello! How can I help you today?', 'bot');
      }
    }

    bubble.addEventListener('click', toggleChat);
    closeBtn.addEventListener('click', toggleChat);

    // Add message to chat
    function addMessage(text, type) {
      var messageDiv = document.createElement('div');
      messageDiv.className = 'whahook-message ' + type;
      messageDiv.innerHTML = '<div class="whahook-message-content">' + escapeHtml(text) + '</div>';
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    // Show typing indicator
    function showTyping() {
      var typingDiv = document.createElement('div');
      typingDiv.id = 'whahook-typing';
      typingDiv.className = 'whahook-message bot';
      typingDiv.innerHTML = '<div class="whahook-message-content whahook-typing"><div class="whahook-typing-dot"></div><div class="whahook-typing-dot"></div><div class="whahook-typing-dot"></div></div>';
      messagesContainer.appendChild(typingDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    function hideTyping() {
      var typing = document.getElementById('whahook-typing');
      if (typing) typing.remove();
    }

    // Escape HTML
    function escapeHtml(text) {
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }

    // Send message
    function sendMessage() {
      var text = input.value.trim();
      if (!text) return;

      addMessage(text, 'user');
      input.value = '';
      sendBtn.disabled = true;
      showTyping();

      // Send to API
      fetch(apiUrl + '/api/public/chat-widgets/' + widgetId + '/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: text,
          conversationId: conversationId,
          visitorId: getVisitorId()
        })
      })
      .then(function(response) {
        return response.json();
      })
      .then(function(data) {
        hideTyping();
        sendBtn.disabled = false;
        
        if (data.success) {
          conversationId = data.data.conversation_id;
          addMessage(data.data.response, 'bot');
        } else {
          addMessage('Sorry, something went wrong. Please try again.', 'bot');
        }
      })
      .catch(function(error) {
        hideTyping();
        sendBtn.disabled = false;
        console.error('Whahook Widget Error:', error);
        addMessage('Sorry, I couldn\'t connect. Please try again later.', 'bot');
      });
    }

    // Get or create visitor ID
    function getVisitorId() {
      var visitorId = localStorage.getItem('whahook_visitor_id');
      if (!visitorId) {
        visitorId = 'visitor_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
        localStorage.setItem('whahook_visitor_id', visitorId);
      }
      return visitorId;
    }

    // Event listeners
    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        sendMessage();
      }
    });

    console.log('Whahook Widget loaded successfully');
  }
})();
