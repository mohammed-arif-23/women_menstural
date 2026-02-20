import { useState } from 'react';
import AlertBanner from './AlertBanner';
import { queueFailedLog } from '../lib/sync';

const SYMPTOM_OPTIONS = [
    { id: 'cramps', label: 'Cramps' },
    { id: 'headache', label: 'Headache' },
    { id: 'fatigue', label: 'Fatigue' },
    { id: 'mood_swings', label: 'Mood Swings' },
    { id: 'acne', label: 'Acne' },
    { id: 'heavy bleeding', label: 'Heavy Bleeding' },
    { id: 'irregular_period', label: 'Irregular Period' },
    { id: 'weight_gain', label: 'Weight Gain' },
    { id: 'severe', label: 'Severe Pain' },
];

export default function CycleForm({ userId }) {
    const [selectedSymptoms, setSelectedSymptoms] = useState([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [alert, setAlert] = useState(null);
    const [submitted, setSubmitted] = useState(false);

    const toggleSymptom = (id) => {
        setSelectedSymptoms(prev =>
            prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (selectedSymptoms.length === 0) return;
        setIsSubmitting(true);
        setAlert(null);

        try {
            const response = await fetch('/api/log', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, date, symptoms: selectedSymptoms })
            });

            const data = await response.json();

            const existing = JSON.parse(localStorage.getItem('symptomLogs') || '[]');
            const entry = { date, symptoms: selectedSymptoms };
            localStorage.setItem('symptomLogs', JSON.stringify([entry, ...existing].slice(0, 100)));

            if (data.alert) {
                setAlert(data.alert);
            }

            setSubmitted(true);
            setSelectedSymptoms([]);

            setTimeout(() => setSubmitted(false), 3000);

        } catch (error) {
            if (error.name === 'TypeError' || error.message.includes('fetch')) {
                await queueFailedLog({ userId, date, symptoms: selectedSymptoms });

                const existing = JSON.parse(localStorage.getItem('symptomLogs') || '[]');
                const entry = { date, symptoms: selectedSymptoms, offline: true };
                localStorage.setItem('symptomLogs', JSON.stringify([entry, ...existing].slice(0, 100)));

                setAlert({
                    severity: 'success',
                    reason: 'You are offline. Your symptoms have been saved locally and will sync when you reconnect.'
                });

                setSelectedSymptoms([]);
            } else {
                setAlert({ severity: 'warning', reason: 'Failed to save log. Please try again.' });
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
            {alert && (
                <AlertBanner
                    severity={alert.severity}
                    message={alert.reason}
                    onClose={() => setAlert(null)}
                />
            )}

            {submitted && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-sm font-medium flex items-center gap-2">
                    <span>Symptoms logged successfully!</span>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Log Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-maroon-600 focus:outline-none text-gray-900 text-sm transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                        Select Symptoms <span className="text-gray-400 font-normal">({selectedSymptoms.length} selected)</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {SYMPTOM_OPTIONS.map(symptom => (
                            <button
                                key={symptom.id}
                                type="button"
                                onClick={() => toggleSymptom(symptom.id)}
                                className={`flex items-center gap-2 p-3 rounded-xl border-2 text-sm font-medium transition-all text-left ${selectedSymptoms.includes(symptom.id)
                                    ? 'border-maroon-800 bg-maroon-50 text-maroon-900'
                                    : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-base leading-none">{symptom.icon}</span>
                                <span className="leading-tight">{symptom.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting || selectedSymptoms.length === 0}
                    className="w-full bg-maroon-800 text-white py-4 rounded-xl font-semibold text-sm hover:bg-maroon-900 transition-all active:scale-[0.99] shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? 'Saving…' : `Log ${selectedSymptoms.length > 0 ? selectedSymptoms.length + ' Symptom' + (selectedSymptoms.length > 1 ? 's' : '') : 'Symptoms'}`}
                </button>
            </form>
        </div>
    );
}
