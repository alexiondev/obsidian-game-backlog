import GameBacklogPlugin from "main";
import { Cmd } from "./command";
import { GameBacklogSettings } from "settings";
import { App } from "obsidian";
import { Steam } from "external/steam_api";
import { read_all, write } from "notes/note";
import { IgnoreListModal } from "ui/ignore_list_modal";

export class ManageIgnoreListCmd extends Cmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        return new ManageIgnoreListCmd(plugin, prefix, "manage_ignore_list", "Manage ignore list");
    }

    public override async run(app: App, settings: GameBacklogSettings): Promise<void> {
        new IgnoreListModal(app, this.plugin).open();
    }
}