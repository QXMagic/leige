

### Admin Frontend

- **Dynamic routing**: Routes are fetched from the backend after login based on user permissions. `permission.ts` handles the login guard and dynamic route injection via `addRoutesRecursively`.
- **Layout**: `src/layout/default/` — sidebar + header + main content area with multi-tab support.
- **State**: Pinia stores in `src/stores/modules/` — `user` (auth, user info, permission routes), `app` (app config), `multipleTabs`, `setting`.
- **API layer**: `src/api/` modules wrap Axios calls. The request util is at `src/utils/request/` and handles token injection, error interception, and request cancellation.
- **Global components**: `<material-picker>`, `<editor>`, `<dict-value>`, `<daterange-picker>`, `<upload>` are globally registered.

Build outputs go to `server/public/admin/` (served by ThinkPHP at `/admin/`).


## Environment Setup
`.env.development` / `.env.production` in `admin/` — sets `VITE_APP_BASE_URL` for API base URL.

## Key Conventions
- uses `<script setup lang="ts">` (Composition API). PascalCase for component names, kebab-case for filenames.

