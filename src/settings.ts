import GameBacklogPlugin from "main";
import { PluginSettingTab, App, ButtonComponent } from "obsidian";
import { IgnoreListModal } from "ui/ignore_list_modal";
import { SettingsFactory } from "ui/settings_helper";

export interface GameBacklogSettings {
    notes_directory: string
	ignore_list: [string, string][]

    steam_enable: boolean
    steam_api_key: string
    steam_user_id: string
	steam_include_free_to_play: boolean
	steam_include_wishlist: boolean
	steam_import_genres: boolean;

	run_setup: boolean
}

export type SettingsKey = keyof GameBacklogSettings;
export type StringSettingsKey = {
	[K in keyof GameBacklogSettings]: GameBacklogSettings[K] extends string ? K : never
}[keyof GameBacklogSettings];
export type BooleanSettingsKey = {
	[K in keyof GameBacklogSettings]: GameBacklogSettings[K] extends boolean ? K : never
}[keyof GameBacklogSettings];

export const kDefaultGameBacklogSettings: GameBacklogSettings = {
    notes_directory: "games",
	ignore_list: [],

    steam_enable: true,
    steam_api_key: "",
    steam_user_id: "",
	steam_include_free_to_play: true,
	steam_include_wishlist: true,
	steam_import_genres: true,

	run_setup: true,
}

export class GameBacklogSettingsTab extends PluginSettingTab {
	constructor(app: App, private plugin: GameBacklogPlugin) {
		super(app, plugin);
	}

	public display(): void {
		this.containerEl.empty();
		let factory = new SettingsFactory(this.plugin, this.app, this);

		factory.add(this.containerEl)
			.setName("Game notes folder")
			.setDesc("Folder where game notes are stored.")
			.add_directory("notes_directory");
		factory.add(this.containerEl)
			.setName("Ignore list")
			.add_button("Manage", /*cta=*/true, () => {
				new IgnoreListModal(this.app, this.plugin).open()});
		
		factory.add(this.containerEl)
			.setName("Steam")
			.setHeading();
		factory.add(this.containerEl)
			.setName("Enable integration with Steam")
			.add_toggle("steam_enable");

		if (this.plugin.settings.steam_enable) {
			factory.add(this.containerEl)
				.setName("Include free-to-play")
				.add_toggle("steam_include_free_to_play");
			factory.add(this.containerEl)
				.setName("Include wishlist")
				.add_toggle("steam_include_wishlist");
			factory.add(this.containerEl)
				.setName("Import genres")
				.add_toggle("steam_import_genres");
			factory.add(this.containerEl)
				.setName("Steam API key")
				.add_text("steam_api_key");
			factory.add(this.containerEl)
				.setName("Steam user ID")
				.setDesc("Profile needs to be public.")
				.add_text("steam_user_id");
		}

		factory.add(this.containerEl)
			.setName("DEBUG ZONE")
			.setHeading();
		factory.add(this.containerEl)
			.setName("Run setup")
			.setDesc("Run setup menu next invocation.")
			.add_toggle("run_setup");
	}
}