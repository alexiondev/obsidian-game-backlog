// export class SteamImportCmd extends Cmd {
//     public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): SteamImportCmd {
//         return new SteamImportCmd(plugin, prefix, "steam_import", "Import games from Steam");
//     }

import GameBacklogPlugin from "main";
import { Cmd } from "./command";
import { GameBacklogSettings } from "settings";
import { App } from "obsidian";
import { read_all } from "notes/read";

//     public override check(app: App, settings: GameBacklogSettings, checking: boolean): boolean {
//         if (checking) {
//             return settings.steam_enable
//                 && settings.steam_api_key !== ""
//                 && settings.steam_user_id !== "";
//         }

//         this.run(app, settings);
//         return true;
//     }

//     public override async run(app: App, settings: GameBacklogSettings): Promise<void> {
//         let api = new Steam(this.plugin, settings.steam_api_key, settings.steam_user_id);
//         let new_games = await api.get_owned_games();
//         // console.log(new_games);
//         let exist = read_all(app, settings);
//     }
// }

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
    }
}