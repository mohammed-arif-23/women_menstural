import ChatInterface from '@/components/ChatInterface';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

function Modal({ title, onClose, children }) {
    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl border border-gray-100">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
                    <h3 className="font-bold text-gray-900">{title}</h3>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-gray-800 transition-colors text-lg"
                    >
                        ×
                    </button>
                </div>
                <div className="overflow-y-auto flex-1 p-6">{children}</div>
            </div>
        </div>
    );
}

function toICSDate(date) {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

function buildICS(schedule, phase) {
    const now = toICSDate(new Date());
    const today = new Date();

    const events = schedule.map((day, i) => {
        const eventDate = new Date(today);
        eventDate.setDate(today.getDate() + i);
        eventDate.setHours(8, 0, 0, 0);

        const end = new Date(eventDate);
        end.setHours(9, 0, 0, 0);

        const lines = [
            `Task: ${day.taskTip}`,
            `Workout: ${day.workout}`,
            day.nutrition ? `Nutrition: ${day.nutrition}` : '',
        ].filter(Boolean).join('\\n');

        return [
            'BEGIN:VEVENT',
            `UID:wellness-${i}-${Date.now()}@womens-wellness`,
            `DTSTAMP:${now}`,
            `DTSTART:${toICSDate(eventDate)}`,
            `DTEND:${toICSDate(end)}`,
            `SUMMARY:[${day.energy} Energy] ${day.focus} Day - ${phase}`,
            `DESCRIPTION:${lines}`,
            'END:VEVENT',
        ].join('\r\n');
    });

    return [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//Womens Wellness//7-Day Schedule//EN',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        ...events,
        'END:VCALENDAR',
    ].join('\r\n');
}

function CalendarModal({ data, onClose }) {
    const ENERGY = { High: 'bg-emerald-100 text-emerald-700', Medium: 'bg-amber-100 text-amber-700', Low: 'bg-gray-100 text-gray-600' };
    const FOCUS = {
        Creative: 'bg-violet-100 text-violet-700', Execution: 'bg-blue-100 text-blue-700',
        Rest: 'bg-teal-100 text-teal-700', Social: 'bg-pink-100 text-pink-700',
        'Deep Work': 'bg-indigo-100 text-indigo-700', Recovery: 'bg-orange-100 text-orange-700',
    };

    const downloadICS = () => {
        const content = buildICS(data.schedule, data.phase);
        const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'wellness-schedule.ics';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <Modal title={`7-Day Schedule — ${data.phase} (Day ${data.cycleDay})`} onClose={onClose}>
            <div className="space-y-4">
                <button
                    onClick={downloadICS}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl border-2 border-violet-200 bg-violet-50 text-violet-700 font-semibold text-sm hover:bg-violet-100 transition-all active:scale-[0.99]"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path d="M10.75 2.75a.75.75 0 00-1.5 0v8.614L6.295 8.235a.75.75 0 10-1.09 1.03l4.25 4.5a.75.75 0 001.09 0l4.25-4.5a.75.75 0 00-1.09-1.03l-2.955 3.129V2.75z" />
                        <path d="M3.5 12.75a.75.75 0 00-1.5 0v2.5A2.75 2.75 0 004.75 18h10.5A2.75 2.75 0 0018 15.25v-2.5a.75.75 0 00-1.5 0v2.5c0 .69-.56 1.25-1.25 1.25H4.75c-.69 0-1.25-.56-1.25-1.25v-2.5z" />
                    </svg>
                    Add to Calendar
                </button>

                <div className="space-y-3">
                    {data.schedule.map((day, i) => (
                        <div key={i} className="border border-gray-100 rounded-2xl p-4 hover:border-gray-200 transition-colors">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                                <p className="font-bold text-gray-900">{day.day} {day.date && <span className="font-normal text-gray-400 text-sm">· {day.date}</span>}</p>
                                <div className="flex gap-2">
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${FOCUS[day.focus] || 'bg-gray-100 text-gray-700'}`}>{day.focus}</span>
                                    <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${ENERGY[day.energy] || 'bg-gray-100 text-gray-700'}`}>{day.energy}</span>
                                </div>
                            </div>
                            <div className="space-y-1.5 text-sm text-gray-600">
                                <p><span className="font-semibold text-gray-500 text-xs uppercase tracking-wide">Task: </span>{day.taskTip}</p>
                                <p><span className="font-semibold text-gray-500 text-xs uppercase tracking-wide">Workout: </span>{day.workout}</p>
                                {day.nutrition && <p><span className="font-semibold text-gray-500 text-xs uppercase tracking-wide">Nutrition: </span>{day.nutrition}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Modal>
    );
}

function RecentLogsWidget() {
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        const stored = JSON.parse(localStorage.getItem('symptomLogs') || '[]');
        setLogs(stored.slice(0, 3));
    }, []);

    if (logs.length === 0) return null;

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
            <h2 className="font-bold text-gray-900 text-sm mb-4">Recent Logs</h2>
            <div className="space-y-3">
                {logs.map((log, i) => {
                    const symptoms = Array.isArray(log.symptoms)
                        ? log.symptoms
                        : log.symptoms?.symptoms || [];
                    return (
                        <div key={i} className="space-y-1.5">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{log.date}</p>
                            <div className="flex flex-wrap gap-1.5">
                                {symptoms.slice(0, 4).map((s) => (
                                    <span key={s} className="text-xs px-2.5 py-1 rounded-full bg-maroon-50 text-maroon-800 font-medium capitalize">
                                        {s.replace(/_/g, ' ')}
                                    </span>
                                ))}
                                {symptoms.length > 4 && (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-medium">
                                        +{symptoms.length - 4} more
                                    </span>
                                )}
                                {symptoms.length === 0 && (
                                    <span className="text-xs text-gray-400">No symptoms recorded</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default function Dashboard() {
    const router = useRouter();
    const [userId, setUserId] = useState(null);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [modal, setModal] = useState(null);

    useEffect(() => {
        const id = localStorage.getItem('anonymousUserId');
        if (!id) { window.location.href = '/'; return; }
        setUserId(id);
    }, []);

    const postAction = async (path, setLoading, onSuccess) => {
        setLoading(true);
        try {
            const res = await fetch(path, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            onSuccess(data);
        } catch {
            alert('Action failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleCalendar = () => postAction('/api/actions/calendar', setCalendarLoading, (d) => setModal({ type: 'calendar', data: d }));
    const handleLogs = () => router.push('/cycle');

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-screen-xl mx-auto px-4 md:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 items-start">

                <ChatInterface />

                <aside className="flex flex-col gap-4 pb-24 lg:pb-0">
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                        <h2 className="font-bold text-gray-900 text-sm mb-4">Quick actions</h2>
                        <div className="space-y-2.5">
                            <button
                                onClick={handleCalendar}
                                disabled={calendarLoading}
                                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-violet-100 bg-violet-50 hover:bg-violet-100 hover:border-violet-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {calendarLoading ? 'Generating…' : 'Generate 7-Day Schedule'}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-0.5">Based on your cycle phase</p>
                                </div>
                            </button>
                            <button
                                onClick={handleLogs}
                                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-rose-100 bg-rose-50 hover:bg-rose-100 hover:border-rose-200 transition-all text-left"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Update your logs</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Log today's symptoms</p>
                                </div>
                            </button>
                            <button
                                onClick={() => router.push('/pcos')}
                                className="w-full flex items-center gap-3 p-3.5 rounded-2xl border-2 border-emerald-100 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-200 transition-all text-left"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">PCOS Test</p>
                                    <p className="text-xs text-gray-400 mt-0.5">Quick assessment</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    <RecentLogsWidget />
                </aside>
            </main>

            <div className="fixed bottom-6 right-4 z-40 lg:hidden">
                <button
                    onClick={handleLogs}
                    className="flex items-center gap-2 bg-maroon-800 text-white px-5 py-3 rounded-full shadow-xl font-semibold text-sm hover:bg-maroon-900 active:scale-95 transition-all"
                >

                    Log Symptoms
                </button>
            </div>

            {modal?.type === 'calendar' && <CalendarModal data={modal.data} onClose={() => setModal(null)} />}
        </div>
    );
}
