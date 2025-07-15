import GameBacklogPlugin from "main";
import { Cmd } from "./command";
import { App } from "obsidian";
import { IgnoreListModal } from "ui/modals/ignore_list";
import { GamePickerModal } from "ui/modals/game_picker";
import { OwnedGameEntry } from "external/steam_api";

export class ManageIgnoreListCmd extends Cmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        return new ManageIgnoreListCmd(plugin, prefix, "manage_ignore_list", "Manage ignore list");
    }

    public override async run(app: App): Promise<void> {
        new IgnoreListModal(app, this.plugin).open();
    }
}

export class IgnoreGamesCmd extends Cmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        return new IgnoreGamesCmd(plugin, prefix, "ignore_games", "Ignore games not imported");
    }

    public override async run(app: App) {
        if (this.run_setup(app)) {
            return;
        }

        let owned_games = await this.get_steam_games_not_imported(app);
        this.update_status("Selecting games to ignore");
        new GamePickerModal(
            app, this.plugin,
            owned_games,
            "Ignore games",
            "Ignore",
            async (selected: OwnedGameEntry[]) => {
                let ignore_list = this.plugin.settings.ignore_list;
                selected.forEach((owned: OwnedGameEntry) => {
                    ignore_list.push([owned.appid.toString(), owned.name]);
                });

                this.plugin.update_settings({ignore_list});

                this.plugin.update_status();
            }
        ).open();
    }
}