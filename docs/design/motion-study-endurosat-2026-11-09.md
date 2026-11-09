# EnduroSat Space-Service Front-to-Back Motion & Layout Study (2026-11-09)

- **Reference URL**: https://gpc-style-endurosat.vercel.app/space-service/
- **House Standard**: Ruled 2026-11-03 — study and build to its motion and spatial discipline, never copy its assets, markup, shaders, or copy.
- **Capture & REA Evidence Location**: `%USERPROFILE%\remakes\gpc-style-endurosat-space-service\` (all Remake recon and slot manifests, REA static and runtime evidence bundles, and 12 scroll-stop PNG reference frames are stored exclusively in the local study folder outside the repository).

---

## 1. Scroll-Order Motion Inventory (First Paint to Footer)

Each line below documents one distinct motion in strict top-to-bottom scroll order: **what moves**, **which direction** (left, right, diagonal, up, down, toward, or away), **what triggers it** (load, scroll position, hover, or click/drag), **how long it takes**, and **its easing**.

### A. First Paint, Header Chrome, Cursor & Floating Controls (Load & Hover)

1. **Page preloader veil and initial WebGL stage wrapper**: Fades in toward the viewer from black opacity zero to full visibility on initial asset load, taking 0.3 seconds with linear easing.
2. **Custom dual-ring mouse follower**: Glides diagonally, left, right, up, or down toward the live pointer coordinates on mouse move across desktop viewports, taking 0.4 seconds per catch-up step with quadratic out easing.
3. **Top navigation bar container**: Slides up away from the viewport top when scrolling down past 100 pixels and slides down into view when scrolling up, triggered by scroll direction, taking 0.35 seconds with cubic in-out easing.
4. **Workshops mega-menu backdrop and column items**: Expands inward from horizontal scale 1.1 toward scale 1.0 on desktop (or slides left from 25 percent right offset on mobile) when triggered by clicking the header menu toggle, taking 0.75 seconds with 0.075-second item stagger and exponential in-out easing (reversing away at double speed in 0.375 seconds).
5. **Workshops mega-menu mobile accordion drawers**: Expands down from zero height or collapses up to zero height when triggered by clicking a group heading, taking 0.5 seconds with quadratic in-out easing.
6. **Full-screen hamburger menu overlay and navigation links**: Fades in toward the viewer over 1.0 second with quadratic in-out easing while headline words rise up from 150 percent vertical offset over 1.4 seconds (0.05-second stagger), primary links slide right from 50 percent left offset over 1.0 second (0.1-second stagger), and secondary links slide left from 50 percent right offset over 1.0 second (0.1-second stagger), all triggered by click with exponential out easing.
7. **Fixed top-right primary call-to-action button**: Scales its corner arrow badge diagonally up and right while shifting its label mask up on pointer hover, taking 0.3 seconds with cubic out easing.
8. **Global 3D camera rig and satellite mouse parallax**: Shifts the camera laterally left, right, up, and down while pitching and yawing the 3D satellite diagonally toward the cursor on pointer move, damping continuously at 20 percent per frame with linear interpolation easing.
9. **Long-jump scroll transition curtain**: Fades a black overlay in toward the viewer over 0.3 seconds, scrolls the page up or down to the target section over 3.0 seconds, and fades away after 1.8 seconds over 0.3 seconds when triggered by clicking a bottom navigation step more than three viewport heights away, using custom cubic-bezier easing.

### B. Hero, Problem & Solution Text Reveals (Scroll Progress 0.0 to 2.5)

10. **Hero pretitle and main headline**: Slides up by 40 pixels and fades away as the user scrolls down from the top of the page (scroll position 0.0 to 0.5), taking 0.5 scroll-scrub units with quadratic in-out easing.
11. **3D Earth globe and background starfield on hero exit**: Pushes the camera forward toward the sunlit Earth horizon while rotating the globe slowly left-to-right on scroll position 0.0 to 2.0, spanning 2.0 scroll-scrub units with quadratic in-out camera interpolation.
12. **Challenge section pretitle**: Fades in toward the viewer at scroll position 0.5 over 0.25 seconds and fades away at scroll position 1.5 over 0.25 seconds, triggered by crossing the section scroll threshold, with quadratic in-out easing.
13. **Challenge section split-word headline**: Lifts each word up from 100 percent below its line mask in a left-to-right wave on scroll position 0.5 (and drops down on reverse scroll), taking 0.6 seconds per word plus up to 0.6 seconds of staggered word delay with asymmetric quadratic out easing, then slides up 40 pixels and fades away at scroll position 1.5 over 0.5 seconds with quadratic in-out easing.
14. **Solution section pretitle and split-word headline**: Rises up word-by-word out of hidden line masks from bottom to top on scroll position 2.0, taking 0.6 seconds per word plus up to 0.6 seconds of staggered delay with asymmetric quadratic out easing, and slides up 40 pixels while fading away at scroll position 2.8 over 0.5 seconds with quadratic in-out easing.

### C. Two Steps & Progress Bar Morph (Scroll Progress 2.5 to 4.5)

15. **Two Steps section header**: Slides up into the upper-center viewport on scroll position 2.5 and translates up 60 pixels while fading away at scroll position 3.2, spanning 0.5 scroll-scrub units with quadratic in-out easing.
16. **Step 01 left column block**: Rises up from 100 percent below its mask on the left side of the screen at scroll position 2.75, taking 0.5 scroll-scrub units with quadratic out easing.
17. **Vertical divider line between steps**: Draws down from top to bottom (vertical scale 0 to 1) at scroll position 2.9, then collapses down and away by shifting its transform origin to the bottom at scroll position 3.25, taking 0.35 scroll-scrub units with quadratic in-out easing.
18. **Step 02 right column block**: Rises up from 100 percent below its mask on the right side of the screen at scroll position 3.0, then slides left and fades away when transitioning to the timeline bar at scroll position 3.35, taking 0.5 scroll-scrub units with quadratic in-out easing.
19. **Center timeline headline and horizontal progress track**: Slides in from right to left while the inner progress bar fill expands left-to-right from horizontal scale 0 to 1 across the center of the viewport between scroll position 3.35 and 3.85, spanning 0.5 scroll-scrub units with quadratic in-out easing.
20. **Center progress bar morph into the bottom navigation bar**: Translates down and scales down away from the center of the screen into the exact bounding box of the persistent bottom navigation bar at scroll position 3.9 to 4.2, taking 0.6 seconds with quadratic out easing.
21. **We Cover section giant centered headline**: Scales down away from the viewer from 1.08x to 1.0x while fading in and then sliding up 40 pixels to exit between scroll position 4.0 and 4.5, spanning 0.5 scroll-scrub units with quadratic in-out easing.

### D. Payload & Captation Earth Imagery Zoom/Pan Stage (Scroll Progress 4.5 to 6.5)

22. **Camera dive toward Earth surface map**: Plunges the 3D camera down and toward the Earth surface until the Captation ground plane fills the background between scroll position 4.25 and 4.75, spanning 0.5 scroll-scrub units with quintic exponential out easing.
23. **Scroll-to-continue indicator pill**: Pulses its inner vertical bar down and up in a continuous loop at the bottom-left while fading away once scroll position passes 4.6, taking 0.3 seconds to fade with quadratic in-out easing.
24. **Payload category switcher and horizontal card carousel**: Slides up into the lower-left viewport at scroll position 4.5 and pans its card strip left-to-right and right-to-left when dragged or clicked, taking 0.5 seconds for entrance and 0.4 seconds per category swap with quadratic out easing.
25. **Captation satellite imagery zoom-in and spectral band cross-dissolve**: Zooms the high-resolution Earth observation texture in toward the viewer (zoom factor 1.0 to 1.35) while cross-wiping left-to-right and right-to-left between Hyperspectral, Multispectral, SAR, Thermal, and VHR Optical bands on scroll position 4.5 to 5.5 or card click, taking 1.0 second per band transition with quadratic in-out easing.
26. **Captation image pan left-to-right and right-to-left across ground targets**: Pans the zoomed surface imagery horizontally left-to-right and right-to-left while sweeping a sensor scan line across the terrain between scroll position 4.6 and 5.8, spanning 1.2 scroll-scrub units with linear scrub easing (and 0.8-second quadratic out easing when triggered by clicking payload cards).
27. **Animated aircraft, marine vessels, and ground trucks on the Captation map**: Glides miniature planes, boats, and trucks diagonally, left-to-right, and right-to-left along vector paths across the zoomed Earth imagery while pulsing target lock rings outward on scroll position 4.8 to 5.8, running continuously on the render loop with linear path easing and 0.5-second quadratic in-out visibility fades.
28. **Captation ground-point data cloud and vertical telemetry lines**: Shoots glowing point markers and vertical data lines up toward the camera from the surface map during connectivity modes between scroll position 5.2 and 6.0, spanning 0.8 scroll-scrub units with quadratic in-out easing.
29. **Captation imagery zoom-out and fade away**: Zooms the Earth observation plane out away from the viewer and fades its opacity from 1.0 to 0.0 between scroll position 5.5 and 6.5, spanning 1.0 scroll-scrub unit with quadratic in-out easing.

### E. Satellite Blueprint Assembly, Rocket Docking & Launch (Scroll Progress 6.5 to 10.5)

30. **3D Satellite wireframe blueprint emergence**: Fades the detailed 3D satellite in toward the center of the viewport as a glowing blue wireframe while rotating it diagonally across pitch and yaw axes between scroll position 5.5 and 8.25, spanning 2.75 scroll-scrub units with linear scrub easing.
31. **Satellite core build transition (wireframe to solid metallic fuselage)**: Sweeps the materialization threshold up across the satellite body from bottom to top so solid solar arrays, gold foil, and aluminum panels replace the wireframe between scroll position 6.75 and 8.0, spanning 1.25 scroll-scrub units with linear scrub easing.
32. **Assess left-aligned text card**: Slides up 40 pixels into the left viewport margin at scroll position 6.5 and slides up 40 pixels while fading away at scroll position 7.2, taking 0.5 seconds on enter and leave with quadratic in-out easing.
33. **Train left-aligned text card**: Slides up 40 pixels into the left viewport margin at scroll position 7.25 and slides up 40 pixels while fading away at scroll position 8.0 while the satellite completes its 360-degree inspection tumble, taking 0.5 seconds with quadratic in-out easing.
34. **Satellite shrink and docking descent into launch vehicle**: Scales the 3D satellite down away from the viewer from full scale to 10 percent scale while lowering it down into the rocket payload adapter between scroll position 8.25 and 9.0, spanning 0.75 scroll-scrub units with quadratic in-out easing.
35. **Launch vehicle fuselage and fairing assembly**: Rises up from below the frame around the docked satellite while the two payload fairing halves close inward from left and right between scroll position 8.35 and 9.0, spanning 0.65 scroll-scrub units with quadratic out easing.
36. **Adopt left-aligned text card**: Slides up 40 pixels into the left viewport margin at scroll position 8.25 and slides up 40 pixels while fading away at scroll position 9.5, taking 0.5 seconds with quadratic in-out easing.
37. **Rocket vertical launch and exhaust trail ignition**: Blasts the assembled rocket straight up and away along the vertical axis while igniting the glowing exhaust plume downward between scroll position 9.0 and 9.6, spanning 0.6 scroll-scrub units with quadratic in easing.
38. **Fairing separation and booster stage drop-away**: Splits the left and right nose-cone fairings outward to the left and right while the lower rocket stage drops down and fades away between scroll position 9.35 and 10.0, spanning 0.65 scroll-scrub units with quadratic out and cubic out easing.
39. **Satellite orbital deployment expansion**: Scales the freed satellite back up toward the viewer from 10 percent scale to full scale in low-Earth orbit while pitching it into its orbital attitude between scroll position 9.5 and 10.5, spanning 1.0 scroll-scrub unit with quadratic in-out easing.

### F. Deploy, Maintain & SpaceOps Orbital Dashboard (Scroll Progress 10.0 to 14.0)

40. **Step 02 Deploy hero banner**: Slides its giant step number and title up from hidden line masks on the left at scroll position 10.0 and lifts up 40 pixels to exit at scroll position 10.8, taking 0.6 seconds per word with asymmetric quadratic out easing.
41. **Long-term support centered headline**: Rises up word-by-word in the upper center of the viewport at scroll position 10.8 and fades away upward at scroll position 11.4, taking 0.6 seconds per word with asymmetric quadratic out easing.
42. **SpaceOps 3D-to-orthographic globe transition**: Pulls the camera back away from the close-up satellite to reveal the full Earth globe and orbital ground-station network while fading in the SpaceOps orthographic HUD layer between scroll position 11.0 and 11.5, spanning 0.5 scroll-scrub units with linear and quadratic in-out easing.
43. **SpaceOps satellite orbital pass, ground search cone, and telemetry packets**: Moves the SpaceOps satellite marker diagonally across the orbital arc from left to right while sweeping a conical radar search beam down toward the ground station and streaming data pulses up and down the communication link between scroll position 11.0 and 13.75, spanning 2.75 scroll-scrub units with linear scrub easing.
44. **SpaceOps HUD callout boxes flash-in**: Flashes the technical HUD frames and telemetry status readouts in toward the viewer using instant single-step opacity cuts along the orbital path between scroll position 11.3 and 13.5, taking 0.01 seconds per step cut with stepped easing.
45. **Repair, Monitor, and Document right-hand text cards**: Each card slides up 40 pixels into the right side of the viewport and exits up 40 pixels in sequence across scroll position 11.5 to 13.8, taking 0.5 seconds per transition with quadratic in-out easing.

### G. Security, Integration & 10-Satellite Constellation (Scroll Progress 14.0 to 16.0)

46. **Earth surface encryption character matrix flash-in**: Flashes a curved grid of cryptographic letter glyphs across the dark side of the 3D Earth globe while rotating the globe right-to-left between scroll position 14.0 and 15.1, spanning 1.1 scroll-scrub units with quadratic in-out easing.
47. **Security split-column title and description**: Slides the section title up on the left and the body copy up on the right at scroll position 14.0, exiting upward at scroll position 14.9, taking 0.5 seconds with quadratic in-out easing.
48. **10-Satellite constellation radial dispersion**: Flies nine additional instanced satellites outward in all radial directions from behind the primary satellite to form a ten-satellite orbital ring around the globe, then retracts them inward back into a single craft between scroll position 14.85 and 16.2, spanning 1.35 scroll-scrub units with quadratic in-out easing.
49. **Integration split-column title and description**: Slides the title up on the left and the description up on the right at scroll position 15.0, exiting upward at scroll position 15.8, taking 0.5 seconds with quadratic in-out easing.

### H. Workshops, Breakouts X-Ray View & Hands-On Live Counting Meters (Scroll Progress 16.0 to 19.0)

50. **Workshops split-column title and description**: Rises up into the left and right margins while the camera pushes back in toward the hero satellite between scroll position 15.8 and 16.5, taking 0.5 seconds with quadratic in-out easing.
51. **Satellite X-ray fuselage transparency and internal module flash-in**: Fades the outer satellite skin to semi-transparent X-ray mode while flashing in the internal avionics modules and wiring harnesses with glowing blue edges as the satellite rotates 270 degrees between scroll position 16.0 and 18.75, spanning 2.75 scroll-scrub units with quadratic in-out easing.
52. **Satellite antenna concentric wave pulse**: Emits concentric radio rings outward and away from the satellite antenna dish between scroll position 16.35 and 17.5, spanning 1.15 scroll-scrub units with linear wave propagation and quadratic in-out envelope easing.
53. **Breakouts right-aligned card**: Slides up 40 pixels into the right viewport at scroll position 16.5 and exits upward at scroll position 17.4, taking 0.5 seconds with quadratic in-out easing.
54. **Hands-on 3D-to-2D callout tracking line**: Projects a live 3D anchor point on the rotating satellite into 2D screen coordinates and stretches a connecting line diagonally from the satellite toward the right-hand telemetry card at scroll position 17.5 to 18.8, updating every frame with a 0.5-second quadratic in-out horizontal scale entrance.
55. **Hands-on four live counting telemetry meters (Ampere, Max DoD, Data, Power)**: Counts the four numerical readouts and horizontal progress bars up and down continuously in a four-step looping cycle while the section is active (Ampere counting between 4.2 A and 10.0 A, Max DoD counting between 30 percent and 100 percent, Data counting between 100 Mbps and 2000 Mbps, and Power counting between 30 dBm and 33 dBm), triggered by section visibility at scroll position 17.5, with each count tween taking 0.5 seconds every 1.0 second using quadratic in-out easing.

### I. Budget Priorities Slider, Odometer Slot Counter & Orbit Exit (Scroll Progress 19.0 to 24.0)

56. **Satellite lighting warm-shift for Budget section**: Rotates the satellite toward the lower-left and shifts directional rim lighting to warm orange as the camera settles into the pricing angle between scroll position 18.75 and 19.5, spanning 0.75 scroll-scrub units with quadratic in-out easing.
57. **Priorities interactive range slider and live cost counters**: Slides the calculator panel up into the right side of the viewport at scroll position 19.0; dragging the horizontal thumb left or right (or scrolling through the section) counts the satellite quantity (1 to 36), revisit time (24 hours down to 0.5 hours), and total price up and down in real time with 0.25-second quadratic out smoothing.
58. **Idle seats four-column vertical odometer slot-machine counter**: Rolls four vertical digit strips (0 through 9 columns) rapidly up and down like a mechanical odometer while shifting the number color from orange to white and sliding a vertical scrollbar indicator down on the right edge between scroll position 20.0 and 21.5, spanning 1.5 scroll-scrub units with linear scrub easing.
59. **Bottom navigation bar morph into final CTA button**: Collapses the five-section bottom navigation bar inward and translates it up toward the center-left call-to-action button using a bounding-box morph between scroll position 21.8 and 22.8, spanning 1.0 scroll-scrub unit with quadratic in-out easing.
60. **Orbit final headline and WebGL scene fade to black**: Rises up word-by-word on the left while the 3D satellite drifts away into dark space and the canvas fades to pure black between scroll position 22.0 and 24.0, spanning 2.0 scroll-scrub units with asymmetric quadratic out text easing and quadratic in-out scene fade.

### J. Lower DOM Sections: Flash-In Numbers, Client Logo Stagger & Footer (Below WebGL Stage)

61. **Featured impact numbers count-up (1M, 4, 1)**: Counts the three large statistic integers up from 0 to 1, 0 to 4, and 0 to 1 when their container enters the bottom of the viewport on scroll, taking 2.0 seconds with primary quadratic in-out easing.
62. **Featured impact labels bottom-mask flash-in**: Flashes and lifts the split words of each statistic caption up from 150 percent vertical offset to 0 percent inside overflow-hidden line masks when the row reaches 85 percent viewport height on scroll, taking 1.4 seconds with 0.05-second word stagger and exponential out easing.
63. **Trusted section headline and secondary counters**: Counts the trust metrics up from 0 to their target totals over 2.0 seconds with primary quadratic in-out easing while lifting the section heading words up from 150 percent to 0 percent over 1.4 seconds with exponential out easing on scroll entry.
64. **Trusted client logo grid flash-in and left-to-right/right-to-left stagger**: Slides and fades each partner logo card in from 25 percent right offset toward 0 percent (leftward) — or from 25 percent left offset toward 0 percent (rightward) on inverse rows — in a rapid staggered wave as the grid scrolls through the lower half of the viewport, taking 1.3 seconds per card with 0.1-second stagger and quadratic in-out easing.
65. **Footer parallax reveal**: Translates the entire footer container down from -16 percent vertical offset to 0 percent as its wrapper scrolls into the lower half of the viewport, spanning the scroll range with linear scrub easing and triggering the background grid line reveal upon completion.
66. **Footer mobile link group expanders**: Expands the Contacts and Connect link lists down from zero height to full height (or collapses them up) when tapped on mobile viewports, taking 0.6 seconds with quadratic in-out easing.

---

## 2. How the Page Keeps the Background Visible

The reference page sustains a 43,589-pixel vertical journey without ever burying the 3D satellite, Earth globe, or Captation surface maps under heavy interface chrome. It achieves this through five spatial rules:

1. **Single Fixed Full-Viewport WebGL Stage with Zero Pointer Occlusion**:
   - A single WebGL canvas sits fixed across 100 percent of the viewport width and height behind every section with pointer events disabled. Instead of scrolling opaque page blocks over the canvas, invisible spacer containers (sized between 50 percent and 500 percent of viewport height) drive a normalized scroll progress value while every text frame sits fixed over the stage at zero opacity until its active scroll window.
2. **Strict One-Cluster-at-a-Time Text Density (10 to 22 Percent Viewport Occupancy)**:
   - At any scroll stop, at most one short headline (6 to 14 words) or one compact title and two-sentence paragraph sits on screen. No two narrative sections ever overlap in opacity; the outgoing frame translates up 40 pixels and fades completely out before or just as the incoming frame rises out of its line masks.
   - Because text sits directly over the dark space background without solid card backings in 11 of the 14 frames, starfields, Earth limb glow, and satellite silhouettes remain visible right through the negative space between letters and lines.
3. **Peripheral Edge Pinning (Center 65 to 80 Percent Reserved for the 3D Subject)**:
   - Whenever the 3D satellite or Earth globe occupies the center or right-center of the viewport (Assess, Train, Adopt, Deploy), the text column is pinned to the far left margin (occupying less than 25 percent of the viewport width).
   - When the camera shifts the satellite or SpaceOps globe to the left-center (Repair, Monitor, Document, Breakouts, Hands-on, Priorities, Idle seats), the text and interactive controls shift to the far right margin, leaving the left-center 65 percent of the viewport completely unobstructed.
   - In split-header frames (Security, Integration, Workshops), the title sits in the upper-left corner and the short paragraph sits in the upper-right corner, keeping the entire lower and central 75 percent of the screen clear for the ten-satellite constellation and Earth encryption matrix.
4. **Compact Edge Docks for Interactive Panels and Carousels**:
   - The Payload selector carousel (Step 01 Define) docks tightly to the bottom-left corner as small square thumbnail buttons so the Captation satellite imagery can zoom and pan across the upper and right 80 percent of the viewport.
   - The Hands-on telemetry meters (Ampere, Max DoD, Data, Power) stack in a narrow vertical column on the far right, connected to the 3D satellite only by a hairline 1-pixel projected callout line.
   - The persistent section progress bar hugs the very bottom edge of the viewport as a thin horizontal strip under 56 pixels tall, and the primary call-to-action button stays pinned to the top-right corner.
5. **High-Contrast Translucent HUD Treatments Instead of Solid Panels**:
   - Where panels or meters do appear (Two Steps progress bar, SpaceOps telemetry boxes, Performance meters, Priorities cost slider, Idle seats odometer), they use 1-pixel translucent borders, transparent or ultra-dark glass fills, and open typographic spacing rather than large opaque cards.

---

## 3. What we take

The list below captures the reusable motion, rendering, and spatial techniques we take from this study for our own clean-room builds, paired with the library or API each technique uses (no code):

- **Virtual smooth scroll normalization and programmatic anchor easing**: Lenis smooth scroll library synchronized with the GSAP Ticker API and browser requestAnimationFrame API.
- **Spacer-driven fixed stage scrubbing**: GSAP ScrollTrigger scrub API measuring invisible viewport-height spacer elements to drive a single master progress scalar while keeping active content frames fixed.
- **Multi-node 3D camera rig interpolation**: Three.js Vector3 lerpVectors API and Quaternion slerpQuaternions API interpolating between authored scene camera nodes with GSAP CustomEase curves.
- **Continuous pointer parallax with frame-rate-independent damping**: Browser mousemove event coordinates damped via Three.js Vector2 lerp API for 3D camera/mesh tilt and GSAP quickTo API for 2D cursor followers.
- **Multi-pass post-processing bloom over a single shared WebGL canvas**: Three.js WebGLRenderer, WebGLRenderTarget, and PostProcessing EffectComposer and BloomPass APIs.
- **Shader-driven wireframe-to-solid materialization and X-ray cutaway**: Three.js ShaderMaterial API with custom GLSL vertex and fragment uniforms scrubbed by GSAP Timeline.
- **Multi-band surface imagery zoom, pan, and cross-dissolve**: Three.js plane mesh and custom GLSL fragment shader uniforms for zoom, pan offset, and band mixing driven by GSAP ScrollTrigger and click tweens.
- **Instanced constellation radial dispersion**: Three.js InstancedMesh and Object3D transform APIs scrubbed along radial vectors by GSAP Timeline.
- **3D world-to-2D screen callout line projection**: Three.js Vector3 project API converting 3D mesh anchors into 2D viewport coordinates every frame, paired with CSS 2D/3D transform matrices on a DOM line element.
- **Split-word and split-line masked text reveals**: GSAP SplitText plugin (lines and words mode with overflow-hidden line masks) animated via GSAP Timeline and CustomEase or Exponential Out easing.
- **FLIP bounding-box morph between navigation chrome elements**: Browser Element getBoundingClientRect API paired with GSAP 3D translation and scale tweens to morph a centered progress bar into a bottom navigation bar and later into a call-to-action button.
- **Looping live telemetry counter and bar-fill tweens**: GSAP repeating Timeline API interpolating numeric state objects and writing formatted readouts to DOM textContent and CSS horizontal scale transforms.
- **Mechanical odometer vertical digit-strip counter**: GSAP ScrollTrigger scrub API translating stacked 0-to-9 digit column elements vertically while interpolating text color via GSAP color interpolation utilities.
- **Viewport-triggered integer count-up**: GSAP ScrollTrigger API triggering a GSAP numeric property tween with Math.floor updates written to DOM textContent.
- **Directional staggered card and logo grid entrance**: GSAP ScrollTrigger API paired with GSAP staggered horizontal translation and opacity tweens.
