# 🚀 Real-Time Chat App

A modern, real-time chat application built with **Node.js + TypeScript + Prisma** (backend) and **Next.js** (frontend). Features include real-time messaging, group chats, typing indicators, read receipts, and a beautiful modern UI.

## 🏗️ Architecture

### Backend (Node.js + TypeScript)
- **Express** - Fast, minimalist web framework
- **Prisma** - Modern database ORM with type safety
- **PostgreSQL** - Persistent data storage
- **Redis** - Real-time pub/sub messaging and caching
- **Socket.io** - Real-time WebSocket communication
- **JWT** - Authentication
- **bcrypt** - Password hashing

### Frontend (Next.js)
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety
- **shadcn/ui** - Beautiful UI components
- **Tailwind CSS** - Styling
- **React Query** - Server state management
- **WebSocket Client** - Real-time updates

## 🚀 Quick Start

### Prerequisites

- **Node.js** (18+) with npm
- **PostgreSQL** (12+) 
- **Redis** (6+)

### 1. Database Setup

**PostgreSQL:**
```bash
# Create database
createdb chat_app

# Or using psql
psql -c "CREATE DATABASE chat_app;"
```

**Redis:**
```bash
# Start Redis server (varies by OS)
redis-server
# or
brew services start redis  # macOS
sudo systemctl start redis # Linux
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL=postgresql://username:password@localhost:5432/chat_app
# REDIS_URL=redis://localhost:6379
# JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Generate Prisma client
npm run db:generate

# Push database schema (creates tables)
npm run db:push

# Seed database with sample data
npm run db:seed

# Start development server
npm run dev
```

The backend will start on `http://localhost:8000`

### 3. Frontend Setup

```bash
cd frontend

# Copy environment file
cp .env.local.example .env.local

# Install dependencies
npm install

# Start development server
npm run dev
```

The frontend will start on `http://localhost:3000`

## 📱 Features

### ✅ Implemented Features

- **User Authentication**
  - Registration with email/username/password
  - Login with JWT tokens
  - Secure password hashing with Argon2

- **Real-Time Chat**
  - WebSocket connections for instant messaging
  - Group chats and direct messages
  - Message history with PostgreSQL storage
  - Redis pub/sub for multi-instance scaling

- **Modern UI**
  - Responsive design with Tailwind CSS
  - Beautiful shadcn/ui components
  - Dark/light mode support
  - Mobile-friendly interface

- **Chat Features**
  - Typing indicators
  - Read receipts
  - Online/offline status
  - Message timestamps
  - Infinite scroll for message history

### 🚧 Future Enhancements

- File sharing and image uploads
- Message reactions and emoji support
- Voice and video calls
- Message search functionality
- Push notifications
- User profiles and settings
- Admin panel for group management
- Message encryption

## 🔧 Development

### Backend Development

```bash
cd backend

# Run with auto-reload
cargo install cargo-watch
cargo watch -x run

# Run tests
cargo test

# Check code format
cargo fmt --check

# Run linter
cargo clippy
```

### Frontend Development

```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

## 📊 Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `email` (Unique)
- `username` (Unique)
- `password_hash` (Argon2)
- `avatar_url` (Optional)
- `is_online` (Boolean)
- `last_seen` (Timestamp)

### Chats Table
- `id` (UUID, Primary Key)
- `name` (Optional, for groups)
- `description` (Optional)
- `chat_type` (Enum: direct/group)
- `created_by` (User ID)

### Messages Table
- `id` (UUID, Primary Key)
- `chat_id` (Foreign Key)
- `sender_id` (Foreign Key)
- `content` (Text)
- `message_type` (Enum: text/image/file/system)
- `reply_to_id` (Optional, for replies)
- `created_at` (Timestamp)

### Chat Members Table
- `chat_id` + `user_id` (Composite Key)
- `role` (Enum: admin/member)
- `joined_at` (Timestamp)
- `last_read_at` (Optional, for read receipts)

## 🔗 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user info

### Chats
- `GET /api/chats` - Get user's chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:id` - Get specific chat
- `GET /api/chats/:id/messages` - Get chat messages
- `POST /api/chats/:id/messages` - Send message

### WebSocket
- `GET /ws` - WebSocket connection for real-time updates

## 🚀 Deployment

### Backend Deployment

1. **Build for production:**
   ```bash
   cargo build --release
   ```

2. **Set environment variables:**
   ```bash
   export DATABASE_URL="postgresql://user:pass@host:port/db"
   export REDIS_URL="redis://host:port"
   export JWT_SECRET="your-secret-key"
   export PORT=8000
   ```

3. **Run migrations:**
   ```bash
   ./target/release/chat-backend
   ```

### Frontend Deployment

1. **Build for production:**
   ```bash
   npm run build
   ```

2. **Set environment variables:**
   ```bash
   export NEXT_PUBLIC_API_URL="https://your-api-domain.com"
   export NEXT_PUBLIC_WS_URL="wss://your-api-domain.com"
   ```

3. **Start production server:**
   ```bash
   npm start
   ```

### Docker Deployment (Coming Soon)

Docker configurations will be added for easy deployment.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 🆘 Troubleshooting

### Common Issues

1. **Database connection issues:**
   - Ensure PostgreSQL is running
   - Check DATABASE_URL format
   - Verify database exists

2. **Redis connection issues:**
   - Ensure Redis server is running
   - Check REDIS_URL format

3. **WebSocket connection issues:**
   - Check CORS settings
   - Verify WebSocket URL format
   - Ensure backend is running

4. **Frontend build issues:**
   - Clear `.next` folder
   - Delete `node_modules` and reinstall
   - Check Node.js version

### Performance Tips

1. **Database:**
   - Use connection pooling
   - Add database indexes for frequently queried fields
   - Consider read replicas for scaling

2. **Redis:**
   - Configure memory limits
   - Use Redis clustering for high availability

3. **Frontend:**
   - Enable Next.js production optimizations
   - Use CDN for static assets
   - Implement service workers for offline support

## 📞 Support

For questions and support, please open an issue on GitHub or contact the development team.

---

**Built with ❤️ using Rust and Next.js**


# Last updated: Fri, Sep  5, 2025  9:49:49 PM

# Last updated: Fri, Sep  5, 2025  9:49:51 PM


# Last updated: Fri, Sep  5, 2025  9:49:54 PM

# Last updated: Fri, Sep  5, 2025  9:49:58 PM


# Last updated: Fri, Sep  5, 2025  9:50:01 PM


# Last updated: Fri, Sep  5, 2025  9:50:04 PM

# Last updated: Fri, Sep  5, 2025  9:50:05 PM



# Last updated: 2025-08-08

# Last updated: 2025-08-12


# Last updated: 2025-08-13

# Last updated: 2025-08-20


