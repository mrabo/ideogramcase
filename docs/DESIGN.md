---
name: Floral Narrative
colors:
  surface: '#ebffe6'
  surface-dim: '#bae5b7'
  surface-bright: '#ebffe6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#d4ffd0'
  surface-container: '#cdf9c9'
  surface-container-high: '#c8f4c4'
  surface-container-highest: '#c2eebf'
  on-surface: '#002106'
  on-surface-variant: '#574145'
  inverse-surface: '#123818'
  inverse-on-surface: '#d0fccc'
  outline: '#8a7175'
  outline-variant: '#ddbfc4'
  surface-tint: '#ab2d58'
  primary: '#a82a56'
  on-primary: '#ffffff'
  primary-container: '#c8446e'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb1c2'
  secondary: '#7c5800'
  on-secondary: '#ffffff'
  secondary-container: '#fcb812'
  on-secondary-container: '#6a4b00'
  tertiary: '#665386'
  on-tertiary: '#ffffff'
  tertiary-container: '#7f6ba0'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffd9e0'
  primary-fixed-dim: '#ffb1c2'
  on-primary-fixed: '#3f0018'
  on-primary-fixed-variant: '#8b1041'
  secondary-fixed: '#ffdea7'
  secondary-fixed-dim: '#ffbb1e'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5e4200'
  tertiary-fixed: '#ecdcff'
  tertiary-fixed-dim: '#d3bcf7'
  on-tertiary-fixed: '#231141'
  on-tertiary-fixed-variant: '#503d6f'
  background: '#ebffe6'
  on-background: '#002106'
  surface-variant: '#c2eebf'
typography:
  headline-lg:
    fontFamily: beVietnamPro
    fontSize: 40px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-md:
    fontFamily: beVietnamPro
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.25'
  headline-sm:
    fontFamily: beVietnamPro
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.3'
  body-lg:
    fontFamily: plusJakartaSans
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: plusJakartaSans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-md:
    fontFamily: plusJakartaSans
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: plusJakartaSans
    fontSize: 12px
    fontWeight: '700'
    lineHeight: '1.4'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style

The brand personality of this design system is flourishing, optimistic, and deeply rooted in the tactile beauty of the natural world. It avoids the cold, clinical precision of modern technology in favor of a "Modern Botanical" aesthetic. The goal is to evoke the feeling of a sun-drenched garden—approachable, warm, and restorative.

The design style leans into **Minimalism** with **Tactile** influences. It utilizes heavy whitespace to allow the vibrant colors to breathe, paired with soft, organic textures that mimic high-quality recycled paper or soft petals. By prioritizing human-centric warmth over "tech-first" efficiency, the UI feels like a companion rather than a tool.

## Colors

The palette is a vibrant celebration of a blooming garden. **Rose Pink** serves as the primary energetic driver, used for key actions and highlights. **Sunflower Yellow** provides warmth and optimism, ideal for secondary accents and attention-grabbing elements. **Lavender** adds a layer of sophisticated tranquility, used to soften the experience.

These floral tones are grounded by **Fresh Leaf Greens**, which act as the functional anchors for success states and secondary navigational elements. The canvas is a warm, creamy off-white rather than a pure digital white, ensuring the interface feels natural and easy on the eyes. Use the Leaf Green for text when a softer alternative to black is required.

## Typography

This design system utilizes a dual-font approach to balance personality with readability. **beVietnamPro** is the headline face; its contemporary and inviting character sets a friendly tone for large displays. Tighten the letter spacing slightly on larger headlines to create a more "editorial" feel.

For all functional and body text, **plusJakartaSans** provides a soft, rounded geometric structure that complements the organic shapes of the UI. It remains highly legible while reinforcing the optimistic and approachable nature of the system. Maintain generous line-heights for body copy to mimic the airy feel of an open landscape.

## Layout & Spacing

The layout philosophy is based on a **Fluid Grid** with an emphasis on "breathing room." Content is organized using a 12-column system, but with significantly larger margins and gutters than standard corporate interfaces to prevent a cramped, "techy" feeling.

A strict 8px rhythmic scale governs all padding and margin decisions. Use larger spacing increments (32px, 48px, 64px) between distinct content sections to reinforce the sense of calm and clarity. Elements should never feel forced into place; if a layout feels tight, default to the next largest spacing unit.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layers** rather than harsh borders. Shadows are exceptionally soft, with high blur radii and low opacity, often tinted with a hint of the primary or neutral colors (e.g., a soft Rose or Leaf Green tint) to avoid muddy grays.

Depth is used sparingly to suggest "stacking" like leaves or petals. Surfaces closer to the user are lighter and have a more pronounced, diffused shadow. Background blurs are used behind navigation bars to maintain a sense of transparency and lightness, ensuring the UI never feels heavy or opaque.

## Shapes

The shape language is defined by **Soft, Organic Curves**. Standard rectangles are entirely avoided. This design system employs a "Rounded" (0.5rem base) philosophy, but frequently moves toward pill-shapes for interactive elements.

To further the floral narrative, consider using asymmetrical border-radii for featured imagery or decorative containers (e.g., `80% 20% 80% 20% / 20% 80% 20% 80%`) to create leaf-like or pebble-like silhouettes. All corners must be "squircled" where possible to ensure the transitions feel natural rather than mathematically sharp.

## Components

**Buttons:** Should be pill-shaped and utilize vibrant petal colors. The primary action uses a subtle gradient of Rose Pink to Sunflower Yellow to suggest a blooming effect. Text inside buttons should be bold and high-contrast.

**Chips:** Use high roundedness (pill-shaped) with a light, desaturated background tint of the label color (e.g., light lavender background with deep lavender text). These represent small petals or seeds.

**Cards:** Cards use the softest elevation level and large corner radii (1rem or higher). They should have a thin, 1px border in a very pale Leaf Green or Cream to define their boundaries against the off-white background without appearing "boxed in."

**Input Fields:** Use a subtle background fill rather than a strong border. When focused, the border should glow with a soft Sunflower Yellow or Rose Pink ambient shadow.

**Lists:** Items are separated by generous white space rather than horizontal lines. If a divider is necessary, use a dotted or very faint organic line style.

**Progress Indicators:** Use a "growing vine" or "expanding petal" metaphor for loaders and progress bars, avoiding traditional technical spinning wheels.