import GameBacklogPlugin from "main";
import { Cmd } from "./command";
import { GameBacklogSettings } from "settings";
import { App } from "obsidian";
import { read_all, write } from "notes/note";

export class RewriteAllCmd extends Cmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): RewriteAllCmd {
        return new RewriteAllCmd(plugin, prefix, "rewrite_all", "Rewrites all existing game notes.");
    }

    public override check(app: App, settings: GameBacklogSettings, checking: boolean): boolean {
        if (!checking) {
            this.run(app, settings);
        }

        return true;
    }

    public override async run(app: App, settings: GameBacklogSettings): Promise<void> {
        let games = (await read_all(app, settings));
        console.log(games);
        write(app, settings, games);
    }
}