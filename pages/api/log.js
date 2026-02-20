import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, date, symptoms } = req.body;


        const { error: logError } = await supabase
            .from('logs')
            .insert([{ user_id: userId, log_date: date, symptoms: symptoms }]);

        if (logError) throw logError;

        let alert = null;

        if (symptoms.includes('heavy bleeding') && symptoms.includes('cramps')) {
            alert = {
                severity: 'warning',
                reason: 'Possible heavy flow with cramps; track closely and stay hydrated.',
            };
        } else if (symptoms.includes('heavy bleeding') && symptoms.includes('fatigue')) {
            alert = {
                severity: 'warning',
                reason: 'Heavy bleeding with fatigue can indicate anemia. Please consult a doctor if this persists.'
            };
        } else if (symptoms.includes('severe') || (symptoms.length > 4)) {
            alert = {
                severity: 'emergency',
                reason: 'Multiple severe symptoms reported; please consult a health worker immediately.',
            };
        }

        if (alert) {
            await supabase
                .from('alerts')
                .insert([{ user_id: userId, severity: alert.severity, reason: alert.reason }]);
        }

        res.status(200).json({ alert });
    } catch (error) {
        console.error('Log error:', error);
        res.status(500).json({ error: 'Failed to submit log' });
    }
}
