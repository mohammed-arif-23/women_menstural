import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

function formatLogsForClinician(logs) {
    return logs.map((log, index) => {
        let symptoms = log.symptoms;
        let symptomStr = '';

        if (symptoms && typeof symptoms === 'object' && !Array.isArray(symptoms)) {
            const parts = [];
            if (symptoms.symptoms && symptoms.symptoms.length > 0) {
                parts.push(`Symptoms: ${symptoms.symptoms.join(', ')}`);
            }
            if (symptoms.mood) parts.push(`Mood: ${symptoms.mood}`);
            if (symptoms.pain_level) parts.push(`Pain Level: ${symptoms.pain_level}/10`);
            if (symptoms.cycle_phase_indicator) parts.push(`Phase: ${symptoms.cycle_phase_indicator}`);
            if (symptoms.notes) parts.push(`Notes: ${symptoms.notes}`);
            symptomStr = parts.join('; ') || 'No specific symptoms recorded';
        } else if (Array.isArray(symptoms)) {
            symptomStr = symptoms.length > 0 ? symptoms.join(', ') : 'No specific symptoms recorded';
        } else if (typeof symptoms === 'string') {
            symptomStr = symptoms;
        } else {
            symptomStr = 'No specific symptoms recorded';
        }

        return `Entry ${index + 1} [${log.log_date}]: ${symptomStr}`;
    }).join('\n');
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = thirtyDaysAgo.toISOString().split('T')[0];

        const { data: logs, error } = await supabase
            .from('logs')
            .select('log_date, symptoms')
            .eq('user_id', userId)
            .gte('log_date', cutoffDate)
            .order('log_date', { ascending: true });

        if (error) throw error;

        if (!logs || logs.length === 0) {
            return res.status(200).json({
                report: 'SOAP NOTE — INSUFFICIENT DATA\n\nNo symptom logs have been recorded in the past 30 days. Please use the health chat to log your symptoms daily before generating a clinical report.'
            });
        }

        const formattedLogs = formatLogsForClinician(logs);
        const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const prompt = `You are a licensed gynecologist and clinical documentation specialist. You have been provided with a patient's self-reported health log spanning the past 30 days from a health tracking application.

Your task is to format these logs into a formal SOAP (Subjective, Objective, Assessment, Plan) clinical note that the patient can present to their physician.

Patient-reported logs:
${formattedLogs}

Format the output as a professional SOAP note. Use the following strict structure:

CLINICAL SUMMARY REPORT
Generated: ${reportDate}
(Patient Self-Reported via Health Tracking Application)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUBJECTIVE (S):
[Summarize the patient's reported symptoms in a clinical, first-person narrative as the patient would describe them. Include duration, frequency, and pattern of symptoms. Note any recurring complaints and their timeline.]

OBJECTIVE (O):
[Present the quantifiable, observable data extracted from the logs. Include: frequency counts of specific symptoms, documented pain levels, mood patterns, and cycle phase observations. Present as structured bullet points with dates where relevant.]

ASSESSMENT (A):
[Provide a differential clinical assessment based purely on the presented data. Identify potential symptom clusters. Note any patterns consistent with hormonal imbalances, menstrual irregularities, or conditions warranting further investigation. Include a statement that this is a preliminary assessment based on self-reported data and should not replace formal clinical evaluation.]

PLAN (P):
[Recommend 3-5 specific, actionable next steps for the attending physician to consider. Include suggested diagnostic tests (e.g., hormonal panels, ultrasound) and referrals if warranted by the symptom pattern.]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DISCLAIMER: This report is generated from patient self-reported data and is intended as a clinical advocacy tool to facilitate informed discussions with healthcare providers. It does not constitute a medical diagnosis.`;

        const result = await model.generateContent(prompt);
        const reportText = result.response.text().trim();

        res.status(200).json({ report: reportText, logCount: logs.length });

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ error: 'Failed to generate clinical report' });
    }
}
