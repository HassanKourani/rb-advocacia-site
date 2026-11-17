# RB Advocacia e Consultoria Jurídica

Site institucional da Dra. Izabely Ramalho (OAB/SP 462.051), advocacia previdenciária.

Plain static site: no build step, no framework.

```
index.html            page markup (pt-BR)
css/styles.css        all styles
js/main.js            header, hero animation, reveal, contact form (demo)
assets/img/           logo, monogram, portrait, hero textures (WebP, compressed from the design originals)
assets/icons/         favicon and touch icons
assets/og-image.jpg   social share image
vercel.json           cache headers
```

## Run locally

```
npx serve .
```

or

```
python3 -m http.server 8080
```

## Deploy

Vercel, framework preset "Other", no build command, output directory `.` (root).

## Still to do

- Contact form is a demo: it validates but sends nothing. Hook it to a form service or an API route.
- "Política de Privacidade" and "Aviso Legal" links point to `#`.
- Update `og:image`, `og:url` and canonical when a custom domain is added.
