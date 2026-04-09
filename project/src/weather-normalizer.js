function normalizeWeather(providerWeather) {
  const primaryCondition = providerWeather.weather && providerWeather.weather[0] ? providerWeather.weather[0] : {};
  const windSpeedMps = providerWeather.wind && typeof providerWeather.wind.speed === 'number'
    ? providerWeather.wind.speed
    : 0;
  const temperatureC = providerWeather.main && typeof providerWeather.main.temp === 'number'
    ? providerWeather.main.temp
    : null;
  const feelsLikeC = providerWeather.main && typeof providerWeather.main.feels_like === 'number'
    ? providerWeather.main.feels_like
    : null;
  const humidity = providerWeather.main && typeof providerWeather.main.humidity === 'number'
    ? providerWeather.main.humidity
    : null;
  const windKph = Math.round(windSpeedMps * 3.6);
  const condition = primaryCondition.main || '';

  const normalized = {
    city: providerWeather.name || '',
    country: providerWeather.sys && providerWeather.sys.country ? providerWeather.sys.country : '',
    retrievedAt: new Date((providerWeather.dt || 0) * 1000).toISOString(),
    temperatureC,
    feelsLikeC,
    humidity,
    windKph,
    condition,
    conditionDescription: primaryCondition.description || '',
    comfortLevel: deriveComfortLevel({ feelsLikeC, humidity, windKph, condition }),
    isOutdoorFriendly: deriveOutdoorFriendly({ feelsLikeC, humidity, windKph, condition }),
  };

  if (primaryCondition.icon) {
    normalized.icon = primaryCondition.icon;
  }

  return normalized;
}

function deriveComfortLevel({ feelsLikeC, humidity, windKph, condition }) {
  if (feelsLikeC === null) {
    return 'unknown';
  }

  if (isSevereCondition(condition) || feelsLikeC < 0 || feelsLikeC > 32 || humidity !== null && humidity > 85 || windKph > 35) {
    return 'uncomfortable';
  }

  if (feelsLikeC >= 15 && feelsLikeC <= 24 && (humidity === null || humidity <= 70) && windKph <= 20) {
    return 'comfortable';
  }

  return 'moderate';
}

function deriveOutdoorFriendly({ feelsLikeC, humidity, windKph, condition }) {
  if (feelsLikeC === null) {
    return false;
  }

  return !isSevereCondition(condition)
    && feelsLikeC >= 10
    && feelsLikeC <= 30
    && (humidity === null || humidity <= 80)
    && windKph <= 25;
}

function isSevereCondition(condition) {
  return ['Thunderstorm', 'Snow', 'Rain', 'Drizzle'].includes(condition);
}

module.exports = {
  normalizeWeather,
};
