import { App, Setting } from "obsidian";

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
}