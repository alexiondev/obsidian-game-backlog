import { UpdateBacklogCmd } from 'commands/backlog';
import { RewriteAllCmd } from 'commands/basic';
import { ManageIgnoreListCmd } from 'commands/ignore_list';
import { SteamImportCmd, SteamUpdateCmd, SteamWishlistCmd } from 'commands/steam';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, requestUrl, RequestUrlParam, RequestUrlResponse, RequestUrlResponsePromise, Setting } from 'obsidian';
import { GameBacklogSettings, kDefaultGameBacklogSettings, GameBacklogSettingsTab } from 'settings';

function sleep(ms: number) {
	return new Promise(_ => setTimeout(_, ms));
}

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

	public async query(url: string, attempts: number = 3, delay: number = 100): Promise<RequestUrlResponse|null> {
		if (attempts <= 0) {
			return null;
		}

		if (this.query_cache.has(url)) {
			return this.query_cache.get(url);
		}

		let request: RequestUrlParam = {
			url: url,
			throw: false,
		};

		let resp = await requestUrl(request);
		switch (resp.status) {
			case 200:
				this.query_cache.set(url, resp);
				return resp;
			case 429: // Rate limiting
				sleep(delay);
				return this.query(url, attempts - 1, delay*2);
		}

		return null;
	}
}
