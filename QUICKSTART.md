# Quick Start Guide

Get the Kids Reading Recognition app running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- Python 3.9+ installed
- Azure Speech Services account (free tier available)
- OpenAI or Anthropic API key

## Step 1: Get API Keys

### Azure Speech Services (Required)

1. Visit https://portal.azure.com
2. Create a "Speech Services" resource
3. Copy your **Key** and **Region** from "Keys and Endpoint"
4. Free tier includes 5 hours/month

### OpenAI API (for quizzes)

1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Add $5-10 credits to your account

**OR** use Anthropic Claude (cheaper):
1. Visit https://console.anthropic.com
2. Create an API key

## Step 2: Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env

# Edit .env and add your keys
nano .env  # or use any text editor
```

Your `.env` should look like:

```env
AZURE_SPEECH_KEY=your_actual_key_here
AZURE_SPEECH_REGION=eastus
OPENAI_API_KEY=your_actual_key_here
WORD_MATCH_THRESHOLD=0.70
```

## Step 3: Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create environment file (optional)
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
```

## Step 4: Run the App

Open **two terminal windows**:

### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate
python main.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

## Step 5: Open the App

Open your browser and go to:
```
http://localhost:3000
```

## Testing

1. **Click on a story** (e.g., "The Forest Adventure")
2. **Click the microphone button** (grant permission if asked)
3. **Read the text aloud**
4. Watch words turn **green** as you read correctly!
5. **Complete the quiz** after reading
6. **See your results** with celebration!

## Troubleshooting

### "Module not found" error (Python)
```bash
# Make sure virtual environment is activated
source venv/bin/activate
pip install -r requirements.txt
```

### "Cannot find module" error (Node)
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Microphone not working
- Grant microphone permission in browser
- Check system microphone settings
- Use Chrome or Firefox (best support)

### WebSocket connection failed
- Make sure backend is running on port 8000
- Check firewall settings
- Verify `http://localhost:8000/health` returns `{"status":"healthy"}`

### Azure Speech API error
- Verify your AZURE_SPEECH_KEY is correct
- Check AZURE_SPEECH_REGION matches your resource
- Ensure you have quota remaining (free tier: 5 hours/month)

### Quiz not generating
- Verify OPENAI_API_KEY or ANTHROPIC_API_KEY is set
- Check API credits/quota
- App will use fallback sample questions if API fails

## Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Add your own reading texts in `frontend/app/page.tsx`
- Adjust word matching threshold in `backend/.env`
- Customize the UI in frontend components

## Cost Information

### Free Tier Usage
- Azure Speech: 5 hours/month free
- Perfect for development and testing

### Estimated Production Costs (1000 users/month)
- Azure Speech: $50-100/month
- OpenAI quizzes: $150/month
- Anthropic quizzes: $10/month (much cheaper!)
- Total: $250-300/month

## Features Overview

✅ Real-time speech recognition
✅ Lenient word matching (70% threshold)
✅ Progressive green highlighting
✅ Encouraging feedback
✅ Haptic feedback (Android)
✅ Auto-generated quizzes
✅ Kid-friendly UI
✅ Works on tablets and desktops

## Browser Support

- ✅ Chrome 88+ (recommended)
- ✅ Firefox 85+
- ✅ Edge 88+
- ⚠️ Safari 14+ (no haptic feedback)

## Getting Help

- Check the main [README.md](./README.md)
- Review error messages in browser console (F12)
- Check backend logs in terminal
- Verify all API keys are correct

## Happy Reading! 📚

The app is designed to encourage kids aged 11-13 to practice reading. The lenient matching system prioritizes recognition over perfect pronunciation, making it friendly and non-intimidating.

Enjoy! 🎉
