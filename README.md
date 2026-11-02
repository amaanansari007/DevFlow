# DevFlow — Project & Task Management Workspace

DevFlow is a full-stack project and task management application. It provides a workspace to organise projects, manage tasks, track progress, and view a quick summary of work.

## Features

- **User accounts:** Register, log in, check the current session, and log out.
- **Project management:** Create, view, edit, and delete projects.
- **Task management:** Create, view, edit, and delete tasks.
- **Task workflow:** Track tasks through **To do**, **In progress**, and **Done**.
- **Task details:** Set a task's project, priority, and due date.
- **Dashboard:** View task totals, in-progress work, completed tasks, completion rate, and project progress.
- **Search and filtering:** Find tasks and filter them by status.
- **Workspace preferences:** Switch between light and dark themes.
- **Persistent storage:** Store application data in PostgreSQL.

## Tech stack

| Area | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| UI icons | Lucide React |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| API communication | Fetch API |
| Authentication support | Express middleware and cookie-based requests |

## Project structure

```text
devflow/
├── backend/
│   ├── auth.js
│   ├── db.js
│   ├── server.js
│   └── package.json
├── src/
│   ├── App.tsx
│   ├── App.css
│   └── api.ts
├── public/
├── package.json
└── README.md
```

## Run locally

### Prerequisites

- Node.js and npm
- PostgreSQL database
- The backend environment file configured with the database and authentication settings used by `backend/db.js` and `backend/auth.js`

### 1. Clone the repository

```bash
git clone <your-github-repository-url>
cd devflow
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Configure the backend

Create or update `backend/.env` with the environment variables required by your backend database and authentication files.

The API server reads these settings:

```env
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Add your PostgreSQL connection and authentication secrets using the exact variable names expected by `backend/db.js` and `backend/auth.js`. Do not commit `.env` files or share their values publicly.

### 4. Start the backend

Open a terminal:

```bash
cd backend
npm install
npm run dev
```

The API server uses port `5000` by default.

### 5. Configure and start the frontend

In the project root, create a `.env` file:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Then start Vite in a second terminal:

```bash
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Production build

From the project root:

```bash
npm run build
```

Vite creates the production frontend files in the `dist/` folder.

## API overview

The backend exposes these main route groups:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/auth/me` | Check the signed-in user |
| POST | `/api/auth/register` | Register an account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/logout` | Sign out |
| GET | `/api/tasks` | List the signed-in user's tasks |
| POST | `/api/tasks` | Create a task |
| PATCH | `/api/tasks/:id` | Update a task |
| DELETE | `/api/tasks/:id` | Delete a task |
| GET | `/api/projects` | List the signed-in user's projects |
| POST | `/api/projects` | Create a project |
| PATCH | `/api/projects/:id` | Update a project |
| DELETE | `/api/projects/:id` | Delete a project |
| GET | `/api/db-test` | Check the PostgreSQL connection |

Task and project routes require an authenticated user. The backend uses credentialed CORS requests, so the deployed frontend origin must be configured correctly in `FRONTEND_URL`.

## Deployment notes

Before deploying:

1. Deploy the backend and PostgreSQL database.
2. Configure the backend's database/authentication environment variables on the hosting provider.
3. Set the backend `FRONTEND_URL` to the exact deployed frontend origin.
4. Set the frontend `VITE_API_BASE_URL` to the deployed backend API base URL, ending in `/api`.
5. Check the authentication cookie settings in `backend/auth.js` for secure cross-site HTTPS deployment.
6. Keep all `.env` files, database URLs, passwords, and signing secrets out of Git.

Vite environment variables are embedded during the frontend build. Set `VITE_API_BASE_URL` in the frontend hosting settings before triggering a production build.

## Security

- Never commit `.env` files, database credentials, passwords, or authentication secrets.
- Keep the frontend and backend environment variables configured in the hosting provider's private settings.
- Do not put private database credentials in frontend variables. Variables prefixed with `VITE_` are exposed to the browser.

## Screenshots

Add screenshots of the dashboard, project view, task details, and light/dark themes here:

```text
Add screenshots to a `screenshots/` folder and link them in this section.
```

## Project status

DevFlow's core project and task management flows have been implemented and tested locally. Deployment and public demo details should be added here after they are verified.

## Author

**Amaan Ansari**

GitHub profile - https://github.com/amaanansari007
