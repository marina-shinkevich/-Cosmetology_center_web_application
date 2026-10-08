const express = require('express');
const router = express.Router();
const { query } = require('../db');
const OpenAI = require('openai').default;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || 'https://openrouter.ai/api/v1',
  defaultHeaders: {
    'HTTP-Referer': 'https://localhost:20444',
    'X-Title': 'SKIN CODE Cosmetic',
  },
});

// POST /api/ai/contraindications
router.post('/ai/contraindications', async (req, res) => {
  const { drugName, drugDescription, userId } = req.body;
  if (!drugName) return res.status(400).json({ error: 'drugName required' });
  try {
    let clientContext = '';
    if (userId) {
      const profile = await query(`SELECT Allergies, ChronicDiseases, Medications FROM Profiles WHERE UserID=?`, [userId]);
      const recs = await query(`SELECT Recommendations FROM MedicalRecords WHERE ClientID=?`, [userId]);
      if (profile && profile.length > 0) {
        const p = profile[0];
        if (p.Allergies)       clientContext += `Аллергии: ${p.Allergies}\n`;
        if (p.ChronicDiseases) clientContext += `Хронические заболевания: ${p.ChronicDiseases}\n`;
        if (p.Medications)     clientContext += `Принимаемые препараты: ${p.Medications}\n`;
      }
      if (recs && recs.length > 0)
        clientContext += `Рекомендации врача: ${recs.map(r => r.Recommendations).join('; ')}\n`;
    }

    const systemPrompt = `Ты — врач-косметолог, который объясняет риски процедур простым языком для пациентов.
Твоя задача: на основе данных о здоровье клиента объяснить, можно ли ему использовать этот препарат и что будет, если его применить.
Правила ответа:
- Пиши простым языком, без медицинских терминов
- Будь конкретным: что именно может случиться (покраснение, отёк, боль, аллергия и т.д.)
- Укажи насколько это опасно: "высокий риск", "умеренный риск" или "низкий риск"
- Ответ должен быть 2-4 коротких абзаца (не больше!)
- Не используй markdown (**, ##) — только чистый текст
Если противопоказаний нет — скажи что препарат безопасен и почему.`;

    const userPrompt = clientContext
      ? `Препарат: ${drugName}\n${drugDescription ? `Что это: ${drugDescription}\n` : ''}Данные клиента:\n${clientContext}\nОбъясни простым языком: можно ли этому клиенту использовать препарат и что будет если его применить.`
      : `Препарат: ${drugName}\n${drugDescription ? `Что это: ${drugDescription}\n` : ''}Данные о клиенте не предоставлены. Объясни простым языком общие риски этого препарата.`;

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free',
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
      max_tokens: 600,
      temperature: 0.4,
    });

    const text = completion.choices[0]?.message?.content || '';
    const paragraphs = text.split(/\n{2,}/).map(p => p.trim()).filter(Boolean);
    res.json({ success: true, contraindications: paragraphs, raw: text });
  } catch (err) {
    console.error('[POST /api/ai/contraindications]', err.message);
    res.status(500).json({ success: false, error: 'Ошибка ИИ-анализа' });
  }
});

module.exports = router;
