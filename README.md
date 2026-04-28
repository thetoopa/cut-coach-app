# Calos

A local-first Expo/React Native app for calorie tracking, meals, workouts, progressive overload, cardio, golf mode, and drinking-day budget.

## Run it locally

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on iPhone/Android.

## Build downloadable phone apps

Expo recommends EAS Build for Android/iOS binaries. EAS can generate/manage Android keystores and iOS signing credentials.

```bash
npm install -g eas-cli
eas login
eas build:configure
npm run build:android
npm run build:ios
```

For Android, the included `preview` profile creates an APK you can send to friends. For iPhone distribution outside your own device, you generally need Apple Developer/TestFlight or internal distribution setup.

## What is included

- Profile: age, height, weight, goal weight, calorie/protein targets
- Meal picker: preset meals plus manual meal creation
- Drinking day mode: reserves calories per drink
- Golf mode: lowers cardio pressure and gives instructions
- Workout tracker: Push/Pull/Legs/Upper split
- Progressive overload: tells when to increase weight
- Rest timer: 90/120/180 seconds
- Backup workouts for missed gym days
- Cardio plan: outdoor + incline treadmill minutes, progress, and heart-rate zone guidance
- Local storage with AsyncStorage

## Next upgrades

- Weekly trend charts
- Friend profiles
- Apple Health / Google Fit sync
- Cloud sync with Supabase/Firebase
- Barcode scanner / nutrition database
