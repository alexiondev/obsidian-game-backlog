import * as obsidian from "obsidian";
import { FolderSuggest } from "./folder_suggest";
import GameBacklogPlugin from "main";
import { BooleanSettingsKey, kDefaultGameBacklogSettings, StringSettingsKey } from "settings";

interface Container {
    display: () => void;
}

export class Setting extends obsidian.Setting {
    plugin: GameBacklogPlugin;
    app: obsidian.App;
    container: Container|null

    constructor(plugin: GameBacklogPlugin, app: obsidian.App, container: Container|null, containerEl: HTMLElement) {
        super(containerEl);
        this.plugin = plugin;
        this.app = app;
        this.container = container;
    }

    public add_raw_directory(placeholder: string, value: string, on_change: (new_folder: string) => any): Setting {
        this.addSearch((component: obsidian.SearchComponent) => {
            new FolderSuggest(this.app, component.inputEl);
            component
                .setPlaceholder(placeholder)
                .setValue(value)
                .onChange(on_change)});
            
        return this;
    }

    public add_directory(setting: StringSettingsKey): Setting {
        return this.add_raw_directory(
            kDefaultGameBacklogSettings[setting],
            this.plugin.settings[setting],
            (new_folder: string) => {
                this.plugin.update_settings({[setting]: new_folder})});
    }

    public add_raw_toggle(value: boolean, on_change: (new_value: boolean) => any): Setting {
        this.addToggle((component: obsidian.ToggleComponent) => {
            component
                .setValue(value)
                .onChange(on_change)});

        return this;
    }
    public add_toggle(setting: BooleanSettingsKey): Setting {
        return this.add_raw_toggle(
            this.plugin.settings[setting],
            (new_value: boolean) => {
                this.plugin.update_settings({[setting]:  new_value});

                if (this.container) {
                    this.container?.display();
                }
            });
    }

    public add_raw_text(placeholder: string, value: string, on_change: (new_value: string) => any): Setting {
        this.addText((component: obsidian.TextComponent) => {
            component
                .setPlaceholder(placeholder)
                .setValue(value)
                .onChange(on_change)});

        return this;
    }
    public add_text(setting: StringSettingsKey): Setting {
        return this.add_raw_text(
            kDefaultGameBacklogSettings[setting],
            this.plugin.settings[setting],
            (new_value: string) => {
                    this.plugin.update_settings({[setting]: new_value})});
    }
 
    public add_button(text: string, cta: boolean = false, on_click: () => any): Setting {
        this.addButton((component: obsidian.ButtonComponent) => {
            component
                .setButtonText(text)
                .onClick(on_click);
            if (cta) {
                component.setCta();
            }
        });

        return this;
    }
    
    public add_extra_button(icon: obsidian.IconName, on_click: () => any): Setting {
        this.addExtraButton((component: obsidian.ExtraButtonComponent) => {
            component
                .setIcon(icon)
                .onClick(on_click);
        });

        return this;
    }
}

export class SettingsFactory {
    plugin: GameBacklogPlugin;
    app: obsidian.App;
    container: Container;

    constructor(plugin: GameBacklogPlugin, app: obsidian.App, container: Container) {
        this.plugin = plugin;
        this.app = app;
        this.container = container;
    }

    public add(containerEl: HTMLElement): Setting {
        return new Setting(this.plugin, this.app, this.container, containerEl);
    }
}
