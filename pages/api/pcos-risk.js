import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const HIGH_RISK_MARKERS = ['acne', 'hirsutism', 'weight_gain', 'irregular_period'];
const MODERATE_RISK_MARKERS = ['fatigue', 'mood_swings', 'bloating', 'insomnia'];
const CYCLE_MARKERS = ['period_start', 'period_end'];

function extractSymptomArray(rawSymptoms) {
    if (!rawSymptoms) return [];

    if (Array.isArray(rawSymptoms)) {
        return rawSymptoms.flatMap(s => typeof s === 'string' ? [s] : []);
    }

    if (typeof rawSymptoms === 'object') {
        const nested = rawSymptoms.symptoms;
        if (Array.isArray(nested)) return nested;
        return Object.values(rawSymptoms).filter(v => typeof v === 'string');
    }

    if (typeof rawSymptoms === 'string') {
        try {
            const parsed = JSON.parse(rawSymptoms);
            return extractSymptomArray(parsed);
        } catch {
            return rawSymptoms.split(',').map(s => s.trim()).filter(Boolean);
        }
    }

    return [];
}

function assessCycleIrregularity(logs) {
    const periodStarts = logs
        .filter(log => {
            const symptoms = extractSymptomArray(log.symptoms);
            return symptoms.includes('period_start');
        })
        .map(log => new Date(log.log_date))
        .sort((a, b) => a - b);

    if (periodStarts.length < 2) return 0;

    const gaps = [];
    for (let i = 1; i < periodStarts.length; i++) {
        const diffDays = Math.round((periodStarts[i] - periodStarts[i - 1]) / (1000 * 60 * 60 * 24));
        gaps.push(diffDays);
    }

    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const isIrregular = avgGap < 21 || avgGap > 35;
    const variance = gaps.reduce((sum, g) => sum + Math.abs(g - avgGap), 0) / gaps.length;
    const hasHighVariance = variance > 7;

    let score = 0;
    if (isIrregular) score += 25;
    if (hasHighVariance) score += 15;
    return score;
}

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId } = req.query;

        if (!userId) {
            return res.status(400).json({ error: 'userId is required' });
        }

        const { data: logs, error } = await supabase
            .from('logs')
            .select('log_date, symptoms')
            .eq('user_id', userId)
            .order('log_date', { ascending: false })
            .limit(90);

        if (error) throw error;

        if (!logs || logs.length === 0) {
            return res.status(200).json({
                riskScore: 0,
                assessmentText: 'Not enough data yet. Continue logging your symptoms daily to receive a personalized PCOS risk assessment.',
                markers: []
            });
        }

        const allSymptoms = logs.flatMap(log => extractSymptomArray(log.symptoms));
        const symptomFrequency = {};
        allSymptoms.forEach(s => { symptomFrequency[s] = (symptomFrequency[s] || 0) + 1; });

        let score = 0;
        const detectedMarkers = [];

        HIGH_RISK_MARKERS.forEach(marker => {
            const count = symptomFrequency[marker] || 0;
            if (count >= 3) {
                score += 15;
                detectedMarkers.push(marker);
            } else if (count >= 1) {
                score += 8;
                detectedMarkers.push(marker);
            }
        });

        MODERATE_RISK_MARKERS.forEach(marker => {
            const count = symptomFrequency[marker] || 0;
            if (count >= 3) {
                score += 8;
                detectedMarkers.push(marker);
            } else if (count >= 1) {
                score += 4;
            }
        });

        const irregularityScore = assessCycleIrregularity(logs);
        score += irregularityScore;
        if (irregularityScore > 0) detectedMarkers.push('cycle_irregularity');

        const totalLogs = logs.length;
        const uniqueDays = new Set(logs.map(l => l.log_date)).size;
        const loggingConsistency = uniqueDays / Math.min(totalLogs, 30);
        if (loggingConsistency < 0.5 && totalLogs < 10) score = Math.round(score * 0.7);

        const riskScore = Math.min(100, Math.max(0, Math.round(score)));

        let assessmentText = '';
        let riskLevel = '';

        if (riskScore < 20) {
            riskLevel = 'Low';
            assessmentText = 'Your logged symptoms suggest a low likelihood of PCOS-related patterns. Keep logging consistently for a more accurate picture.';
        } else if (riskScore < 45) {
            riskLevel = 'Moderate';
            assessmentText = `Some markers associated with hormonal imbalance have been detected (${detectedMarkers.slice(0, 3).join(', ')}). Consider discussing these patterns with your healthcare provider.`;
        } else if (riskScore < 70) {
            riskLevel = 'Elevated';
            assessmentText = `Multiple PCOS-associated markers are present in your logs, including ${detectedMarkers.slice(0, 3).join(', ')}. This warrants a conversation with a gynecologist or endocrinologist.`;
        } else {
            riskLevel = 'High';
            assessmentText = `Your symptom history shows a strong pattern of PCOS-associated markers (${detectedMarkers.slice(0, 4).join(', ')}). We strongly recommend scheduling a clinical evaluation. Use the "Download Clinical Report" feature to prepare documentation for your appointment.`;
        }

        res.status(200).json({ riskScore, riskLevel, assessmentText, markers: detectedMarkers });

    } catch (error) {
        console.error('PCOS risk error:', error);
        res.status(500).json({ error: 'Failed to compute PCOS risk score' });
    }
}
