import GameBacklogPlugin from "main";
import { Cmd } from "./command";
import { GameBacklogSettings } from "settings";
import { App } from "obsidian";
import { Steam } from "external/steam_api";
import { read_all, write } from "notes/note";
import { IgnoreListModal } from "ui/ignore_list_modal";
import { SetupModal } from "ui/setup_modal";

export class UpdateBacklogCmd extends Cmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        return new UpdateBacklogCmd(plugin, prefix, "update_backlog", "Update game backlog");
    }

    public override async run(app: App, settings: GameBacklogSettings): Promise<void> {
        if (!settings.run_setup) {
            this.update_backlog();
            return;
        }

        let setup_menu = new SetupModal(app, this.plugin, (cancelled: boolean) => {
            if (!cancelled) {
                this.plugin.update_settings({run_setup: false});
                this.update_backlog();
            }
        });
        setup_menu.open();
    }

    private async update_backlog(): Promise<void> {
        console.log("Update backlog");
    }
}