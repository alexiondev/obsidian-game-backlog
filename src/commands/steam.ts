import GameBacklogPlugin from "main";
import { Cmd } from "./command";
import { GameBacklogSettings } from "settings";
import { App } from "obsidian";
import { Steam } from "external/steam_api";
import { read_all, write } from "notes/note";

export class SteamImportCmd extends Cmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): SteamImportCmd {
        return new SteamImportCmd(plugin, prefix, "steam_import", "Import games from Steam");
    }

    public override check(app: App, settings: GameBacklogSettings, checking: boolean): boolean {
        if (checking) {
            return settings.steam_enable
                && settings.steam_api_key !== ""
                && settings.steam_user_id !== "";
        }

        this.run(app, settings);
        return true;
    }

    public override async run(app: App, settings: GameBacklogSettings): Promise<void> {
        let api = new Steam(this.plugin, settings.steam_api_key, settings.steam_user_id);
        let new_games = await api.import_games(app, settings);
        write(app, settings, new_games);
    }
}