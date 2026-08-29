module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Vercel иногда присылает body как Buffer или строку — распарсим вручную
    let body = req.body;
    if (Buffer.isBuffer(body)) {
      body = JSON.parse(body.toString());
    } else if (typeof body === 'string') {
      body = JSON.parse(body);
    }

    // Проверяем, есть ли ключ (не показываем его, только факт наличия)
    if (!process.env.OPENROUTER_KEY) {
      return res.status(200).json({ error: true, message: 'API-ключ не найден. Проверь Environment Variables в Vercel.' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer sk-Q025lYJVanNF60oWG8XNb5ShoWHMzX4eGW2XtDP32KDDCfSP`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://bukvitsa-mobile.vercel.app',
        'X-Title': 'Bukvitsa Oracle'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // Если OpenRouter сам вернул ошибку — отправим её текстом, а не пустым 500
    if (data.error) {
      return res.status(200).json({ 
        error: true, 
        message: data.error.message || 'Ошибка со стороны OpenRouter' 
      });
    }

    res.status(200).json(data);
  } catch (err) {
    res.status(200).json({ error: true, message: 'Сервер: ' + err.message });
  }
};