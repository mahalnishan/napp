'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export default function OrderChatWidget () {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const chatEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: 'init', role: 'assistant', content: 'How can I help?' }])
    }
  }, [open])

  const sendMessage = async () => {
    if (!input.trim()) return
    const newMessage: ChatMessage = { id: Date.now().toString(), role: 'user', content: input.trim() }
    setMessages(prev => [...prev, newMessage])
    setInput('')

    try {
      setSending(true)
      const res = await fetch('/api/chat/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.content })
      })
      const data = await res.json()
      if (data.answer) {
        const assistantMsg: ChatMessage = { id: Date.now().toString() + '-ai', role: 'assistant', content: data.answer }
        setMessages(prev => [...prev, assistantMsg])
      } else {
        const assistantMsg: ChatMessage = { id: Date.now().toString() + '-err', role: 'assistant', content: 'Sorry, something went wrong.' }
        setMessages(prev => [...prev, assistantMsg])
      }
    } catch (err) {
      const assistantMsg: ChatMessage = { id: Date.now().toString() + '-err', role: 'assistant', content: 'Network error. Please try again.' }
      setMessages(prev => [...prev, assistantMsg])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg focus:outline-none"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-6 right-6 w-[28rem] sm:w-[32rem] bg-white border border-gray-200 rounded-lg shadow-xl flex flex-col h-[32rem]">
          {/* Header */}
                      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
              <span className="font-semibold text-gray-800">Order Assistant</span>
              <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-sm">
            {messages.map(msg => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`rounded-lg px-3 py-2 max-w-[80%] whitespace-pre-wrap ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                placeholder="Ask about your orders…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button size="icon" onClick={sendMessage} disabled={sending} aria-label="Send message">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 