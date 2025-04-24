# ✨ Infinite Galaxy Zoom ✨

Ever gaze at the night sky and wonder about the sheer scale of the universe? What would it look like to travel between those distant points of light?

This project is a small attempt to capture a sliver of that feeling – an interactive simulation of traveling through a field of galaxies and nebulae, built entirely with web technologies.

![Infinite Galactic Zoom Demo](https://github.com/user-attachments/assets/3aed9833-b002-4a5c-b4fc-003b52723a04)

## Journey Through a Simulated Cosmos

This simulation uses HTML, CSS, and the JavaScript Canvas 2D API to procedurally generate and render a dynamic starfield populated with:

* **Diverse Galaxies:** Encounter simplified representations of various galaxy types based on astronomical classifications:
    * Ellipticals (Smooth, oval glows)
    * Spirals & Barred Spirals (Core bulge and disk structure)
    * Ringed Spirals (Inspired by objects like Hoag's Object)
    * Edge-On Spirals (Featuring bright bulges and dark dust lanes, inspired by galaxies like NGC 891)
    * Irregular Galaxies (Patchy, asymmetric structures)
    * Lenticular Galaxies (Disk galaxies without prominent arms)
* **Colorful Nebulae:** Large, sprawling clouds with soft edges and mixed colors (reds, blues, greys), inspired by famous nebulae images, adding depth and color to the void.
* **Perspective & Motion:** Experience a pseudo-3D effect where objects have depth (`z`-coordinate). As you "move", objects closer to you fly past faster, while distant ones appear slower, mimicking perspective. New objects fade in gently from the distance.

It's a canvas for imagination, a reminder of the vast, beautiful structures that populate our universe.

## Instructions

Ready to explore? It's simple:

🌌 **Click and hold** the mouse button anywhere on the screen to travel through the spacetime continuum with galaxies and nebulae rushing past!

🌠 Release the mouse button to pause your journey and observe the starfield.

## Technology Used

* HTML5
* CSS3
* JavaScript (ES6+)
* Canvas 2D API

No external libraries or frameworks were used for the core simulation logic and rendering in this version.

## Live Demo

Check out the live version deployed on Vercel:
https://galaxy-zoom.vercel.app/
 
## Credits
Created for curious minds by [**Sai Gattupalli**](https://saigattupalli.com) from UMass Amherst.
---
