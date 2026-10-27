# ankit-portfolio

My personal site. Live at https://ankit-portfolio-liart.vercel.app

I'm Ankit, a backend engineer (Java / Spring Boot, mostly) who also likes building the front of things. This is where I keep my résumé, the stuff I've shipped, and a couple of small experiments.

## What's in here

- `index.html`, `styles.css`, `main.js` – the whole site. No framework, no bundler. GSAP is vendored under `assets/` and the fonts are self-hosted, so it works offline too.
- `venom.js` – the black goo on the "Hire me" / "Email me" buttons. Bring the mouse close and it reaches out, grabs the pointer and tries to drag it in (the real cursor never moves, it's an illusion). Canvas only, no filters, and it switches itself off on touch devices and when reduced-motion is on.
- `styles.min.css`, `venom.min.js` – minified copies the page actually loads. If you edit the source files, re-minify or point `index.html` at the unminified ones.
- `resume.pdf` – current résumé.

## Running it

```
python3 -m http.server 4640
```

then open http://localhost:4640. That's it.

## Deploying

It's on Vercel as a plain static site: framework preset "Other", no build command, output directory `.`. `vercel.json` has the headers.
