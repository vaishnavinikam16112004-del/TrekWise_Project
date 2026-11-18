# TrekWise – Beginner-Friendly Project

TrekWise is a web-based prototype that helps users compare heritage trekking routes using:
- User fitness, trekking experience, and available time
- Route distance, estimated duration, and difficulty
- A Route Compatibility Score (0–100)
- A separate Safety Score (0–100)
- Weather information (optional OpenWeather API key)
- Community trail/hazard reports
- A simple map link for each destination

IMPORTANT SAFETY NOTE
This is an academic prototype, not a certified safety system. Scores are illustrative decision-support indicators, not guarantees that a trek is safe. Verify trail conditions with local authorities and experienced guides. Do not trek in severe weather or on a route reported blocked/dangerous. Unknown data must not be interpreted as safe.

## 1. Software needed
1. Install Node.js LTS from https://nodejs.org/
2. Install Visual Studio Code from https://code.visualstudio.com/
3. Optional: Create a MongoDB Atlas database at https://www.mongodb.com/atlas
4. Optional: Get an OpenWeather API key at https://openweathermap.org/api

Check Node.js:
```powershell
node -v
npm -v
```
Both commands should show version numbers.

## 2. Open the project
1. Extract `TrekWise_Project.zip`.
2. In VS Code choose File > Open Folder.
3. Select the extracted `TrekWise_Project` folder.

## 3. Start the backend
Open Terminal > New Terminal in VS Code:
```powershell
cd backend
npm install
copy .env.example .env
npm run dev
```
Backend runs at http://localhost:5000

The backend works in demo memory mode without MongoDB. In this mode, new accounts/reports disappear when the backend restarts. To use MongoDB, put your connection string in `backend/.env` as `MONGODB_URI=...`.

## 4. Start the frontend
Open a SECOND terminal in VS Code:
```powershell
cd frontend
npm install
npm run dev
```
Open the local URL shown by Vite, usually http://localhost:5173

Keep both terminals running while using the app.

## Deploy on Render
Deploy the backend and frontend as two separate Render services from the same GitHub repository.

### Backend web service
1. In Render, choose **New + > Web Service** and connect this repository.
2. Set **Root Directory** to `backend`.
3. Set **Build Command** to `npm install` and **Start Command** to `npm start`.
4. Add these environment variables in the Render dashboard:
   - `JWT_SECRET`: a long, unique random secret.
   - `FRONTEND_URL`: the frontend Static Site URL, with no trailing slash. You can set this after creating the frontend service.
   - `MONGODB_URI`: optional. Without it, the backend uses temporary demo memory and data is lost when it restarts.
   - `OPENWEATHER_API_KEY`: optional.

### Frontend Static Site
1. In Render, choose **New + > Static Site** and connect the same repository.
2. Set **Root Directory** to `frontend`.
3. Set **Build Command** to `npm install && npm run build` and **Publish Directory** to `dist`.
4. Add the environment variable `VITE_API_BASE` with the backend URL followed by `/api`, for example `https://your-backend.onrender.com/api`.
5. Deploy the site, then copy its URL into the backend's `FRONTEND_URL` variable and redeploy the backend.

The frontend URL must match `FRONTEND_URL` exactly (without a trailing slash), or browser API requests will be blocked by CORS. After changing frontend environment variables, trigger a new Static Site deploy because Vite reads them at build time.

## 5. Demo login / account
Choose Register and create a demo account, or use the app without logging in to explore routes. For a classroom demo, do not use a real password you use elsewhere.

## 6. Main features
- Modern home page, feature directory and user dashboard
- Login, registration and profile preferences
- Route search and fitness-based compatibility recommendations
- Difficulty, distance and sample per-person budget filters
- Hindi/Marathi controls for the main discovery flow, plus persistent dark/light theme
- Saved favorites stored in the current browser
- Browser voice search where supported
- Step-by-step Help Center and a local-only trek inquiry draft
- Profile inputs for fitness, experience and time
- Compatibility scoring and recommendation explanation
- Safety scoring with route conditions and community reports
- Community reports and trek reviews
- Offline-friendly fort location overview with a full OpenStreetMap link for each fort, plus elevation summaries
- User-triggered location sharing for a personal check-in
- Optional current weather lookup

## Smart tools demo and limitations
The Smart tools page includes a sample trip-cost planner, a local English/Hindi/Marathi FAQ assistant, a non-medical fitness-readiness estimate, a browser-only trail-photo preview with a manual hazard checklist, and consent-gated matching against fictional sample trek groups.

These are local prototype helpers, not connected AI features. The planner uses illustrative INR estimates; the assistant uses bundled responses; the readiness score is not a medical assessment; the photo tool does not run computer vision and never uploads the image; buddy groups are synthetic and do not contact real people. Verify trail, weather, budget and safety information independently. The buddy demo does not request or share location.

The Advanced safety page adds a browser-session check-in timer with manual sharing, downloadable emergency text and a local-only SOS draft queue, route-level caution indicators, local fort photos with illustrative virtual story markers, self-reported trek points and milestone badges, a printable personal achievement certificate, a local monthly leaderboard preview, a weather-aware day/overnight packing checklist, a group budget estimate and English/Hindi/Marathi browser voice search and preparation commands.

These are also prototype features: no automatic emergency contact alerts, offline map tiles, guaranteed offline app reload, segment-level risk heatmap, monument recognition, verified leaderboard, live group matching or turn-by-turn voice navigation is provided. Camera preview is user-initiated and stays in the browser. Check-ins and queued messages are not delivered automatically. Never rely on this prototype as an emergency service.

## Friendly discovery tools and limitations
The discovery page can filter sample routes by difficulty, distance and a per-person INR budget estimate. Estimates reuse the sample budget calculator and are not live quotes. Route favorites, interface language and theme are saved in browser local storage on the current device. Voice search depends on browser speech-recognition support and microphone permission.

The English/Hindi/Marathi selector translates the main navigation, discovery flow, route actions, Help Center and inquiry draft; some advanced/demo feature pages and route-specific source data remain in English. The Help Center provides a short onboarding guide. “Ask about this trek” opens a local inquiry draft that can be saved or copied, but it does not contact an organizer, make a reservation or confirm a booking.

## 7. Project structure
```text
TrekWise_Project/
  backend/
    server.js
    package.json
    .env.example
    data/routes.js
    models/User.js
    models/Report.js
    middleware/auth.js
    routes/auth.js
    routes/treks.js
    routes/reports.js
    routes/weather.js
  frontend/
    package.json
    index.html
    vite.config.js
    src/main.jsx
    src/App.jsx
    src/SmartFeatures.jsx
    src/AdvancedFeatures.jsx
    src/localization.js
    src/routeBudget.js
    src/api.js
    src/styles.css
```

## 8. How the scores work
Compatibility Score:
- Fitness match: 30%
- Experience match: 25%
- Available time match: 25%
- Difficulty preference match: 20%

Safety Score (simple academic rule-based model):
- Starts at 100
- Rain / adverse weather reduces the score
- Slippery or damaged trail reduces the score
- Recent hazard reports reduce the score
- Unknown trail information is shown as unknown and should be checked; it is not proof of safety

These weights and deductions are starting examples. Explain them in your project report and test them with different sample profiles. A high score is not a safety guarantee.

## 9. Common problems
- `node` is not recognized: restart VS Code after installing Node.js; if still not found, reinstall Node.js LTS and enable PATH.
- `npm install` fails: check internet, then retry.
- Port already in use: stop the old terminal with Ctrl+C, or change the port.
- Frontend cannot reach backend: ensure backend is running on port 5000 and frontend on port 5173.
- MongoDB connection error: leave MONGODB_URI blank to use demo memory mode.
- Weather unavailable: set OPENWEATHER_API_KEY in backend/.env, or use the app's route/trail demo data.

## 10. Suggested development stages
1. Run the starter app.
2. Understand the route cards and profile form.
3. Try different fitness, experience, and time values.
4. Submit a community report and observe the safety score.
5. Add your own verified fort and route data.
6. Configure MongoDB and weather API.
7. Test, take screenshots, prepare report and presentation.

## 11. Academic limitations
- Route data is sample data and must be verified/expanded.
- Compatibility and safety scores are rule-based, not trained machine-learning models.
- GPS trail navigation is not implemented as turn-by-turn navigation.
- Weather integration needs a valid API key and internet access.
- SOS sharing is not an emergency-service integration.
