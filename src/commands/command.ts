import GameBacklogPlugin from "main";
import { App } from "obsidian";
import { GameBacklogSettings } from "settings";

export class Cmd {
    protected plugin: GameBacklogPlugin;
    protected id: string;
    protected name: string;

    protected constructor(plugin: GameBacklogPlugin, prefix: string, id: string, name: string) {
        this.plugin = plugin;
        this.id = [prefix, id].join("-");
        this.name = name;

        this.plugin.addCommand({
            id: this.id,
            name: this.name,
            checkCallback: (checking: boolean) => this.check(plugin.app, plugin.settings, checking),
        });
    }

    public static with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        throw new Error("Method must be overriden.");
    }

    public check(app: App, settings: GameBacklogSettings, checking: boolean): boolean {
        throw new Error("Method must be overriden.");
    }

    public async run(app: App, settings: GameBacklogSettings): Promise<void> {
        throw new Error("Method must be overriden.");
    }
}