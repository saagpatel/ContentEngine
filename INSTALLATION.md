# ContentEngine Installation Guide

## System Requirements

### macOS
- macOS 10.13 (High Sierra) or later
- 100MB free disk space

### Windows
- Windows 10 or later (64-bit)
- 100MB free disk space

### Linux
- Ubuntu 18.04+ / Debian 10+ / Fedora 30+ / Arch Linux
- 100MB free disk space
- GTK 3.24+ (usually pre-installed)

## Installation

### macOS

1. Download `ContentEngine-macos-universal.dmg` from the [latest release](https://github.com/YOUR_USERNAME/ContentEngine/releases/latest)
2. Open the `.dmg` file
3. Drag **ContentEngine** to your **Applications** folder
4. Launch from Applications or Spotlight

**First Launch:** Right-click the app and select "Open" to bypass Gatekeeper if you see a security warning.

### Windows

1. Download `ContentEngine-windows-x64.msi` from the [latest release](https://github.com/YOUR_USERNAME/ContentEngine/releases/latest)
2. Run the installer
3. Follow the setup wizard
4. Launch from Start Menu or Desktop shortcut

**Windows Defender:** You may need to allow the app through SmartScreen on first run.

### Linux

1. Download `ContentEngine-linux-x64.AppImage` from the [latest release](https://github.com/YOUR_USERNAME/ContentEngine/releases/latest)
2. Make it executable:
   ```bash
   chmod +x ContentEngine-linux-x64.AppImage
   ```
3. Run the AppImage:
   ```bash
   ./ContentEngine-linux-x64.AppImage
   ```

**Optional:** Integrate with your desktop environment using [AppImageLauncher](https://github.com/TheAssassin/AppImageLauncher).

## Setup

### 1. Get Your Claude API Key

1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Sign up or log in
3. Navigate to **API Keys**
4. Create a new API key
5. Copy the key (starts with `sk-ant-`)

### 2. Configure ContentEngine

1. Launch ContentEngine
2. Click the **Settings** icon (⚙️) in the sidebar
3. Paste your Claude API key
4. Click **Save**

Your API key is stored securely on your device (see [PRIVACY.md](PRIVACY.md)).

## Troubleshooting

### macOS: "ContentEngine can't be opened because it is from an unidentified developer"

**Solution:** Right-click the app → **Open** → Click **Open** in the dialog

### Windows: "Windows protected your PC"

**Solution:** Click **More info** → **Run anyway**

### Linux: Missing dependencies

If the AppImage fails to launch:

```bash
# Ubuntu/Debian
sudo apt-get install libwebkit2gtk-4.1-0 libappindicator3-1

# Fedora
sudo dnf install webkit2gtk4.1 libappindicator-gtk3

# Arch
sudo pacman -S webkit2gtk libappindicator-gtk3
```

### API Key Not Working

- Verify the key starts with `sk-ant-`
- Check you have sufficient credits at [console.anthropic.com](https://console.anthropic.com/)
- Ensure you're connected to the internet

### Data Location

See [PRIVACY.md](PRIVACY.md) for data storage locations.

## Uninstallation

### macOS
Drag ContentEngine from Applications to Trash, then:
```bash
rm -rf ~/Library/Application\ Support/com.contentengine.app
```

### Windows
Use **Add or Remove Programs**, then delete:
```
%APPDATA%\com.contentengine.app
```

### Linux
Delete the AppImage and:
```bash
rm -rf ~/.config/com.contentengine.app
```

## Building from Source

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup instructions.
