import { useState, useEffect } from 'react';
import '../styles/Notebook.css';

export interface ChatMessage {
  timestamp: string;
  sender: string;
  content: string;
}

interface NotebookProps {
  isOpen: boolean;
  onClose: () => void;
}

const Notebook = ({ isOpen, onClose }: NotebookProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    // Load initial messages
    loadMessages();

    // Add listener for updates
    const handleHistoryUpdate = () => {
      loadMessages();
    };

    window.addEventListener('chatHistoryUpdated', handleHistoryUpdate);

    return () => {
      window.removeEventListener('chatHistoryUpdated', handleHistoryUpdate);
    };
  }, []);

  const loadMessages = () => {
    const savedMessages = localStorage.getItem('chatHistory');
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="notebook-window">
      <div className="notebook-header">
        <h2>Phil's Notebook</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>
      <div className="notebook-content">
        {messages.map((msg, index) => (
          <div key={index} className="message-entry">
            <div className="message-header">
              <span className="timestamp">{msg.timestamp}</span>
              <span className="sender">{msg.sender}</span>
            </div>
            <div className="message-content">{msg.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Notebook; 