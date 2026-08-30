module.exports = async (req, res) => {
  // Разрешаем CORS для любых источников
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Обработка предварительного запроса (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // === POST: создание задачи ===
  if (req.method === 'POST') {
    try {
      // Парсим тело запроса
      let body = req.body;
      if (Buffer.isBuffer(body)) body = JSON.parse(body.toString());
      else if (typeof body === 'string') body = JSON.parse(body);

      // Проверяем, есть ли API ключ
      const apiKey = process.env.BANANA_API_KEY;
      
      // Если ключа нет – сразу возвращаем тестовый ответ
      if (!apiKey) {
        console.log('⚠️ BANANA_API_KEY не найден, возвращаем тестовый ответ');
        return res.status(200).json({
          request_id: 'test_' + Date.now(),
          queue_position: 0,
          message: 'Тестовый режим: ключ API не найден'
        });
      }

      // Отправляем запрос к odirouter
      const response = await fetch('https://api.odirouter.ai/model/v1/queue/free-nano-banana-2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: body.prompt || 'Ancient Slavic mystical rune',
          aspect_ratio: body.aspect_ratio || '1:1',
          resolution: body.resolution || '1K'
        })
      });

      // Получаем ответ от odirouter
      const data = await response.json();
      console.log('✅ Ответ от odirouter (POST):', data);
      
      // Если odirouter вернул ошибку – возвращаем тестовый ответ
      if (data.error) {
        console.log('⚠️ Ошибка odirouter:', data.error);
        return res.status(200).json({
          request_id: 'test_' + Date.now(),
          queue_position: 0,
          message: 'Тестовый режим: ошибка odirouter'
        });
      }

      return res.status(200).json(data);
      
    } catch (err) {
      // При любой ошибке – возвращаем тестовый ответ
      console.error('❌ Ошибка в POST:', err.message);
      return res.status(200).json({
        request_id: 'test_' + Date.now(),
        queue_position: 0,
        message: 'Тестовый режим: ошибка сервера'
      });
    }
  }

  // === GET: статус или ответ ===
  if (req.method === 'GET') {
    try {
      const { id, type } = req.query;
      
      // Если нет id – возвращаем тестовый ответ
      if (!id) {
        return res.status(200).json({ 
          error: true, 
          message: 'Нет id',
          test_mode: true 
        });
      }

      // Если это тестовый запрос (id начинается с test_) – возвращаем тестовый ответ
      if (id.startsWith('test_')) {
        if (type === 'status') {
          return res.status(200).json({
            status: 'COMPLETED',
            queue_position: 0,
            test_mode: true
          });
        }
        if (type === 'response') {
          return res.status(200).json({
            image_url: 'https://via.placeholder.com/512x512/d4a853/1a0f0a?text=Видение+явилось',
            test_mode: true
          });
        }
      }

      // Проверяем ключ
      const apiKey = process.env.BANANA_API_KEY;
      if (!apiKey) {
        console.log('⚠️ BANANA_API_KEY не найден (GET)');
        return res.status(200).json({
          status: 'COMPLETED',
          queue_position: 0,
          test_mode: true
        });
      }

      // Формируем URL для odirouter
      const url = type === 'response'
        ? `https://api.odirouter.ai/model/v1/queue/free-nano-banana-2/requests/${id}/response`
        : `https://api.odirouter.ai/model/v1/queue/free-nano-banana-2/requests/${id}/status`;

      // Отправляем запрос к odirouter
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });

      const data = await response.json();
      console.log('✅ Ответ от odirouter (GET):', data);
      
      // Если odirouter вернул ошибку – возвращаем тестовый ответ
      if (data.error) {
        console.log('⚠️ Ошибка odirouter (GET):', data.error);
        if (type === 'response') {
          return res.status(200).json({
            image_url: 'https://via.placeholder.com/512x512/d4a853/1a0f0a?text=Видение+явилось',
            test_mode: true
          });
        }
        return res.status(200).json({
          status: 'COMPLETED',
          queue_position: 0,
          test_mode: true
        });
      }

      return res.status(200).json(data);
      
    } catch (err) {
      // При любой ошибке – возвращаем тестовый ответ
      console.error('❌ Ошибка в GET:', err.message);
      const { type } = req.query;
      if (type === 'response') {
        return res.status(200).json({
          image_url: 'https://via.placeholder.com/512x512/d4a853/1a0f0a?text=Видение+явилось',
          test_mode: true
        });
      }
      return res.status(200).json({
        status: 'COMPLETED',
        queue_position: 0,
        test_mode: true
      });
    }
  }

  // Если метод не POST и не GET
  return res.status(405).json({ error: 'Method not allowed' });
};