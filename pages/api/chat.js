import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

const SYSTEM_PROMPT = `You are a warm, knowledgeable, and engaging health companion for women.
Your goal is to provide helpful, friendly advice and tips based on the user's current input.

Guidelines:
1. Focus on the Now: Address the user's latest message directly. Do not over-reference previous messages unless strictly relevant.
2. Be Engaging & Helpful: Offer practical tips, tricks, or comforting words. Make the conversation feel alive and supportive.
3. Use Context Subtly: You have access to cycle logs and past chat history. Weave this knowledge naturally into your response.
4. Safety First: Do not provide medical diagnoses. Always suggest consulting a healthcare professional for serious concerns.
5. Tone: Empathetic, positive, and professional yet accessible.
6. Brevity: Keep responses concise (approx. 3-4 sentences) unless a detailed explanation is requested.
7. Markdown: Use markdown sparingly and only when it meaningfully enhances readability.`;

const EXTRACTION_PROMPT = (message) => `You are a clinical data extraction system. Analyze the following patient message and extract any health symptoms, conditions, or observations mentioned.

Patient message: "${message}"

Return ONLY a valid JSON object with this exact structure (no markdown, no extra text):
{
  "symptoms": [],
  "mood": null,
  "pain_level": null,
  "cycle_phase_indicator": null,
  "notes": null
}

Where:
- "symptoms" is an array of strings from this list if mentioned: ["cramps", "bloating", "headache", "fatigue", "acne", "hirsutism", "weight_gain", "irregular_period", "period_start", "period_end", "mood_swings", "anxiety", "insomnia", "hot_flashes", "nausea", "breast_tenderness", "spotting"]
- "mood" is one of: "happy", "sad", "anxious", "irritable", "calm", "depressed", or null
- "pain_level" is an integer 1-10 or null
- "cycle_phase_indicator" is one of: "menstrual", "follicular", "ovulatory", "luteal" or null
- "notes" is a brief free-text observation or null

If no clinical information is present, return the structure with empty/null values.`;

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, message, language, history, firstName } = req.body;

        await supabase
            .from('users')
            .upsert({ id: userId, language: language }, { onConflict: 'id' });

        const { data: logs } = await supabase
            .from('logs')
            .select('log_date, symptoms')
            .eq('user_id', userId)
            .order('log_date', { ascending: false })
            .limit(5);

        let contextPrompt = SYSTEM_PROMPT;

        if (firstName) {
            contextPrompt += `\n[System Note: The user's name is "${firstName}" and their language is "${language}". Respond in that language when appropriate. Use their name occasionally.]`;
        }

        if (logs && logs.length > 0) {
            const logsText = logs.map(log =>
                `- Date: ${log.log_date}, Symptoms: ${Array.isArray(log.symptoms) ? log.symptoms.join(', ') : JSON.stringify(log.symptoms)}`
            ).join('\n');
            contextPrompt += `\n\n[System Note: User's Recent Health Logs]\n${logsText}`;
        }

        const formattedHistory = (history || []).map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
        }));

        const seedHistory = [
            { role: 'user', parts: [{ text: contextPrompt }] },
            { role: 'model', parts: [{ text: `Understood. I am ready to be a supportive and insightful health companion${firstName ? ' for ' + firstName : ''}.` }] },
        ];

        const [chatResult, extractionResult] = await Promise.all([
            model.startChat({ history: [...seedHistory, ...formattedHistory] }).sendMessage(message),
            model.generateContent(EXTRACTION_PROMPT(message))
        ]);

        const reply = chatResult.response.text();

        let extractedSymptoms = null;

        try {
            let rawExtraction = extractionResult.response.text().trim();
            rawExtraction = rawExtraction.replace(/```json/g, '').replace(/```/g, '').trim();
            extractedSymptoms = JSON.parse(rawExtraction);
        } catch {
            extractedSymptoms = { symptoms: [], mood: null, pain_level: null, cycle_phase_indicator: null, notes: null };
        }


        const hasData = extractedSymptoms && (
            (extractedSymptoms.symptoms && extractedSymptoms.symptoms.length > 0) ||
            extractedSymptoms.mood ||
            extractedSymptoms.pain_level ||
            extractedSymptoms.notes
        );

        if (hasData && userId) {
            await supabase.from('logs').insert({
                user_id: userId,
                log_date: new Date().toISOString().split('T')[0],
                symptoms: extractedSymptoms
            });
        }

        res.status(200).json({ reply, extractedSymptoms });

    } catch (error) {
        console.error('Chat error:', error);
        res.status(500).json({ error: 'Failed to generate response' });
    }
}
