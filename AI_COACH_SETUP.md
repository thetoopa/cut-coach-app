# 🤖 AI Coach Setup Guide

## Getting Your OpenAI API Key

The AI Coach feature uses OpenAI's GPT-3.5 Turbo model to create personalized meal plans. Here's how to set it up:

### Step 1: Create an OpenAI Account
1. Go to https://platform.openai.com
2. Click "Sign up" and create a free account
3. Verify your email

### Step 2: Get Your API Key
1. Log in to https://platform.openai.com/account/api-keys
2. Click "Create new secret key"
3. Copy the key (you'll only see it once!)

### Step 3: Add to Your App
1. Open `.env` in your project root:
```bash
EXPO_PUBLIC_OPENAI_API_KEY=sk-your-actual-key-here
```

2. Replace `sk-your-actual-key-here` with your actual key

3. **Important:** Add `.env` to `.gitignore` so you don't accidentally commit your key:
```bash
echo ".env" >> .gitignore
```

### Step 4: Restart Your App
```bash
npm start
# Then press 'r' to refresh or Ctrl+C and restart
```

## How the AI Coach Works

### The Conversation Flow
1. **User opens "AI Coach"** in the Meals tab
2. **AI asks about preferences**: foods they like, dislikes, allergies, dietary restrictions
3. **User responds naturally** (like chatting with a friend)
4. **AI asks about goals**: cutting, bulking, maintaining, etc.
5. **User shares their targets**: calories, macros, lifestyle
6. **AI generates a meal plan**: Custom meals tailored to their preferences
7. **User can save meals** directly to their meal menu

### Sample Conversation
```
AI: "Hi Cooper! 👋 I'm your AI Nutrition Coach..."
User: "I love chicken and rice, but I hate fish"
AI: "Got it! Chicken and rice are excellent for cutting..."
User: "I'm trying to cut, 1900 calories, 170g protein"
AI: "Perfect! Based on your goals, here's your meal plan..."
[Shows customized meals with macros]
User: Taps "Save to My Meals" ✅
```

## Cost Estimate

- **Free tier**: $5 in free credits (usually covers ~50-100 conversations)
- **After free credits**: ~$0.001 per conversation (very cheap!)
- **Example**: 1000 conversations = ~$1

The Expo free tier app will communicate with OpenAI, which charges per API call.

## Troubleshooting

### "API key not configured"
- Check your `.env` file exists in root directory
- Verify the key starts with `sk-`
- Make sure you restarted the app after adding the key

### "Failed to get response from AI"
- Check your internet connection
- Verify your OpenAI account has available credits
- Try a simpler message first

### "Rate limit exceeded"
- You've sent too many requests too fast
- Wait a few seconds and try again

## Privacy & Safety

- Your API key should **never** be shared or committed to git
- OpenAI stores conversations for safety/abuse prevention (30 days default)
- Your meal data is stored locally on your phone
- Meals saved from AI are stored in AsyncStorage on your device

## Customizing the AI

Want to change how the AI works? Edit the system prompt in [openaiService.ts](src/services/openaiService.ts):

```typescript
const SYSTEM_PROMPT = `You are a knowledgeable fitness nutrition coach...`;
```

You can modify this to:
- Ask different questions
- Change the meal plan format
- Add restrictions (e.g., "only suggest meals under 500 calories")
- Change the tone/personality

## What's Tracked

When you chat with AI Coach, the conversation includes:
- Your current goals (calories, protein, etc.)
- Food preferences and restrictions
- Fitness level and objectives

The AI uses this info to create **personalized** recommendations. Meals are stored only on your phone.

---

**Questions?** The AI Coach is still evolving. Feel free to experiment and let me know what works (or doesn't)!
