// Ensure WAHA_URL is set or default to local docker service
const WAHA_URL = process.env.WAHA_URL || 'http://localhost:3000';
export const sendWhatsappMessage = async (req, res) => {
    const { chatId, text, session } = req.body;
    try {
        const response = await fetch(`${WAHA_URL}/api/sendText`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chatId,
                text,
                session: session || 'default'
            }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            return res.status(response.status).json({ error: 'WAHA Error', details: errorData });
        }
        const data = await response.json();
        res.json(data);
    }
    catch (error) {
        console.error('WAHA Integration Error:', error);
        res.status(500).json({ error: 'Internal Server Error (WAHA)' });
    }
};
