// src/services/openaiService.ts
// OpenAI integration for meal planning and fitness advice

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface MealPlanResponse {
  meals: Array<{
    name: string;
    type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    description: string;
    notes: string;
  }>;
  summary: string;
  totalCalories: number;
  totalProtein: number;
  recommendations: string[];
}

const SYSTEM_PROMPT = `You are a knowledgeable fitness nutrition coach helping users create a personalized meal plan. Your role is to:

1. Ask about their dietary preferences, restrictions, allergies, and dislikes
2. Understand their fitness goals (cutting, bulking, maintaining)
3. Learn about their calorie and macro targets
4. Find out what foods they enjoy

Then provide a tailored meal plan that is:
- Delicious and practical to prepare
- Aligned with their goals and preferences
- Varied and sustainable long-term
- Realistic for their lifestyle

When generating meals, provide:
- Meal name
- Type (Breakfast/Lunch/Dinner/Snack)
- Approximate calories and macros (protein/carbs/fat)
- Simple description
- Any special notes

Be friendly, encouraging, and specific. Ask follow-up questions to understand their situation better.

When the user seems satisfied with their preferences, offer to generate a complete meal plan. Format the final meal plan as a JSON block like:
\`\`\`json
{
  "meals": [
    {
      "name": "Example Meal",
      "type": "Breakfast",
      "calories": 400,
      "protein": 30,
      "carbs": 40,
      "fat": 12,
      "description": "Description of the meal",
      "notes": "Any special preparation notes"
    }
  ],
  "summary": "Overall summary of the meal plan",
  "totalCalories": 1900,
  "totalProtein": 150,
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}
\`\`\``;

export async function sendChatMessage(
  messages: ChatMessage[],
  userMessage: string
): Promise<string> {
  if (!OPENAI_API_KEY) {
    return "Error: OpenAI API key not configured. Please set EXPO_PUBLIC_OPENAI_API_KEY in your .env file.";
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      return `Error: ${error.error?.message || 'Failed to get response from AI'}`;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || 'No response received';
  } catch (error) {
    console.error('Chat error:', error);
    return `Error communicating with AI: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}

export function parseMealPlanFromResponse(response: string): MealPlanResponse | null {
  try {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
    const jsonString = jsonMatch ? jsonMatch[1] : response;
    const parsed = JSON.parse(jsonString);

    if (parsed.meals && Array.isArray(parsed.meals)) {
      return {
        meals: parsed.meals,
        summary: parsed.summary || 'Personalized meal plan created',
        totalCalories: parsed.totalCalories || 0,
        totalProtein: parsed.totalProtein || 0,
        recommendations: parsed.recommendations || [],
      };
    }
  } catch (e) {
    console.log('Could not parse meal plan JSON from response');
  }
  return null;
}
