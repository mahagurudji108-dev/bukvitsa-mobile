module.exports = async (req, res) => {
  console.log('=== ФУНКЦИЯ ЗАПУЩЕНА ===');
  console.log('Метод:', req.method);
  console.log('Ключ из env:', process.env.OPENROUTER_KEY ? 'ЕСТЬ (начинается с ' + process.env.OPENROUTER_KEY.slice(0,10) + '...)' : 'НЕТ');
  
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    console.log('Это OPTIONS, отвечаю 200');
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    console.log('Не POST, отвечаю 405');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let body = req.body;
    console.log('Тело запроса (сырое):', typeof body, body ? 'есть' : 'пусто');
    
    if (Buffer.isBuffer(body)) {
      body = JSON.parse(body.toString());
      console.log('Распарсил из Buffer');
    } else if (typeof body === 'string') {
      body = JSON.parse(body);
      console.log('Распарсил из строки');
    }
    
    console.log('Тело после парсинга:', JSON.stringify(body).slice(0, 200));

    if (!process.env.OPENROUTER_KEY) {
      console.log('ОШИБКА: ключ не найден!');
      return res.status(200).json({ error: true, message: 'API-ключ не найден в переменных окружения' });
    }

    console.log('Отправляю запрос в OpenRouter...');
    
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.origin || 'https://bukvitsa-mobile.vercel.app',
        'X-Title': 'Bukvitsa Oracle'
      },
      body: JSON.stringify(body)
    });

    console.log('Ответ от OpenRouter статус:', response.status);
    const data = await response.json();
    console.log('Ответ от OpenRouter данные:', JSON.stringify(data).slice(0, 300));

    if (data.error) {
      return res.status(200).json({ error: true, message: data.error.message || 'OpenRouter error' });
    }

    res.status(200).json(data);
  } catch (err) {
    console.log('ОШИБКА:', err.message);
    res.status(200).json({ error: true, message: 'Сервер: ' + err.message });
  }
};