# Pending setup

Things we chose to postpone and must come back to before launching to real
users. Delete each item once it's done.

## Auth email: custom SMTP (blocks real users signing in)

Sign-in currently uses **Supabase's built-in email**, which is meant for
development only:

- It **only delivers to members of the Supabase organization's team**. Anyone
  else gets "Email address not authorized" (the app shows "Todavía no podemos
  mandar correos a esta dirección.").
- It's limited to about **2 emails per hour** for the whole project.
- On new free-tier projects, **email templates can't be edited** while using
  it (Supabase changelog, 2026-06-03), so emails are Supabase's default
  English "Magic Link" / "Confirm signup" templates.

To fix, in the Supabase dashboard:

1. **Authentication → Emails → SMTP Settings:** configure a provider (e.g.
   Resend) with a sender on a domain we own, e.g. `no-reply@clabe.club`.
2. **Authentication → Rate Limits:** raise the email limit (custom SMTP starts
   at 30/hour).
3. **Authentication → Emails → Templates:** translate the templates to
   Spanish.

## Auth email: switch from links to one-time codes

We use **email links** only because templates can't be edited yet (see
above). Codes are better for our users: people often arrive from Instagram
or WhatsApp in-app browsers, and a link in an email opens in a different
browser, so they end up signed in in the wrong place.

Once custom SMTP is set up:

1. Edit the **Magic Link** and **Confirm signup** templates to send
   `{{ .Token }}` instead of `{{ .ConfirmationURL }}`, e.g.

   ```html
   <h2>Tu código para entrar</h2>
   <p>Escribe este código en CLABE.club:</p>
   <p style="font-size:28px;font-weight:bold;letter-spacing:4px">
     {{ .Token }}
   </p>
   <p>Si no lo pediste, puedes ignorar este correo.</p>
   ```

2. Bring back the code step in `components/auth/sign-in-dialog.tsx`. The
   working implementation is in commit `af71f56` (`verifyOtp` with
   `type: "email"`). `app/auth/callback` can then be removed.

## When moving to a real domain (e.g. clabe.club)

Supabase's **Authentication → URL Configuration** currently allows
`https://clabe.vercel.app`. When adding a custom domain in Vercel, update the
**Site URL** to it and add its `/auth/callback` to **Redirect URLs**, or
sign-in links on the new domain will fail.
