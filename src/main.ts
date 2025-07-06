import { UpdateBacklogCmd } from 'commands/backlog';
import { RewriteAllCmd } from 'commands/basic';
import { Cmd } from 'commands/command';
import { ManageIgnoreListCmd } from 'commands/ignore_list';
import { SteamImportCmd, SteamUpdateCmd, SteamWishlistCmd } from 'commands/steam';
import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, requestUrl, RequestUrlParam, RequestUrlResponse, RequestUrlResponsePromise, setIcon } from 'obsidian';
import { abort } from 'process';
import { GameBacklogSettings, kDefaultGameBacklogSettings, GameBacklogSettingsTab } from 'settings';
import { Setting } from 'ui/settings_helper';

export default class GameBacklogPlugin extends Plugin {
	settings: GameBacklogSettings;
	query_cache: Map<string, any> = new Map();

	status_el: HTMLElement;

	update_backlog: Cmd;
	manage_ignore_list: Cmd;

	public async onload() {
		this.settings = Object.assign(kDefaultGameBacklogSettings, (await this.loadData()));
		this.addSettingTab(new GameBacklogSettingsTab(this.app, this));
		this.status_el = this.addStatusBarItem();
		this.update_status();

		const command_prefix = "backlog";

		this.update_backlog = UpdateBacklogCmd.with_prefix(this, command_prefix);

		// Ignore list
		this.manage_ignore_list = ManageIgnoreListCmd.with_prefix(this, command_prefix);

		// // Temporary debugging commands
		// // Basic
		// RewriteAllCmd.with_prefix(this, command_prefix);

		// // Steam
		// SteamImportCmd.with_prefix(this, command_prefix);
		// SteamUpdateCmd.with_prefix(this, command_prefix);
		// SteamWishlistCmd.with_prefix(this, command_prefix);

		console.log("GameBacklog loaded!");
	}

	public onunload() {
		console.log("GameBacklog unloaded...");
	}

	public update_status(status: string = "", cancel_cb?: ()=>any) {
		this.status_el.empty();

		const icon = this.status_el.createSpan();
		setIcon(icon, "gamepad-2");
		this.status_el.createSpan().style.width = "8px";

		const label = this.status_el.createSpan();
		if (status.length === 0) {
			label.setText("Idle");
			this.status_el.createSpan().style.width = "8px";

			const refresh_button = this.status_el.createEl("a", {
				cls: "clickable-icon"
			});
			setIcon(refresh_button, "refresh-cw");
			refresh_button.setAttr("aria-label", "Refresh game backlog");
			refresh_button.onclick = async () => {
				this.update_backlog.check(this.app, this.settings, false);
			};
			return;
		}

		label.setText(status);

		if (cancel_cb) {
			const abort_button = this.status_el.createEl("a", {
				cls: "clickable-icon"
			});
			setIcon(abort_button, "x");
			abort_button.setAttr("aria-label", "Abort current task");
			abort_button.onclick = async () => {
				cancel_cb();
			};
		}

	}
	
	public async update_settings(settings: Partial<GameBacklogSettings>) {
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
				await sleep(delay);
				return this.query(url, attempts - 1, delay*2);
		}

		return null;
	}
}
