import React, { useState, useRef, useEffect } from 'react';
import './AIChatbot.css';
import aiService from '../../services/aiService';

export default function AIChatbot({ token }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: 'Xin chào! Tôi là Trợ lý AI của MarketLink 🌿. Bạn muốn tìm chợ nông sản họp hôm nay, hay cần gợi ý rau củ tươi sạch từ nông dân?'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const quickPrompts = [
    'Chợ nào mở vào sáng Thứ 7?',
    'Rau hữu cơ nào đang vào vụ?',
    'Cách đặt trước nhận tại sạp?'
  ];

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (customText = null) => {
    const textToSend = customText || inputValue.trim();
    if (!textToSend || isLoading) return;

    const userMsg = { id: Date.now(), sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInputValue('');
    setIsLoading(true);

    try {
      const botReply = await aiService.askAssistant(textToSend);
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: botReply }
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, sender: 'bot', text: 'Xin lỗi bạn, trợ lý tạm thời gặp sự cố kết nối. Bạn có thể xem danh mục nông sản trực tiếp trên website nhé!' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ml-chatbot-container">
      {/* Floating Trigger Button */}
      <button
        type="button"
        className={`ml-chatbot-bubble ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Mở trợ lý AI MarketLink"
      >
        <span className="ml-bubble-icon">{isOpen ? '✕' : '🤖'}</span>
        {!isOpen && <span className="ml-bubble-pulse" />}
      </button>

      {/* Chat Sheet / Dialog */}
      {isOpen && (
        <div className="ml-chat-window">
          {/* Header */}
          <div className="ml-chat-header">
            <div className="ml-chat-bot-info">
              <div className="ml-chat-avatar">🌱</div>
              <div>
                <div className="ml-chat-name">Trợ lý AI Nông Sản</div>
                <div className="ml-chat-status">
                  <span className="ml-status-dot" /> Trực tuyến • Sẵn sàng hỗ trợ
                </div>
              </div>
            </div>
            <button 
              type="button" 
              className="ml-chat-close-btn"
              onClick={() => setIsOpen(false)}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="ml-chat-body">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`ml-chat-bubble-row ${msg.sender === 'user' ? 'user' : 'bot'}`}
              >
                {msg.sender === 'bot' && <span className="ml-msg-bot-avatar">🤖</span>}
                <div className={`ml-msg-bubble ${msg.sender === 'user' ? 'user' : 'bot'}`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="ml-chat-bubble-row bot">
                <span className="ml-msg-bot-avatar">🤖</span>
                <div className="ml-msg-bubble bot ml-typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="ml-chat-prompts">
            {quickPrompts.map((p, idx) => (
              <button 
                key={idx} 
                type="button" 
                className="ml-prompt-chip"
                onClick={() => handleSendMessage(p)}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form 
            className="ml-chat-footer"
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
          >
            <input
              type="text"
              className="ml-chat-input"
              placeholder="Hỏi về chợ, nông sản, giá bán..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button 
              type="submit" 
              className="ml-chat-send-btn"
              disabled={!inputValue.trim() || isLoading}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
