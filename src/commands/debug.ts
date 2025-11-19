import GameBacklogPlugin from "main";
import { Cmd } from "./command";
import { App } from "obsidian";
import { read_notes, write_note } from "notes/note";

export class RewriteAllCmd extends Cmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        return new RewriteAllCmd(plugin, prefix, "rewrite_all", "Rewrite all game notes in the vault.");
    }

    public override async run(app: App): Promise<void> {
        for (let note of await read_notes(this.plugin, this.plugin.app)) {
            console.info(`Writing ${note.name.display}`);
            write_note(this.plugin, this.plugin.app, note);
        }
    }
}