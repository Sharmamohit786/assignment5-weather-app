function createWeatherProvider({ apiKey = '', fetchImpl = fetch } = {}) {
  return {
    async getCurrentWeather(city) {
      const url = new URL('https://api.openweathermap.org/data/2.5/weather');
      url.searchParams.set('q', city);
      url.searchParams.set('appid', apiKey);
      url.searchParams.set('units', 'metric');

      let response;
      try {
        response = await fetchImpl(url.toString());
      } catch (error) {
        const networkError = new Error('Network error while contacting weather provider.');
        networkError.code = 'NETWORK_ERROR';
        networkError.cause = error;
        throw networkError;
      }

      if (!response.ok) {
        if (response.status === 404) {
          const cityError = new Error('City not found');
          cityError.code = 'CITY_NOT_FOUND';
          throw cityError;
        }

        const upstreamError = new Error('Weather provider request failed');
        upstreamError.code = 'UPSTREAM_FAILURE';
        upstreamError.status = response.status;
        throw upstreamError;
      }

      return response.json();
    },
  };
}

module.exports = {
  createWeatherProvider,
};
