import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

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
            .limit(14);

        if (error) throw error;

        let symptomSummary = 'no specific symptoms documented';

        if (logs && logs.length > 0) {
            const allSymptoms = new Set();
            logs.forEach(log => {
                let s = log.symptoms;
                if (s && typeof s === 'object' && !Array.isArray(s) && s.symptoms) {
                    s.symptoms.forEach(sym => allSymptoms.add(sym.replace(/_/g, ' ')));
                } else if (Array.isArray(s)) {
                    s.forEach(sym => allSymptoms.add(sym.replace(/_/g, ' ')));
                }
            });
            if (allSymptoms.size > 0) {
                symptomSummary = Array.from(allSymptoms).join(', ');
            }
        }

        const prompt = `You are an expert HR communication specialist and patient advocate.

Draft a professional workplace accommodation request email for an employee experiencing a chronic women's health condition. The email should be privacy-preserving, firm, empathetic, and legally informed.

Context:
- The employee has been tracking recurring health symptoms over recent weeks including: ${symptomSummary}
- These symptoms periodically impact their ability to maintain standard work schedules and physical presence requirements

Draft an email that:
1. Is addressed generically to "HR Department / [Manager Name]"
2. Opens with a clear, professional statement of purpose
3. Names the general nature of the condition as "a documented chronic gynecological health condition" without disclosing specifics
4. References relevant accommodation provisions (e.g., flexible scheduling, remote work options, medical leave entitlements under applicable employment law)
5. Requests a confidential meeting to discuss accommodations
6. Maintains a calm, professional, and assertive tone that prevents medical gaslighting
7. Closes with a request for written acknowledgment of receipt
8. Uses [Your Name], [Your Department], [Your Employee ID] as placeholders

Return ONLY the email text, starting with "Subject:" and ending with the signature block. No preamble or explanation.`;

        const result = await model.generateContent(prompt);
        const emailText = result.response.text().trim();

        res.status(200).json({ email: emailText });

    } catch (error) {
        console.error('HR email generation error:', error);
        res.status(500).json({ error: 'Failed to generate HR email' });
    }
}
