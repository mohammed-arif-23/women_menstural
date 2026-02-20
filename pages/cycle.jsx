import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CycleForm from '../components/CycleForm';
import CycleSchedule from '../components/CycleSchedule';

const TABS = [
    { id: 'log', label: 'Log Symptoms' },
];

export default function CyclePage() {
    const router = useRouter();
    const [userId, setUserId] = useState(null);
    const [activeTab, setActiveTab] = useState('log');

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
                    <h1 className="text-2xl font-bold text-gray-900">Cycle Tracker</h1>
                    <p className="text-sm text-gray-500 mt-1">Log your symptoms and generate a personalized wellness schedule.</p>
                </header>

                <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 w-fit">

                </div>

                <div className="animate-fade-in-up">
                    {activeTab === 'log' && <CycleForm userId={userId} />}
                </div>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="text-sm text-maroon-800 hover:text-maroon-900 font-medium underline underline-offset-2"
                    >
                        Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    );
}
