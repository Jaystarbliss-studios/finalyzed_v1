import React, { useEffect, useRef, useState } from 'react';
import { Send, X, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type Message = { id: string; project_id: string; sender_id: string; sender_name: string | null; sender_role: string | null; text: string; created_at: string };
type Props = { projectId: string; writerName?: string; onClose: () => void };

export default function ProjectChat({ projectId, writerName, onClose }: Props) {
  const { user, userData } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    if (!projectId || projectId === 'demo') { setLoading(false); return; }
    const loadMessages = async () => {
      setLoading(true);
      const { data, error: loadError } = await supabase.from('project_messages').select('id,project_id,sender_id,sender_name,sender_role,text,created_at').eq('project_id', projectId).order('created_at', { ascending: true });
      if (!active) return;
      if (loadError) setError(loadError.message); else setMessages((data ?? []) as Message[]);
      setLoading(false);
    };
    void loadMessages();
    const channel = supabase.channel(`project-writer-chat:${projectId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'project_messages', filter: `project_id=eq.${projectId}` }, payload => {
      if (!active || !payload.new) return;
      const incoming = payload.new as Message;
      setMessages(current => current.some(message => message.id === incoming.id) ? current : [...current, incoming]);
    }).subscribe();
    return () => { active = false; void supabase.removeChannel(channel); };
  }, [projectId]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = newMessage.trim();
    if (!text || !user || !projectId || projectId === 'demo' || sending) return;
    setSending(true); setError('');
    const { data, error: sendError } = await supabase.from('project_messages').insert({ project_id: projectId, sender_id: user.id, sender_name: userData?.name || 'User', sender_role: userData?.role || 'student', text }).select('id,project_id,sender_id,sender_name,sender_role,text,created_at').single();
    if (sendError) setError(sendError.message);
    else if (data) { setMessages(current => current.some(message => message.id === data.id) ? current : [...current, data as Message]); setNewMessage(''); }
    setSending(false);
  };

  if (!projectId) return null;
  return <div className="flex flex-col h-[560px] bg-background border border-border rounded-xl shadow-2xl overflow-hidden">
    <div className="flex justify-between items-center p-4 border-b border-border bg-muted/50"><div><p className="text-[10px] uppercase tracking-wider text-primary font-bold">Project communication</p><h3 className="font-bold text-sm mt-1">Chat with {writerName || 'Project Writer'}</h3></div><button type="button" onClick={onClose} aria-label="Close chat" className="p-2 rounded-md hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button></div>
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {loading ? <div className="h-full flex items-center justify-center text-sm text-muted-foreground gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Loading conversation…</div> : messages.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground text-sm px-6"><p>No messages yet.</p><p className="text-xs mt-1">Send a message to start your conversation with the project writer.</p></div> : messages.map(message => { const mine = message.sender_id === user?.id; return <div key={message.id} className={`flex flex-col max-w-[85%] ${mine ? 'ml-auto items-end' : 'mr-auto items-start'}`}><span className="text-[10px] text-muted-foreground mb-1 px-1">{message.sender_name || 'User'} · {message.sender_role || 'user'}</span><div className={`px-3 py-2.5 rounded-2xl text-sm whitespace-pre-wrap break-words ${mine ? 'bg-primary text-primary-foreground rounded-br-sm' : 'bg-muted text-foreground rounded-bl-sm'}`}>{message.text}</div><time className="text-[9px] text-muted-foreground mt-1 px-1">{new Date(message.created_at).toLocaleString('en-NG')}</time></div>; })}
      <div ref={endRef} />
    </div>
    {error && <div className="px-4 py-2 text-xs text-red-500 border-t border-red-500/10 flex items-center gap-2"><AlertCircle className="w-3.5 h-3.5 shrink-0" /> {error}</div>}
    <form onSubmit={handleSend} className="p-3 border-t border-border bg-muted/20 flex gap-2"><input type="text" value={newMessage} onChange={event => setNewMessage(event.target.value)} placeholder="Type a message to your writer…" disabled={sending || !user} className="flex-1 bg-background border border-border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-primary disabled:opacity-60" /><button type="submit" disabled={!newMessage.trim() || sending || !user} className="bg-primary text-white px-3 rounded-lg hover:bg-primary-light disabled:opacity-50 flex items-center justify-center" aria-label="Send message">{sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}</button></form>
  </div>;
}
