# Testing App with Express, TypeORM, and SQLite

A full-stack application for creating and managing different types of tests with audio support.

## Features

- Multiple test types: multiple choice, true/false, fill in blank, audio questions
- File upload support for audio files
- JWT-based authentication
- RESTful API with consistent response format
- SQLite database with TypeORM
- Persistent data storage using Railway Volume

## Project Structure

- `src/entity/Test.ts` - TypeORM entity definition
- `src/data-source.ts` - TypeORM connection configuration
- `src/service/TestService.ts` - Service layer for database operations
- `src/index.ts` - Main application entry point
- `uploads/` - Directory for persistent storage (database + audio files)
  - `tests.db` - SQLite database file
  - `audio/` - Audio files directory

## Local Development

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd testing-app
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Railway Deployment with Persistent Storage

This application is configured to use Railway's Volume feature for persistent data storage.

### Setting Up Railway Volume

1. **Create a new Railway project** from your GitHub repository

2. **Add a Volume for persistent storage:**

   - In your Railway project dashboard, click "New"
   - Select "Volume"
   - Configure the volume:
     - **Volume Name**: `app-data-volume`
     - **Mount Path**: `/app/uploads`
   - Click "Deploy"

3. **Set Environment Variables:**
   - `JWT_SECRET` - Secret key for JWT tokens
   - `FRONTEND_URL` - Your frontend domain(s), comma-separated
   - `NODE_ENV` - Set to `production`
   - `PORT` - Railway sets this automatically

### Storage Structure

With the Volume mounted at `/app/uploads`, your persistent data structure will be:

```
/app/uploads/           # Volume Mount Point (persistent)
├── tests.db           # SQLite database file
└── audio/             # Audio files directory
    ├── audiofile-123456789.mp3
    ├── audiofile-987654321.wav
    └── ...
```

### Why Volume is Required

Railway uses ephemeral containers that are recreated on each deployment. Without a Volume:

- ❌ Database and uploaded files are lost on every deploy
- ❌ User data disappears
- ❌ Audio files are not persistent

With Volume:

- ✅ Database persists between deployments
- ✅ Audio files are preserved
- ✅ All user data is safe
- ✅ Cost-effective solution for small to medium applications

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/change-password` - Change password (authenticated)

### Tests

- `GET /api/tests` - Get all tests (public)
- `GET /api/tests/:id` - Get specific test (public)
- `POST /api/tests` - Create new test (authenticated, supports file upload)
- `DELETE /api/tests/:id` - Delete test (authenticated)

### Response Format

All API responses follow this consistent format:

```json
{
  "success": boolean,
  "data": any,
  "error"?: string
}
```

## Test Types

The application supports multiple test types with flexible content structure:

- **multiple_choice** / **input-choice**: Questions with multiple answer options
- **true_false**: Boolean questions
- **fill_in_blank**: Questions with blanks to fill
- **audio_question**: Questions with audio file attachments

## File Upload

- Audio files are stored in `/app/uploads/audio/`
- Supported formats: All audio MIME types
- File size limit: 100MB
- Files are served statically via `/uploads/*` endpoint

## Database

- **Development**: SQLite database stored in `uploads/tests.db`
- **Production**: SQLite database in Railway Volume for persistence
- **ORM**: TypeORM with automatic synchronization

## Security

- JWT-based authentication
- Password hashing with bcrypt
- File type validation for uploads
- CORS configuration for cross-origin requests

## Cost Considerations

For applications with light traffic (< 5000 requests/month):

- SQLite + Volume is more cost-effective than PostgreSQL
- Railway Hobby plan ($5/month) easily handles this load
- No additional database service costs
