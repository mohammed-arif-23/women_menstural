import Head from 'next/head';
import Navbar from '../components/Navbar';
import '../styles/globals.css';
import { useEffect, useState } from 'react';
import { syncQueuedLogs } from '../lib/sync';

function OfflineBanner() {
    const [isOffline, setIsOffline] = useState(false);

    useEffect(() => {
        setIsOffline(!navigator.onLine);

        const handleOnline = async () => {
            setIsOffline(false);
            const count = await syncQueuedLogs();
            if (count > 0) {
            }
        };

        const handleOffline = () => setIsOffline(true);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    if (!isOffline) return null;

    return (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center flex items-center justify-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
            </span>
            <p className="text-xs font-semibold text-amber-800">
                You are offline. Logs will be saved locally and sync automatically when you reconnect.
            </p>
        </div>
    );
}

function MyApp({ Component, pageProps }) {
    return (
        <>
            <Head>
                <title>Women's Wellness Companion</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
                <link rel="manifest" href="/manifest.json" />
                <meta name="theme-color" content="#800000" />
                <link rel="apple-touch-icon" href="/file.svg" />
            </Head>
            <OfflineBanner />
            <Navbar />
            <main className="min-h-screen ">
                <Component {...pageProps} />
            </main>
        </>
    );
}

export default MyApp;
