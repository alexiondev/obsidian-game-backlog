import { UpdateBacklogCmd } from 'commands/backlog';
import { RewriteAllCmd } from 'commands/basic';
import { ManageIgnoreListCmd } from 'commands/ignore_list';
import { SteamImportCmd, SteamUpdateCmd, SteamWishlistCmd } from 'commands/steam';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, requestUrl, Setting } from 'obsidian';
import { GameBacklogSettings, kDefaultGameBacklogSettings, GameBacklogSettingsTab } from 'settings';

export default class GameBacklogPlugin extends Plugin {
	settings: GameBacklogSettings;
	query_cache: Map<string, any> = new Map();

	async onload() {
		this.settings = Object.assign(kDefaultGameBacklogSettings, (await this.loadData()));
		this.addSettingTab(new GameBacklogSettingsTab(this.app, this));

		const command_prefix = "backlog";

		UpdateBacklogCmd.with_prefix(this, command_prefix);

		// Ignore list
		ManageIgnoreListCmd.with_prefix(this, command_prefix);


		// Temporary debugging commands
		// Basic
		RewriteAllCmd.with_prefix(this, command_prefix);

		// Steam
		SteamImportCmd.with_prefix(this, command_prefix);
		SteamUpdateCmd.with_prefix(this, command_prefix);
		SteamWishlistCmd.with_prefix(this, command_prefix);

		console.log("GameBacklog loaded!");
	}

	onunload() {
		console.log("GameBacklog unloaded...");
	}

	async update_settings(settings: Partial<GameBacklogSettings>) {
		console.log(settings);
		Object.assign(this.settings, settings);
		await this.saveData(this.settings);
	}

	public async query(url: string): Promise<any> {
		if (this.query_cache.has(url)) {
			return this.query_cache.get(url);
		}

		try {
			let resp = await requestUrl(url);
			if (resp.status === 200) {
				this.query_cache.set(url, resp);
			}

			return resp;
		} catch (e) {
			console.error(e);
		}	
	}
}

