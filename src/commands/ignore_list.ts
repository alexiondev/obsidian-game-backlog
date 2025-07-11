import GameBacklogPlugin from "main";
import { Cmd } from "./command";
import { App } from "obsidian";
import { IgnoreListModal } from "ui/ignore_list_modal";

export class ManageIgnoreListCmd extends Cmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        return new ManageIgnoreListCmd(plugin, prefix, "manage_ignore_list", "Manage ignore list");
    }

    public override async run(app: App): Promise<void> {
        new IgnoreListModal(app, this.plugin).open();
    }
}