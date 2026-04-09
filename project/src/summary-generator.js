function createSummaryGenerator({
  apiKey = '',
  model = 'gpt-4o-mini',
  fetchImpl = fetch,
} = {}) {
  return {
    async generate(weather) {
      const response = await fetchImpl('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          response_format: {
            type: 'json_object',
          },
          messages: [
            {
              role: 'system',
              content: 'You generate one short weather summary and 2 to 3 activity suggestions. Use only the provided JSON weather record. Return JSON with keys "text" and "suggestions".',
            },
            {
              role: 'user',
              content: JSON.stringify(weather),
            },
          ],
        }),
      });

      if (!response.ok) {
        const error = new Error('OpenAI summary request failed.');
        error.code = 'SUMMARY_GENERATION_FAILED';
        error.status = response.status;
        throw error;
      }

      const payload = await response.json();
      const content = payload.choices && payload.choices[0] && payload.choices[0].message
        ? payload.choices[0].message.content
        : '';
      const parsed = JSON.parse(content);
      const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];

      if (typeof parsed.text !== 'string' || suggestions.length < 2) {
        const error = new Error('OpenAI summary output was invalid.');
        error.code = 'SUMMARY_GENERATION_FAILED';
        throw error;
      }

      return {
        text: parsed.text,
        suggestions,
      };
    },
  };
}

module.exports = {
  createSummaryGenerator,
};
