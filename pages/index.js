import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import LanguageSelector from '../components/LanguageSelector';

export default function Home() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const existingUserId = localStorage.getItem('anonymousUserId');

        if (existingUserId) {
            console.log("Found existing user:", existingUserId);
            router.push('/dashboard');
        } else {
            setIsLoading(false);
        }
    }, [router]);

    const handleLanguageSelect = () => {
        router.push('/dashboard');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-10 h-10 border-4 border-pink-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return <LanguageSelector onLanguageSelect={handleLanguageSelect} />;
}
