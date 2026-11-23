# Posting to YouTube Shorts (optional)

Reelhouse can upload each finished video to your YouTube channel as a Short. It uses Google's official YouTube Data API. It is **off** until you do the steps below, and you can switch it off or disconnect any time in the **Shipping Dock**.

It takes about 15 minutes, once. You need the Google account that owns your YouTube channel.

## Two things to know first

- **Uploads start out private.** Google keeps every video uploaded by a new, unverified project private (only you can see it). You can make each one public in YouTube Studio with one click. To make uploads public automatically, you have to ask Google to verify your project (an "audit"), which can take weeks.
- **About 6 uploads a day.** A new project gets 10,000 "quota units" a day and one upload costs about 1,600, so roughly 6 videos a day. The count resets at midnight Pacific time. Reelhouse makes 1 a day by default, so this is plenty.

## Step 1: Make a Google Cloud project

1. Go to <https://console.cloud.google.com/> and sign in with the Google account that owns your channel.
2. At the top, click the project picker, then **New project**. Name it `Reelhouse` and click **Create**. Make sure it is selected.

## Step 2: Turn on the YouTube API

1. Open <https://console.cloud.google.com/apis/library/youtube.googleapis.com>.
2. Click **Enable**.

## Step 3: Set up the sign-in screen

1. Open **Google Auth Platform** (in the menu, or <https://console.cloud.google.com/auth/overview>) and click **Get started**.
2. App name: `Reelhouse`. Support email: your email. Click **Next**.
3. Audience: choose **External**. Click **Next**, add your email as the contact, agree, and click **Create**.
4. Go to **Audience** and under **Test users** click **Add users**. Add the Gmail address that owns your YouTube channel and save.
5. Go to **Data Access**, click **Add or remove scopes**, search for `youtube.upload`, tick it, click **Update**, then **Save**.

## Step 4: Get your keys

1. Go to **Clients** and click **Create client**.
2. Application type: **Web application**. Name: `Reelhouse`.
3. Under **Authorized redirect URIs**, click **Add URI** and paste exactly:

   ```
   http://localhost:3000/api/youtube/callback
   ```

4. Click **Create**. Copy the **Client ID** and **Client secret**.

## Step 5: Tell Reelhouse

1. Open the `.env.local` file in your Reelhouse folder (copy `.env.example` to `.env.local` if you don't have one yet).
2. Add these two lines with your values:

   ```
   YOUTUBE_CLIENT_ID=paste-the-client-id
   YOUTUBE_CLIENT_SECRET=paste-the-client-secret
   ```

3. Close Reelhouse and start it again.

## Step 6: Connect your channel

1. Open Reelhouse **on the same computer** at <http://localhost:3000> (Google only allows this address for the sign-in).
2. Click the **Shipping Dock**, then **Connect YouTube**.
3. Pick your Google account. Google will warn **"Google hasn't verified this app"**. That's expected because it's your own app: click **Continue**, then allow uploads.
4. Back in Reelhouse, choose what happens **After each video**: don't upload, private, unlisted or public.

Each finished video gets a **Upload to YouTube** button too, for uploading by hand.

## Good to know

- **Sign-in expires every 7 days while the project is in "Testing".** If uploads start failing with "sign-in expired", click **Connect YouTube** again. To stop that, go to **Audience** and click **Publish app**. For a personal tool you can do this without a full review; Google may still show the "unverified" warning when you sign in.
- Videos are labelled as **altered or synthetic content** (the story and voice are AI-made), which YouTube asks for. Titles end with `#Shorts`.
- Reelhouse never sees your Google password. The keys stay in `.env.local` on your computer.
- To disconnect, click **Disconnect** in the Shipping Dock. You can also remove access at <https://myaccount.google.com/permissions>.
