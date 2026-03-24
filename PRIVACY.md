# Privacy Policy - ContentEngine

**Last Updated:** March 2026

## Overview

ContentEngine is a **local-first desktop application**. Your data stays on your device. We do not operate any servers, collect analytics, or transmit your content anywhere except to Anthropic's Claude API (when you generate content).

## Data Storage

All data is stored **locally on your device** in the following locations:

### macOS

```
~/Library/Application Support/com.contentengine.app/
```

### Windows

```
%APPDATA%\com.contentengine.app\
```

### Linux

```
~/.config/com.contentengine.app/
```

### What's Stored

1. **Database (`contentengine.db`)**
   - Your input content
   - Generated outputs
   - Brand voice profiles
   - Usage statistics

2. **Logs (`logs/`)**
   - Application logs (for debugging)
   - Daily rotation (auto-deleted after 7 days)
   - No personal identifiable information

3. **Exports (`exports/`)**
   - PDF files you export
   - Stored indefinitely until you delete them

4. **API Key**
   - Stored locally in `contentengine.db` (`app_settings` table)
   - Protected by your device account permissions and any full-disk encryption you enable

## Data Transmission

### To Anthropic (Claude API)

When you click "Generate", we send:

- Your input content
- Selected tone/length preferences
- Brand voice attributes (if selected)

We **DO NOT** send:

- Your API key (it's used for authentication only)
- Your usage statistics
- Any metadata about your device

### Response from Anthropic

We receive and store:

- Generated content for each platform
- Token usage count

### No Other Transmissions

- No analytics
- No crash reports
- No telemetry
- No third-party tracking

## Your API Key

Your Claude API key is:

- **Never** transmitted to our servers (we don't have any)
- Stored locally in `contentengine.db` (`app_settings` table)
- Only used to authenticate requests to Anthropic's API
- Displayed masked in the UI (`sk-ant-xxxx...yyyy`)

## Third-Party Services

### Anthropic Claude API

- **Purpose:** Generate repurposed content
- **Data Sent:** Your content, preferences
- **Privacy Policy:** [anthropic.com/privacy](https://www.anthropic.com/privacy)
- **You Control:** When and what content is sent

### No Other Services

We don't use:

- Google Analytics
- Crash reporting services
- Ad networks
- Social media integrations

## Your Rights

You have complete control over your data:

### Access

All your data is in plain SQLite format. You can access it directly at the storage locations above.

### Export

- Export individual content to PDF via the History page
- Copy the entire database file to back up all data

### Delete

- Delete individual items in the History page
- Delete all data by uninstalling (see [README.md](README.md#installation))

## Security

### Local Security

- Your data is only as secure as your device
- Enable full-disk encryption for maximum security
- Keep your operating system updated

### API Key Security

- API keys are stored locally in SQLite (`app_settings`)
- Use full-disk encryption for stronger at-rest protection
- Keys are never logged

## Updates

ContentEngine does not currently perform automatic update checks.
To update, install a newer release from GitHub:

- [Releases](https://github.com/saagar210/ContentEngine/releases)

## Children's Privacy

ContentEngine does not collect any personal information from anyone, including children under 13.

## Changes to This Policy

We'll notify you of significant privacy changes via:

- Release notes
- In-app notification

## Contact

Questions about privacy?

- Open an issue: [GitHub Issues](https://github.com/saagar210/ContentEngine/issues)

## Open Source

ContentEngine is open source. You can audit the code:

- Repository: [github.com/saagar210/ContentEngine](https://github.com/saagar210/ContentEngine)
- License: MIT
