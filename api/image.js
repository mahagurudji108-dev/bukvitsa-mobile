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

      if (type === 'status') {
        const url = `https://api.odirouter.ai/model/v1/queue/free-nano-banana-2/requests/${id}/status`;
        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await response.json();
        return res.status(200).json(data);
      }

      if (type === 'response') {
        // Получаем JSON с информацией о задаче
        const statusUrl = `https://api.odirouter.ai/model/v1/queue/free-nano-banana-2/requests/${id}/response`;
        const response = await fetch(statusUrl, {
          headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        const data = await response.json();
        console.log('Ответ от odirouter (response):', data);

        // Ищем URL картинки внутри output
        let imageUrl = null;

        // Проверяем структуру: output[0].content[0].url
        if (data.output && Array.isArray(data.output) && data.output.length > 0) {
          const firstOutput = data.output[0];
          if (firstOutput.content && Array.isArray(firstOutput.content) && firstOutput.content.length > 0) {
            const firstContent = firstOutput.content[0];
            if (firstContent.url) {
              imageUrl = firstContent.url;
            }
          }
        }

        // Если нашли URL – скачиваем картинку и возвращаем как base64
        if (imageUrl) {
          console.log('Скачиваем изображение по URL:', imageUrl);
          const imageRes = await fetch(imageUrl);
          const imageBuffer = await imageRes.arrayBuffer();
          const base64 = Buffer.from(imageBuffer).toString('base64');
          const contentType = imageRes.headers.get('content-type') || 'image/jpeg';

          return res.status(200).json({
            image_url: `data:${contentType};base64,${base64}`,
            mime_type: contentType,
            success: true
          });
        }

        // Если URL не найден – возвращаем ошибку
        return res.status(200).json({
          error: true,
          message: 'Не удалось найти URL изображения в ответе odirouter'
        });
      }

      return res.status(200).json({ error: true, message: 'Неверный type' });

    } catch (err) {
      console.error('Ошибка в GET:', err);
      return res.status(200).json({ error: true, message: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};