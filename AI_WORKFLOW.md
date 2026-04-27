# AI Development Workflow Guide

## Quick Reference: How to Request Changes

You can simply describe what you want in plain English. Here are example formats:

### Example 1: Bug Fix
```
The calendar is showing the wrong date for yesterday. 
Please fix the date calculation in the CalendarView.
```

### Example 2: Feature Addition
```
Add a button to copy a meal to clipboard for sharing.
It should appear next to the meal name in the meal detail view.
```

### Example 3: Modification
```
The color red is too dark on the day cells. 
Make it a brighter red (#FF4444 instead of #CC0000).
```

### Example 4: Complex Feature
```
When I complete a set on the workout screen, 
show a confetti animation and play a "ding" sound.
Then automatically move to the next set with a 90-second timer.
```

## Standard Change Request Format (Optional but Helpful)

If you want to be more detailed:

```
Component: [Calendar / Meals / Workout / Cardio / Profile]
Change: [What needs to change]
Details: [Any specifics - colors, timing, calculations, etc.]
Priority: [High / Medium / Low]
```

## How I'll Handle Your Requests

1. **Read the current code** to understand what exists
2. **Make minimal, targeted changes** - no unnecessary refactoring
3. **Maintain consistency** with existing code style
4. **Update DEVELOPMENT_ROADMAP.md** if it affects the roadmap
5. **Test implications** - what else might break?
6. **Commit changes** with clear messages so you can track them

## Working with Git

After I make changes:
- Code is committed automatically with descriptive messages
- You can view changes with: `git log --oneline`
- You can revert with: `git revert <commit-hash>`
- You can see what changed: `git diff <commit-hash>`

## Version Management

If data structure changes (new fields in meals, profiles, etc.):
- Old user data is handled gracefully
- New fields get default values
- Data migrations happen automatically

## Common Requests I Can Handle Quickly

- ✅ Change colors, fonts, sizes
- ✅ Add/remove UI elements
- ✅ Modify calculations (calories, macros, etc.)
- ✅ Add sound/haptic feedback
- ✅ Create new screens/tabs
- ✅ Add data fields to existing models
- ✅ Connect to existing APIs (Health app, Firebase, etc.)
- ✅ Performance optimizations
- ✅ Bug fixes

## What Needs More Planning

- ⚠️ Major architecture changes (if unclear)
- ⚠️ Backend services (discuss first)
- ⚠️ Breaking changes to data model
- ⚠️ New large dependencies

## Checking Progress

You can always ask:
- "What features are working?"
- "What's next on the roadmap?"
- "How much of Phase 1 is done?"
- "Show me the commit history"

---

**TL;DR:** Just tell me what you want in plain English, and I'll make it happen. 😊
