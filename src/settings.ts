import GameBacklogPlugin from "main";
import { PluginSettingTab, App } from "obsidian";
import { SettingsHelper } from "ui/settings_helper";

export interface GameBacklogSettings {
    notes_directory: string,
    steam_enable: boolean
    steam_api_key: string
    steam_user_id: string
}

export const kDefaultGameBacklogSettings: GameBacklogSettings = {
    notes_directory: "games",
    steam_enable: true,
    steam_api_key: "",
    steam_user_id: "",
}

export class GameBacklogSettingsTab extends PluginSettingTab {
	constructor(app: App, private plugin: GameBacklogPlugin) {
		super(app, plugin);
	}

	public display(): void {
		const helper = new SettingsHelper(this.app, this.containerEl);

        helper.directory("Game notes folder",
            "Folder where game notes are stored.",
            kDefaultGameBacklogSettings.notes_directory,
            this.plugin.settings.notes_directory,
            (new_folder: string) => {
                this.plugin.update_settings({notes_directory: new_folder});
            }
        );

		helper.header("Steam");
		helper.toggle("Enable integration with Steam APIs", 
			"", 
			this.plugin.settings.steam_enable, 
			(new_value: boolean) => { 
				this.plugin.update_settings({steam_enable: new_value}); 
				this.display();
			}
		);

		if (this.plugin.settings.steam_enable) {
			helper.text("Steam API key", 
				"https://steamcommunity.com/dev/apikey",
				kDefaultGameBacklogSettings.steam_api_key,
				this.plugin.settings.steam_api_key,
				(new_value: string) => {
					this.plugin.update_settings({steam_api_key: new_value});
					this.display();
				}
			);

            helper.text("Steam User ID",
                "Profile needs to be public.",
                kDefaultGameBacklogSettings.steam_user_id,
                this.plugin.settings.steam_user_id,
                (new_value: string) => {
                    this.plugin.update_settings({steam_user_id: new_value});
                    this.display();
                }
            );
		}
	}
}