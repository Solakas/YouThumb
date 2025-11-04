export const EDIT_PROMPT_SUGGESTIONS = [
  'Add a retro filter',
  'Make the colors more vibrant',
  'Increase the contrast',
  'Add a blurry background',
  'Remove the person in the background',
  'Add text: "NEW VIDEO"',
  'Change the background to a galaxy',
  'Add a glowing outline to the main subject'
];

export const ASK_PROMPT_SUGGESTIONS = [
  'How do I use the selection tools?',
  'Give me ideas for a travel vlog thumbnail',
  'What makes a thumbnail stand out?',
  'Explain the adjustment sliders',
];


export const GENERATE_PROMPT_SUGGESTIONS = [
    'A majestic lion wearing a crown, cinematic lighting',
    'A futuristic cityscape at night with flying cars',
    'An enchanted forest with glowing mushrooms, fantasy art',
    'A cute robot exploring Mars, digital art',
    'Surreal art of a whale floating in the clouds',
    'An astronaut playing guitar on the moon',
    'A hyper-realistic portrait of a cyborg',
    'A logo for a coffee shop named "The Daily Grind"',
];

export const TEMPLATES = [
  {
    name: 'MrBeast Style',
    prompt: `
      Apply the following edits to create a "MrBeast" style thumbnail, step-by-step:
      1.  **Background**: Replace the background with something exciting that fits the theme, then apply a blur and a soft, bright glow in the center.
      2.  **Subject**: Create a cutout of the main subject. Add a prominent outline (often white or a bright color) and a soft drop shadow to make it pop. Brighten the subject's eyes and teeth to make them stand out.
      3.  **Hero Prop**: Identify a key object or "hero prop." Scale it up to be very large. Give it a similar outline and shadow treatment as the subject. Add a slight bloom or glow effect to it.
      4.  **Text & Graphics**: If text is needed, add a 1-4 word title in a very bold, stroked font. Optionally, add one simple graphic like an arrow or a circle to draw attention to the most important element.
      5.  **Color & Sharpening**: Apply a global color pop by increasing contrast and vibrance.
      6.  **Final Polish**: Selectively sharpen the subject's eyes and the hero prop to guide the viewer's focus. Ensure the final image is clear and impactful when viewed at a small, phone-sized scale.
    `
  },
  {
    name: 'Mark Rober Style',
    prompt: `
      Apply the following edits to create a "Mark Rober" style thumbnail, step-by-step:
      1.  **Background**: Use a workshop, lab, or blueprint-style background. Apply a slight blur and a central glow to focus the viewer.
      2.  **Hero Element**: Place the main build, experiment, or subject very large in the frame. Tilt it slightly (5-10 degrees) to create a dynamic feel. Add subtle motion streaks, sparks, or energy effects around it.
      3.  **Subject (Mark)**: Add a cutout of a person (mid-shot) with an excited, curious, or surprised expression, often pointing at the hero element. Give the person a clean outline and a soft shadow. Lightly brighten their eyes and teeth.
      4.  **Overlays**: Add 1-3 simple, clean overlays. Think bold arrows, "VS" text for comparisons, simple labels, or measurement marks to add a scientific feel.
      5.  **Details & Color**: If relevant, add a scale cue (like a tiny human figure or a ruler). Add a mild bloom effect on bright parts of the hero element. Stick to a blue and orange color palette where possible.
      6.  **Final Polish**: Increase global contrast and vibrance. Selectively sharpen the hero element and the person's eyes. Check that it's easy to understand on a phone screen.
    `
  },
  {
    name: 'Emma Chamberlain Style',
    prompt: `
      Apply the following edits to create an "Emma Chamberlain" style thumbnail, step-by-step:
      1.  **Background**: Start with a neutral or muted real-world location background, or a simple flat color. Slightly reduce the overall saturation and add a mild film grain effect for a vintage feel.
      2.  **Subject**: Place a candid, off-center, mid-shot photo of the subject. The expression should be natural, not overly posed. The subject's face should take up roughly 25-35% of the thumbnail's height.
      3.  **Color Grading**: Apply a "film look" color grade. This means adding a warm tint, using soft contrast (avoiding pure black and pure white), and lifting the blacks slightly. Add a subtle vignette (darkening the corners).
      4.  **Text**: If text is used, it should be minimal (0-3 words), tiny, and placed in negative space. Use a handwritten or simple sans-serif font. Often, no text is best.
      5.  **Composition**: The composition should be minimal and uncluttered. If a prop is present (like a coffee cup or a piece of clothing), it should feel natural and part of the scene, not a "hero prop".
      6.  **Final Polish**: Lightly sharpen the subject's eyes but keep the skin looking natural. Ensure the overall mood is relaxed and authentic.
    `
  },
];