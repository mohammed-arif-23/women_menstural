import { useState } from 'react';

export default function LanguageSelector({ onLanguageSelect }) {
    const [step, setStep] = useState(1);
    const [selectedLang, setSelectedLang] = useState(null);
    const [firstName, setFirstName] = useState('');

    const languages = [
        { code: 'en', label: 'English', native: 'English' },
        { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
        { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
    ];

    const handleLanguageClick = (languageCode) => {
        setSelectedLang(languageCode);
        setStep(2);
    };

    const handleComplete = (e) => {
        e.preventDefault();
        const anonymousUserId = crypto.randomUUID();
        localStorage.setItem('anonymousUserId', anonymousUserId);
        localStorage.setItem('userLanguage', selectedLang);
        if (firstName.trim()) {
            localStorage.setItem('userFirstName', firstName.trim());
        }

        window.dispatchEvent(new Event('user-info-updated'));
        onLanguageSelect(selectedLang);
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[90vh] p-6 bg-white">
            {step === 1 ? (
                <>
                    <div className="mb-12 text-center space-y-4">

                        <h1 className="text-4xl font-bold text-maroon-900 tracking-tight">
                            Welcome
                        </h1>
                        <p className="text-gray-500 text-lg">
                            Choose your preferred language to begin
                        </p>
                    </div>

                    <div className="grid gap-4 w-full max-w-sm">
                        {languages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => handleLanguageClick(lang.code)}
                                className="group relative w-full bg-white border-2 border-gray-100 p-6 rounded-3xl hover:border-maroon-800 hover:shadow-xl transition-all active:scale-[0.98] text-left flex justify-between items-center"
                            >
                                <div>
                                    <span className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{lang.label}</span>
                                    <span className="block text-2xl font-bold text-maroon-900">{lang.native}</span>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-gray-50 group-hover:bg-maroon-800 group-hover:text-white transition-colors flex items-center justify-center">
                                    →
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            ) : (
                <form onSubmit={handleComplete} className="w-full max-w-sm space-y-8 animate-fade-in-up">
                    <div className="mb-12 text-center space-y-4">
                        <h1 className="text-4xl font-bold text-maroon-900 tracking-tight">
                            One last thing...
                        </h1>
                        <p className="text-gray-500 text-lg">
                            What should we call you?
                        </p>
                    </div>

                    <div className="space-y-4">
                        <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Enter your first name (optional)"
                            className="w-full p-6 text-xl text-center border-2 border-gray-100 rounded-3xl focus:border-maroon-800 focus:outline-none transition-all placeholder-gray-300 text-maroon-900 font-medium"
                            autoFocus
                        />
                        <button
                            type="submit"
                            className="w-full bg-maroon-800 text-white p-5 rounded-3xl font-bold text-lg hover:bg-maroon-900 transition-transform active:scale-95 shadow-lg"
                        >
                            Start Journey
                        </button>
                        <button
                            type="button"
                            onClick={() => setStep(1)}
                            className="w-full text-gray-400 text-sm hover:text-maroon-800 transition-colors"
                        >
                            Back to Language Selection
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
}
