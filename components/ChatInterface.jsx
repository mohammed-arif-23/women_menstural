import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';

const QUICK_PROMPTS = [
    'I have cramps today',
    'Feeling fatigued this week',
    'My cycle seems irregular',
    'I noticed some acne breakouts',
];

export default function ChatInterface({ userId }) {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [firstName, setFirstName] = useState('');
    const messagesEndRef = useRef(null);
    const recognitionRef = useRef(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const name = localStorage.getItem('userFirstName') || '';
        setFirstName(name);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);

        recognition.onresult = async (event) => {
            const transcript = event.results[0][0].transcript;
            const userLang = localStorage.getItem('userLanguage') || 'en';
            let finalText = transcript;

            if (userLang !== 'en') {
                try {
                    const res = await fetch('https://libretranslate.de/translate', {
                        method: 'POST',
                        body: JSON.stringify({ q: transcript, source: userLang, target: 'en', format: 'text' }),
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const data = await res.json();
                    finalText = data.translatedText || transcript;
                } catch {
                    finalText = transcript;
                }
            }

            setInputMessage(finalText);
        };

        recognitionRef.current = recognition;
    }, []);

    const getLocale = (lang) => {
        switch (lang) {
            case 'hi': return 'hi-IN';
            case 'ta': return 'ta-IN';
            default: return 'en-US';
        }
    };

    const speakResponse = (text) => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const userLang = localStorage.getItem('userLanguage') || 'en';
        utterance.lang = getLocale(userLang);
        utterance.pitch = 1.1;
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Speech recognition is not supported in this browser.');
            return;
        }
        const userLang = localStorage.getItem('userLanguage') || 'en';
        recognitionRef.current.lang = getLocale(userLang);
        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    const sendMessage = useCallback(async (text) => {
        if (!text.trim() || isLoading) return;

        const userMessage = { role: 'user', content: text };
        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);

        try {
            const storedUserId = userId || localStorage.getItem('anonymousUserId');
            const language = localStorage.getItem('userLanguage');
            const name = localStorage.getItem('userFirstName');

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: storedUserId, message: text, language, history: messages, firstName: name })
            });

            const data = await response.json();
            const botMessage = { role: 'assistant', content: data.reply };
            setMessages(prev => [...prev, botMessage]);
            speakResponse(data.reply);

            if (data.extractedSymptoms) {
                const existing = JSON.parse(localStorage.getItem('symptomLogs') || '[]');
                const entry = { date: new Date().toISOString().split('T')[0], symptoms: data.extractedSymptoms };
                localStorage.setItem('symptomLogs', JSON.stringify([entry, ...existing].slice(0, 100)));
            }
        } catch {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
        } finally {
            setIsLoading(false);
        }
    }, [isLoading, messages, userId]);

    const handleSubmit = useCallback((e) => {
        e.preventDefault();
        sendMessage(inputMessage);
    }, [inputMessage, sendMessage]);

    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
    const greetingLine = firstName ? `${greeting}, ${firstName} ` : `${greeting} `;

    return (
        <div className="flex flex-col bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 h-[calc(100vh-140px)] min-h-[500px]">
            <div className="px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
                <p className="font-bold text-gray-900">{greetingLine}</p>
                <p className="text-xs text-gray-400 mt-0.5">Your health companion — ask me anything</p>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full gap-6 pb-4">
                        <div className="text-center space-y-2">
                            <p className="text-sm font-medium text-gray-600">How are you feeling today?</p>
                        </div>
                        <div className="w-full max-w-sm grid grid-cols-2 gap-2">
                            {QUICK_PROMPTS.map((prompt) => (
                                <button
                                    key={prompt}
                                    onClick={() => sendMessage(prompt)}
                                    className="text-left text-xs px-3 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:border-maroon-800 hover:text-maroon-900 hover:bg-maroon-50 transition-all leading-snug"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed shadow-sm rounded-2xl ${msg.role === 'user'
                                ? 'bg-maroon-800 text-white rounded-tr-sm'
                                : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                                }`}
                        >
                            <div className="prose prose-sm">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                            </div>
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white px-4 py-3 border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                            {[0, 1, 2].map(i => (
                                <span
                                    key={i}
                                    className="w-2 h-2 bg-maroon-600 rounded-full animate-bounce"
                                    style={{ animationDelay: `${i * 0.15}s` }}
                                />
                            ))}
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSubmit} className="p-4 bg-white border-t border-gray-100 flex gap-2 items-center flex-shrink-0">
                <button
                    type="button"
                    onClick={toggleListening}
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${isListening ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                    title="Voice Input"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                        <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                        <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
                    </svg>
                </button>
                <input
                    type="text"
                    value={inputMessage}
                    onChange={e => setInputMessage(e.target.value)}
                    placeholder={isListening ? 'Listening…' : 'Type your health query…'}
                    className="flex-1 p-3 bg-gray-50 border border-gray-200 focus:ring-2 focus:ring-maroon-600 focus:border-transparent focus:bg-white text-gray-900 placeholder-gray-400 text-sm rounded-xl transition-all outline-none"
                />
                <button
                    type="submit"
                    disabled={isLoading || !inputMessage.trim()}
                    className="w-10 h-10 bg-maroon-800 text-white flex items-center justify-center rounded-full hover:bg-maroon-900 transition-all active:scale-95 shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                        <path d="M3.478 2.404a.75.75 0 00-.926.941l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.404z" />
                    </svg>
                </button>
            </form>
        </div>
    );
}
