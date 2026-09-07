---
name: mobile
description: "React Native, Expo, iOS/Android patterns, navigation, app store deployment."
version: 1.0.0
author: Joshua (joshlcoleman), Hermes Agent
license: MIT
platforms: [linux, macos, windows]
metadata:
  hermes:
    tags: [mobile, react-native, expo, ios, android]
    related_skills: [frontend-react, design-ui]
---

# Mobile Development

## When to Use

- Building iOS/Android apps with React Native
- Expo managed workflow
- Native module integration
- App store submission

## Expo Patterns

### Project Structure

```
/app
  _layout.tsx          # Root layout (Stack/Tabs)
  index.tsx            # Home screen
  [id].tsx             # Dynamic route
  (tabs)/              # Tab group
    _layout.tsx
    home.tsx
    settings.tsx
/components
  ThemedText.tsx
  ThemedView.tsx
/constants
  Colors.ts
/hooks
  useThemeColor.ts
```

### Navigation

```tsx
// Stack Navigator
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="[id]" options={{ title: 'Details' }} />
    </Stack>
  );
}

// Navigate
import { router } from 'expo-router';
router.push(`/post/${id}`);
router.back();
```

### Safe Area

```tsx
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Screen() {
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
      {/* Content */}
    </SafeAreaView>
  );
}
```

## Performance

| Problem | Solution |
|---------|----------|
| Large lists | `FlashList` (not FlatList) |
| Images | `expo-image` with caching |
| Animations | Reanimated 3 (worklets) |
| Navigation | Expo Router (file-based) |
| State | Zustand + MMKV for persistence |

## Platform-Specific

```tsx
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
    android: { elevation: 4 },
  }),
});
```

## App Store Checklist

- [ ] App icon (1024x1024 no alpha)
- [ ] Screenshots (6.5" and 5.5" for iOS)
- [ ] Privacy policy URL
- [ ] App Store description & keywords
- [ ] Build signed with distribution cert
- [ ] No console.log in production
- [ ] Deep links configured
- [ ] Push notifications permission strings

## Pitfalls

- **Ignoring safe areas** → Notch/home indicator overlap
- **FlatList for 1000+ items** → Use FlashList
- **Blocking JS thread** → Move heavy work to worklets
- **Missing keyboard handling** → KeyboardAvoidingView
- **Testing only on simulator** → Real device for performance

## Verification

- [ ] Runs on both iOS and Android
- [ ] Handles keyboard appearance
- [ ] Respects safe areas
- [ ] Smooth 60fps animations
- [ ] Deep links work
- [ ] Offline state handled
