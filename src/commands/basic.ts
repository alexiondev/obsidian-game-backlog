import GameBacklogPlugin from "main";
import { Cmd } from "./command";
import { GameBacklogSettings } from "settings";
import { App } from "obsidian";
import { read_all, write } from "notes/old_note";

export class RewriteAllCmd extends Cmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): RewriteAllCmd {
        return new RewriteAllCmd(plugin, prefix, "rewrite_all", "Rewrites all existing game notes.");
    }

    public override async run(app: App): Promise<void> {
        let games = (await read_all(app, this.plugin.settings));
        console.log(games);
        write(app, this.plugin.settings, games);
    }
}