import GameBacklogPlugin from "main";
import { Modal, App, ButtonComponent, ExtraButtonComponent, TextComponent } from "obsidian";
import { Setting, SettingsFactory } from "./settings_helper";

function clone(value: any): any {
    return JSON.parse(JSON.stringify(value));
}

export class IgnoreListModal extends Modal {
    plugin: GameBacklogPlugin;
    loaded: [string, string][];
    
    constructor(app: App, plugin: GameBacklogPlugin) {
        super(app);
        this.plugin = plugin;
        this.loaded = clone(this.plugin.settings.ignore_list);

        this.display();
    }

    public display(): void {
        this.setTitle("Ignore list");
        this.contentEl.empty();

        let factory = new SettingsFactory(this.plugin, this.app, this);

        // Display the loaded ignore list.
        this.loaded.forEach((entry: [string, string], index: number) => {
            factory.add(this.contentEl)
                .add_raw_text(
                    "",
                    entry[0],
                    (new_value: string) => {
                        this.loaded[index][0] = new_value;
                    })
                .add_raw_text(
                    "",
                    entry[1],
                    (new_value: string) => {
                        this.loaded[index][1] = new_value;
                    })
                .add_extra_button(
                    "trash-2", 
                    () => {
                        this.loaded.remove(entry);
                        this.display();
                    });
        });

        // Add a new entry
        let new_entry: [string, string] = ["", ""]
        factory.add(this.contentEl)
            .add_raw_text(
                "appid",
                "",
                (new_value: string) => new_entry[0] = new_value)
            .add_raw_text(
                "game name",
                "",
                (new_value: string) => new_entry[1] = new_value)
            .add_extra_button(
                "plus",
                () => {
                    this.loaded.push(new_entry);
                    this.display();
                });

        // Save and Cancel buttons
        factory.add(this.contentEl)
            .add_button(
                "Save", 
                true, 
                () => {
                    this.close();
                    this.plugin.update_settings({ignore_list: this.loaded});
                })
            .add_button(
                "Cancel",
                false,
                () => {
                    this.close();
                });
    }
}