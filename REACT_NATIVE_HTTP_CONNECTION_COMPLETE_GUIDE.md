# 🔧 React Native HTTP Connection Fix

## 🚨 Problem

-   **HTTP requests fail** on **physical Android devices** (error: "CLEARTEXT communication not permitted")
-   **Works fine on emulators** but fails on real devices
-   **Android API 28+** blocks HTTP traffic by default for security

## ✅ Quick Fix (3 steps)

---

### Step 1: Update `app.json`

```json
{
	"expo": {
		"android": {
			"usesCleartextTraffic": true
		},
		"plugins": [
			[
				"expo-build-properties",
				{
					"android": {
						"networkSecurityConfig": "./network_security_config.xml"
					}
				}
			]
		]
	}
}
```

### Step 2: Install Dependencies

```bash
npm install expo-build-properties
```

### Step 3: Create Network Security Config

Create `network_security_config.xml` in project root:

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="false">35.223.247.76</domain>
        <domain includeSubdomains="false">localhost</domain>
        <domain includeSubdomains="false">10.0.2.2</domain>
    </domain-config>
</network-security-config>
```

**IP Explanations:**
- `35.223.247.76`: _Replace with your production server IP_
- `localhost`: _For local development server_
- `10.0.2.2`: _Android emulator's address to reach host machine_

## 🏗️ Build & Test

**Recommended: Use local build (fastest)**

```bash
# Build and run on device
npx @expo/cli run:android
```

**Alternative: EAS Build (if needed)**

```bash
npx eas-cli build --platform android --profile preview
```

## ✅ Verify Fix

1. **Check logs**: No "CLEARTEXT communication not permitted" errors
2. **Test HTTP requests**: Should work on physical devices
3. **Status 400/404 responses are OK** - means connection works but needs auth

## 🔧 Troubleshooting

**Still getting cleartext errors?**

-   Make sure your server IP is in the `network_security_config.xml`
-   Rebuild the app after config changes

**Need to allow all HTTP? (less secure)**

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true" />
</network-security-config>
```

## 📱 Generate APK

**Option 1: EAS Build (Recommended)**

```bash
# Install EAS CLI if needed
npm install -g @expo/eas-cli

# Login to Expo
npx eas-cli login

# Build APK
npx eas-cli build --platform android --profile preview

# Download link will be provided when build completes
```

**Option 2: Local APK Build**

```bash
# Generate android folder only (without running app)
npx expo prebuild --platform android

# Navigate to android folder
cd android

# Generate release APK
./gradlew assembleRelease

# APK location: android/app/build/outputs/apk/release/app-release.apk
```

**Option 3: Development Build (Testing)**

```bash
# Build and install directly to connected device
npx @expo/cli run:android --device
```
