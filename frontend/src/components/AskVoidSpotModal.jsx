import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Sparkles, 
  Send, 
  Terminal, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Cpu, 
  Layers, 
  Key, 
  Info,
  Compass,
  ArrowRight,
  TrendingUp,
  Award
} from 'lucide-react';
import api from '../services/api';

const QUICK_PROMPTS = [
  "NYC me cafe ke liye best area batao aur kyun?",
  "Which corridor is best for a cafe in NYC?",
  "Compare the best two corridors for a cafe in NYC.",
  "Analyze Upper East Side for a cafe.",
  "I want to open a business in DFW. What area should I consider?"
];

export default function AskVoidSpotModal({ onClose, initialQuery = '' }) {
  const [messages, setMessages] = useState([
    {
      role: 'agent',
      content: "Hello! I am the VoidSpot Location Intelligence Agent. Ask me anything about commercial opportunities in NYC or DFW (e.g., best locations for a cafe, comparing corridors, or analyzing demand and resilience). All my recommendations are strictly grounded in deterministic VoidSpot signals.",
      toolUsed: null,
      evidence: null,
    }
  ]);
  const [inputQuery, setInputQuery] = useState(initialQuery || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Synthesizing...');
  const [agentStatus, setAgentStatus] = useState(null);
  const [expandedEvidenceIdx, setExpandedEvidenceIdx] = useState(null);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    let isMounted = true;
    async function fetchStatus() {
      try {
        const status = await api.getAgentStatus();
        if (isMounted) setAgentStatus(status);
      } catch (err) {
        console.warn('Agent status check error:', err);
      }
    }
    fetchStatus();
    return () => { isMounted = false; };
  }, []);

  const handleSend = async (queryText) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || loading) return;

    // Add user message
    const newMessages = [
      ...messages,
      { role: 'user', content: textToSend }
    ];
    setMessages(newMessages);
    setInputQuery('');
    setLoading(true);

    // Activity state cycle
    setStatusMessage('Analyzing opportunities & spatial signals...');
    const t1 = setTimeout(() => setStatusMessage('Checking corridor intelligence & signals...'), 800);
    const t2 = setTimeout(() => setStatusMessage('Synthesizing evidence-based recommendation...'), 1600);

    try {
      const response = await api.sendAgentChat(textToSend);
      clearTimeout(t1);
      clearTimeout(t2);

      setMessages([
        ...newMessages,
        {
          role: 'agent',
          content: response.message,
          toolUsed: response.tool_used,
          evidence: response.evidence,
        }
      ]);
      // Auto-expand evidence for the newest response if tool was used
      if (response.tool_used) {
        setExpandedEvidenceIdx(newMessages.length);
      }
    } catch (err) {
      clearTimeout(t1);
      clearTimeout(t2);
      setMessages([
        ...newMessages,
        {
          role: 'agent',
          content: `Agent Communication Error: ${err.message || 'Unable to connect to agent endpoint.'}`,
          toolUsed: null,
          evidence: null,
          isError: true,
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-void-900 border border-void-700/80 rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-void-800 bg-void-950/90">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-glow-indigo">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white tracking-tight">
                  Ask VoidSpot
                </h2>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold">
                  AI Agent
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Grounded location intelligence backed by deterministic VoidSpot data
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {/* Status indicator pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono border bg-void-950 border-void-800 text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${agentStatus?.configured ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
              <span>
                {agentStatus?.configured ? `OpenAI (${agentStatus.model})` : 'Deterministic Engine'}
              </span>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-void-800 hover:bg-void-700 border border-void-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick prompt suggestions strip */}
        <div className="px-6 py-2.5 bg-void-950/50 border-b border-void-800/60 overflow-x-auto flex items-center gap-2 text-xs">
          <span className="text-slate-500 text-[11px] font-medium shrink-0 flex items-center gap-1">
            <Compass className="w-3 h-3 text-indigo-400" />
            Quick queries:
          </span>
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="shrink-0 px-2.5 py-1 rounded-lg bg-void-850 hover:bg-void-800 border border-void-700/60 text-slate-300 hover:text-cyan-300 text-[11px] transition-colors"
            >
              "{prompt}"
            </button>
          ))}
        </div>

        {/* Messages Chat Area */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const isEvidenceExpanded = expandedEvidenceIdx === index;

            return (
              <div
                key={index}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] sm:max-w-[75%] space-y-2`}>
                  {/* Message Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                      isUser
                        ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-glow-indigo'
                        : msg.isError
                        ? 'bg-rose-950/60 border border-rose-800 text-rose-200'
                        : 'bg-void-950/90 border border-void-800 text-slate-200 shadow-card'
                    }`}
                  >
                    <div className="whitespace-pre-wrap font-sans">
                      {msg.content}
                    </div>

                    {/* Tool Tag */}
                    {msg.toolUsed && (
                      <div className="mt-2.5 pt-2 border-t border-void-800/80 flex items-center justify-between text-[10px] font-mono text-cyan-400">
                        <span className="flex items-center gap-1">
                          <Terminal className="w-3 h-3 text-indigo-400" />
                          Tool: {msg.toolUsed}()
                        </span>
                        <span className="text-slate-500">Verified Evidence</span>
                      </div>
                    )}
                  </div>

                  {/* Formatted Evidence Section */}
                  {msg.evidence && (
                    <div className="bg-void-950/60 border border-void-800/80 rounded-xl overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedEvidenceIdx(isEvidenceExpanded ? null : index)}
                        className="w-full px-3.5 py-2 flex items-center justify-between text-[11px] font-semibold text-slate-300 hover:bg-void-850/60 transition-colors"
                      >
                        <span className="flex items-center gap-1.5 text-indigo-300">
                          <Layers className="w-3.5 h-3.5" />
                          Evidence Used in Answer
                        </span>
                        {isEvidenceExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </button>

                      {isEvidenceExpanded && (
                        <div className="p-3.5 border-t border-void-800/60 text-xs space-y-3 bg-void-950/80 animate-in fade-in duration-150">
                          {/* Top Recommendation Evidence Format */}
                          {msg.evidence.recommendation && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-white text-sm">
                                  {msg.evidence.recommendation.corridor_name}
                                </span>
                                <span className="font-mono text-cyan-400 font-extrabold text-sm">
                                  Score: {msg.evidence.recommendation.voidspot_score}/100
                                </span>
                              </div>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
                                <div className="p-2 rounded bg-void-900 border border-void-800">
                                  <span className="text-slate-400 block">Category Fit</span>
                                  <span className="text-cyan-300 font-bold">
                                    {msg.evidence.recommendation.signals?.category_fit}%
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-void-900 border border-void-800">
                                  <span className="text-slate-400 block">Demand</span>
                                  <span className="text-emerald-300 font-bold">
                                    {msg.evidence.recommendation.signals?.demand}%
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-void-900 border border-void-800">
                                  <span className="text-slate-400 block">Whitespace</span>
                                  <span className="text-teal-300 font-bold">
                                    {msg.evidence.recommendation.signals?.whitespace}%
                                  </span>
                                </div>
                                <div className="p-2 rounded bg-void-900 border border-void-800">
                                  <span className="text-slate-400 block">Resilience</span>
                                  <span className="text-indigo-300 font-bold">
                                    {msg.evidence.recommendation.signals?.resilience}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Compare Evidence Format */}
                          {msg.evidence.corridors && (
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                                Head-to-Head Comparison Evidence
                              </span>
                              <div className="space-y-1.5">
                                {msg.evidence.corridors.map((c, i) => (
                                  <div key={i} className="flex items-center justify-between p-2 rounded bg-void-900 border border-void-800 text-[11px]">
                                    <span className="text-white font-semibold">{c.corridor_name}</span>
                                    <div className="flex items-center gap-3 font-mono">
                                      <span className="text-slate-400">Fit: {c.signals?.category_fit}%</span>
                                      <span className="text-cyan-400 font-bold">Score: {c.voidspot_score}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Analysis Evidence Format */}
                          {msg.evidence.corridor && (
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-white">
                                  {msg.evidence.corridor.name} ({msg.evidence.corridor.district})
                                </span>
                                <span className="font-mono text-cyan-400 font-bold">
                                  Score: {msg.evidence.voidspot?.score}/100
                                </span>
                              </div>
                              {msg.evidence.best_archetype && (
                                <p className="text-[11px] text-amber-300">
                                  Archetype: {msg.evidence.best_archetype.name} (Fit: {msg.evidence.best_archetype.score}%)
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            );
          })}

          {/* Loading status indicator */}
          {loading && (
            <div className="flex items-center gap-3 text-xs text-slate-400 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-indigo-950/80 border border-indigo-700/60 flex items-center justify-center text-indigo-400">
                <Sparkles className="w-4 h-4 animate-spin" />
              </div>
              <div className="space-y-1">
                <span className="font-semibold text-slate-300">{statusMessage}</span>
                <span className="block text-[10px] text-slate-500 font-mono">
                  Dispatching VoidSpot tool call...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form Footer */}
        <div className="p-4 bg-void-950 border-t border-void-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask anything... e.g. 'NYC me cafe ke liye best area batao aur kyun?'"
              disabled={loading}
              className="flex-1 bg-void-900 border border-void-800 text-slate-100 placeholder-slate-500 text-xs sm:text-sm rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !inputQuery.trim()}
              className="h-[44px] px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-glow-indigo disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>Send</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
          <div className="mt-2 text-center text-[10px] text-slate-500">
            Powered by VoidSpot Deterministic Telemetry &amp; Model Context Protocol (MCP).
          </div>
        </div>

      </div>
    </div>
  );
}
