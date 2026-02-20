import { useState } from 'react';
import { getCycleSchedule } from '../lib/api';

const ENERGY_COLORS = {
    High: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
    Medium: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    Low: { bg: 'bg-gray-50', border: 'border-gray-200', badge: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
};

const FOCUS_COLORS = {
    Creative: 'bg-violet-100 text-violet-700',
    Execution: 'bg-blue-100 text-blue-700',
    Rest: 'bg-teal-100 text-teal-700',
    Social: 'bg-pink-100 text-pink-700',
    'Deep Work': 'bg-indigo-100 text-indigo-700',
    Recovery: 'bg-orange-100 text-orange-700',
};

const PHASE_COLORS = {
    'Menstrual (The Reset)': { gradient: 'from-red-100 to-rose-50', text: 'text-red-700', border: 'border-red-200', badge: 'bg-red-100 text-red-700' },
    'Follicular (The Creative High)': { gradient: 'from-green-100 to-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' },
    'Ovulatory (The Peak)': { gradient: 'from-yellow-100 to-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700' },
    'Luteal (The Deep Work)': { gradient: 'from-purple-100 to-violet-50', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700' },
};

export default function CycleSchedule({ userId }) {
    const [schedule, setSchedule] = useState(null);
    const [phase, setPhase] = useState('');
    const [cycleDay, setCycleDay] = useState('');
    const [manualCycleDay, setManualCycleDay] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const phaseStyle = PHASE_COLORS[phase] || PHASE_COLORS['Follicular (The Creative High)'];

    const generateSchedule = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const dayInput = manualCycleDay ? parseInt(manualCycleDay) : null;
            const data = await getCycleSchedule(userId, dayInput);
            setSchedule(data.schedule);
            setPhase(data.phase);
            setCycleDay(data.cycleDay);
        } catch {
            setError('Failed to generate schedule. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-1">Hormonal Schedule</h2>
                <p className="text-sm text-gray-500 mb-5">Generate a personalized 7-day productivity plan based on your cycle phase.</p>

                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Manual Cycle Day (optional)</label>
                        <input
                            type="number"
                            min="1"
                            max="35"
                            value={manualCycleDay}
                            onChange={e => setManualCycleDay(e.target.value)}
                            placeholder="Auto-detect from logs"
                            className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-maroon-600 focus:outline-none text-sm text-gray-900 placeholder-gray-300 transition-all"
                        />
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={generateSchedule}
                            disabled={isLoading}
                            className="w-full sm:w-auto px-6 py-3 bg-maroon-800 text-white rounded-xl font-semibold text-sm hover:bg-maroon-900 transition-all active:scale-[0.99] shadow-md disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    Generating…
                                </>
                            ) : 'Generate Schedule'}
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">{error}</div>
                )}
            </div>

            {schedule && (
                <div className="space-y-3 animate-fade-in-up">


                    <div className="grid gap-3">
                        {schedule.map((day, i) => {
                            const energyStyle = ENERGY_COLORS[day.energy] || ENERGY_COLORS['Low'];
                            const focusStyle = FOCUS_COLORS[day.focus] || 'bg-gray-100 text-gray-700';

                            return (
                                <div
                                    key={i}
                                    className={`bg-white border-2 ${energyStyle.border} rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}
                                >
                                    <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-bold text-gray-900">{day.day}</h3>
                                                {day.date && <span className="text-xs text-gray-400">{day.date}</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${focusStyle}`}>{day.focus}</span>
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${energyStyle.badge}`}>{day.energy} Energy</span>
                                        </div>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex gap-2">
                                            <span className="text-gray-400 w-20 flex-shrink-0 text-xs font-semibold uppercase tracking-wide pt-0.5">Task</span>
                                            <p className="text-gray-700 leading-snug">{day.taskTip}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <span className="text-gray-400 w-20 flex-shrink-0 text-xs font-semibold uppercase tracking-wide pt-0.5">Workout</span>
                                            <p className="text-gray-700 leading-snug">{day.workout}</p>
                                        </div>
                                        {day.nutrition && (
                                            <div className="flex gap-2">
                                                <span className="text-gray-400 w-20 flex-shrink-0 text-xs font-semibold uppercase tracking-wide pt-0.5">Nutrition</span>
                                                <p className="text-gray-700 leading-snug">{day.nutrition}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
