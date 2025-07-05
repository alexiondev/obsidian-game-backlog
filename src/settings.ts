import GameBacklogPlugin from "main";
import { PluginSettingTab, App, ButtonComponent } from "obsidian";
import { IgnoreListModal } from "ui/ignore_list_modal";
import { SettingsHelper } from "ui/settings_helper";

export interface GameBacklogSettings {
	debug: boolean,
    notes_directory: string
	ignore_list: [string, string][]
    steam_enable: boolean
    steam_api_key: string
    steam_user_id: string
	steam_include_free_to_play: boolean
}

export const kDefaultGameBacklogSettings: GameBacklogSettings = {
	debug: true,
    notes_directory: "games",
	ignore_list: [],
    steam_enable: true,
    steam_api_key: "",
    steam_user_id: "",
	steam_include_free_to_play: true,
}

export class GameBacklogSettingsTab extends PluginSettingTab {
	constructor(app: App, private plugin: GameBacklogPlugin) {
		super(app, plugin);
	}

	public display(): void {
		const helper = new SettingsHelper(this.app, this.containerEl);

		helper.toggle("Debug mode",
			"",
			this.plugin.settings.debug,
			(new_value: boolean) => {
				this.plugin.update_settings({debug: new_value});
				this.display();
			}
		);

		helper.button("Ignore list", "", "Manage", () => {
			new IgnoreListModal(this.app, this.plugin).open()
		}, /*cta=*/true);

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

            helper.text("Steam user ID",
                "Profile needs to be public.",
                kDefaultGameBacklogSettings.steam_user_id,
                this.plugin.settings.steam_user_id,
                (new_value: string) => {
                    this.plugin.update_settings({steam_user_id: new_value});
                    this.display();
                }
            );

			helper.toggle("Import F2P", 
				"Will include free-to-play games when importing from Steam.", 
				this.plugin.settings.steam_include_free_to_play,
				(new_value: boolean) => {
					this.plugin.update_settings({steam_include_free_to_play: new_value});
					this.display();
				}
			);
		}
	}
}