module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    let body = req.body;
    if (Buffer.isBuffer(body)) body = JSON.parse(body.toString());
    else if (typeof body === 'string') body = JSON.parse(body);

    if (!process.env.OPENROUTER_KEY) {
      return res.status(200).json({ error: true, message: 'API-ключ не найден в переменных окружения' });
    }

        const response = await fetch('https://api.odirouter.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://bukvitsa-mobile.vercel.app',
        'X-Title': 'Bukvitsa Oracle'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (data.error) {
      return res.status(200).json({ error: true, message: data.error.message || 'Ошибка API' });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(200).json({ error: true, message: 'Сервер: ' + err.message });
  }
};