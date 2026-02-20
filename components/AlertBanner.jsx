export default function AlertBanner({ severity, message, onClose }) {
    if (!message) return null;

    const styles = {
        info: 'bg-blue-50 text-blue-900 border-blue-200',
        warning: 'bg-orange-50 text-orange-900 border-orange-200',
        emergency: 'bg-red-50 text-red-900 border-red-200',
    };

    const styleClass = styles[severity] || styles.info;

    return (
        <div className={`p-6 mb-8 rounded-3xl border flex flex-col md:flex-row gap-4 justify-between items-start shadow-sm mx-2 ${styleClass}`}>
            <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl shrink-0 ${severity === 'emergency' ? 'bg-red-200' : severity === 'warning' ? 'bg-orange-200' : 'bg-blue-200'
                    }`}>
                    {severity === 'emergency' ? '!' : 'i'}
                </div>
                <div>
                    <h4 className="font-bold capitalize text-lg mb-1">{severity} Alert</h4>
                    <p className="opacity-90 leading-relaxed max-w-2xl">{message}</p>
                </div>
            </div>
            <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors self-end md:self-start"
                aria-label="Dismiss"
            >
                <span className="text-xl font-bold block w-4 h-4 leading-4 flex items-center justify-center">×</span>
            </button>
        </div>
    );
}
