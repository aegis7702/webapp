import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Send } from 'lucide-react';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'agent';
  timestamp: Date;
  isTyping?: boolean;
}

const STORAGE_KEY = 'aegis_agent_messages';
const LAST_READ_KEY = 'aegis_agent_last_read';

export function AgentChat() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [isAgentResponding, setIsAgentResponding] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem(STORAGE_KEY);
    const lastReadTimestamp = localStorage.getItem(LAST_READ_KEY);
    
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);

        // Check if there are unread messages
        if (lastReadTimestamp && messagesWithDates.length > 0) {
          const lastMessage = messagesWithDates[messagesWithDates.length - 1];
          if (lastMessage.sender === 'agent' && 
              new Date(lastMessage.timestamp) > new Date(lastReadTimestamp)) {
            setHasUnreadMessage(true);
          }
        }
      } catch (error) {
        console.error('Failed to parse saved messages:', error);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages]);

  // Mark messages as read when panel is opened
  useEffect(() => {
    if (isExpanded && hasUnreadMessage) {
      setHasUnreadMessage(false);
      localStorage.setItem(LAST_READ_KEY, new Date().toISOString());
    }
  }, [isExpanded, hasUnreadMessage]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAgentThinking]);

  useEffect(() => {
    if (isExpanded && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isExpanded]);

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Simulate Agent response
    simulateAgentResponse(inputValue);
  };

  const simulateAgentResponse = (userInput: string) => {
    // Show thinking state
    setIsAgentThinking(true);
    setIsAgentResponding(true);

    setTimeout(() => {
      setIsAgentThinking(false);

      // Generate response based on user input
      const responseText = generateAgentResponse(userInput);
      const agentMessageId = Date.now().toString();

      const agentMessage: Message = {
        id: agentMessageId,
        content: '',
        sender: 'agent',
        timestamp: new Date(),
        isTyping: true
      };

      setMessages(prev => [...prev, agentMessage]);
      setTypingMessageId(agentMessageId);

      // Simulate typing
      typeMessage(responseText, agentMessageId);
    }, 1500); // Thinking duration
  };

  const typeMessage = (text: string, messageId: string) => {
    let currentIndex = 0;
    const typingSpeed = 30; // ms per character

    // Clear any existing typing interval
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < text.length) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, content: text.substring(0, currentIndex + 1) }
              : msg
          )
        );
        currentIndex++;
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setMessages(prev =>
          prev.map(msg =>
            msg.id === messageId
              ? { ...msg, isTyping: false }
              : msg
          )
        );
        setTypingMessageId(null);
        setIsAgentResponding(false);

        // If panel is minimized, show unread indicator
        if (!isExpanded) {
          setHasUnreadMessage(true);
        } else {
          // Mark as read immediately if panel is open
          localStorage.setItem(LAST_READ_KEY, new Date().toISOString());
        }
      }
    }, typingSpeed);
  };

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  const generateAgentResponse = (userInput: string): string => {
    const lowerInput = userInput.toLowerCase();

    if (lowerInput.includes('safe') || lowerInput.includes('security')) {
      return 'I analyze implementations according to EIP-7702 standards. Each implementation undergoes comprehensive security checks including storage structure compatibility, upgrade safety, and state collision risk assessment.';
    } else if (lowerInput.includes('implementation') || lowerInput.includes('imple')) {
      return 'Implementations are smart contract modules that extend your wallet functionality. I verify each implementation for security compliance before you activate it. Would you like me to explain the verification process?';
    } else if (lowerInput.includes('activate') || lowerInput.includes('change')) {
      return 'Before activating or changing an implementation, I perform a compatibility analysis to ensure it\'s safe to use with your current setup. This includes checking storage structure, upgrade paths, and potential conflicts.';
    } else if (lowerInput.includes('risk')) {
      return 'I categorize implementations by risk level: Safe (fully verified), Low Risk (minor considerations), Unsafe (significant concerns), and Unknown (insufficient data). Each level reflects comprehensive security analysis.';
    } else if (lowerInput.includes('transaction') || lowerInput.includes('7702')) {
      return 'I monitor EIP-7702 transactions continuously, even after execution. Post-execution analysis helps detect anomalies that only become visible through event monitoring and state change tracking.';
    } else {
      return 'I\'m here to help you understand implementation security, EIP-7702 compliance, and wallet protection. Feel free to ask about any implementation details, security concerns, or activation processes.';
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleOpenPanel = () => {
    setIsExpanded(true);
    if (hasUnreadMessage) {
      setHasUnreadMessage(false);
      localStorage.setItem(LAST_READ_KEY, new Date().toISOString());
    }
  };

  // Determine if Agent is actively working (thinking or responding)
  const isAgentWorking = isAgentThinking || isAgentResponding;

  return (
    <>
      {/* Floating Button */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={handleOpenPanel}
            className="fixed bottom-[88px] right-6 w-14 h-14 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all z-50 relative"
          >
            {/* Loading Animation - Agent is working while minimized */}
            {isAgentWorking && (
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white border-t-transparent"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
            )}

            <MessageCircle className="w-6 h-6 text-white" />

            {/* Red Dot Indicator - New message available */}
            {hasUnreadMessage && !isAgentWorking && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-white"
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded Chat Panel */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-stone-900/20 z-40"
            />

            {/* Chat Panel */}
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 flex flex-col max-w-4xl mx-auto"
              style={{ height: '50vh', maxHeight: '600px' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center shadow-sm">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-base text-stone-900">Aegis Agent</h3>
                    <p className="text-xs text-stone-500">Security Assistant</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center transition-colors"
                >
                  <X className="w-5 h-5 text-stone-600" />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="w-8 h-8 text-orange-600" />
                    </div>
                    <h4 className="font-semibold text-lg text-stone-900 mb-2">How can I help you?</h4>
                    <p className="text-sm text-stone-600">
                      Ask me about implementation security, EIP-7702 compliance, or wallet protection.
                    </p>
                  </div>
                )}

                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                        message.sender === 'user'
                          ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white'
                          : 'bg-stone-100 text-stone-900'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                        {message.isTyping && (
                          <span className="inline-block w-1 h-4 bg-current ml-1 animate-pulse" />
                        )}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {isAgentThinking && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-start"
                  >
                    <div className="bg-stone-100 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-stone-600">Thinking</span>
                        <div className="flex gap-1">
                          <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                            className="w-1.5 h-1.5 bg-stone-600 rounded-full"
                          />
                          <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                            className="w-1.5 h-1.5 bg-stone-600 rounded-full"
                          />
                          <motion.span
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                            className="w-1.5 h-1.5 bg-stone-600 rounded-full"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-stone-200 px-6 py-4 bg-white rounded-b-3xl">
                <div className="flex items-end gap-3">
                  <textarea
                    ref={textareaRef}
                    value={inputValue}
                    onChange={handleTextareaChange}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask about implementations, security, or compliance..."
                    className="flex-1 bg-stone-50 rounded-2xl px-4 py-3 text-sm text-stone-900 placeholder-stone-400 outline-none border border-stone-200 focus:border-orange-500 resize-none min-h-[48px] max-h-[200px] transition-colors"
                    rows={1}
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                      inputValue.trim()
                        ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-md hover:shadow-lg'
                        : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                    }`}
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-stone-400 mt-2">
                  Press Enter to send, Shift+Enter for new line
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}