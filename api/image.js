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
      const url = type === 'response'
        ? `https://api.odirouter.ai/model/v1/queue/free-nano-banana-2/requests/${id}/response`
        : `https://api.odirouter.ai/model/v1/queue/free-nano-banana-2/requests/${id}/status`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${process.env.BANANA_API_KEY}` }
      });
      const data = await response.json();
      return res.status(200).json(data);
    } catch (err) {
      return res.status(200).json({ error: true, message: err.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
};