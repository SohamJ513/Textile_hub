'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  XMarkIcon, 
  ChatBubbleLeftRightIcon, 
  MicrophoneIcon, 
  PaperAirplaneIcon, 
  SparklesIcon,
  ShoppingBagIcon,
  ArrowRightIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  UserCircleIcon,
  BoltIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';
import api from '@/lib/api';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  products?: any[];
  intent?: string;
  suggestions?: { name: string; id: string }[];
  timestamp: Date;
  fallback?: boolean;
}

// TypeScript declaration for SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function AIChat() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      type: 'assistant',
      content: "👋 Hello! I'm your AI assistant. I can help you find fabrics, compare products, and answer questions about our marketplace. What are you looking for today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  const getIntentIcon = (intent?: string) => {
    const icons: Record<string, string> = {
      search: '🔍',
      recommend: '💡',
      compare: '⚖️',
      pricing: '💰',
      availability: '📦',
      question: '❓',
    };
    return icons[intent || 'question'] || '🤖';
  };

  const getIntentLabel = (intent?: string) => {
    const labels: Record<string, string> = {
      search: 'Searching products',
      recommend: 'Making recommendations',
      compare: 'Comparing products',
      pricing: 'Checking prices',
      availability: 'Checking stock',
      question: 'Answering question',
    };
    return labels[intent || 'question'] || 'AI thinking...';
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/ai/chat', { 
        message: input,
        context: messages.slice(-5).map(m => ({ type: m.type, content: m.content }))
      });

      const data = response.data;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response || "I'm sorry, I didn't understand that. Could you please rephrase?",
        products: data.products || [],
        intent: data.intent || 'question',
        suggestions: data.suggestions || [],
        timestamp: new Date(),
        fallback: data.fallback || false,
      };

      setMessages(prev => [...prev, assistantMessage]);

      if (data.products && data.products.length > 0) {
        const summaryMessage: Message = {
          id: (Date.now() + 2).toString(),
          type: 'assistant',
          content: `🛍️ I found ${data.products.length} product${data.products.length > 1 ? 's' : ''} that match your request:`,
          products: data.products.slice(0, 5),
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, summaryMessage]);
      }

    } catch (error) {
      console.error('AI Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
        fallback: true,
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Voice input is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsListening(true);

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      setTimeout(() => sendMessage(), 300);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleProductClick = (productId: string) => {
    setIsOpen(false);
    router.push(`/products/${productId}`);
  };

  const handleSuggestionClick = (suggestion: { name: string; id: string }) => {
    if (suggestion.id) {
      handleProductClick(suggestion.id);
    } else {
      setInput(suggestion.name);
      setTimeout(() => sendMessage(), 100);
    }
  };

  const quickSuggestions = [
    { name: 'Show me cotton fabrics', icon: '🌿' },
    { name: 'Find silk under $50', icon: '🪭' },
    { name: 'What fabrics are in stock?', icon: '📦' },
    { name: 'Recommend summer fabrics', icon: '☀️' },
    { name: 'Compare cotton vs silk', icon: '⚖️' },
    { name: 'I need affordable fabrics', icon: '💰' },
  ];

  return (
    <>
      {/* Chat Button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-textile-indigo to-textile-royal text-white rounded-full p-4 shadow-textile hover:shadow-textile-hover transition-all duration-300 z-50 group"
      >
        {isOpen ? (
          <XMarkIcon className="w-6 h-6" />
        ) : (
          <div className="relative">
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></span>
          </div>
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] bg-white/95 backdrop-blur-sm rounded-2xl shadow-textile border-2 border-textile-gold/20 z-50 flex flex-col max-h-[600px] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-textile-indigo to-textile-royal p-4 rounded-t-2xl flex justify-between items-center">
              <div className="flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-textile-gold" />
                <span className="font-semibold text-white">AI Assistant</span>
                <span className="text-xs bg-green-400 text-textile-indigo px-2 py-0.5 rounded-full font-medium">Online</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors text-white/80 hover:text-white"
                >
                  {isMinimized ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="hover:bg-white/20 rounded-full p-1 transition-colors text-white/80 hover:text-white"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages - Hidden when minimized */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[300px] max-h-[400px] bg-textile-cream/30">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[85%] rounded-xl p-3 ${
                            message.type === 'user'
                              ? 'bg-gradient-to-r from-textile-indigo to-textile-royal text-white shadow-md'
                              : 'bg-white border-2 border-textile-gold/10 text-textile-brown shadow-soft'
                          }`}
                        >
                          {/* Intent indicator for assistant messages */}
                          {message.type === 'assistant' && message.intent && !message.content.includes('found') && (
                            <div className="flex items-center gap-1 text-xs text-textile-brown/60 mb-1.5">
                              <span>{getIntentIcon(message.intent)}</span>
                              <span>{getIntentLabel(message.intent)}</span>
                              {message.fallback && (
                                <span className="text-textile-gold text-[10px] ml-1">(basic mode)</span>
                              )}
                            </div>
                          )}
                          
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          
                          {/* Product cards in message */}
                          {message.products && message.products.length > 0 && (
                            <div className="mt-3 space-y-2">
                              {message.products.map((product: any) => (
                                <button
                                  key={product._id}
                                  onClick={() => handleProductClick(product._id)}
                                  className="w-full text-left bg-textile-warm/30 hover:bg-textile-warm/60 rounded-lg p-2 transition-all duration-200 flex items-center gap-3 border-2 border-textile-gold/10 hover:border-textile-gold/30"
                                >
                                  <img
                                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=40&h=40&fit=crop'}
                                    alt={product.name}
                                    className="w-12 h-12 object-cover rounded-lg"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-textile-brown truncate">{product.name}</p>
                                    <p className="text-xs text-textile-brown/60">{product.category}</p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-xs font-bold gradient-textile">${product.price?.toFixed(2)}</span>
                                      {product.stock > 0 ? (
                                        <span className="text-xs text-green-600">✅ In Stock</span>
                                      ) : (
                                        <span className="text-xs text-textile-terracotta">❌ Out of Stock</span>
                                      )}
                                    </div>
                                  </div>
                                  <ArrowRightIcon className="w-4 h-4 text-textile-brown/30" />
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Suggestions */}
                          {message.suggestions && message.suggestions.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {message.suggestions.slice(0, 4).map((suggestion) => (
                                <button
                                  key={suggestion.name}
                                  onClick={() => handleSuggestionClick(suggestion)}
                                  className="text-xs bg-textile-gold/10 text-textile-gold hover:bg-textile-gold/20 rounded-full px-3 py-1 transition-all duration-200 border border-textile-gold/20 hover:border-textile-gold/40"
                                >
                                  {suggestion.name}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-textile-brown/40 mt-1 px-1">
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex justify-start"
                    >
                      <div className="bg-white border-2 border-textile-gold/10 rounded-xl p-3 shadow-soft">
                        <div className="flex items-center gap-3">
                          <div className="flex space-x-1">
                            <div className="w-2 h-2 bg-textile-indigo rounded-full animate-bounce"></div>
                            <div className="w-2 h-2 bg-textile-royal rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                            <div className="w-2 h-2 bg-textile-gold rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                          </div>
                          <span className="text-xs text-textile-brown/60">AI is thinking...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Suggestions */}
                {messages.length < 3 && (
                  <div className="px-4 py-3 border-t-2 border-textile-gold/10 bg-textile-cream/30">
                    <p className="text-xs font-medium text-textile-brown/60 mb-2 flex items-center gap-1">
                      <LightBulbIcon className="w-3 h-3 text-textile-gold" />
                      Try asking:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {quickSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.name}
                          onClick={() => {
                            setInput(suggestion.name);
                            setTimeout(() => sendMessage(), 100);
                          }}
                          className="text-xs bg-white border-2 border-textile-gold/10 rounded-full px-3 py-1.5 hover:border-textile-gold/30 hover:bg-textile-gold/5 transition-all duration-200 text-textile-brown"
                        >
                          {suggestion.icon} {suggestion.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="border-t-2 border-textile-gold/10 p-3 bg-white rounded-b-2xl">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleVoiceInput}
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        isListening
                          ? 'bg-textile-terracotta text-white animate-pulse shadow-lg shadow-textile-terracotta/20'
                          : 'bg-textile-cream text-textile-brown hover:bg-textile-gold/10 border-2 border-textile-gold/20 hover:border-textile-gold/40'
                      }`}
                      title="Voice input"
                    >
                      <MicrophoneIcon className="w-5 h-5" />
                    </button>
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder={isListening ? '🎤 Listening...' : 'Type your message...'}
                      className="flex-1 px-4 py-2 border-2 border-textile-gold/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-textile-gold focus:border-transparent transition-all duration-200 bg-textile-cream/30 text-textile-brown placeholder:text-textile-brown/40"
                      disabled={isListening}
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!input.trim() || isLoading || isListening}
                      className="p-2 bg-gradient-to-r from-textile-indigo to-textile-royal text-white rounded-xl hover:shadow-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <PaperAirplaneIcon className="w-5 h-5" />
                    </button>
                  </div>
                  {isListening && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-xs text-textile-terracotta mt-1.5 text-center font-medium"
                    >
                      🎤 Listening... Please speak clearly
                    </motion.p>
                  )}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}