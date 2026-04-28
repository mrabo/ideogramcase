# Project Brief: BrandBloom

## Overview
BrandBloom is a specialized web application designed for small business owners to generate high-quality, on-brand campaign imagery using their own brand assets and inspiration. The tool prioritizes a delightful, non-technical, and highly tactile interface.

## Core Objective
To provide a simple single-screen experience where users can transform a logo and reference images into professional campaign visuals, shielded from the complexity of the underlying technology.

## Target Audience
- Small business owners and entrepreneurs.
- Users seeking a friendly, approachable tool rather than a technical "AI" platform.
- Designers looking for a rapid, mood-to-visual conceptualization tool with a hand-crafted feel.

## Key Features & User Flow
The application is a single-page interface with a linear, focused flow:
1.  **Hand-Crafted Branding**: A prominent, eye-catching header featuring the BrandBloom wordmark and subtitle, backed by hand-illustrated, animated floral graphics with a "boiling lines" effect.
2.  **Brand Identity Upload**: A clear area for users to drag and drop or upload their business logo, accompanied by helpful descriptive text.
3.  **Visual Inspiration**: A separate upload section for up to five reference images, with guidance on how these images influence the final output.
4.  **Creative Intent**: A simple, friendly text field for users to describe the campaign image they envision.
5.  **Instant Generation**: A prominent "Generate Visuals" button to trigger the creation process.
6.  **Side-by-Side Results**: The application outputs two distinct image concepts that align with the brand logo and inspiration.
7.  **Regeneration**: A "Regenerate" option for quick iterations.

## Design Principles
- **Minimalism & Tactility**: A clean layout that eliminates distractions (no navigation, no footer) and emphasizes hand-crafted elements.
- **Floral Narrative Aesthetic**: A vibrant palette of pinks, fresh greens, and soft yellows. The design feels "alive" and organic.
- **Playful Animation**: Use of "boiling lines" and hand-drawn animations to give the interface a unique, human touch that feels less like a sterile tool and more like a creative partner.
- **Warm & Approachable**: Language is simple, inviting, and completely avoids technical jargon or mentions of AI.

## Technical Constraints (Prototype)
- Single-screen website.
- No navigation menu or footer.
- Stateless experience (no saved library in this phase).
- Focused exclusively on the core generation loop.

## Implementation details
- Do not install npm packages on the local machine.
- All node packages/modules must be installed in the `.local-preview` directory.
- The app should run on localhost through `.local-preview` for editing and also be ready for deployment. 
- When editing app source, keep the root project files and `.local-preview/app` copy in sync, or run `npm run local:setup` after root edits before testing through localhost.
