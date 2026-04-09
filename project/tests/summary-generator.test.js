const test = require('node:test');
const assert = require('node:assert/strict');

const { createSummaryGenerator } = require('../src/summary-generator');

test('summary generator sends the normalized weather record to OpenAI and returns structured summary output', async () => {
  const requests = [];
  const generator = createSummaryGenerator({
    apiKey: 'openai-test-key',
    model: 'gpt-4o-mini',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  text: 'Cloudy and cool, but still decent for outdoor plans.',
                  suggestions: ['Take a walk', 'Bring a light jacket'],
                }),
              },
            },
          ],
        }),
      };
    },
  });

  const weather = {
    city: 'Toronto',
    country: 'CA',
    retrievedAt: '2024-04-09T22:00:00.000Z',
    temperatureC: 12.3,
    feelsLikeC: 10.8,
    humidity: 61,
    windKph: 18,
    condition: 'Clouds',
    conditionDescription: 'broken clouds',
    comfortLevel: 'moderate',
    isOutdoorFriendly: true,
    icon: '04d',
  };

  const summary = await generator.generate(weather);

  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://api.openai.com/v1/chat/completions');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[0].options.headers.Authorization, 'Bearer openai-test-key');

  const body = JSON.parse(requests[0].options.body);
  assert.equal(body.model, 'gpt-4o-mini');
  assert.match(body.messages[1].content, /"city":"Toronto"/);
  assert.match(body.messages[1].content, /"comfortLevel":"moderate"/);
  assert.equal(body.messages[1].content.includes('providerOnlyField'), false);
  assert.deepEqual(summary, {
    text: 'Cloudy and cool, but still decent for outdoor plans.',
    suggestions: ['Take a walk', 'Bring a light jacket'],
  });
});

test('summary generator trims suggestions to three items when the model returns too many', async () => {
  const generator = createSummaryGenerator({
    apiKey: 'openai-test-key',
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                text: 'Warm and clear.',
                suggestions: ['Walk', 'Bike ride', 'Patio lunch', 'Read outdoors'],
              }),
            },
          },
        ],
      }),
    }),
  });

  const summary = await generator.generate({
    city: 'Boston',
    country: 'US',
    retrievedAt: '2024-04-09T22:00:00.000Z',
    temperatureC: 24,
    feelsLikeC: 24,
    humidity: 40,
    windKph: 7,
    condition: 'Clear',
    conditionDescription: 'clear sky',
    comfortLevel: 'comfortable',
    isOutdoorFriendly: true,
  });

  assert.deepEqual(summary, {
    text: 'Warm and clear.',
    suggestions: ['Walk', 'Bike ride', 'Patio lunch'],
  });
});
