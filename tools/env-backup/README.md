# env-backups

[![Tests](https://github.com/dash-/env-backups/actions/workflows/test.yml/badge.svg)](https://github.com/dash-/env-backups/actions/workflows/test.yml)

Simple backup utility for `.env` files and directories across multiple projects.

## Why?

`.env` files are easy to accidentally overwrite or corrupt—whether it's an AI coding assistant that gets a bit too creative, a botched sed command, or a rogue `> .env` instead of `>> .env`. And since they're (rightly) excluded from version control, you can't just `git checkout` your way out of trouble. This tool keeps rolling backups so you can recover quickly when things go wrong.

## Features

- Backs up `.env` files and directories to a central location
- Detects changes using SHA-256 hashing (skips unchanged files/directories)
- Archives previous versions with timestamps when changes are detected
- Directory backups use deterministic tarballs for reliable change detection

## Installation (macOS)

1. Clone this repo and set up your `config.json` (see [Configuration](#configuration) below)

2. Run the install script:
   ```bash
   ./install.sh
   ```

This will:
- Add `env-backup` command to your PATH (via `~/bin`)
- Schedule daily backups at 9 AM using launchd

To uninstall:
```bash
./uninstall.sh
```

### Manual commands

```bash
env-backup                              # Run backup manually
launchctl start com.env-backup.daily    # Trigger scheduled backup now
launchctl list | grep env-backup        # Check if job is loaded
```

## Usage

```bash
node backup.js
```

Or with a custom config path:

```bash
ENV_BACKUP_CONFIG=/path/to/config.json node backup.js
```

## Configuration

Copy `config.example.json` to `config.json` and edit. The config file supports [JSON5](https://json5.org/) format, so you can use comments and trailing commas:

```json5
{
  "backups": [
    {
      // File backup
      "name": "my-app-env",
      "source": "/path/to/my-app/.env",
      "latest": "/path/to/env-backups/latest/my-app/.env",
      "archiveDir": "/path/to/env-backups/archives/my-app",
    },
    {
      // Directory backup (stored as .tar.gz)
      "name": "my-app-config",
      "source": "/path/to/my-app/config",
      "latest": "/path/to/env-backups/latest/my-app/config",
      "archiveDir": "/path/to/env-backups/archives/my-app-config",
    },
  ],
}
```

| Field | Description |
|-------|-------------|
| `name` | Identifier for the backup entry |
| `source` | Path to the file or directory to back up |
| `latest` | Where to store the latest backup (directories get `.tar.gz` appended automatically) |
| `archiveDir` | Directory for timestamped archives |

### Directory Backups

When the source is a directory, it's backed up as a gzipped tarball. The tool creates deterministic archives so that identical directory contents produce identical hashes, avoiding false change detection.

For fully deterministic tarballs on macOS, install GNU tar:

```bash
brew install gnu-tar
```

Without GNU tar, the tool falls back to BSD tar with a workaround, but file modification times may cause hash differences even when content is unchanged.

## Development

```bash
npm install    # Install dev dependencies
npm test       # Run tests
```
