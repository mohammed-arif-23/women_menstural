import Head from 'next/head';
import Navbar from '../components/Navbar';
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
    return (
        <>
            <Head>
                <title>Women's Wellness Companion</title>
                <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
            </Head>
            <Navbar />
            <main className="min-h-screen ">
                <Component {...pageProps} />
            </main>
        </>
    );
}

export default MyApp;
