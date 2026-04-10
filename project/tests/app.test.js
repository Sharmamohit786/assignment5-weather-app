const test = require('node:test');
const assert = require('node:assert/strict');

const { initWeatherApp } = require('../src/public/app');

test('submitting the form shows loading state and posts the city to /weather', async () => {
  const statusNode = createNode();
  const weatherNode = createNode();
  const summaryNode = createNode();
  const cityInput = createInput('Toronto');
  const form = createForm();

  const fetchCalls = [];
  const fetchImpl = async (url, options) => {
    fetchCalls.push({ url, options });
    return {
      ok: true,
      json: async () => ({
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
        },
        summaryStatus: 'available',
        summary: {
          text: 'Toronto looks moderate today.',
          suggestions: ['Take a light jacket', 'Go for a short walk'],
        },
      }),
    };
  };

  initWeatherApp({
    document: {
      getElementById(id) {
        return {
          'weather-form': form,
          'city-input': cityInput,
          status: statusNode,
          weather: weatherNode,
          summary: summaryNode,
        }[id];
      },
    },
    fetchImpl,
  });

  const submission = form.submit();

  assert.equal(statusNode.textContent, 'Loading weather.');

  await submission;

  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, '/weather');
  assert.equal(fetchCalls[0].options.method, 'POST');
  assert.equal(fetchCalls[0].options.headers['Content-Type'], 'application/json');
  assert.equal(fetchCalls[0].options.body, JSON.stringify({ city: 'Toronto' }));
  assert.equal(statusNode.textContent, 'Ready');
  assert.match(weatherNode.innerHTML, /Toronto, CA/);
  assert.match(weatherNode.innerHTML, /Temperature<\/dt><dd>12\.3 C/);
 assert.match(weatherNode.innerHTML, /Condition<\/dt><dd>Clouds<\/dd>/);
 assert.match(weatherNode.innerHTML, /Description<\/dt><dd>broken clouds<\/dd>/);
  assert.match(summaryNode.innerHTML, /AI Summary/);
  assert.match(summaryNode.innerHTML, /Toronto looks moderate today\./);
  assert.match(summaryNode.innerHTML, /Take a light jacket/);
  assert.match(summaryNode.innerHTML, /Go for a short walk/);
});

test('submitting the form renders fallback summary content when AI is unavailable', async () => {
  const statusNode = createNode();
  const weatherNode = createNode();
  const summaryNode = createNode();
  const cityInput = createInput('Toronto');
  const form = createForm();

  initWeatherApp({
    document: {
      getElementById(id) {
        return {
          'weather-form': form,
          'city-input': cityInput,
          status: statusNode,
          weather: weatherNode,
          summary: summaryNode,
        }[id];
      },
    },
    fetchImpl: async () => ({
      ok: true,
      json: async () => ({
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
        },
        summaryStatus: 'unavailable',
        summary: {
          text: 'Weather summary is unavailable right now. Showing the latest stored weather details instead.',
          suggestions: [],
        },
      }),
    }),
  });

  await form.submit();

  assert.match(summaryNode.innerHTML, /Fallback Summary/);
  assert.match(summaryNode.innerHTML, /Weather summary is unavailable right now/);
});

function createNode() {
  return {
    textContent: '',
    innerHTML: '',
  };
}

function createInput(value) {
  return {
    value,
  };
}

function createForm() {
  const listeners = new Map();

  return {
    addEventListener(eventName, handler) {
      listeners.set(eventName, handler);
    },
    submit() {
      const handler = listeners.get('submit');
      return handler({
        preventDefault() {},
      });
    },
  };
}
