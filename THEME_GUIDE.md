# Theme Switching Guide

This project is configured to support hot-swapping themes using [tweakcn](https://tweakcn.com) or manual CSS variable updates.

## Using tweakcn

1. Visit [tweakcn.com](https://tweakcn.com)
2. Select or create your desired theme
3. Copy the generated CSS variables
4. Replace the contents of `:root` and `.dark` in `app/globals.css`

## Theme Structure

All theme colors are defined as HSL CSS variables in `app/globals.css`:

### Light Mode (`:root`)
```css
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --card: 0 0% 100%;
  --card-foreground: 240 10% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 240 10% 3.9%;
  --primary: 240 5.9% 10%;
  --primary-foreground: 0 0% 98%;
  --secondary: 240 4.8% 95.9%;
  --secondary-foreground: 240 5.9% 10%;
  --muted: 240 4.8% 95.9%;
  --muted-foreground: 240 3.8% 46.1%;
  --accent: 240 4.8% 95.9%;
  --accent-foreground: 240 5.9% 10%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 240 5.9% 90%;
  --input: 240 5.9% 90%;
  --ring: 240 5.9% 10%;
  --radius: 0.5rem;

  /* Sidebar specific colors */
  --sidebar-background: 0 0% 98%;
  --sidebar-foreground: 240 5.3% 26.1%;
  --sidebar-primary: 240 5.9% 10%;
  --sidebar-primary-foreground: 0 0% 98%;
  --sidebar-accent: 240 4.8% 95.9%;
  --sidebar-accent-foreground: 240 5.9% 10%;
  --sidebar-border: 220 13% 91%;
  --sidebar-ring: 217.2 91.2% 59.8%;
}
```

### Dark Mode (`.dark`)
```css
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  --card: 240 10% 3.9%;
  --card-foreground: 0 0% 98%;
  /* ... etc */
}
```

## Manual Theme Customization

To create a custom theme manually:

1. Open `app/globals.css`
2. Modify the HSL values in `:root` (light mode) or `.dark` (dark mode)
3. HSL format: `hue saturation% lightness%`
   - Example: `220 13% 91%` = slightly blue, light gray

## Theme Variables Reference

| Variable | Purpose |
|----------|---------|
| `--background` | Main background color |
| `--foreground` | Main text color |
| `--card` | Card background |
| `--card-foreground` | Card text |
| `--primary` | Primary action color (buttons, links) |
| `--primary-foreground` | Text on primary elements |
| `--secondary` | Secondary UI elements |
| `--muted` | Muted/subtle backgrounds |
| `--accent` | Accent/highlight color |
| `--destructive` | Error/danger states |
| `--border` | Border color |
| `--input` | Form input backgrounds |
| `--ring` | Focus ring color |
| `--sidebar-*` | Sidebar-specific colors |

## Current Setup

The app currently uses:
- **Dark mode by default** (via `className="dark"` on `<html>`)
- **HSL color format** for all theme variables
- **shadcn/ui** component library

All components are styled using these theme variables, so changing them will update the entire app's appearance instantly.

## Tips

- Keep contrast ratios accessible (use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/))
- Test both light and dark modes
- The sidebar has separate color variables for independent styling
- `--radius` controls border radius globally (currently set to `0.5rem`)
