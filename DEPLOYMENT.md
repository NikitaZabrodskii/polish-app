# Railway Deployment Guide with Persistent Storage

## Quick Setup Instructions

### 1. Deploy to Railway

1. **Connect GitHub Repository:**

   - Go to [Railway.app](https://railway.app)
   - Click "Deploy from GitHub repo"
   - Select your repository

2. **Add Volume for Persistent Storage:**

   - In Railway dashboard, click "New"
   - Select "Volume"
   - **Mount Path**: `/app/uploads`
   - **Volume Name**: `app-data-volume`
   - Click "Deploy"

3. **Set Environment Variables:**
   ```
   JWT_SECRET=your-secret-jwt-key-here
   FRONTEND_URL=https://your-domain.com,http://localhost:5173
   NODE_ENV=production
   ```

### 2. Expected Structure

After deployment, your persistent storage will look like:

```
/app/uploads/               # Railway Volume (persistent)
├── tests.db               # SQLite database
└── audio/                 # Audio files
    ├── audiofile-123.mp3
    └── audiofile-456.wav
```

### 3. Test the Deployment

1. **Check logs** for successful initialization:

   ```
   Data Source has been initialized!
   Database location: /app/dist/../uploads/tests.db
   Audio files location: /app/dist/../uploads/audio
   ```

2. **Test API endpoints:**

   ```bash
   # Register a user
   curl -X POST https://your-app.up.railway.app/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"username": "test", "email": "test@example.com", "password": "123456"}'

   # Login
   curl -X POST https://your-app.up.railway.app/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"username": "test", "password": "123456"}'

   # Get tests (should return empty array initially)
   curl https://your-app.up.railway.app/api/tests
   ```

### 4. Verify Persistence

To confirm data persistence:

1. **Create a test** via API
2. **Redeploy** your application (push to GitHub)
3. **Check** if the test still exists after redeploy

## Important Notes

- ✅ **Database and files persist** between deployments
- ✅ **Auto-scaling** is limited to 1 replica (SQLite constraint)
- ✅ **Cost-effective** for small applications
- ⚠️ **Volume failures** are rare but possible - consider backups for critical data

## Troubleshooting

### Volume Not Mounting

- Check Mount Path is exactly `/app/uploads`
- Verify Volume is attached to your service
- Check deployment logs for directory creation messages

### Database Connection Issues

- Ensure uploads directory is created (should auto-create)
- Check file permissions in Railway logs
- Verify SQLite file exists in `/app/uploads/tests.db`

### Audio File Upload Issues

- Check `/app/uploads/audio/` directory exists
- Verify file paths in responses start with `/uploads/audio/`
- Test with small audio files first

## Migration from Development

If you have local data to migrate:

1. **Export local data** (optional):

   ```bash
   sqlite3 uploads/tests.db .dump > backup.sql
   ```

2. **Deploy** application to Railway with Volume

3. **Import data** (if needed) via API or database tools
