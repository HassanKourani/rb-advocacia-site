# RB Advocacia e Consultoria Jurídica

Site institucional da Dra. Izabely Ramalho (OAB/SP 462.051), advocacia previdenciária.

Plain static site: no build step, no framework.

```
index.html            page markup (pt-BR)
css/styles.css        all styles
js/main.js            header, hero animation, reveal, contact form
api/contact.js        Vercel function: validates the form and emails it through Resend
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

## Contact form

The form posts JSON to `/api/contact`, a Vercel Node function with no dependencies. It checks the fields, rejects bots that fill the hidden `rb_hp` honeypot, limits size (16 KB body, 5000 character message) and rate (5 messages per IP per 10 minutes, per warm instance), then sends the message through the Resend HTTP API with `reply_to` set to the visitor's email, so replying in the inbox answers the visitor.

Environment variables (Vercel project > Settings > Environment Variables):

| Name | Required | Value |
| --- | --- | --- |
| `RESEND_API_KEY` | yes | API key from resend.com |
| `CONTACT_TO_EMAIL` | yes | inbox that receives the messages (comma separated for several) |
| `CONTACT_FROM_EMAIL` | no | sender, e.g. `RB Advocacia <contato@yourdomain>`; defaults to `RB Advocacia <onboarding@resend.dev>` |

Setup:

1. Create a free account at https://resend.com.
2. API Keys > Create API Key, permission "Sending access".
3. Add `RESEND_API_KEY` and `CONTACT_TO_EMAIL` in Vercel for Production (and Preview if you test on preview URLs).
4. Redeploy (Deployments > latest > Redeploy) so the function picks up the values.

With the default `onboarding@resend.dev` sender, Resend only delivers to the email address that owns the Resend account. To deliver to any other inbox, verify a domain in Resend (Domains > Add Domain, then add its DNS records) and set `CONTACT_FROM_EMAIL` to an address on that domain.

If the variables are missing, the function answers 503 and the form shows a friendly error with the WhatsApp number instead of crashing.

## Still to do

- "Política de Privacidade" and "Aviso Legal" links point to `#`.
- Update `og:image`, `og:url` and canonical when a custom domain is added.
