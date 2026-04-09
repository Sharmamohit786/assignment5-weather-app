# Changes made after grill-me

- Cut freeform Q&A and kept one generated summary/advice flow
- Chose a small client-server architecture instead of pure frontend
- Store only one latest normalized weather snapshot in a server-side JSON file
- Use POST /weather and GET /weather/latest as the backend contract
- Return weather data even if AI summary generation fails
- Use clear 400, 404, and 502/503 error responses
- Keep ETL meaningful by flattening JSON and deriving a small number of app-level fields