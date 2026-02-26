# Trinity Sound - Release Build Guide

## Prerequisites

1. **Flutter SDK** installed and in PATH
2. **Android SDK** with build tools and API 34
3. **Java JDK 17** installed
4. **Android Studio** (optional, for testing)

## Step 1: Generate Upload Keystore

Run the following command to generate a keystore for signing your release builds:

```bash
keytool -genkey -v -keystore ~/upload-keystore.jks \
  -storetype JKS \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -alias upload \
  -dname "CN=Trinity Sound, OU=Mobile, O=Trinity Sound, L=Maseru, ST=Maseru, C=LS"
```

**Important:** Keep this keystore file secure. If lost, you cannot upload updates to the Play Store.

## Step 2: Configure key.properties

Edit `android/key.properties` with your actual keystore details:

```properties
storePassword=<your-keystore-password>
keyPassword=<your-key-password>
keyAlias=upload
storeFile=<path-to-keystore>/upload-keystore.jks
```

**Never commit this file to version control.** It's already in `.gitignore`.

## Step 3: Build the App Bundle (AAB)

```bash
cd /path/to/mobile

# Clean previous builds
flutter clean

# Get dependencies
flutter pub get

# Build release AAB for Play Store
flutter build appbundle --release

# The AAB will be at:
# build/app/outputs/bundle/release/app-release.aab
```

## Step 4: Build APK (for testing only)

```bash
# Build release APK for testing
flutter build apk --release

# Build split APKs per ABI (smaller size)
flutter build apk --split-per-abi --release

# APKs will be at:
# build/app/outputs/flutter-apk/app-release.apk
# build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
# build/app/outputs/flutter-apk/app-armeabi-v7a-release.apk
# build/app/outputs/flutter-apk/app-x86_64-release.apk
```

## Step 5: Test the Release Build

```bash
# Install release APK on connected device
flutter install --release

# Or install specific APK
adb install build/app/outputs/flutter-apk/app-arm64-v8a-release.apk
```

## Step 6: Upload to Play Store

1. Go to [Google Play Console](https://play.google.com/console)
2. Create a new app or select existing
3. Navigate to **Release** > **Production** (or **Internal testing** first)
4. Upload the AAB file: `build/app/outputs/bundle/release/app-release.aab`
5. Fill in release notes
6. Submit for review

## Play Store Checklist

Before submitting, ensure you have:

- [ ] **Privacy Policy URL** — Host the `privacy-policy.html` file at a public URL and add it in Play Console
- [ ] **App Icon** — 512x512 PNG high-res icon uploaded to Play Console
- [ ] **Feature Graphic** — 1024x500 PNG uploaded to Play Console
- [ ] **Screenshots** — At least 2 phone screenshots (1080x1920)
- [ ] **Store Listing** — Fill in title, short description, full description (see `PLAY_STORE_LISTING.md`)
- [ ] **Content Rating** — Complete the IARC questionnaire
- [ ] **Data Safety** — Complete the data safety form (see `PLAY_STORE_LISTING.md`)
- [ ] **Target Audience** — Set to 18+ (business app)
- [ ] **App Category** — Set to "Business"
- [ ] **Contact Details** — Add developer email and phone
- [ ] **App Signing** — Enroll in Google Play App Signing (recommended)

## Versioning

Update version in `pubspec.yaml` before each release:

```yaml
version: 1.0.0+1  # version_name+version_code
```

- **version_name** (1.0.0): Displayed to users
- **version_code** (+1): Must be incremented for each upload

## Troubleshooting

### Build fails with "keystore not found"
Ensure the path in `key.properties` is absolute and the file exists.

### ProGuard issues
If the release build crashes but debug works, check `android/app/proguard-rules.pro` and add keep rules for any problematic classes.

### 64-bit requirement
The build is configured to include `arm64-v8a` by default. The AAB format handles this automatically.

### App rejected for target SDK
Ensure `android/app/build.gradle` has `targetSdk 34` or higher (current minimum for new apps on Play Store).

### App rejected for missing privacy policy
Host `privacy-policy.html` at a public URL and add it in both:
1. Play Console > Store settings > Privacy policy
2. Play Console > App content > Privacy policy
