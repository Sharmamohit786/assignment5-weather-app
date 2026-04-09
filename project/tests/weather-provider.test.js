const test = require('node:test');
const assert = require('node:assert/strict');

const { createWeatherProvider } = require('../src/weather-provider');

test('weather provider calls OpenWeatherMap current weather endpoint for a city', async () => {
  const requestedUrls = [];
  const provider = createWeatherProvider({
    apiKey: 'test-key',
    fetchImpl: async (url) => {
      requestedUrls.push(url);
      return {
        ok: true,
        json: async () => ({
          name: 'Toronto',
          sys: { country: 'CA' },
          weather: [{ main: 'Clouds' }],
        }),
      };
    },
  });

  const result = await provider.getCurrentWeather('Toronto');

  assert.equal(requestedUrls.length, 1);
  assert.equal(
    requestedUrls[0],
    'https://api.openweathermap.org/data/2.5/weather?q=Toronto&appid=test-key&units=metric'
  );
  assert.deepEqual(result, {
    name: 'Toronto',
    sys: { country: 'CA' },
    weather: [{ main: 'Clouds' }],
  });
});

test('weather provider maps OpenWeatherMap 404 responses to CITY_NOT_FOUND', async () => {
  const provider = createWeatherProvider({
    apiKey: 'test-key',
    fetchImpl: async () => ({
      ok: false,
      status: 404,
      json: async () => ({ message: 'city not found' }),
    }),
  });

  await assert.rejects(
    provider.getCurrentWeather('Atlantis'),
    (error) => error.code === 'CITY_NOT_FOUND'
  );
});
