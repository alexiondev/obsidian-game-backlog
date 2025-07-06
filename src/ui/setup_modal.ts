import GameBacklogPlugin from "main";
import { Modal, App, ButtonComponent, ExtraButtonComponent, Setting, TextComponent } from "obsidian";
import { GameBacklogSettings } from "settings";
import { SettingsFactory } from "./settings_helper";

export class SetupModal extends Modal {
    plugin: GameBacklogPlugin;
    close_cb: (cancelled: boolean) => void;
    current_page: number;
    pages: (()=>any)[];

    constructor(app: App, plugin: GameBacklogPlugin) {
        super(app);
        this.plugin = plugin;

        this.pages = [];
        this.pages.push(() => {
            this.setContent("Hello world!");
            let factory = new SettingsFactory(this.plugin, this.app, this);
            factory.add(this.contentEl)
                .setName("Steam API key")
                .add_text("steam_api_key")
            factory.add(this.contentEl)
                .add_button("Get API key", this.plugin.settings.steam_api_key.length == 0, () => {
                    window.open("https://steamcommunity.com/dev/apikey");
                })
            factory.add(this.contentEl)
                .setName("Steam user ID")
                .setDesc("This is steamID64 (Dec)")
                .add_text("steam_user_id");
            factory.add(this.contentEl)
                .add_button("Lookup Steam user ID", false, () => {
                    window.open("https://www.steamidfinder.com");
                });
        });

        this.current_page = 0;
        this.display();
    }

    public display(): void {
        this.contentEl.empty();

        this.setTitle(`Game Backlog: Setup Wizard (${this.current_page+1}/${this.pages.length})`);
        this.pages[this.current_page]();

        let factory = new SettingsFactory(this.plugin, this.app, this);
        let buttons = factory.add(this.contentEl);
        if (this.pages.length <= this.current_page + 1) {
            buttons.add_button("Finish", true,() => {
                this.plugin.update_settings({run_setup: false});
                this.close();
            });
        } else {
            buttons.add_button("Next", true, () => {
                this.current_page += 1;
                this.display();
            });
        }

        if (this.current_page == 0) {
            buttons.add_button("Cancel", false, () => {
                this.close();
            });
        } else {
            buttons.add_button("Previous", false, () => {
                this.current_page -= 1;
                this.display();
            })
        }
    }
}