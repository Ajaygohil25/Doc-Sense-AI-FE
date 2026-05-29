# Doc Sense AI Frontend

React frontend for Doc Sense AI, built with Vite. The app provides authentication, protected dashboard routes, document views, profile management, API integration, and real-time communication with the backend through Socket.IO.

## Tech Stack

- React 19
- Vite 8
- React Router
- Axios
- Socket.IO Client
- Vitest and Testing Library
- ESLint

## Prerequisites

- Node.js 20 or newer
- npm
- Running Doc Sense AI backend API

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Update `.env` with your backend URL:

```env
VITE_API_URL=http://localhost:8000
VITE_PRE_FIX=/api/v1
```

Start the development server:

```bash
npm run dev
```

The app will be available at the local URL printed by Vite, usually `http://localhost:5173`.

## Available Scripts

```bash
npm run dev
```

Starts the Vite development server with hot module replacement.

```bash
npm run build
```

Creates a production build in `dist/`.

```bash
npm run preview
```

Serves the production build locally for verification.

```bash
npm run lint
```

Runs ESLint across the project.

```bash
npm run test
```

Runs the Vitest test suite.

## Environment Variables

| Variable | Description | Example |
| --- | --- | --- |
| `VITE_API_URL` | Backend API origin without the API prefix | `http://localhost:8000` |
| `VITE_PRE_FIX` | API route prefix appended to `VITE_API_URL` | `/api/v1` |

API requests are configured in `src/services/api.js`. The final base URL is built as:

```js
`${VITE_API_URL}${VITE_PRE_FIX}`
```

## Project Structure

```text
src/
  components/       Shared UI and layout components
  context/          Auth and toast providers
  hooks/            Reusable React hooks
  pages/            Route-level app screens
  services/         API client configuration
  test/             Vitest setup and tests
```

## Backend Integration

The frontend expects the backend to expose REST endpoints under `VITE_PRE_FIX` and Socket.IO on the same backend origin. See `docs/FRONTEND_INTEGRATION_GUIDE.md` for endpoint details, response shapes, and real-time event notes.

Authentication tokens are stored in `localStorage`. The Axios client automatically attaches the access token and attempts token refresh on eligible `401` responses.

## Production Build

Build the app:

```bash
npm run build
```

Deploy the generated `dist/` directory to your static hosting provider. Make sure production environment variables point to the deployed backend API before building.
