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

<!-- TROLLZ1004-SPINE:START -->
- `Repo: ANTIGRAVITY | Fleet: Alienware (192.168.0.40, workshop) & T5500 (192.168.0.15, front-of-house) | GitHub: Trollz1004 (ops/fleet/fleet-map.json).`
- `Spine: Trollz1004/dream-online docs/house/SPINE.md (pointers: ADDRESS-DOCTRINE.md, NODES.md, PIPELINE.md, TRUSTED-MODELS.md, THE-HOUSE.md).`
- `Address doctrine: use 192.168.0.40 and 192.168.0.15 from ops/fleet/fleet-map.json; never use loopback reach URLs; Postgres (port 5432), Redis (port 6379), and Obsidian REST (port 27123) bind "127.0.0.1" on their own machine only.`
- `Trusted three: Claude Opus 5.5 / Fable (Claude Code), Gemini 4 Carbon (agy), and GPT-6 Astra / GPT-6.1 Sol / Codex (Codex CLI); superpowers is in every kit on demand, while REA, remake, Agent-Reach, and last30days are locked to the trusted three.`
- `Pipeline: brainstorm first, route role + <=2 skills, build [A]/[B] with failing test first, expediter rubric + 5 stacked add-on PRs, Carbon + Codex judge, Fable / rotating trusted-three merges green checks.`
- `Starter kit MCP ("kit"): cmd.exe /d /c node "%USERPROFILE%\antigravity\DREAM-Engine-runner\ops\kit\server.mjs" (tools: map_search, map_section, memory_search, memory_add, role_get, method_get).`
<!-- TROLLZ1004-SPINE:END -->
