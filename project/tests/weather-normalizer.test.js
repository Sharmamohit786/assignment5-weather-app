const test = require('node:test');
const assert = require('node:assert/strict');

const { normalizeWeather } = require('../src/weather-normalizer');

test('normalizeWeather maps OpenWeatherMap fields into the app weather schema', () => {
  const result = normalizeWeather({
    name: 'Paris',
    dt: 1712703600,
    sys: {
      country: 'FR',
    },
    main: {
      temp: 18.2,
      feels_like: 17.6,
      humidity: 48,
    },
    wind: {
      speed: 3.5,
    },
    weather: [
      {
        main: 'Clear',
        description: 'clear sky',
        icon: '01d',
      },
    ],
  });

  assert.deepEqual(result, {
    city: 'Paris',
    country: 'FR',
    retrievedAt: '2024-04-09T23:00:00.000Z',
    temperatureC: 18.2,
    feelsLikeC: 17.6,
    humidity: 48,
    windKph: 13,
    condition: 'Clear',
    conditionDescription: 'clear sky',
    comfortLevel: 'comfortable',
    isOutdoorFriendly: true,
    icon: '01d',
  });
});

test('normalizeWeather omits icon when the provider does not return one', () => {
  const result = normalizeWeather({
    name: 'Madrid',
    dt: 1712703600,
    sys: {
      country: 'ES',
    },
    main: {
      temp: 22,
      feels_like: 22,
      humidity: 30,
    },
    wind: {
      speed: 2,
    },
    weather: [
      {
        main: 'Clear',
        description: 'sunny',
      },
    ],
  });

  assert.equal(Object.hasOwn(result, 'icon'), false);
  assert.equal(result.condition, 'Clear');
  assert.equal(result.conditionDescription, 'sunny');
});

test('normalizeWeather marks rainy, windy conditions as uncomfortable and not outdoor friendly', () => {
  const result = normalizeWeather({
    name: 'Vancouver',
    dt: 1712703600,
    sys: {
      country: 'CA',
    },
    main: {
      temp: 7,
      feels_like: 4,
      humidity: 92,
    },
    wind: {
      speed: 12,
    },
    weather: [
      {
        main: 'Rain',
        description: 'light rain',
      },
    ],
  });

  assert.equal(result.comfortLevel, 'uncomfortable');
  assert.equal(result.isOutdoorFriendly, false);
});
