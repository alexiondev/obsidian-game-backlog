import GameBacklogPlugin from "main";
import { Cmd } from "./command";
import { GameBacklogSettings } from "settings";
import { App } from "obsidian";
import { Steam } from "external/steam_api";
import { read_all, write } from "notes/note";

class SteamCmd extends Cmd {
    public override check(app: App, settings: GameBacklogSettings, checking: boolean): boolean {
        if (checking) {
            return settings.steam_enable
                && settings.steam_api_key.length > 0
                && settings.steam_user_id.length > 0;
        }

        this.run(app, settings);
        return true;
    }
}

export class SteamImportCmd extends SteamCmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): SteamImportCmd {
        return new SteamImportCmd(plugin, prefix, "steam_import", "Import games from Steam");
    }

    public override async run(app: App, settings: GameBacklogSettings): Promise<void> {
        let api = new Steam(this.plugin, settings.steam_api_key, settings.steam_user_id);
        let new_games = await api.import_games(app, settings);
        write(app, settings, new_games);
    }
}

export class SteamUpdateCmd extends SteamCmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        return new SteamUpdateCmd(plugin, prefix, "steam_update", "Update Steam games");
    }

    public override async run(app: App, settings: GameBacklogSettings): Promise<void> {
        let api = new Steam(this.plugin, settings.steam_api_key, settings.steam_user_id);

        let updated = await api.update_games(app, settings, 
            await api.get_oudated_games(app, settings));
        write(app, settings, updated);
    }
}

export class SteamWishlistCmd extends SteamCmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        return new SteamWishlistCmd(plugin, prefix, "steam_wishlist", "Import Steam wishlist");
    }

    public override async run(app: App, settings: GameBacklogSettings): Promise<void> {
        let api = new Steam(this.plugin, settings.steam_api_key, settings.steam_user_id);

        let wishlist = await api.get_wishlisted_games(app, settings);
        write(app, settings, wishlist);
    }
}