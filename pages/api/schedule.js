import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, currentCycleDay } = req.body;
        const { data: logs, error: logsError } = await supabase
            .from('logs')
            .select('log_date, symptoms')
            .eq('user_id', userId)
            .order('log_date', { ascending: false })
            .limit(30);

        if (logsError) throw logsError;

        let cycleDay = 1;
        let phase = 'Menstrual (The Reset)';

        if (currentCycleDay) {
            cycleDay = parseInt(currentCycleDay);
        } else if (logs && logs.length > 0) {
            const periodLog = logs.find(log => {
                const s = log.symptoms;
                if (Array.isArray(s)) return s.includes('period_start');
                if (typeof s === 'string') return s.includes('period_start');
                return false;
            });

            if (periodLog) {
                const lastPeriodDate = new Date(periodLog.log_date);
                const today = new Date();
                const diffTime = Math.abs(today - lastPeriodDate);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                cycleDay = diffDays || 1;
            } else {
                cycleDay = 1;
            }
        }
        if (cycleDay <= 5) phase = "Menstrual (The Reset)";
        else if (cycleDay <= 13) phase = "Follicular (The Creative High)";
        else if (cycleDay <= 16) phase = "Ovulatory (The Peak)";
        else phase = "Luteal (The Deep Work)";

        const prompt = `
            You are a Bio-Hacking Assistant. 
            The user is currently in the ${phase} phase (Cycle Day ${cycleDay}).
            Generate a 7-day optimized schedule starting from today.
            
            Return ONLY a valid JSON array of objects (no markdown blocks, no extra text).
            Each object should represent a day and have this structure:
            {
                "day": "Monday", // or "Day 1", etc.
                "focus": "Creative|Execution|Rest|Social",
                "taskTip": "Specific work advice...",
                "workout": "Type of exercise...",
                "energy": "High|Medium|Low"
            }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();

        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const jsonStart = text.indexOf('[');
        const jsonEnd = text.lastIndexOf(']');

        if (jsonStart !== -1 && jsonEnd !== -1) {
            text = text.substring(jsonStart, jsonEnd + 1);
        }

        const schedule = JSON.parse(text);

        res.status(200).json({ phase, cycleDay, schedule });

    } catch (error) {
        console.error('Schedule generation error:', error);
        res.status(500).json({ error: 'Failed to generate schedule' });
    }
}
