# Doc Sense AI Frontend

React and Vite client for Doc Sense AI, an authenticated PDF knowledge-base application. Users can upload and chat with individual documents or group multiple PDFs into projects and ask questions across the project knowledge base.

## Features

- Email/password registration, sign-in, sign-out, token refresh, password reset, and profile management
- Protected dashboard routes with responsive desktop and mobile navigation
- PDF upload with client-side type and 20 MB size validation
- Document history with ingestion status tracking
- Document-scoped chat rooms and conversation history
- Owner-scoped projects containing multiple PDF files
- Project-scoped chat across all successfully ingested files in a project
- Streaming answers over authenticated Socket.IO with REST fallback
- Dark and light themes persisted in the browser
- Request error feedback through application toasts

## Application Workflows

### Individual documents

1. Upload one PDF from **Upload**.
2. Wait for the document status to become `Success`.
3. Open the document from **Documents**.
4. Create or select a chat room and ask questions about that PDF.

### Projects

1. Create a project with a name and optional description.
2. Add PDF files one at a time to build the project knowledge base.
3. Wait until at least one file has a `Success` status.
4. Open project chat and ask questions across the successfully ingested project files.
5. Use separate chat rooms when independent conversation histories are needed.

## Tech Stack

- React 19
- Vite 8
- React Router 7
- Axios
- Socket.IO Client
- Lucide React
- Vitest, jsdom, and Testing Library
- ESLint

## Prerequisites

- Node.js `20.19+` or `22.12+`
- npm
- A running Doc Sense AI backend API

The frontend and backend are separate applications. Start the backend first so authentication, uploads, and chat are available to the UI.

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create the local environment file:

   ```bash
   cp .env.example .env
   ```

3. Configure the backend origin and REST prefix:

   ```env
   VITE_API_URL=http://localhost:8000
   VITE_PRE_FIX=/api/v1
   ```

4. Start the development server:

   ```bash
   npm run dev
   ```

Vite prints the application URL when it starts. The default is usually `http://localhost:5173`.

## Environment Variables

| Variable | Required | Description | Default in code |
| --- | --- | --- | --- |
| `VITE_API_URL` | Recommended | Backend origin used by both Axios and Socket.IO | `http://localhost:8000` |
| `VITE_PRE_FIX` | Recommended | REST API prefix appended to `VITE_API_URL` | `/api/v1` |

The REST base URL is built in `src/services/api.js` as:

```text
VITE_API_URL + VITE_PRE_FIX
```

Do not include `/api/v1` in both variables. Socket.IO connects directly to `VITE_API_URL` at `/socket.io`.

Vite embeds environment values at build time. Set production values before running `npm run build`.

## Routes

| Route | Access | Purpose |
| --- | --- | --- |
| `/login` | Public | Sign in |
| `/register` | Public | Create an account |
| `/forgot-password` | Public | Submit a password-reset request |
| `/reset-password` | Public | Set a new password using the reset token |
| `/` | Protected | Dashboard overview |
| `/upload` | Protected | Upload an individual PDF |
| `/documents` | Protected | Browse uploaded documents and processing states |
| `/documents/:id/chat` | Protected | Chat with one document |
| `/projects` | Protected | List and create projects |
| `/projects/:projectId` | Protected | View a project and upload project files |
| `/projects/:projectId/chat` | Protected | Chat across a project knowledge base |
| `/profile` | Protected | Update profile details and password |

Unknown paths redirect to `/`.

## Backend Integration

### REST API

`src/services/api.js` owns the shared Axios client. It:

- adds `Authorization: Bearer <access_token>` to authenticated requests;
- refreshes an expired access token through `POST /api/v1/token/generate-access-token`;
- queues concurrent requests while a refresh is in progress; and
- clears the local session when refresh fails.

The app integrates with these backend route families:

| Backend prefix | Frontend use |
| --- | --- |
| `/api/v1/user` | Authentication, password, and profile operations |
| `/api/v1/token` | Access-token verification and refresh |
| `/api/v1/dashboard` | Individual PDF upload and document history |
| `/api/v1/chat` | Document chat rooms, history, and REST question fallback |
| `/api/v1/projects` | Projects, project files, project rooms, and project question fallback |

### Socket.IO

`src/hooks/useSocket.js` opens an authenticated connection to `/socket.io`. The access token is sent in the Socket.IO auth payload and connection headers.

The client emits `ask_question` with a question, chat-room ID, request ID, and exactly one scope identifier:

- `file_id` for document chat; or
- `project_id` for project chat.

It listens for:

- `connected`
- `chat_message_created`
- `question_response_start`
- `question_response_chunk`
- `question_response_end`
- `question_response`
- `error`
- `channel_joined`
- `channel_left`

The final `question_response` event completes request tracking. If the socket is unavailable, document and project chat pages can use their corresponding REST question endpoint.

## Authentication and Browser Storage

The application stores these values in `localStorage`:

- `access_token`
- `refresh_token`
- `user`
- `theme`
- `sidebarState`

On application load, the auth provider verifies the saved access token and reloads the user profile. Protected routes redirect unauthenticated users to `/login`.

## Project Structure

```text
src/
  components/
    layout/          Protected route and sidebar components
    ui/              Shared loading components
  context/           Authentication and toast providers
  hooks/             Responsive and Socket.IO hooks
  pages/
    auth/             Sign-in, registration, and password pages
    dashboard/        Home, upload, and document list pages
    document/         Single-document chat
    profile/          User profile and password management
    projects/         Project list, detail, and project chat
  services/          Axios client and project API functions
  test/              Vitest setup and component/hook tests
  App.jsx             Routes and authenticated layout
  main.jsx            React entry point
```

## Available Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server with hot reload |
| `npm run build` | Create an optimized production build in `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run test` | Start Vitest in watch mode |
| `npm run test -- --run` | Run the test suite once |
| `npm run lint` | Run ESLint across the repository |

Recommended validation before opening a pull request:

```bash
npm run test -- --run
npm run build
npm run lint
```

## Production Build

```bash
npm run build
npm run preview
```

Deploy the generated `dist/` directory to a static host. Configure the host to serve `index.html` for client-side routes such as `/projects/:projectId` and `/documents/:id/chat`.

## Troubleshooting

### API requests fail or use the wrong URL

Check `VITE_API_URL` and `VITE_PRE_FIX`, then restart Vite. Environment changes are not applied to an already running development server.

### Socket.IO does not connect

- Confirm the backend was started with `uvicorn main:socket_app --reload`, not `main:app`.
- Confirm `VITE_API_URL` points to the backend origin without `/api/v1`.
- Sign in again if the saved access token has expired.
- Check the backend `SOCKETIO_CORS_ORIGINS` setting.

### A document or project cannot be opened for chat

Chat is enabled only after ingestion produces a `Success` status. Check the backend logs, Hugging Face token, uploaded file path, and Chroma vector store if a file remains `Ingested` or becomes `Failed`.

### Deep links return 404 after deployment

Configure the static server with a single-page application fallback so unknown paths serve `index.html`.
