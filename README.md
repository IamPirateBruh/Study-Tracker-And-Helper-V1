# A/L StudyTrack — Sri Lanka

A modern single-page study management website for Sri Lankan A/L students.

## Included
- Dashboard with daily study time, task completion, subject progress and exam countdown
- Tasks & assignment manager with priorities, due dates, subject filters and completion tracking
- Weekly timetable builder with editable study sessions
- Subject tracker for syllabus completion and confidence
- Focus timer with session and minute logging
- 7-day analytics
- Student settings and JSON data export
- Light / dark theme
- Responsive mobile layout
- Local browser storage; no backend required

## Run
Open `index.html` directly in a browser, or serve the folder with any static web server.

Example:
```bash
python -m http.server 8000
```
Then open `http://localhost:8000`.

## Data
All app data is stored in `localStorage` under:
`alStudyTrack.v1`

This is intentionally frontend-only so the website can work without a server.
