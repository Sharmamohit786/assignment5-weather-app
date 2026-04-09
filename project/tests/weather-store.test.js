const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const { createWeatherStore } = require('../src/weather-store');

test('weather store writes the latest normalized weather snapshot to JSON', async () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'weather-store-test-'));
  const filePath = path.join(tempDir, 'latest-weather.json');
  const store = createWeatherStore({ filePath });

  try {
    const snapshot = {
      city: 'Toronto',
      country: 'CA',
      retrievedAt: '2024-04-09T22:00:00.000Z',
      temperatureC: 12.3,
    };

    await store.saveLatest(snapshot);

    const contents = fs.readFileSync(filePath, 'utf8');
    assert.deepEqual(JSON.parse(contents), snapshot);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('weather store overwrites the existing latest snapshot instead of appending history', async () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'weather-store-test-'));
  const filePath = path.join(tempDir, 'latest-weather.json');
  const store = createWeatherStore({ filePath });

  try {
    await store.saveLatest({ city: 'Toronto', country: 'CA' });
    await store.saveLatest({ city: 'Boston', country: 'US' });

    const contents = fs.readFileSync(filePath, 'utf8');
    assert.deepEqual(JSON.parse(contents), {
      city: 'Boston',
      country: 'US',
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('weather store reads back the latest saved snapshot', async () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'weather-store-test-'));
  const filePath = path.join(tempDir, 'latest-weather.json');
  const store = createWeatherStore({ filePath });

  try {
    const snapshot = { city: 'Boston', country: 'US' };
    await store.saveLatest(snapshot);

    const loaded = await store.getLatest();
    assert.deepEqual(loaded, snapshot);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('weather store returns null when no latest snapshot file exists', async () => {
  const tempDir = fs.mkdtempSync(path.join(process.cwd(), 'weather-store-test-'));
  const filePath = path.join(tempDir, 'latest-weather.json');
  const store = createWeatherStore({ filePath });

  try {
    const loaded = await store.getLatest();
    assert.equal(loaded, null);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
