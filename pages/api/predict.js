export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { features } = req.body;

        if (!features || !Array.isArray(features) || features.length !== 9) {
            return res.status(400).json({ detail: "Invalid features array" });
        }

        const response = await fetch("https://backend-pcos.vercel.app/predict", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ features }),
        });

        const data = await response.json();

        if (response.ok) {
            return res.status(200).json(data);
        } else {
            return res.status(response.status).json(data);
        }
    } catch (error) {
        console.error("PCOS Proxy Error:", error);
        return res.status(500).json({ detail: "Failed to connect to the prediction server." });
    }
}
