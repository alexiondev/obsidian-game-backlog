import { App, Setting } from "obsidian";
import { FolderSuggest } from "./folder_suggest";

export interface Description {
    text: string,
    url: string,
}

export class SettingsHelper {
    app: App;
    containerEl: HTMLElement;

    constructor(app: App, containerEl: HTMLElement) {
        this.app = app;
        this.containerEl = containerEl;
        this.containerEl.empty();
    }

    public header(text: string): Setting {
        return new Setting(this.containerEl).setName(text).setHeading();
    }

    public toggle(name: string, description: string, value: boolean, on_change: (new_value:boolean)=>void): Setting {
        return new Setting(this.containerEl)
            .setName(name)
            .setDesc(description)
            .addToggle((toggle) => {
                toggle.setValue(value)
                      .onChange(on_change);
            });
    }

    public text(name: string, description: string, placeholder: string, value: string, on_change: (new_value:string)=>void): Setting {
        return new Setting(this.containerEl)
            .setName(name)
            .setDesc(description)
            .addText((text) => {
                text.setPlaceholder(placeholder)
                    .setValue(value)
                    .onChange(on_change)
            })
    }

    public directory(name: string, description: string, placeholder: string, value: string, on_change: (new_value:string)=>void): Setting {
        return new Setting(this.containerEl)
            .setName(name)
            .setDesc(description)
            .addSearch((cb) => {
                new FolderSuggest(this.app, cb.inputEl);
                cb.setPlaceholder(placeholder)
                    .setValue(value)
                    .onChange(on_change);
            });
    }
}