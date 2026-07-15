# Installing MakeDreamHomes on an Android phone

Step-by-step guide to build the app and install it on a physical Android
phone, using **Android Studio** (and a command-line alternative).

This project is **Ionic React + Capacitor**. Android Studio builds only the
native shell — the actual app UI is the web build in `dist/`, copied into the
Android project by `npx cap sync`. So there is always a **web build step first**,
then the **native build/install step**.

---

## 0. Prerequisites (already set up on this machine)

| Tool           | Where / version                                                       |
| -------------- | --------------------------------------------------------------------- |
| Node           | v22 (`node -v`)                                                       |
| Android Studio | `/opt/android-studio` (launch: `android-studio`)                      |
| Android SDK    | `/home/csolution/Android/Sdk` (platform 36, build-tools 36)           |
| **JDK 21**     | bundled with Android Studio: `/opt/android-studio/android-studio/jbr` |

> ⚠️ **Capacitor 8 requires JDK 21.** The system default `java` is 17, which
> fails with `invalid source release: 21`. Android Studio's bundled JDK (JBR)
> is 21, so building **through Android Studio just works**. For command-line
> builds you must point `JAVA_HOME` at the bundled JDK 21 (see Part 5).

`android/local.properties` already points Gradle at the SDK:

```
sdk.dir=/home/csolution/Android/Sdk
```

---

## Part 1 — Build the web app and sync it into Android

Run these **every time you change the app's code** (TypeScript/React/CSS).
Android Studio does **not** do this for you.

```bash
cd /var/www/html/clerisy-solutions/MakeDreamHomesApp
npm install          # first time only
npm run build        # compiles the web app into dist/
npx cap sync android # copies dist/ + plugins into the android/ project
```

---

## Part 2 — Prepare the phone (one time)

1. **Settings → About phone** → tap **"Build number" 7 times**.
   You'll see "You are now a developer!".
2. **Settings → System → Developer options** → turn **ON**:
   - **USB debugging**
   - (optional) **Install via USB**
3. Keep the phone unlocked for the next step.

---

## Part 3 — Plug in the phone

1. Connect the phone to the computer with a **USB data cable** (not a
   charge-only cable).
2. On the phone, if a **"Allow USB debugging?"** dialog appears, tick
   **"Always allow from this computer"** and tap **Allow**.
3. If prompted for a **USB mode**, choose **File Transfer (MTP)** — plain
   "Charging only" sometimes hides the device.
4. Verify the computer sees it:
   ```bash
   ~/Android/Sdk/platform-tools/adb devices
   ```
   You should see your device id followed by `device`:
   ```
   List of devices attached
   ABCD1234    device
   ```
   - `unauthorized` → you haven't tapped **Allow** on the phone yet.
   - nothing listed → try another cable/port, or run
     `adb kill-server && adb start-server`.

---

## Part 4 — Build & install with Android Studio (GUI)

1. **Launch Android Studio:**
   ```bash
   android-studio &
   ```
2. **Open the Android project (not the repo root):**
   `File → Open` → select the folder
   `/var/www/html/clerisy-solutions/MakeDreamHomesApp/android` → **OK**.
   Wait for **"Gradle sync"** to finish (bottom status bar).
3. **Confirm the Gradle JDK is 21** (one time):
   `File → Settings → Build, Execution, Deployment → Build Tools → Gradle`
   → set **Gradle JDK** to the embedded **jbr-21** (or "Embedded JDK 21").
   Click **OK**. (It's the default, but confirm if a build ever fails with
   `invalid source release: 21`.)
4. **Pick your device:** in the toolbar device dropdown (top, next to the Run
   button) select your phone by name.
5. **Run:** click the green **▶ Run** button (or press **Shift + F10**).
   Android Studio builds the APK, installs it, and launches it on the phone.
6. First launch on the phone may show **"Install blocked"** / Play Protect —
   choose **Install anyway** (this is a debug build, not from the Play Store).

That's it — the **MakeDreamHomes** app icon will be on the phone.

---

## Part 5 — Command-line alternative (no GUI)

From the app root, after Part 1 (build + sync):

```bash
cd /var/www/html/clerisy-solutions/MakeDreamHomesApp/android

# Point at the bundled JDK 21 and the SDK
export JAVA_HOME=/opt/android-studio/android-studio/jbr
export ANDROID_HOME=/home/csolution/Android/Sdk
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH

# Build the debug APK
./gradlew assembleDebug

# Install onto the connected phone (-r = replace if already installed)
adb install -r app/build/outputs/apk/debug/app-debug.apk

# (optional) launch it
adb shell monkey -p com.makedreamhomes.app 1
```

The APK is written to:
`android/app/build/outputs/apk/debug/app-debug.apk`

You can also copy that `.apk` file directly onto the phone (e.g. via USB file
transfer or a messaging app) and tap it to install — no cable/adb needed.

Shortcut: `npx cap run android` does build-sync-install in one command once a
device is connected.

---

## Part 6 — Make the app reach the backend API

The app talks to the NestJS API over the local network. On a phone,
`localhost` means the _phone itself_, so the app is configured with the dev
machine's **LAN IP** in `.env.local`:

```
VITE_API_URL=http://192.168.1.46:8080/api/v1
VITE_STORAGE_PUBLIC_URL=http://192.168.1.46:8080/
```

For the app to work on the phone:

1. The **phone and this computer must be on the same Wi-Fi/LAN**.
2. This machine's IP must match the one above. Check with `hostname -I`
   (currently `192.168.1.46`). If it changed, update `.env.local` and redo
   Part 1 (rebuild + sync + reinstall).
3. The **API server must be running** on port 8080
   (`MakeDreamHomesAPI`). Verify from the phone's browser by visiting
   `http://192.168.1.46:8080/api/v1` — you should get a response (a 404 on the
   bare path is normal; it means the server is up).

> Note: the app uses `http://` (not https). Capacitor's Android WebView allows
> cleartext to the configured host by default for debug builds, so this works
> for local testing.

---

## Troubleshooting

| Symptom                                | Fix                                                                                     |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `invalid source release: 21`           | Gradle used JDK 17. Set Gradle JDK to jbr-21 (Part 4.3) or export `JAVA_HOME` (Part 5). |
| `adb: no devices/emulators found`      | Phone not authorized. Re-check Part 3; tap **Allow** on the phone.                      |
| Device shows `unauthorized`            | Unlock phone, tap **Allow USB debugging**, re-run `adb devices`.                        |
| App opens but shows a blank/old screen | You forgot Part 1 — run `npm run build && npx cap sync android`, then reinstall.        |
| Network error / can't log in           | API not running, wrong LAN IP, or phone on different Wi-Fi — see Part 6.                |
| Play Protect blocks install            | Tap **Install anyway** (debug build).                                                   |
