import { useState, useMemo } from 'react';
import { useRouter } from 'next/router';

export default function PCOSAssessment() {
    const router = useRouter();

    const [age, setAge] = useState(28);
    const [weight, setWeight] = useState(65.0);
    const [height, setHeight] = useState(160.0);
    const [hb, setHb] = useState(12.5);
    const [irregularCycle, setIrregularCycle] = useState(1);
    const [weightGain, setWeightGain] = useState(0);
    const [hairGrowth, setHairGrowth] = useState(1);
    const [skinDarkening, setSkinDarkening] = useState(0);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const bmi = useMemo(() => {
        if (!weight || !height) return 0;
        const hMeters = height / 100;
        return parseFloat((weight / (hMeters * hMeters)).toFixed(1));
    }, [weight, height]);

    const handlePredict = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        const features = [
            Number(age),
            Number(weight),
            Number(height),
            Number(bmi),
            Number(hb),
            Number(irregularCycle),
            Number(weightGain),
            Number(hairGrowth),
            Number(skinDarkening)
        ];

        try {
            const response = await fetch("/api/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ features })
            });

            const data = await response.json();

            if (response.ok) {
                setResult({
                    detected: data.pcos_detected,
                    confidence: data.confidence_percentage
                });
            } else {
                setError(data.detail || "Prediction failed. Try again.");
            }
        } catch (err) {
            setError("Could not connect to the predictor API.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-xl mx-auto">
                <button
                    onClick={() => router.push('/dashboard')}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-sm font-semibold mb-6"
                >
                    <span>←</span> Back to Dashboard
                </button>

                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="bg-maroon-800 p-6 text-white">
                        <h1 className="text-2xl font-bold mb-1">PCOS AI Risk Assessment</h1>
                        <p className="text-maroon-100 text-sm">
                            Analyze your health features using our ML model. Quick, private, and instant.
                        </p>
                    </div>

                    <form onSubmit={handlePredict} className="p-6 space-y-6">
                        <div>
                            <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Biometrics</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <label className="block">
                                    <span className="text-xs text-gray-500 font-semibold">Age (years)</span>
                                    <input type="number" value={age} onChange={e => setAge(e.target.value)} required min="10" max="80"
                                        className="mt-1 w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-maroon-600 outline-none text-sm transition-all" />
                                </label>
                                <label className="block">
                                    <span className="text-xs text-gray-500 font-semibold">Hemoglobin (g/dL)</span>
                                    <input type="number" step="0.1" value={hb} onChange={e => setHb(e.target.value)} required
                                        className="mt-1 w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-maroon-600 outline-none text-sm transition-all" />
                                </label>
                                <label className="block">
                                    <span className="text-xs text-gray-500 font-semibold">Weight (kg)</span>
                                    <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} required min="30" max="200"
                                        className="mt-1 w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-maroon-600 outline-none text-sm transition-all" />
                                </label>
                                <label className="block">
                                    <span className="text-xs text-gray-500 font-semibold">Height (cm)</span>
                                    <input type="number" step="0.1" value={height} onChange={e => setHeight(e.target.value)} required min="100" max="250"
                                        className="mt-1 w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-maroon-600 outline-none text-sm transition-all" />
                                </label>
                            </div>
                            <div className="mt-3 p-3 bg-gray-50 rounded-xl flex justify-between items-center border border-gray-100">
                                <span className="text-xs text-gray-500 font-semibold">Calculated BMI</span>
                                <span className="text-sm font-bold text-gray-900">{bmi}</span>
                            </div>
                        </div>

                        <hr className="border-gray-100" />

                        <div>
                            <h2 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Symptoms</h2>
                            <div className="space-y-3">
                                {[
                                    { label: 'Irregular Cycles', state: irregularCycle, set: setIrregularCycle },
                                    { label: 'Recent Weight Gain', state: weightGain, set: setWeightGain },
                                    { label: 'Excessive Hair Growth', state: hairGrowth, set: setHairGrowth },
                                    { label: 'Skin Darkening', state: skinDarkening, set: setSkinDarkening },
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors">
                                        <span className="text-sm text-gray-700 font-medium">{item.label}</span>
                                        <div className="flex bg-gray-100 p-1 rounded-lg gap-1">
                                            <button type="button" onClick={() => item.set(1)} className={`px-4 py-1 text-xs font-semibold rounded-md transition-all ${item.state === 1 ? 'bg-white shadow text-maroon-800' : 'text-gray-500 hover:text-gray-700'}`}>Yes</button>
                                            <button type="button" onClick={() => item.set(0)} className={`px-4 py-1 text-xs font-semibold rounded-md transition-all ${item.state === 0 ? 'bg-white shadow text-maroon-800' : 'text-gray-500 hover:text-gray-700'}`}>No</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 text-sm font-semibold rounded-xl border border-red-100">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-maroon-800 text-white font-bold py-3.5 rounded-xl hover:bg-maroon-900 transition-colors shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                "Analyze My Risk"
                            )}
                        </button>
                    </form>

                    {result && (
                        <div className="p-6 bg-gray-50 border-t border-gray-100 animate-fade-in-up">
                            <div className={`p-5 rounded-2xl border-2 ${result.detected ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
                                <h3 className={`text-lg font-bold mb-1 ${result.detected ? 'text-rose-800' : 'text-emerald-800'}`}>
                                    {result.detected ? 'High Risk Detected' : 'Low Risk Detected'}
                                </h3>
                                <p className={`text-sm ${result.detected ? 'text-rose-600' : 'text-emerald-600'} font-medium`}>
                                    We think that you have {result.confidence.toFixed(1)}% probability of PCOS.
                                </p>

                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
