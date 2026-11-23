# Posting to TikTok automatically (optional)

Reelhouse can send every finished video to your TikTok account using TikTok's official **Content Posting API**. It's off until you set it up.

## What to know first

- TikTok requires you to register a free **developer app**. It's quick to make, but TikTok reviews apps before they can post publicly.
- **Before approval**, posts made through your app are **private** (only you can see them). You can still use **"Send to my TikTok inbox"**: the video lands in your TikTok app's inbox and you tap Post yourself, adding sounds or text if you like.
- **After approval**, Reelhouse can post publicly straight away.
- TikTok only accepts sign-in from a secure web address (`https://`). On your own computer that means using the **inbox** option through a tunnel, or posting by hand. The simplest path for most people is: download from the Shipping Dock and upload in the TikTok app.
- TikTok's rules ask creators to label AI-generated content. When you post, turn on TikTok's "AI-generated content" label.

## Steps

1. Go to <https://developers.tiktok.com> and sign in with your TikTok account.
2. Click **Manage apps > Connect an app**. Give it a name like "Reelhouse" and an icon.
3. In the app, add the product **Login Kit** and the product **Content Posting API**.
   - Under Content Posting API, turn on **Direct Post** if you want straight-away posting.
4. Under **Scopes**, make sure these are added: `user.info.basic`, `video.upload`, `video.publish`.
5. Under **Login Kit > Redirect URI**, add your Reelhouse address followed by `/api/tiktok/callback`, for example `https://my-tunnel-name.trycloudflare.com/api/tiktok/callback`. It must start with `https://`.
6. Copy the **Client key** and **Client secret** from the app page into `.env.local`:

   ```
   TIKTOK_CLIENT_KEY=your-client-key
   TIKTOK_CLIENT_SECRET=your-client-secret
   TIKTOK_REDIRECT_URI=https://my-tunnel-name.trycloudflare.com/api/tiktok/callback
   ```

7. Restart Reelhouse, open the **Shipping Dock**, click **Connect TikTok** and approve.
8. Choose what happens after each video:
   - **Don't post**: nothing is sent.
   - **Send to my TikTok inbox**: you finish posting in the TikTok app (works before approval).
   - **Post it straight away**: public after TikTok approves your app, private before.
9. When you're ready to post publicly, click **Submit for review** on the developer site. TikTok asks for a short screen recording showing how the app works.

## Getting an https address on your own computer

TikTok won't redirect to `http://localhost`. A free way to get an `https://` address is Cloudflare Tunnel:

1. Install `cloudflared` from <https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/>.
2. While Reelhouse is running, open a terminal and run: `cloudflared tunnel --url http://localhost:3000`
3. It prints an address like `https://something.trycloudflare.com`. Use that address in step 5 and in `TIKTOK_REDIRECT_URI`, then open Reelhouse through it to click **Connect TikTok**.

If you do this, set `REELHOUSE_PASSWORD` in `.env.local` first, because the tunnel makes your studio reachable from the internet.

The quick tunnel address changes every time. After you connect once, Reelhouse keeps the sign-in and refreshes it by itself, so you only need a tunnel again if you reconnect (and then you update the Redirect URI on the developer site to the new address).
