import GameBacklogPlugin from "main";
import { Cmd } from "./command";
import { App, TFile } from "obsidian";
import { IgnoreListModal } from "ui/modals/ignore_list";
import { GamePickerModal } from "ui/modals/game_picker";
import { OwnedGameEntry } from "external/steam_api";
import { read_note } from "notes/note";

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

export class IgnoreCurrentGameCmd extends Cmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        return new IgnoreCurrentGameCmd(plugin, prefix, "ignore_current_game", "Ignore current game");
    }

    public override async run(app: App) {
        if (this.run_setup(app)) {
            return;
        }

        const current = app.workspace.getActiveFile();
        if (!(current instanceof TFile)) {
            this.plugin.warn("No file is open.");
            return;
        }

        const metadata = app.metadataCache.getFileCache(current);

        if (!metadata) {
            this.plugin.warn("Can't load metadata of current file.");
            return;
        }

        if (!metadata.frontmatter) {
            this.plugin.warn("Can't load frontmatter of current file.");
            return;
        }

        if (!metadata.tags) {
            this.plugin.warn("Can't load tags of current file.");
            return;
        }

        const game = read_note(
            current.path,
            (await app.vault.read(current)).split("\n"),
            metadata
        );

        if (game.steam_app_id) {
            let ignore_list = this.plugin.settings.ignore_list;
            ignore_list.push([game.steam_app_id.toString(), game.name.display]);
            this.plugin.update_settings({ignore_list});
        }
    }
}