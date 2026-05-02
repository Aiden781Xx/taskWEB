# TaskFlow — Team Task Manager
# Role base access control -admin, user

A full-stack MERN application for team task management with role-based access control.

## Features

- 🔐 **Authentication** — Signup/Login with JWT
- 📁 **Projects** — Create, edit, delete projects with team members
- ✅ **Tasks** — Create, assign, track tasks with Kanban board
- 📊 **Dashboard** — Stats, overdue alerts, status breakdowns
- 👥 **Team Management** — Add/remove members, role-based permissions
- 🛡️ **RBAC** — Admin/Member roles with granular permissions

## Tech Stack

- **Frontend:** React 18, Vite, React Router v6, Axios
- **Backend:** Node.js, Express.js, MongoDB, Mongoose
- **Auth:** JWT, bcryptjs

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB running locally (or Atlas URI)

### Installation

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Running

```bash
# Terminal 1 — Start backend
cd server
npm run dev

# Terminal 2 — Start frontend
cd client
npm run dev
```

- Backend: http://localhost:5000
- Frontend: http://localhost:5173

## Deployment: Render + Netlify

### Backend on Render

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Health check path: `/api/health`

Set these Render environment variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/team-task-manager
JWT_SECRET=use_a_long_random_secret
JWT_EXPIRES_IN=7d
CLIENT_URL=https://your-netlify-site.netlify.app
ADMIN_REGISTRATION_KEY=private_admin_signup_key
ADMIN_NAME=Admin
ADMIN_EMAIL=admin@ethara.ai
ADMIN_PASSWORD=use_a_strong_password
```

After Render deploys, run the admin seeder from Render shell or locally with the production `MONGODB_URI`:

```bash
cd server
npm run seed
```

### Frontend on Netlify

- Base directory: `client`
- Build command: `npm run build`
- Publish directory: `client/dist`

Set this Netlify environment variable:

```
VITE_API_URL=https://your-render-backend.onrender.com
```

The frontend includes `public/_redirects` so refreshes on routes like `/admin` and `/dashboard` work on Netlify.

### Admin Accounts

The first user can register as admin. After that, public admin registration requires `ADMIN_REGISTRATION_KEY`; otherwise an existing admin should promote users from the Admin Panel.

### Environment Variables

Create `server/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/team-task-manager
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/register | Register user |
| POST | /api/auth/login | Login user |
| GET | /api/auth/me | Get profile |
| GET/POST | /api/projects | List/Create projects |
| GET/PUT/DELETE | /api/projects/:id | Project CRUD |
| POST/DELETE | /api/projects/:id/members | Manage members |
| GET/POST | /api/tasks | List/Create tasks |
| GET/PUT/DELETE | /api/tasks/:id | Task CRUD |
| PATCH | /api/tasks/:id/status | Update status |
| GET | /api/tasks/dashboard/stats | Dashboard stats |
| GET | /api/users | Search users |

## Roles

- **Admin** — Full access (first user auto-admin)
- **Member** — View projects, update own tasks
"# taskWEB" 
