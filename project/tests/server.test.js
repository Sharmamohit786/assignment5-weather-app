const test = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');

const { createServer } = require('../src/server');

test('GET / serves the weather search page with the city form', async () => {
  const server = createServer();
  server.listen(0);
  await once(server, 'listening');

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/`);
    const html = await response.text();

    assert.equal(response.status, 200);
    assert.match(html, /<form[^>]*id="weather-form"/);
    assert.match(html, /<input[^>]*name="city"/);
    assert.match(html, /<script[^>]*src="\/app\.js"/);
  } finally {
    server.close();
  }
});

test('POST /weather returns 400 for blank city input', async () => {
  const server = createServer();
  server.listen(0);
  await once(server, 'listening');

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city: '   ' }),
    });
    const payload = await response.json();

    assert.equal(response.status, 400);
    assert.deepEqual(payload, {
      error: 'City is required.',
    });
  } finally {
    server.close();
  }
});

test('POST /weather returns normalized weather fields for a valid city', async () => {
  const calls = [];
  const storedSnapshots = [];
  const server = createServer({
    weatherProvider: {
      async getCurrentWeather(city) {
        calls.push(city);
        return {
          name: city,
          dt: 1712700000,
          sys: {
            country: 'CA',
          },
          main: {
            temp: 12.3,
            feels_like: 10.8,
            humidity: 61,
          },
          wind: {
            speed: 5,
          },
          weather: [
            {
              main: 'Clouds',
              description: 'broken clouds',
              icon: '04d',
            },
          ],
        };
      },
    },
    weatherStore: {
      async saveLatest(weather) {
        storedSnapshots.push(weather);
      },
    },
    summaryGenerator: {
      async generate(weather) {
        return {
          text: `${weather.city} looks moderate today.`,
          suggestions: ['Take a light jacket', 'Go for a short walk'],
        };
      },
    },
  });
  server.listen(0);
  await once(server, 'listening');

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city: 'Toronto' }),
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(calls, ['Toronto']);
    assert.deepEqual(payload, {
      ok: true,
      weather: {
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
      },
      summaryStatus: 'available',
      summary: {
        text: 'Toronto looks moderate today.',
        suggestions: ['Take a light jacket', 'Go for a short walk'],
      },
    });
    assert.deepEqual(storedSnapshots, [payload.weather]);
  } finally {
    server.close();
  }
});

test('POST /weather maps city not found to 404', async () => {
  const server = createServer({
    weatherProvider: {
      async getCurrentWeather() {
        const error = new Error('City not found');
        error.code = 'CITY_NOT_FOUND';
        throw error;
      },
    },
  });
  server.listen(0);
  await once(server, 'listening');

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city: 'Atlantis' }),
    });
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(payload, {
      error: 'City not found.',
    });
  } finally {
    server.close();
  }
});

test('POST /weather maps upstream provider failures to 502', async () => {
  const server = createServer({
    weatherProvider: {
      async getCurrentWeather() {
        const error = new Error('Upstream failure');
        error.code = 'UPSTREAM_FAILURE';
        throw error;
      },
    },
  });
  server.listen(0);
  await once(server, 'listening');

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city: 'Toronto' }),
    });
    const payload = await response.json();

    assert.equal(response.status, 502);
    assert.deepEqual(payload, {
      error: 'Weather provider is unavailable.',
    });
  } finally {
    server.close();
  }
});

test('POST /weather overwrites the latest stored snapshot on each successful search', async () => {
  const stored = { latest: null };
  const server = createServer({
    weatherProvider: {
      async getCurrentWeather(city) {
        return {
          name: city,
          dt: 1712700000,
          sys: {
            country: city === 'Toronto' ? 'CA' : 'US',
          },
          main: {
            temp: city === 'Toronto' ? 12.3 : 24,
            feels_like: city === 'Toronto' ? 10.8 : 24,
            humidity: city === 'Toronto' ? 61 : 40,
          },
          wind: {
            speed: city === 'Toronto' ? 5 : 2,
          },
          weather: [
            {
              main: city === 'Toronto' ? 'Clouds' : 'Clear',
              description: city === 'Toronto' ? 'broken clouds' : 'clear sky',
            },
          ],
        };
      },
    },
    weatherStore: {
      async saveLatest(weather) {
        stored.latest = weather;
      },
    },
    summaryGenerator: {
      async generate() {
        return {
          text: 'Stored weather summary.',
          suggestions: ['Walk', 'Read outside'],
        };
      },
    },
  });
  server.listen(0);
  await once(server, 'listening');

  try {
    const { port } = server.address();

    await fetch(`http://127.0.0.1:${port}/weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city: 'Toronto' }),
    });

    await fetch(`http://127.0.0.1:${port}/weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city: 'Boston' }),
    });

    assert.deepEqual(stored.latest, {
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
  } finally {
    server.close();
  }
});

test('POST /weather generates a summary from the stored normalized weather record', async () => {
  const summaryCalls = [];
  const storedWeather = {
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
  const server = createServer({
    weatherProvider: {
      async getCurrentWeather() {
        return {
          name: 'Toronto',
          dt: 1712700000,
          sys: { country: 'CA' },
          main: {
            temp: 12.3,
            feels_like: 10.8,
            humidity: 61,
          },
          wind: { speed: 5 },
          weather: [
            {
              main: 'Clouds',
              description: 'broken clouds',
              icon: '04d',
            },
          ],
          providerOnlyField: 'should-not-leak',
        };
      },
    },
    weatherStore: {
      async saveLatest() {},
      async getLatest() {
        return storedWeather;
      },
    },
    summaryGenerator: {
      async generate(weather) {
        summaryCalls.push(weather);
        return {
          text: 'Cloudy and cool, but still reasonable for being outside.',
          suggestions: ['Take a walk', 'Bring a light jacket'],
        };
      },
    },
  });
  server.listen(0);
  await once(server, 'listening');

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city: 'Toronto' }),
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(summaryCalls, [storedWeather]);
    assert.deepEqual(payload, {
      ok: true,
      weather: storedWeather,
      summaryStatus: 'available',
      summary: {
        text: 'Cloudy and cool, but still reasonable for being outside.',
        suggestions: ['Take a walk', 'Bring a light jacket'],
      },
    });
  } finally {
    server.close();
  }
});

test('POST /weather falls back to a default summary when AI generation fails', async () => {
  const storedWeather = {
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
  const server = createServer({
    weatherProvider: {
      async getCurrentWeather() {
        return {
          name: 'Toronto',
          dt: 1712700000,
          sys: { country: 'CA' },
          main: {
            temp: 12.3,
            feels_like: 10.8,
            humidity: 61,
          },
          wind: { speed: 5 },
          weather: [
            {
              main: 'Clouds',
              description: 'broken clouds',
              icon: '04d',
            },
          ],
        };
      },
    },
    weatherStore: {
      async saveLatest() {},
      async getLatest() {
        return storedWeather;
      },
    },
    summaryGenerator: {
      async generate() {
        const error = new Error('OpenAI summary request failed.');
        error.code = 'SUMMARY_GENERATION_FAILED';
        throw error;
      },
    },
  });
  server.listen(0);
  await once(server, 'listening');

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/weather`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ city: 'Toronto' }),
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      ok: true,
      weather: storedWeather,
      summaryStatus: 'unavailable',
      summary: {
        text: 'Weather summary is unavailable right now. Showing the latest stored weather details instead.',
        suggestions: [],
      },
    });
  } finally {
    server.close();
  }
});

test('GET /weather/latest returns the latest stored normalized weather snapshot', async () => {
  const latestWeather = {
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
  const server = createServer({
    weatherStore: {
      async saveLatest() {},
      async getLatest() {
        return latestWeather;
      },
    },
  });
  server.listen(0);
  await once(server, 'listening');

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/weather/latest`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, {
      ok: true,
      weather: latestWeather,
    });
  } finally {
    server.close();
  }
});

test('GET /weather/latest returns 404 when no weather snapshot has been stored yet', async () => {
  const server = createServer({
    weatherStore: {
      async saveLatest() {},
      async getLatest() {
        return null;
      },
    },
  });
  server.listen(0);
  await once(server, 'listening');

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/weather/latest`);
    const payload = await response.json();

    assert.equal(response.status, 404);
    assert.deepEqual(payload, {
      error: 'No weather data has been stored yet.',
    });
  } finally {
    server.close();
  }
});
