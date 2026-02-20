import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

function determineCyclePhase(logs) {
    let cycleDay = 1;
    let phase = 'Menstrual (The Reset)';

    if (!logs || logs.length === 0) return { cycleDay, phase };

    const periodLog = logs.find(log => {
        let symptoms = log.symptoms;
        if (symptoms && typeof symptoms === 'object' && !Array.isArray(symptoms)) {
            symptoms = symptoms.symptoms || [];
        }
        if (Array.isArray(symptoms)) return symptoms.includes('period_start');
        if (typeof symptoms === 'string') return symptoms.includes('period_start');
        return false;
    });

    if (periodLog) {
        const lastPeriodDate = new Date(periodLog.log_date);
        const today = new Date();
        const diffDays = Math.ceil(Math.abs(today - lastPeriodDate) / (1000 * 60 * 60 * 24));
        cycleDay = Math.max(1, diffDays);
    }

    if (cycleDay <= 5) phase = 'Menstrual (The Reset)';
    else if (cycleDay <= 13) phase = 'Follicular (The Creative High)';
    else if (cycleDay <= 16) phase = 'Ovulatory (The Peak)';
    else phase = 'Luteal (The Deep Work)';

    return { cycleDay, phase };
}

const today = new Date();
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const { data: logs, error } = await supabase
            .from('logs')
            .select('log_date, symptoms')
            .eq('user_id', userId)
            .order('log_date', { ascending: false })
            .limit(30);

        if (error) throw error;

        const { cycleDay, phase } = determineCyclePhase(logs || []);

        const startDayName = dayNames[today.getDay()];

        const prompt = `You are a certified women's health and biohacking expert. The user is currently on cycle day ${cycleDay} in their ${phase} phase.

Generate a 7-day personalized hormonal productivity and wellness schedule starting from ${startDayName}.

Return ONLY a valid JSON array of 7 objects. No markdown fences, no extra text. Each object must have exactly these fields:
{
  "day": "Day name (e.g. Monday)",
  "date": "Short date label (e.g. Feb 20)",
  "focus": "One of: Creative, Execution, Rest, Social, Deep Work, Recovery",
  "taskTip": "One specific, actionable work or study tip (1-2 sentences) tailored to the current hormonal phase and day energy level",
  "workout": "A specific workout recommendation with duration (e.g. 30-min yoga flow, 45-min strength training)",
  "nutrition": "One key nutritional focus for hormonal support (e.g. Prioritize iron-rich foods like lentils and leafy greens)",
  "energy": "One of: High, Medium, Low"
}`;

        const result = await model.generateContent(prompt);
        let text = result.response.text().trim();
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();

        const jsonStart = text.indexOf('[');
        const jsonEnd = text.lastIndexOf(']');
        if (jsonStart !== -1 && jsonEnd !== -1) {
            text = text.substring(jsonStart, jsonEnd + 1);
        }

        const schedule = JSON.parse(text);

        res.status(200).json({ phase, cycleDay, schedule });

    } catch (error) {
        console.error('Calendar generation error:', error);
        res.status(500).json({ error: 'Failed to generate calendar schedule' });
    }
}
