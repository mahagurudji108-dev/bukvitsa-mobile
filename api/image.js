module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (Buffer.isBuffer(body)) body = JSON.parse(body.toString());
      else if (typeof body === 'string') body = JSON.parse(body);

      const response = await fetch('https://api.odirouter.ai/model/v1/queue/free-nano-banana-2', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.BANANA_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt: body.prompt,
          aspect_ratio: body.aspect_ratio || '1:1',
          resolution: body.resolution || '1K'
        })
      });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(200).json({ error: true, message: err.message });
    }
  }

  if (req.method === 'GET') {
    try {
      const { id, type } = req.query;
      if (!id) return res.status(200).json({ error: true, message: 'Нет id' });

      const apiKey = process.env.BANANA_API_KEY;

      // --- Если запрашиваем статус ---
      if (type === 'status') {
        const url = `https://api.odirouter.ai/model/v1/queue/free-nano-banana-2/requests/${id}/status`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await response.json();
        return res.status(200).json(data);
      }

      // --- Если запрашиваем ответ (изображение) ---
      if (type === 'response') {
        // Сначала получаем response_url из статуса
        const statusUrl = `https://api.odirouter.ai/model/v1/queue/free-nano-banana-2/requests/${id}/status`;
        const statusRes = await fetch(statusUrl, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const statusData = await statusRes.json();
        console.log('Статус для получения изображения:', statusData);

        // Если есть response_url – скачиваем изображение
        if (statusData.response_url) {
          // Скачиваем изображение как бинарные данные
          const imageRes = await fetch(statusData.response_url, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
          });

          // Проверяем, что пришло
          const contentType = imageRes.headers.get('content-type') || 'image/png';
          const imageBuffer = await imageRes.arrayBuffer();
          const base64 = Buffer.from(imageBuffer).toString('base64');

          // Возвращаем JSON с base64
          return res.status(200).json({
            image_url: `data:${contentType};base64,${base64}`,
            mime_type: contentType,
            success: true
          });
        }

        // Если нет response_url, пробуем взять из output
        if (statusData.output && statusData.output.length > 0) {
          // В output может быть массив с base64 или ссылками
          const firstOutput = statusData.output[0];
          if (firstOutput.content && firstOutput.content.length > 0) {
            // content может содержать base64 или объект с image_url
            const content = firstOutput.content[0];
            if (content.image_url) {
              return res.status(200).json({
                image_url: content.image_url,
                success: true
              });
            }
            if (typeof content === 'string' && content.startsWith('data:image')) {
              return res.status(200).json({
                image_url: content,
                success: true
              });
            }
          }
        }

        return res.status(200).json({ error: true, message: 'Не удалось получить изображение' });
      }

      return res.status(200).json({ error: true, message: 'Неверный type' });

    } catch (err) {
      console.error('Ошибка в GET:', err);
      return res.status(200).json({ error: true, message: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};