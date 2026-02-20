export async function getCycleSchedule(userId, currentCycleDay = null) {
    const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, currentCycleDay }),
    });

    if (!response.ok) {
        throw new Error('Failed to generate schedule');
    }

    return response.json();
}

export async function sendChatMessage(userId, message, language, history = [], firstName = null) {
    const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, message, language, history, firstName }),
    });

    if (!response.ok) {
        throw new Error('Failed to send message');
    }

    return response.json();
}

export async function submitCycleLog(userId, date, symptoms) {
    const response = await fetch('/api/log', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, date, symptoms }),
    });

    if (!response.ok) {
        throw new Error('Failed to submit log');
    }

    return response.json();
}
