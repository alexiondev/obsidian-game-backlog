import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { GameBacklogSettings, kDefaultGameBacklogSettings } from 'settings';
import { SettingsHelper } from 'ui/settings_helper';

export default class GameBacklogPlugin extends Plugin {
	settings: GameBacklogSettings;

	async onload() {
		this.settings = Object.assign(kDefaultGameBacklogSettings, (await this.loadData()));
		this.addSettingTab(new GameBacklogSettingsTab(this.app, this));

		console.log("GameBacklog loaded!");
	}

	onunload() {
		console.log("GameBacklog unloaded...");
	}

	async update_settings(settings: Partial<GameBacklogSettings>) {
		Object.assign(this.settings, settings);
		await this.saveData(this.settings);
	}
}

class GameBacklogSettingsTab extends PluginSettingTab {
	constructor(app: App, private plugin: GameBacklogPlugin) {
		super(app, plugin);
	}

	public display(): void {
		const helper = new SettingsHelper(this.app, this.containerEl);

		helper.header("test 124");
	}
}