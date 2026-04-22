# Research: LinkedIn dark theme

> Generated 2026-04-18 UTC

## Executive summary

LinkedIn has an official dark mode on desktop and mobile, with `Device settings`, `Dark mode`, and `Light mode` options in settings. For this project, the best path is to make LinkedIn use its native dark theme inside the WebView and avoid relying on generic Android/WebView darkening, which usually produces muddy and inconsistent results.

Your current app-wide dark theme is a generic slate/black system, not a LinkedIn-flavored token set. The in-app LinkedIn mock screen also uses only a couple of old LinkedIn blues on top of the generic theme, so the result looks mixed rather than cohesive.

## Current state on LinkedIn

### Official dark mode exists

- LinkedIn Help says users can switch between `Device settings`, `Dark mode`, and `Light mode` from `Settings & Privacy` > `Account Preferences` > `Dark mode`.
- LinkedIn Help also says the preference is saved locally on the device/browser via cookies, not in the LinkedIn account.

Implication:

- A WebView should ideally activate LinkedIn's own preference and keep browser/device theme signals aligned.
- If we only override CSS or only fake `prefers-color-scheme`, that may still miss the storage mechanism LinkedIn actually reads.

Source:

- https://www.linkedin.com/help/linkedin/answer/a522955

### Brand and imitation constraints

- LinkedIn brand guidance explicitly says not to copy or imitate LinkedIn's website design, typeface, colors, graphics, or imagery.
- The same guidance also says not to use a color or layout too similar to the LinkedIn platform, and specifically warns against using the signature blue as the dominant visual language in derivative media.

Implication:

- If this is a SocialFlow-owned UI that only references LinkedIn, it should feel compatible with LinkedIn, not like a cloned LinkedIn screen.

Source:

- https://brand.linkedin.com/business-books-and-media-usage

### Palette cues worth reusing carefully

LinkedIn's official screen palette exposes:

- Blue ramp: `#9BDAF3`, `#68C7EC`, `#34B3E4`, `#00A0DC`, `#008CC9`, `#0077B5`, `#005E93`, `#004471`
- Neutral ramp: `#E6E9EC`, `#D0D3D6`, `#B6B9BC`, `#A0A3A6`, `#86898C`, `#737679`, `#595C5F`, `#434649`, `#303336`

The public LinkedIn logo guidance also states the preferred logo treatment is blue on white, which reinforces that blue should be used as accent, not as the whole interface background.

Sources:

- https://brand.linkedin.com/content/dam/brand/site/brand-assets/linkedin-palette-screen.pdf
- https://brand.linkedin.com/linkedin-logo

## Dark mode implementation guidance

### Prefer the site's real dark theme over browser recoloring

Google's `color-scheme` guidance explains that `color-scheme` and the matching meta tag let the browser use theme-aware defaults and help prevent browsers from applying their own transformations. It also recommends combining early `color-scheme` declaration with `prefers-color-scheme`.

Implication:

- If LinkedIn supports dark mode natively, the cleanest rendering comes from getting LinkedIn into dark mode early, then letting its own CSS/tokens render the page.
- Algorithmic darkening should be a fallback, not the main strategy.

Source:

- https://web.dev/articles/color-scheme

### Accessibility floor

WCAG 2.1 says normal text should meet a contrast ratio of at least `4.5:1`, and large text at least `3:1`.

Implication:

- Any custom dark theme needs explicit text/surface checks.
- "Cool" dark mode that uses low-contrast gray-on-gray will fail quickly, especially in dense feed UI.

Source:

- https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum

### Visual design guidance

Apple's dark mode guidance emphasizes that dark colors should not be simple inversions, and that elevated surfaces should feel distinct from base backgrounds to preserve depth.

Implication:

- Use 3-4 surface levels, not one flat black.
- Use brighter foregrounds and dimmer backgrounds.
- Keep cards, dialogs, composer, and overlays on separate elevations.

Source:

- https://developer.apple.com/design/human-interface-guidelines/dark-mode

## Project findings

### WebView logic already points in the right direction

The Android WebView plugin already documents the intended priority:

1. Site-native dark theme
2. WebView/Android darkening
3. Network-specific fallback

It also already:

- prefers web theme over UA darkening
- patches `matchMedia('(prefers-color-scheme: dark)')`
- sets `document.documentElement.style.colorScheme`
- tries to force LinkedIn storage through `mobileWebTheme`

Relevant code:

- [NativeWebViewPlugin.kt](/home/claude/socialflow/src-tauri/plugins/android-webview/android/src/main/java/com/socialflow/webview/NativeWebViewPlugin.kt:1288)
- [NativeWebViewPlugin.kt](/home/claude/socialflow/src-tauri/plugins/android-webview/android/src/main/java/com/socialflow/webview/NativeWebViewPlugin.kt:1365)

Important nuance:

- LinkedIn's public help says dark mode preference is stored locally via cookies/browser state.
- The current code mainly patches `mobileWebTheme` in storage.
- So the activation path may be incomplete or outdated if LinkedIn now relies on cookies or another key in addition to storage.

### The current app theme is generic, not LinkedIn-specific

Current global dark tokens are:

- `--surface-ground: #09090b`
- `--surface-card: #18181b`
- `--surface-border: #27272a`
- `--primary-color: #5BA8F5`

Relevant code:

- [App.vue](/home/claude/socialflow/src/ui/setup/pages/SocialFlow/App.vue:378)

This creates a modern generic dark SaaS theme, but it does not evoke LinkedIn's restrained neutral system.

### The custom LinkedIn screen mixes styles

The custom LinkedIn screen uses the generic app surfaces plus isolated LinkedIn blue accents:

- banner gradient `#0077b5 -> #00a0dc`
- button `#0077b5`
- all cards/composer/posts still inherit the global generic dark surfaces

Relevant code:

- [LinkedInView.vue](/home/claude/socialflow/src/ui/setup/pages/SocialFlow/components/networks/LinkedInView.vue:359)
- [LinkedInView.vue](/home/claude/socialflow/src/ui/setup/pages/SocialFlow/components/networks/LinkedInView.vue:548)

This is the main reason the theme feels inconsistent: the accent says "LinkedIn" but the surfaces and hierarchy say "generic app".

## Recommendation for this project

### Recommendation A: use LinkedIn's native dark mode in the WebView

This is the highest-confidence path.

Do this:

1. Keep `PREFER_WEB_THEME_OVER_USER_AGENT_DARKENING` for LinkedIn.
2. Keep the `prefers-color-scheme` and `color-scheme` bridge.
3. Inspect which cookie/local state LinkedIn actually writes after a manual switch to `Dark mode` or `Device settings` inside the WebView.
4. Reproduce that exact state instead of only forcing `mobileWebTheme`.
5. If native dark mode is confirmed active, consider disabling algorithmic darkening for LinkedIn specifically to avoid double-darkening.

Why:

- It will look more coherent than any custom CSS overlay.
- It will stay aligned with LinkedIn UI changes over time.
- It reduces maintenance.

### Recommendation B: if you keep a custom LinkedIn-flavored UI, switch to a real token system

Do not keep the current hybrid approach. Define a small LinkedIn-inspired token set such as:

```css
:root {
  --li-accent: #0A66C2;
  --li-accent-hover: #004471;
  --li-bg: #303336;
  --li-surface-1: #434649;
  --li-surface-2: #595C5F;
  --li-border: #737679;
  --li-text: #E6E9EC;
  --li-text-muted: #D0D3D6;
  --li-text-soft: #A0A3A6;
}
```

Then apply these rules:

- Background darker than cards, but not pure black.
- Cards and composer share the same surface family.
- Only primary actions and active states use LinkedIn blue.
- Secondary actions stay neutral.
- Borders stay subtle and consistent across cards, stats rows, dialogs, and inputs.
- Use one radius family, one spacing scale, and one elevation language.

## Practical next step

If the goal is the real LinkedIn browsing experience, refactor the WebView activation path first.

If the goal is the mocked/custom LinkedIn page inside SocialFlow, refactor the design tokens first.

I would not invest more time in the current hybrid theme approach.

## Sources

- https://www.linkedin.com/help/linkedin/answer/a522955
- https://brand.linkedin.com/business-books-and-media-usage
- https://brand.linkedin.com/content/dam/brand/site/brand-assets/linkedin-palette-screen.pdf
- https://brand.linkedin.com/linkedin-logo
- https://web.dev/articles/color-scheme
- https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum
- https://developer.apple.com/design/human-interface-guidelines/dark-mode
