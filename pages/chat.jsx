import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ChatInterface from '../components/ChatInterface';

export default function ChatPage() {
    const router = useRouter();
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const storedUserId = localStorage.getItem('anonymousUserId');
        if (!storedUserId) {
            router.push('/');
        } else {
            setUserId(storedUserId);
        }
    }, [router]);

    if (!userId) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-white">
                <div className="w-10 h-10 border-4 border-maroon-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">AI Consultation</h1>
                    <p className="text-sm text-gray-500 mt-1">Chat with your health companion — symptoms are automatically logged.</p>
                </header>
                <ChatInterface userId={userId} />
                <div className="mt-4 text-center">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-sm text-maroon-800 hover:text-maroon-900 font-medium underline underline-offset-2"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
