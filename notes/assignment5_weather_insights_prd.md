## Problem Statement

The Assignment 5 weather insights app needs to provide a narrow, reliable weather-to-insight workflow instead of a broad assistant experience. A user should be able to enter a city in a browser, trigger a backend request for current weather, receive a normalized and easier-to-read weather record, and see a short AI-generated summary with practical activity suggestions. The app must behave predictably even when the AI step fails, and it must keep the assignment scope intentionally small by storing only one latest weather snapshot on the server.

## Solution

Build a small client-server browser application with a plain HTML, CSS, and JavaScript frontend and a backend that exposes two endpoints: `POST /weather` and `GET /weather/latest`.

`POST /weather` accepts a city name, validates the input, fetches current weather from OpenWeatherMap, normalizes the provider response into a compact app-specific schema, derives deterministic fields for comfort and outdoor suitability, persists the latest snapshot to a server-side JSON file, and then calls OpenAI synchronously to generate one short summary plus exactly 2 to 3 activity suggestions using only the stored normalized record. If AI generation fails, the request still succeeds and returns the stored weather snapshot with `summaryStatus` set to `"unavailable"` and a fallback summary message.

`GET /weather/latest` returns the single latest stored weather snapshot and its summary payload. If no successful search has been stored yet, the endpoint returns `404` with a clear message.

The frontend provides one main user flow: city search, loading state, weather display, and summary display. It does not support freeform Q&A, multi-city history, user accounts, long-range forecasting, or severe weather alerts.

## User Stories

1. As a student using the assignment app, I want to enter a city name, so that I can retrieve current weather insights for that location.
2. As a student using the app in a browser, I want a single focused search flow, so that the assignment remains simple and easy to demonstrate.
3. As a user, I want blank or whitespace-only city input to be rejected, so that I get immediate feedback instead of a broken request.
4. As a user, I want to see a clear error when a city cannot be found, so that I know the problem is with the query rather than the entire app.
5. As a user, I want the backend to fetch current weather from OpenWeatherMap, so that the weather information comes from a real external provider.
6. As a user, I want the raw provider response to be transformed into simpler weather fields, so that I do not need to interpret nested API data.
7. As a user, I want to see the city and country in the response, so that I can confirm the result matches the place I intended to search.
8. As a user, I want to see when the weather data was retrieved, so that I understand how recent the snapshot is.
9. As a user, I want to see the current temperature in Celsius, so that I can quickly judge the day's conditions.
10. As a user, I want to see the feels-like temperature, so that I can understand perceived conditions better than raw temperature alone.
11. As a user, I want to see humidity, so that I have more context for comfort.
12. As a user, I want to see wind speed in kilometers per hour, so that I can assess outdoor conditions more accurately.
13. As a user, I want to see a normalized weather condition label, so that the result is readable at a glance.
14. As a user, I want to see a short condition description, so that the response feels more descriptive than a single label.
15. As a user, I want the app to compute a deterministic `comfortLevel`, so that the result includes an interpretable assessment without depending on AI.
16. As a user, I want the app to compute a deterministic `isOutdoorFriendly` flag, so that I can quickly judge whether outdoor activity is reasonable.
17. As a user, I want an icon field when convenient to support, so that the frontend can optionally show a visual indicator without making it a hard dependency.
18. As a user, I want the backend to persist only one latest weather snapshot, so that the app stays small and aligned with assignment scope.
19. As a user, I want each successful search to overwrite the previous stored record, so that the latest viewed city is always the one returned by the app.
20. As a user, I want the AI summary to be based only on the stored normalized weather record, so that the explanation stays grounded in known app data.
21. As a user, I want the AI response to contain one short summary, so that the explanation is concise and easy to read.
22. As a user, I want exactly 2 to 3 activity suggestions, so that the advice is useful without becoming verbose.
23. As a user, I want the AI to avoid adding facts not present in the stored record, so that the summary does not overstate what the app knows.
24. As a user, I want the weather data to be stored before AI generation runs, so that the app preserves the core result even if the AI step has problems.
25. As a user, I want `POST /weather` to succeed even when OpenAI fails, so that the app still provides weather results for the searched city.
26. As a user, I want `summaryStatus` to indicate whether the summary came from AI or fallback behavior, so that the response clearly communicates summary availability.
27. As a user, I want a fallback summary message when AI generation fails, so that the UI still has a usable explanation area instead of appearing broken.
28. As a user, I want `GET /weather/latest` to return the most recently stored record, so that I can refresh or reopen the page and still see the latest successful result.
29. As a user, I want `GET /weather/latest` to return `404` before any successful search, so that the UI can clearly distinguish "no data yet" from other failures.
30. As a frontend developer, I want a stable backend contract for `POST /weather`, so that the browser app can render success and error states consistently.
31. As a frontend developer, I want a stable backend contract for `GET /weather/latest`, so that the page can optionally load an existing stored result on startup.
32. As a backend developer, I want provider-specific errors translated into app-level status codes, so that clients do not need to understand OpenWeatherMap internals.
33. As a backend developer, I want `400` returned for missing or blank city input, so that validation behavior is explicit and testable.
34. As a backend developer, I want `404` returned when OpenWeatherMap reports city not found, so that the API communicates the failure accurately.
35. As a backend developer, I want `502` or `503` returned for upstream provider or network failures, so that the API clearly indicates dependency problems.
36. As a backend developer, I want deterministic derivation logic separated from the LLM step, so that business rules can be tested without model variability.
37. As a backend developer, I want JSON file persistence encapsulated behind a module, so that route handlers do not mix transport logic with storage details.
38. As a backend developer, I want normalization logic encapsulated behind a module, so that provider mapping and derived fields can evolve without rewriting routes.
39. As a backend developer, I want summary generation encapsulated behind a module, so that OpenAI-specific prompt and response handling do not leak through the app.
40. As an evaluator, I want the app to demonstrate ETL by fetching external JSON, flattening and transforming it, and persisting a processed snapshot, so that the assignment shows meaningful backend work.
41. As an evaluator, I want the app to demonstrate resilient AI integration, so that failure in the reasoning layer does not invalidate the core weather workflow.
42. As an evaluator, I want the app's scope to stay intentionally limited, so that the implementation is coherent and feasible for the assignment.

## Implementation Decisions

- The application uses a small client-server architecture with a plain HTML, CSS, and JavaScript frontend and a backend service responsible for data fetching, transformation, storage, and summary generation.
- OpenWeatherMap is the weather data provider for current weather retrieval.
- OpenAI is the AI provider for summary generation.
- The backend contract consists of `POST /weather` and `GET /weather/latest`.
- `POST /weather` validates input, fetches provider data, normalizes the response, derives deterministic fields, persists the normalized snapshot, generates a synchronous summary, and returns a combined payload.
- `GET /weather/latest` returns the most recently stored snapshot and summary data from server-side persistence.
- If no weather snapshot has ever been stored, `GET /weather/latest` returns `404` with a clear explanatory message.
- Successful weather searches overwrite the single stored JSON record, even when the requested city changes.
- The normalized weather schema includes `city`, `country`, `retrievedAt`, `temperatureC`, `feelsLikeC`, `humidity`, `windKph`, `condition`, `conditionDescription`, `comfortLevel`, `isOutdoorFriendly`, `summaryStatus`, and an optional `icon`.
- `comfortLevel` and `isOutdoorFriendly` are deterministic derived fields computed from temperature, humidity, wind, and condition rather than generated by the LLM.
- Deterministic derivation rules should live in a dedicated normalization or domain module so they are easy to test in isolation.
- The weather provider client should translate OpenWeatherMap-specific failures into app-level outcomes instead of exposing raw upstream behavior directly to route handlers.
- The summary generator must receive only the normalized stored weather record fields and must not receive raw provider JSON or unrelated context.
- The OpenAI prompt should constrain output to one short summary plus exactly 2 to 3 activity suggestions and should forbid unsupported facts beyond the supplied record.
- The backend should persist the normalized weather snapshot before invoking OpenAI so the core data path succeeds independently of summary generation.
- If OpenAI generation fails after persistence, the response still succeeds with stored weather data, `summaryStatus` set to `"unavailable"`, and a fallback summary message.
- `summaryStatus` should distinguish at least between successful AI generation and fallback summary behavior so the frontend can render the result accurately.
- The weather service orchestration should be separated from the HTTP layer to keep route handlers thin and make the end-to-end workflow easier to test.
- The weather store should encapsulate JSON file read and write behavior for the single latest snapshot, including behavior for missing storage files.
- The frontend should implement one primary path: enter city, submit request, show loading or error state, then render weather details and summary output.
- The frontend should avoid framework dependencies and use direct browser APIs for form submission, fetch calls, and DOM updates.
- Error mapping should follow the agreed API behavior: `400` for missing or blank city input, `404` when the provider reports city not found, `502` or `503` for provider or network failures.
- Module boundaries should favor deep modules with narrow interfaces: provider access, normalization and derivation, persistence, summary generation, orchestration, and transport.
- The design intentionally excludes freeform AI question answering, user identity, search history, forecasting workflows, and alerting features from the main implementation.

## Testing Decisions

- Good tests should validate externally observable behavior and stable contracts rather than internal implementation details.
- Tests for the weather normalizer should verify that raw provider input is flattened into the normalized schema correctly and that `comfortLevel` and `isOutdoorFriendly` are derived deterministically from the intended fields.
- Tests for the weather store should verify creation, overwrite behavior, and retrieval of the single latest JSON snapshot, including the no-data case.
- Tests for API routes should verify success payloads, required input validation, error mapping, and the `404` behavior for `GET /weather/latest` when no successful search exists.
- Tests for fallback summary behavior should verify that a weather snapshot is still persisted and returned when OpenAI generation fails and that `summaryStatus` and the fallback summary message are set correctly.
- Tests should cover the requirement that the summary generator only receives normalized record fields, not raw provider payloads.
- Tests should prefer mocked upstream dependencies for OpenWeatherMap and OpenAI so route and service behavior can be validated deterministically.
- Prior art in the codebase does not currently exist because the workspace contains planning notes but no implemented application modules yet; the first test suite should therefore establish the project's testing patterns around module isolation and route-level behavior.

## Out of Scope

- Freeform user questions about weather conditions
- Multi-city history or browsing previously searched cities
- Long-range forecasting beyond the current weather flow
- Severe weather alerts or emergency notification logic
- User accounts, authentication, or personalized settings
- Travel booking, route optimization, or itinerary planning
- Rich analytics dashboards or historical weather charts
- Background jobs, asynchronous queues, or summary regeneration workflows
- Reliance on AI for core weather normalization or deterministic derived fields

## Further Notes

- The assignment should emphasize a meaningful ETL pipeline: extract provider data, transform it into an app-specific schema, load it into a server-side JSON file, and then generate a constrained AI explanation from the stored record.
- The implementation should preserve a strict separation between deterministic weather processing and probabilistic AI output so the app remains debuggable and testable.
- The single-record persistence model is a deliberate scope decision and should not be treated as an incomplete history feature.
