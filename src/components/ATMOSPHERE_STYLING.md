# Atmosphere Component Styling Guide

## Overzicht
Deze documentatie specificeert de correcte styling voor de atmosphere component, waarbij de achtergrondkleur is aangepast van paars naar eggshell wit/licht zoals vereist.

## Kleurenpalet

### Primaire Kleuren (Eggshell White/Light)
- **Primaire achtergrond**: `#faf9f6` (Eggshell white - hoofdachtergrond)
- **Secundaire achtergrond**: `#f5f4f1` (Iets donkerdere eggshell voor variatie)
- **Tertiaire achtergrond**: `#eeede8` (Nog lichtere variatie voor diepte)

### Tekstkleuren
- **Primaire tekst**: `#333333`
- **Secundaire tekst**: `#666666`
- **Accent tekst**: `#4a4a4a`

### Accent Kleuren (Geen Paars!)
- **Licht accent**: `#e8f4f8` (Licht blauw-groen in plaats van paars)
- **Medium accent**: `#b8dce8` (Medium blauw-groen)
- **Zachte accent**: `#f0f8f0` (Zachte groene tint)

## Verboden Kleuren

### ❌ Paarse/'Kermis' Kleuren - NIET GEBRUIKEN
- Alle tinten paars zijn verboden in de atmosphere component
- Dit omvat: `purple`, `violet`, `magenta`, `#800080`, `#9932cc`, etc.
- Geen enkele paarse kleur mag zichtbaar zijn als achtergrond

## CSS Variabelen

```css
:root {
    /* Atmosphere color palette - eggshell white/light theme */
    --atmosphere-bg-primary: #faf9f6;      /* Eggshell white - main background */
    --atmosphere-bg-secondary: #f5f4f1;    /* Slightly darker eggshell for variation */
    --atmosphere-bg-tertiary: #eeede8;     /* Even lighter variation for depth */
    
    /* Text colors */
    --atmosphere-text-primary: #333333;
    --atmosphere-text-secondary: #666666;
    --atmosphere-text-accent: #4a4a4a;
    
    /* Accent colors - avoiding purple completely */
    --atmosphere-accent-light: #e8f4f8;    /* Light blue-green instead of purple */
    --atmosphere-accent-medium: #b8dce8;   /* Medium blue-green */
    --atmosphere-accent-soft: #f0f8f0;     /* Soft green tint */
}
```

## Implementatie Richtlijnen

### Voor Development Environment
- Gebruik altijd de gedefinieerde CSS variabelen
- Test in verschillende browsers om consistentie te waarborgen
- Controleer op kleurenblindheid toegankelijkheid

### Voor Production Environment
- Zorg ervoor dat alle atmosphere componenten de eggshell white achtergrond gebruiken
- Implementeer fallback kleuren voor oudere browsers
- Minify CSS voor betere performance

### Toegankelijkheid
- Contrast ratio tussen tekst en achtergrond moet voldoen aan WCAG richtlijnen
- Minimum contrast ratio: 4.5:1 voor normale tekst, 3:1 voor grote tekst

## Character Styling

### Claudette (Sphere host)
- Achtergrond: Gradient van `--atmosphere-accent-light` naar `--atmosphere-bg-tertiary`
- Zachte overgangen en hover effecten

### Stuwey (Mini-sphere met vleugels)
- Achtergrond: Gradient van `--atmosphere-accent-soft` naar `--atmosphere-bg-secondary`
- Inclusieve knop styling met toegankelijke kleuren

### Clube & Clubie (Cube varianten)
- Achtergrond: Gradient van `--atmosphere-bg-tertiary` naar `--atmosphere-accent-light`
- Consistente cube styling

## Responsive Design
- Atmosphere component moet goed functioneren op alle schermgroottes
- Gebruik flexbox en grid voor layout
- Behoud eggshell white achtergrond op alle viewports

## Browser Ondersteuning
- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+

## Testing Checklist
- [ ] Atmosphere achtergrond is eggshell white (#faf9f6)
- [ ] Geen paarse kleuren zichtbaar in de UI
- [ ] Goede contrast voor toegankelijkheid
- [ ] Responsive design werkt correct
- [ ] Hover effecten functioneren goed
- [ ] Cross-browser compatibiliteit getest

## Laatste Update
Dit document is bijgewerkt om de atmosphere component achtergrondkleur te corrigeren van paars naar eggshell wit/licht zoals vereist in de documentatie.