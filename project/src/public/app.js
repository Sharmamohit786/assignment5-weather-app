function initWeatherApp({ document, fetchImpl = fetch }) {
  const form = document.getElementById('weather-form');
  const cityInput = document.getElementById('city-input');
  const statusNode = document.getElementById('status');
  const weatherNode = document.getElementById('weather');
  const summaryNode = document.getElementById('summary');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    statusNode.textContent = 'Loading weather.';
    weatherNode.innerHTML = '';
    summaryNode.innerHTML = '';

    try {
      const response = await fetchImpl('/weather', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          city: cityInput.value,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.ok || !payload.weather) {
        throw new Error(payload.error || 'Unable to load weather.');
      }

      weatherNode.innerHTML = renderWeather(payload.weather);
      summaryNode.innerHTML = renderSummary(payload.summaryStatus, payload.summary);
      statusNode.textContent = 'Ready';
    } catch (error) {
      statusNode.textContent = 'Unable to submit request.';
      weatherNode.innerHTML = '<p>No weather details available.</p>';
      summaryNode.innerHTML = `<p>${escapeHtml(error.message || 'Something went wrong.')}</p>`;
    }
  });
}

function renderWeather(weather) {
  return `<section class="weather-card">
    <h2>${escapeHtml(weather.city)}, ${escapeHtml(weather.country)}</h2>
    <dl>
      <dt>Retrieved</dt><dd>${escapeHtml(weather.retrievedAt)}</dd>
      <dt>Temperature</dt><dd>${escapeHtml(String(weather.temperatureC))} C</dd>
      <dt>Feels Like</dt><dd>${escapeHtml(String(weather.feelsLikeC))} C</dd>
      <dt>Humidity</dt><dd>${escapeHtml(String(weather.humidity))}%</dd>
      <dt>Wind</dt><dd>${escapeHtml(String(weather.windKph))} kph</dd>
      <dt>Condition</dt><dd>${escapeHtml(weather.condition)}</dd>
      <dt>Description</dt><dd>${escapeHtml(weather.conditionDescription)}</dd>
      <dt>Comfort</dt><dd>${escapeHtml(weather.comfortLevel)}</dd>
      <dt>Outdoor Friendly</dt><dd>${weather.isOutdoorFriendly ? 'Yes' : 'No'}</dd>
    </dl>
  </section>`;
}

function renderSummary(summaryStatus, summary) {
  const heading = summaryStatus === 'available' ? 'AI Summary' : 'Fallback Summary';
  const suggestions = Array.isArray(summary?.suggestions) && summary.suggestions.length > 0
    ? `<ul>${summary.suggestions.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
    : '';

  return `<section class="summary-card">
    <h2>${heading}</h2>
    <p>${escapeHtml(summary?.text || 'No summary available.')}</p>
    ${suggestions}
  </section>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

if (typeof document !== 'undefined') {
  initWeatherApp({ document });
}

module.exports = {
  initWeatherApp,
};