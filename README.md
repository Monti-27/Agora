# Agora - Real-Time Chat Application

A simple, modern chat app where people can have real-time conversations. Built this using Node.js for the backend and Next.js for the frontend because they work well together and make development pretty straightforward.

## What's This All About

This is a real-time messaging app that lets people create accounts, join chats, and send messages instantly. Think of it like a basic version of Discord or Slack, but way simpler. You can create group chats, send direct messages, and see when people are typing.

## Tech Stack (What We Used)

**Backend:**
- Node.js with TypeScript - because JavaScript is everywhere and TypeScript catches those annoying bugs
- Express - simple web server that just works
- Prisma - makes database stuff less painful 
- PostgreSQL - solid database that handles everything we throw at it
- Redis - helps with real-time messaging and keeping things fast
- Socket.io - handles all the real-time connection stuff
- JWT tokens - keeps user authentication simple
- bcrypt - makes sure passwords stay secure

**Frontend:**
- Next.js 14 - React framework that handles routing and makes deployment easier
- TypeScript - same as backend, helps catch mistakes
- Tailwind CSS - utility-first CSS that speeds up styling
- shadcn/ui - pre-built components that look good out of the box
- React Query - handles server data fetching and caching
- Socket.io client - connects to backend for real-time updates

## Project Structure

```
├── backend/                  # Node.js API server
│   ├── src/
│   │   ├── controllers/      # Handle API requests
│   │   ├── middleware/       # Authentication, validation, etc.
│   │   ├── routes/           # API route definitions
│   │   ├── services/         # Database, Redis, Socket.io logic
│   │   ├── types/            # TypeScript type definitions
│   │   └── utils/            # Helper functions
│   ├── prisma/
│   │   └── schema.prisma     # Database schema definition
│   └── package.json
│
├── frontend/                 # Next.js web app
│   ├── src/
│   │   ├── app/              # Next.js app router pages
│   │   ├── components/       # Reusable UI components
│   │   ├── lib/              # Utility functions and API calls
│   │   ├── providers/        # React context providers
│   │   └── types/            # TypeScript types
│   └── package.json
│
└── docker-compose.yml        # Local development setup
```

## Getting Started Locally

### What You Need First

- Node.js (version 18 or newer)
- PostgreSQL (version 12 or newer)
- Redis (version 6 or newer)
- npm or yarn (comes with Node.js)

### Setting Up The Database

**PostgreSQL:**
Install PostgreSQL on your machine, then create a database:
```bash
createdb agora_chat
```

**Redis:**
Start Redis server (this varies by your operating system):
```bash
# On macOS with Homebrew
brew services start redis

# On Linux
sudo systemctl start redis

# Or just run it directly
redis-server
```

### Backend Setup

1. Navigate to backend folder:
```bash
cd backend
```

2. Install all the dependencies:
```bash
npm install
```

3. Copy the environment file and edit it:
```bash
cp .env.example .env
```

4. Open the `.env` file and update with your database details:
```
DATABASE_URL="postgresql://your_username:your_password@localhost:5432/agora_chat"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="put-some-random-secret-key-here"
PORT=8000
```

5. Set up the database:
```bash
# Generate Prisma client
npm run db:generate

# Create database tables
npm run db:push

# Add some test data (optional)
npm run db:seed
```

6. Start the backend server:
```bash
npm run dev
```

Your backend should now be running on `http://localhost:8000`

### Frontend Setup

1. Open a new terminal and go to frontend folder:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

4. Update `.env.local` with your backend URL:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

5. Start the frontend:
```bash
npm run dev
```

Now open `http://localhost:3000` in your browser and you should see the app running.

## What Actually Works

**User Stuff:**
- People can create accounts with email/username/password
- Login system that remembers you (using JWT tokens)
- Secure password storage (properly hashed)

**Chat Features:**
- Real-time messaging (no need to refresh the page)
- Group chats and direct messages
- See when someone is typing
- Message history that loads as you scroll up
- Shows who's online and when they were last seen

**Interface:**
- Works on desktop and mobile
- Dark and light mode toggle
- Clean, modern design
- Fast loading and responsive

## What's Still Missing (Future Ideas)

- File sharing and image uploads
- Message reactions and emojis
- Voice/video calls
- Search through message history
- Push notifications
- User profile customization
- Better admin controls for group chats
- Message encryption for privacy

## API Endpoints (For Developers)

**Authentication:**
- `POST /api/auth/register` - Create new account
- `POST /api/auth/login` - Sign in
- `GET /api/auth/me` - Get current user info

**Chats:**
- `GET /api/chats` - Get all user's chats
- `POST /api/chats` - Create new chat room
- `GET /api/chats/:id` - Get specific chat details
- `GET /api/chats/:id/messages` - Load chat messages
- `POST /api/chats/:id/messages` - Send new message

**Real-time:**
- `GET /ws` - WebSocket connection for live updates

## Database Structure

**Users Table:**
- Basic info (email, username, password)
- Profile stuff (avatar, online status, last seen)

**Chats Table:**
- Chat details (name, description, type)
- Who created it and when

**Messages Table:**
- Message content and metadata
- Links to chat and sender
- Support for different message types
- Reply threading support

**Chat Members:**
- Who's in which chat
- User roles (admin, member)
- Read receipt tracking

## Development Commands

**Backend:**
```bash
cd backend

# Start development server with auto-reload
npm run dev

# Run database migrations
npm run db:push

# Reset database (careful!)
npm run db:reset

# Generate Prisma client after schema changes
npm run db:generate
```

**Frontend:**
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm start

# Check for TypeScript errors
npm run type-check

# Check code style
npm run lint
```

## Deploying This Thing

**Backend Deployment:**
1. Build the project: `npm run build`
2. Set up your production environment variables
3. Run database migrations on your production database
4. Start with: `npm start`

**Frontend Deployment:**
1. Build: `npm run build`
2. Set your production API URLs in environment variables
3. Deploy to Vercel, Netlify, or any static hosting

**Docker (If You Prefer):**
There's a `docker-compose.yml` file included for local development. Just run:
```bash
docker-compose up
```

## Contributing

If you want to help improve this project:

1. Fork the repo on GitHub
2. Create a new branch for your feature
3. Make your changes and test them
4. Submit a pull request with a clear description

Keep it simple and make sure your code follows the existing style.

## License

MIT License - feel free to use this code for whatever you want.

## Thanks
MADE BY MONTI SAINI
