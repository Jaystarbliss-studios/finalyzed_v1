import React, { useState, useEffect, useRef } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from '../lib/supabaseCompat';
import { db } from '../lib/supabase';
import { Send, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ProjectChat({ projectId, onClose }: { projectId: string, onClose: () => void }) {
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectId || projectId === 'demo') return;
    
    const q = query(
      collection(db, 'projects', projectId, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMessages(msgs);
    });
    
    return () => unsubscribe();
  }, [projectId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || projectId === 'demo') return;
    
    try {
      await addDoc(collection(db, 'projects', projectId, 'messages'), {
        text: newMessage.trim(),
        senderId: user.uid,
        senderName: userData?.name || 'User',
        senderRole: userData?.role || 'student',
        createdAt: serverTimestamp()
      });
      setNewMessage('');
    } catch (err) {
      console.error("Error sending message:", err);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-background border border-border rounded-xl shadow-2xl relative">
      <div className="flex justify-between items-center p-4 border-b border-border bg-muted/50 rounded-t-xl">
        <h3 className="font-bold flex items-center gap-2 text-sm uppercase tracking-wider">Workspace Chat</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted">
          <X className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
        {messages.length === 0 ? (
          <div className="text-center text-muted-foreground my-auto text-sm">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={`flex flex-col max-w-[85%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}>
                <span className="text-[10px] text-muted-foreground mb-1 mx-1 capitalize font-medium">
                  {msg.senderName} • {msg.senderRole}
                </span>
                <div className={`p-3 rounded-2xl text-sm shadow-sm ${isMe ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-border bg-muted/20 flex gap-2 rounded-b-xl">
        <input 
          type="text" 
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..." 
          className="flex-1 bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary transition-colors"
        />
        <button 
          type="submit" 
          disabled={!newMessage.trim()} 
          className="bg-primary text-white p-2 rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
