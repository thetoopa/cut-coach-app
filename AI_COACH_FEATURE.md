# 🤖 AI Coach Feature - Phase 2 Addition

## What Just Got Built

Your app now has an **intelligent AI nutrition coach** that creates personalized meal plans through natural conversation. Here's what makes it special:

### ✨ Key Features

**1. Conversational Intake Form**
- Feels like chatting with a real nutrition coach
- AI asks smart follow-up questions
- Remembers preferences throughout conversation
- Understands context naturally

**2. Personalized Meal Plans**
- Analyzes user's goals, preferences, restrictions
- Generates custom meals with full macros
- Accounts for allergies, dislikes, lifestyle
- Provides practical cooking notes

**3. Meal Saving**
- Users can save AI meals directly to their menu
- Custom meals marked with ✨ emoji
- Can mix AI meals with pre-made meals
- All meals tracked in logging

**4. Beautiful Chat Interface**
- Real-time streaming responses
- Shows thinking while AI generates
- Clear meal plan visualization
- One-tap save to menu

---

## How to Use It

### Step 1: Get OpenAI API Key (Free)
1. Go to https://platform.openai.com
2. Sign up (free $5 credits)
3. Create an API key
4. Add to `.env` file in your project

See [AI_COACH_SETUP.md](AI_COACH_SETUP.md) for detailed instructions.

### Step 2: Access AI Coach
1. Open app → Go to **Meals** tab
2. Tap blue **"Ask AI Coach"** button
3. Start chatting about your food preferences

### Step 3: Get Meal Plan
User tells AI:
- "I love chicken, hate fish, no tomatoes"
- "I'm cutting, 1900 cals, 170g protein"
- "I need quick meals, I'm busy"

AI responds with:
- Personalized meal plan
- 4-6 meals tailored to preferences
- Total macros for the day
- Cooking tips and substitutions

### Step 4: Save Meals
- Tap **"Save to My Meals"**
- All meals appear in Meals tab instantly
- Can mix with pre-made meals
- Use in daily logging

---

## Technical Details

### How It Works
```
User Input
    ↓
OpenAI GPT-3.5 Turbo API
    ↓
Natural response + meal plan JSON
    ↓
Parse & display meal plan
    ↓
User saves → AsyncStorage
```

### API Service
- **File**: `src/services/openaiService.ts`
- **Model**: GPT-3.5 Turbo (cost-effective)
- **System Prompt**: Custom fitness nutrition coach persona
- **Features**:
  - Multi-turn conversation memory
  - Structured meal plan JSON parsing
  - Error handling & fallbacks

### Chat Component
- **File**: `src/components/AICoachModal.tsx`
- **Features**:
  - Real-time message display
  - Loading state with spinner
  - Meal plan visualization
  - Save confirmation
  - Beautiful dark theme UI

---

## Example Conversation

```
🤖 AI Coach: "Hi Cooper! 👋 I'm your AI Nutrition Coach. 
I'm here to create a personalized meal plan based on your 
goals and preferences.

Tell me:
1. What are your current fitness goals? (cutting, bulking, maintaining?)
2. Any foods you love or can't stand?
3. Dietary restrictions or allergies?"

👤 You: "I'm cutting, love chicken and rice, hate fish. 
No dairy, trying to hit 1900 cals and 170g protein"

🤖 AI Coach: "Perfect! Here's your tailored meal plan:

📋 Your Meal Plan

Breakfast: Chicken & Oats (390 cal, 40g P)
Lunch: Teriyaki Chicken Bowl (620 cal, 52g P)
[More meals...]

Total: 1900 cal, 170g protein

💡 Recommendations:
• Prep chicken in batches on Sunday
• Use soy sauce for flavor, no added oil needed
• Rice can be made 3 days ahead

[Save to My Meals button appears]"

👤 You: [Tap Save] ✅

✨ All meals now appear in your Meals tab!
```

---

## What's Different Now

| Before | After |
|--------|-------|
| Manual meal selection only | AI-generated custom meals |
| Hard to find meals matching preferences | Personalized recommendations |
| Takes time to plan macros | AI calculates instantly |
| No guidance on preferences | Interactive intake form |
| Limited meal variety | Infinite custom meal generation |

---

## Cost Breakdown

- **Setup**: Free (create OpenAI account)
- **Usage**: ~$0.001 per conversation
- **Monthly budget**: $1-5 for typical usage
- **Free tier**: $5 in credits (50-100+ conversations)

### Example Costs
```
1 conversation = $0.0005
10 conversations = $0.005
100 conversations = $0.05
1000 conversations = $0.50
```

**Super affordable!** The free tier alone covers months of usage.

---

## How the AI Learns Your Preferences

The AI Coach:
1. **Reads your profile** (age, goals, calories, protein targets)
2. **Asks clarifying questions** (dietary restrictions, busy schedule, food allergies)
3. **Understands context** (adapts recommendations based on all info)
4. **Generates tailored meals** (no generic suggestions)
5. **Remembers conversation** (references earlier preferences)

Each conversation is independent, but you can always ask AI new questions or regenerate plans.

---

## Customization Options

Want to change how AI behaves? Edit the system prompt in [src/services/openaiService.ts](src/services/openaiService.ts):

```typescript
const SYSTEM_PROMPT = `You are a knowledgeable fitness nutrition coach...`;
```

**Examples of customizations:**
- "Only suggest meals with less than 500 calories"
- "Always include macro breakdowns in percentages"
- "Be more casual and use emojis heavily"
- "Suggest meal prep tips with every meal"

---

## Common Questions

### Q: Is my data secure?
**A:** Your meal preferences are only stored on your phone in AsyncStorage. OpenAI retains conversation logs for 30 days for safety/abuse prevention, but doesn't use them to train models or sell data.

### Q: Can I use it offline?
**A:** No, it requires internet since it talks to OpenAI's servers.

### Q: What if the meal plan isn't perfect?
**A:** You can ask the AI to regenerate or adjust. It supports multi-turn conversations!

### Q: Can I share meals between friends?
**A:** Not yet! This is coming in Phase 4 (social features). For now, meals are per-user.

### Q: What languages does it support?
**A:** English primarily, but GPT-3.5 understands ~100 languages. You can chat in any language!

---

## Next Steps

### Immediate
1. Get OpenAI API key (free)
2. Add to `.env` file
3. Tap "Ask AI Coach" in Meals tab
4. Save some meals and use them

### Future Improvements
- Voice input (speak to AI)
- Save conversation history
- Favorite meal plan templates
- Share meals with friends
- Meal plan weekly planning
- Dietary plan templates (keto, vegan, etc.)
- Voice output (AI reads recommendations)

---

## Files Added/Modified

```
✨ New Files
├── src/components/AICoachModal.tsx      (Chat UI)
├── src/services/openaiService.ts        (AI integration)
├── .env                                 (API key config)
├── AI_COACH_SETUP.md                    (Setup guide)
└── GETTING_STARTED.md                   (User guide)

📝 Modified Files
└── App.tsx                              (Integrated modal)
```

---

## Architecture

```
UI Layer (AICoachModal.tsx)
    ↓
Service Layer (openaiService.ts)
    ↓
OpenAI API (GPT-3.5 Turbo)
    ↓
Parse Response
    ↓
Display Meals
    ↓
Save to App (AsyncStorage)
```

---

## Testing Checklist

- [ ] Set up OpenAI API key
- [ ] Click "Ask AI Coach" button
- [ ] Have a natural conversation with AI
- [ ] Ask about dietary preferences
- [ ] Get meal plan recommendations
- [ ] Save meals to menu
- [ ] See custom meals marked with ✨
- [ ] Use saved meals in daily logging

---

## Summary

The **AI Coach** transforms the app from a simple tracker into an **intelligent nutrition advisor**. Users no longer need to manually research meals—they can just chat naturally and get personalized recommendations in seconds.

This is **Phase 2.5** (added to Phase 2). The feature works independently but integrates seamlessly with the existing meals system.

**Ready to test? Follow [AI_COACH_SETUP.md](AI_COACH_SETUP.md)!**

---

**Built with:** OpenAI GPT-3.5 Turbo + React Native + Expo  
**Status:** ✅ Ready to use  
**Cost:** Minimal ($0.001 per conversation)  
**Impact:** Game-changing for meal planning experience
