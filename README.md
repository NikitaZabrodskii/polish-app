# Testing App API

A RESTful API built with Express.js, TypeORM, and SQLite to manage tests with titles, text content, answers, and optional audio files.

## Features

- Create tests with text content, answers, and optional audio files
- Get a list of all tests (titles only)
- Get detailed information for a specific test
- Delete tests
- Uses TypeORM for database operations

## Setup

1. Install dependencies:

```bash
npm install
```

2. Build the TypeScript code:

```bash
npm run build
```

3. Start the server:

```bash
npm start
```

For development with hot-reloading:

```bash
npm run dev
```

## API Endpoints

### 1. Create a Test

- **URL**: `/api/tests`
- **Method**: `POST`
- **Content-Type**: `multipart/form-data`
- **Request Body**:
  - `title` (string, required): The title of the test
  - `text` (string, required): The text content of the test
  - `answers` (array, required): Array of possible answers
  - `audiofile` (file, optional): Audio file for the test

#### Example Request:

Using curl:

```bash
curl -X POST http://localhost:3000/api/tests \
  -F "title=English Test" \
  -F "text=What is the capital of England?" \
  -F "answers=[\"London\", \"Manchester\", \"Liverpool\"]" \
  -F "audiofile=@/path/to/audio.mp3"
```

### 2. Delete a Test

- **URL**: `/api/tests/:id`
- **Method**: `DELETE`
- **URL Params**: `id` (number, required): The ID of the test to delete

#### Example Request:

```bash
curl -X DELETE http://localhost:3000/api/tests/1
```

### 3. Get All Tests (Titles Only)

- **URL**: `/api/tests`
- **Method**: `GET`

#### Example Request:

```bash
curl http://localhost:3000/api/tests
```

### 4. Get Test by ID

- **URL**: `/api/tests/:id`
- **Method**: `GET`
- **URL Params**: `id` (number, required): The ID of the test to retrieve

#### Example Request:

```bash
curl http://localhost:3000/api/tests/1
```

## Database Schema

The application uses SQLite with TypeORM. The schema is defined using the following entity:

```typescript
@Entity()
export class Test {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  text: string;

  @Column({
    type: "simple-json",
  })
  answers: string[];

  @Column({ nullable: true })
  audiofile: string;
}
```

## File Structure

- `src/index.ts` - Main application entry point
- `src/entity/Test.ts` - TypeORM entity definition
- `src/data-source.ts` - TypeORM connection configuration
- `src/service/TestService.ts` - Service layer for database operations
- `uploads/` - Directory for uploaded audio files
- `dist/` - Compiled JavaScript code
