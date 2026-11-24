# Posting to TikTok automatically (optional)

**You don't have to do this.** Without it, you open the **Shipping Dock** in Reelhouse, download the finished video, and post it from the TikTok app on your phone. That always works.

If you'd like Reelhouse to send each video to TikTok for you, follow the steps below once. It takes about 30 minutes. There are no commands to type.

## How it works, in one paragraph

TikTok only lets "apps" post videos. So you make a free app for yourself on TikTok's developer website. It gives you two secret codes. You paste the codes into Reelhouse, then click **Connect TikTok** one time. After that, Reelhouse sends each new video to your **TikTok inbox** (the notifications in your TikTok app), and you tap **Post**. Posting fully by itself needs TikTok to review your app first (Part E, optional).

---

## Part A: Make your TikTok app and get your two codes

1. Go to <https://developers.tiktok.com> and click **Log in**, then **Sign up**. The developer website has its **own account**, separate from your TikTok login: use your email address and make up a password. TikTok emails you a code to paste in.
   - Your TikTok account can use Google, Apple or anything else to sign in. That doesn't matter here. You'll use your normal TikTok sign-in later, in Part C.
2. Click your profile picture in the top right, then **Manage apps**.
3. Click **Connect an app**. If it asks who owns the app, choose **Individual** (or make a new one with your own name).
4. Fill in the basics:
   - **App icon**: any square picture (your channel's profile picture is fine).
   - **App name**: `Reelhouse`
   - **Category**: pick the closest one, for example **Entertainment**.
   - **Description**: `Sends my own cartoon videos to my TikTok account.`
   - **Platforms**: tick **Web**. If it asks for a website, put any website you own. If you don't have one, leave it for now (you only need it for Part E).
5. Scroll down to **Products** and click **Add products**. Add these two:
   - **Login Kit**
   - **Content Posting API**
6. At the top of the page, switch to **Sandbox** and click **Create Sandbox** (name it `Reelhouse test`). A sandbox lets you use the app on your own account without waiting for TikTok's review.
7. In the sandbox, find **Target users** (or **Sandbox settings**), click **Add**, and add your channel's TikTok account.
8. Find **Scopes** and make sure these three are ticked: `user.info.basic`, `video.upload`, `video.publish`.
9. Near the top of the sandbox page you'll see **Client key** and **Client secret** (click the eye icon to show the secret). Leave this page open. You'll copy them in Part B.
10. Click **Save** (or **Apply changes**) at the bottom.

If the website won't let you save because it wants a **Terms of Service** or **Privacy Policy** link, stop there and ask for help. We can make simple pages for those.

## Part B: Give the two codes to Reelhouse

1. Open your Reelhouse folder (for example `C:\ai-videos-main`).
2. Find the file named **`.env.local`**. Right-click it, choose **Open with**, then **Notepad**.
   - Don't see it? Double-click **Start Reelhouse** once; it creates the file.
3. Find the line that says `TIKTOK_CLIENT_KEY=`. Click right after the `=` and paste your **Client key**. No spaces.
4. Find `TIKTOK_CLIENT_SECRET=` and paste your **Client secret** right after the `=`.

   It should look like this (with your own codes):

   ```
   TIKTOK_CLIENT_KEY=sbaw1a2b3c4d5e6f
   TIKTOK_CLIENT_SECRET=Ab12Cd34Ef56Gh78Ij90
   ```

5. Leave the line `# TIKTOK_REDIRECT_URI=...` alone. Reelhouse works it out by itself.
6. Save (**Ctrl + S**) and close Notepad.
7. Close the black Reelhouse window, then double-click **Start Reelhouse** again.

## Part C: Connect your TikTok account (one time)

TikTok won't sign in to the normal `http://localhost:3000` address. It needs an address that starts with `https://`. The **Connect TikTok** helper makes one for a few minutes.

1. Make sure Reelhouse is running (the black window is open).
2. In your Reelhouse folder, double-click **`Connect TikTok.bat`**. If Windows says "Windows protected your PC", click **More info**, then **Run anyway**.
3. A new black window opens. The first time, it downloads a small free tool from Cloudflare. Wait until you see a box with an address that ends in **`.trycloudflare.com`**, like `https://happy-blue-river.trycloudflare.com`.
4. Copy that address: drag over it with the mouse, then press **Enter**. Paste it into Notepad for a moment so you don't lose it.
5. Go back to the TikTok developer page from Part A. Under **Login Kit**, find **Redirect URI** (for Web). Paste your address and add `/api/tiktok/callback` to the end, so it looks like:

   ```
   https://happy-blue-river.trycloudflare.com/api/tiktok/callback
   ```

   Click **Save** (or **Apply changes**).
6. In your web browser, open your `.trycloudflare.com` address (without the `/api/...` part). Your studio opens.
7. Click **Shipping Dock**, then **Connect TikTok**.
8. TikTok asks if you allow Reelhouse to post. Click **Authorize** (or **Continue**).
9. You land back in the studio, and the TikTok card says **Connected**. Now close the `Connect TikTok` window. You're done with it.

Reelhouse remembers the sign-in and keeps it fresh by itself. You only repeat Part C if you click **Disconnect**, or if it stops working after about a year. The address is different every time, so you'd paste the new one into step 5 again.

## Part D: Choose what happens after each video

In the **Shipping Dock**, under **TikTok**, pick one:

- **Don't post (I'll post myself)**: nothing is sent.
- **Send to my TikTok inbox to post from the app**: the best choice for now. The video shows up in your TikTok app's notifications. Open it, add a sound or text if you like, and tap **Post**.
- **Post it straight away**: posts by itself. Until TikTok reviews your app (Part E), these posts are **private** (only you can see them).

When you post, turn on TikTok's **AI-generated content** label. TikTok asks creators to label AI-made videos.

## Part E (optional, later): Let Reelhouse post publicly by itself

TikTok has to approve your app first. This needs a website, a Terms of Service link and a Privacy Policy link, and a short screen recording that shows Reelhouse making and posting a video. TikTok usually answers within a couple of weeks.

1. On the developer page, switch from **Sandbox** to **Production**.
2. Fill in anything it marks as missing, then click **Submit for review**.
3. When approved, copy the **Production** Client key and Client secret into `.env.local` (Part B again), restart Reelhouse, and do Part C once more.

Ask for help when you get here. We can make the pages and the recording together.

---

## Optional: a password for your studio

While the `Connect TikTok` window is open, your studio can be reached from the internet at that random address. It's hard to guess and only lasts a few minutes, so most people skip this. If you'd like a password anyway:

1. Open `.env.local` in Notepad.
2. After `REELHOUSE_PASSWORD=`, type a password. Save, and restart Reelhouse.
3. The studio now asks for a user name and password. The user name is `reelhouse`.

You can delete the password again after Part C (then restart Reelhouse).

## If something goes wrong

| What you see | What to do |
| --- | --- |
| The Shipping Dock says TikTok is "Not set up" | The codes aren't in `.env.local`, or you didn't restart Reelhouse after Part B. |
| TikTok says **redirect_uri** is wrong | The address in Part C step 5 doesn't match. Copy the address from the `Connect TikTok` window again, add `/api/tiktok/callback`, and save it on the developer page. |
| TikTok says the app or account isn't allowed | Your TikTok account isn't a target user of the sandbox (Part A, step 7), or you copied the Production codes instead of the Sandbox codes. |
| The `Connect TikTok` window says Reelhouse is not running | Double-click **Start Reelhouse** first and wait for the studio to open. |
| "This site can't be reached" on the `.trycloudflare.com` address | The `Connect TikTok` window was closed, or it's still starting. Wait 30 seconds, or run it again (you'll get a new address). |
| The TikTok card says "Connecting TikTok failed" | Click **Connect TikTok** again. If it keeps failing, check the activity log in the studio and send a screenshot. |
