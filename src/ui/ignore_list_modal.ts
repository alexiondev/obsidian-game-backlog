import GameBacklogPlugin from "main";
import { Modal, App, ButtonComponent, ExtraButtonComponent, Setting, TextComponent } from "obsidian";
import { SettingsHelper } from "./settings_helper";

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

    private display(): void {
        this.setTitle("Ignore list");
        this.contentEl.empty();

        // The current ignore list
        this.loaded.forEach((entry: [string, string], index: number) => {
            new Setting(this.contentEl)
                .addText((component: TextComponent) => {
                    component
                        .setValue(entry[0])
                        .onChange((new_value: string) => {
                            this.loaded[index][0] = new_value;
                        })})
                .addText((component: TextComponent) => {
                    component
                        .setValue(entry[1])
                        .onChange((new_value: string) => {
                        this.loaded[index][1] = new_value;
                    })})
                .addExtraButton((component: ExtraButtonComponent) => {
                    component
                        .setIcon("trash-2")
                        .onClick(() => {
                            this.loaded.remove(entry);
                            this.display();
                        })
                })
        });

        // Add new entry
        let new_entry: [string, string] = ["", ""]
        new Setting(this.contentEl)
            .addText((component: TextComponent) => component
                .setPlaceholder("appid")
                .onChange((new_value: string) => new_entry[0] = new_value))
            .addText((component: TextComponent) => component
                .setPlaceholder("name")
                .onChange((new_value: string) => new_entry[1] = new_value))
            .addExtraButton((component: ExtraButtonComponent) => {
                component
                    .setIcon("plus")
                    .onClick(() => {
                        this.loaded.push(new_entry);
                        this.display();
                    })
            });

        // Save and Cancel buttons
        new Setting(this.contentEl)
            .addButton((component: ButtonComponent) => {
                component
                    .setButtonText("Save")
                    .setCta()
                    .onClick(() => {
                        this.close();
                        this.plugin.update_settings({ignore_list: this.loaded});
                    })})
            .addButton((component: ButtonComponent) => {
                component
                    .setButtonText("Cancel")
                    .onClick(() => this.close())})
    }
}