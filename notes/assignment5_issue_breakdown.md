## Issue 1: Bootstrap app and city search flow

## Parent PRD

Local PRD source: `notes/assignment5_weather_insights_prd.md`

## What to build

Create the minimal client-server project structure for the Assignment 5 weather insights app and wire up the first end-to-end user interaction. The app should load in the browser, present a plain HTML/CSS/JavaScript city search form, and submit the user's city input to the backend using the agreed `POST /weather` contract. Include local environment configuration for external API keys so later slices can plug into the same setup.

This slice should establish the runnable app baseline described in the PRD's Solution and frontend flow sections without yet requiring real weather rendering.

## Acceptance criteria

- [ ] The project can run locally with a minimal client-server setup and environment variable configuration.
- [ ] The browser UI includes a city input, submit control, and loading state for the weather request flow.
- [ ] The frontend submits a request to `POST /weather` using plain JavaScript and handles a placeholder response path without crashing.

## Blocked by

None - can start immediately.

## User stories addressed

- User story 1
- User story 2
- User story 30
- User story 31
- User story 42

---

## Issue 2: Add POST /weather validation and OpenWeatherMap integration

## Parent PRD

Local PRD source: `notes/assignment5_weather_insights_prd.md`

## What to build

Implement the first real backend slice for `POST /weather`. The endpoint should validate city input, reject blank input with `400`, call OpenWeatherMap for current weather data, and translate provider failures into the app-level error responses defined in the PRD.

This slice should deliver a working request path from the browser to a real provider-backed backend response, even if later slices still refine the returned weather shape.

## Acceptance criteria

- [ ] `POST /weather` returns `400` for missing or blank city input.
- [ ] `POST /weather` fetches current weather from OpenWeatherMap for valid city input.
- [ ] Provider city-not-found and upstream/network failures are mapped to the agreed `404` and `502`/`503` responses.

## Blocked by

- Blocked by Issue 1

## User stories addressed

- User story 3
- User story 5
- User story 32
- User story 33
- User story 34
- User story 35
- User story 40

---

## Issue 3: Normalize weather response into app schema

## Parent PRD

Local PRD source: `notes/assignment5_weather_insights_prd.md`

## What to build

Transform the OpenWeatherMap response into the app-specific normalized schema defined in the PRD. This slice should flatten provider JSON into readable fields the frontend can consume consistently and optionally include an icon field if it is straightforward to support.

This slice should move the app from provider-shaped data to assignment-specific weather data.

## Acceptance criteria

- [ ] The backend maps provider data into the normalized fields required by the PRD.
- [ ] The normalized output includes readable weather fields such as city, country, retrieved time, temperatures, humidity, wind, condition, and condition description.
- [ ] The response shape is stable and no longer exposes raw provider JSON directly to the client.

## Blocked by

- Blocked by Issue 2

## User stories addressed

- User story 6
- User story 7
- User story 8
- User story 9
- User story 10
- User story 11
- User story 12
- User story 13
- User story 14

---

## Issue 4: Derive comfort and outdoor suitability fields

## Parent PRD

Local PRD source: `notes/assignment5_weather_insights_prd.md`

## What to build

Add deterministic derived weather fields on top of the normalized weather schema. Compute `comfortLevel` and `isOutdoorFriendly` from normalized weather inputs such as temperature, humidity, wind, and condition so the app exposes useful interpretation without relying on the LLM.

This slice should make the normalized record richer and keep the derived logic fully testable.

## Acceptance criteria

- [ ] The normalized weather output includes deterministic `comfortLevel`.
- [ ] The normalized weather output includes deterministic `isOutdoorFriendly`.
- [ ] The derivation rules are implemented in a dedicated part of the backend rather than embedded loosely in route code.

## Blocked by

- Blocked by Issue 3

## User stories addressed

- User story 15
- User story 16
- User story 36

---

## Issue 5: Persist the latest weather snapshot to JSON storage

## Parent PRD

Local PRD source: `notes/assignment5_weather_insights_prd.md`

## What to build

Persist the normalized weather record in a server-side JSON file as the app's single stored weather snapshot. Each successful search should overwrite the prior stored record, even when the city changes.

This slice should make the app stateful in the limited way defined by the PRD and ensure persistence happens before any AI summary generation.

## Acceptance criteria

- [ ] A successful weather search writes one latest normalized snapshot to server-side JSON storage.
- [ ] A later successful search overwrites the previous stored record rather than appending history.
- [ ] The persistence step occurs as part of the successful weather flow before later summary-generation steps depend on it.

## Blocked by

- Blocked by Issue 4

## User stories addressed

- User story 18
- User story 19
- User story 24
- User story 37

---

## Issue 6: Add GET /weather/latest retrieval

## Parent PRD

Local PRD source: `notes/assignment5_weather_insights_prd.md`

## What to build

Expose `GET /weather/latest` so the frontend can retrieve the latest stored weather snapshot. This route should return the persisted record when it exists and return `404` with a clear message when no successful weather search has been stored yet.

This slice should complete the storage retrieval path end-to-end.

## Acceptance criteria

- [ ] `GET /weather/latest` returns the latest stored weather snapshot from JSON storage.
- [ ] `GET /weather/latest` returns `404` with a clear message when no stored record exists.
- [ ] The route behavior is consistent with the backend contract defined in the PRD.

## Blocked by

- Blocked by Issue 5

## User stories addressed

- User story 28
- User story 29
- User story 31

---

## Issue 7: Generate OpenAI weather summary from stored record

## Parent PRD

Local PRD source: `notes/assignment5_weather_insights_prd.md`

## What to build

Add synchronous OpenAI summary generation after the normalized weather snapshot has been persisted. The summary generator should receive only the normalized stored record fields and should produce one short summary plus exactly 2 to 3 activity suggestions grounded in that data.

This slice should introduce the AI capability while keeping the weather record as the source of truth.

## Acceptance criteria

- [ ] After a successful weather fetch and persistence step, the backend calls OpenAI synchronously during `POST /weather`.
- [ ] The summary generator uses only normalized stored record fields as input.
- [ ] The returned summary contains one short summary plus exactly 2 to 3 activity suggestions.

## Blocked by

- Blocked by Issue 5

## User stories addressed

- User story 20
- User story 21
- User story 22
- User story 23
- User story 39
- User story 41

---

## Issue 8: Add fallback summary behavior when AI fails

## Parent PRD

Local PRD source: `notes/assignment5_weather_insights_prd.md`

## What to build

Make the weather flow resilient when OpenAI summary generation fails. `POST /weather` should still succeed when the AI step fails after persistence, returning the stored weather record, `summaryStatus` set to `"unavailable"`, and a fallback summary message.

This slice should ensure the AI layer enhances the app without becoming a single point of failure.

## Acceptance criteria

- [ ] If OpenAI generation fails, `POST /weather` still returns success with the stored weather data.
- [ ] The response sets `summaryStatus` to `"unavailable"` when fallback behavior is used.
- [ ] The response includes a fallback summary message instead of failing the entire user flow.

## Blocked by

- Blocked by Issue 7

## User stories addressed

- User story 25
- User story 26
- User story 27

---

## Issue 9: Render weather details and summary in the UI

## Parent PRD

Local PRD source: `notes/assignment5_weather_insights_prd.md`

## What to build

Render the normalized weather fields and summary output in the browser after a successful search. The UI should present the processed weather data clearly and display the returned summary content from the backend rather than raw provider data.

This slice should make the main assignment flow demoable from city search through weather insight display.

## Acceptance criteria

- [ ] After a successful search, the frontend renders the normalized weather fields returned by the backend.
- [ ] The frontend displays the AI or fallback summary content returned by `POST /weather`.
- [ ] The UI behavior remains plain HTML/CSS/JavaScript without introducing framework dependencies.

## Blocked by

- Blocked by Issue 4
- Blocked by Issue 8

## User stories addressed

- User story 7
- User story 8
- User story 9
- User story 10
- User story 11
- User story 12
- User story 13
- User story 14
- User story 21
- User story 22

---

## Issue 10: Load latest stored weather and handle UI errors

## Parent PRD

Local PRD source: `notes/assignment5_weather_insights_prd.md`

## What to build

Complete the frontend experience by loading the latest stored weather on page open and surfacing clear UI error states. The page should call `GET /weather/latest` on load, render the latest stored result if available, and show understandable messages for no stored data, invalid input, city-not-found, and upstream failures.

This slice should finish the assignment app's user-facing reliability and startup behavior.

## Acceptance criteria

- [ ] On page load, the frontend requests `GET /weather/latest` and renders the stored weather result when present.
- [ ] The frontend handles the no-data-yet case from `GET /weather/latest` without appearing broken.
- [ ] The frontend shows clear error feedback for invalid input, city-not-found, and upstream request failures.

## Blocked by

- Blocked by Issue 6
- Blocked by Issue 9

## User stories addressed

- User story 4
- User story 28
- User story 29
- User story 30
- User story 31
- User story 34
- User story 35

---

## Issue 11: Add backend and AI test coverage

## Parent PRD

Local PRD source: `notes/assignment5_weather_insights_prd.md`

## What to build

Add practical automated test coverage for the backend and AI-related behavior defined in the PRD. This should cover normalization, deterministic derived fields, JSON storage, route behavior, error mapping, and fallback summary behavior when OpenAI fails.

This slice should lock down the app's stable external behavior without overfitting tests to implementation details.

## Acceptance criteria

- [ ] Tests cover normalization output and deterministic derived fields.
- [ ] Tests cover JSON storage behavior and route-level behavior for `POST /weather` and `GET /weather/latest`.
- [ ] Tests cover fallback summary behavior and verify the AI step is grounded in normalized stored record fields.

## Blocked by

- Blocked by Issue 8

## User stories addressed

- User story 23
- User story 25
- User story 26
- User story 27
- User story 33
- User story 34
- User story 35
- User story 36
- User story 37
