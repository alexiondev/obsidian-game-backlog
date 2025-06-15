# Obsidian Game Backlog Plugin 

Manage your gaming backlog using Obsidian! Works best with [Dataview](https://github.com/blacksmithgu/obsidian-dataview)!

## Installation

1. Download `main.js` and `manifest.json` from the latest release.
2. Copy the files downloaded into `$VAULT/.obsidian/plugins/obsidian-game-backlog` directory.
    - Create this directory if it doesn't exist.
3. Reload Obsidian.
4. Get a [Steam API key](https://steamcommunity.com/dev/apikey) and add it to the options.
5. Find your Steam user ID and add it to the options.

## Usage

If everything was set up correctly, the `Import games from Steam` command should now be able to query the Steam API to generate some games. 
- As of now, progress is only reported through the developer console (Ctrl + Shift + i).
- The plugin does not handle rate limiting, it will stop importing games once it hits the rate limit. Wait a few minutes and then run the command again for a large Steam library.

The `test_vault` included in this directory contains some examples of leveraging this plugin and Dataview (not installed in the vault).