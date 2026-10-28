# Leave Planner & Approval Tracker

A single-page prototype for a small team to request leave, see it on a shared calendar, and approve or reject it. Plain HTML, CSS and JavaScript with no build step.

## Screens
- **Review & calendar** (team lead): month calendar showing each person's leave as a bar (name · leave type · days). Click a bar to approve, reject or reopen. Amber days flag 2+ people off. A review queue sits beside it with overlap warnings and one-click decisions.
- **Request leave**: applicant and application date fill in automatically; choose Annual, Sick, Family care or Childcare leave and the dates. Duration counts calendar days including weekends.
- **My status & updates**: each request's status (Pending / Approved / Rejected) plus a notifications feed.

## Prototype limits
- No login: the "Viewing as" selector stands in for identity (Maya Lim is the team lead).
- Fictional sample data lives in memory and resets on refresh.
- Public holidays and leave balances are not handled.
- Only sick leave can be backdated (up to 30 days).

## Files
- `index.html`: page markup
- `styles.css`: styles (light and dark themes)
- `app.js`: data, rendering and interactions
- `vercel.json`: static hosting config for Vercel

## Run locally
Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

## Deploy to Vercel
Import this repository in Vercel. Use the **Other** framework preset, leave the build command empty, and keep the output directory as the repository root. Every push to `main` redeploys.
