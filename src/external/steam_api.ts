import GameBacklogPlugin from "main";
import { Game } from "notes/game";
import { App, Notice } from "obsidian";
import { GameBacklogSettings } from "settings";

export class Steam {
    plugin: GameBacklogPlugin;
    key: string;
    user_id: string;

    public constructor(plugin: GameBacklogPlugin, key: string, user_id: string) {
        this.plugin = plugin;
        this.key = key;
        this.user_id = user_id;
    }

    public async get_owned_games(): Promise<null|any> {
	    const url = `http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?key=${this.key}&steamid=${this.user_id}&include_appinfo=true&include_played_free_games=true`;
        return (await this.plugin.query(url)).json.response.games;
    }

    public async import_games(app: App, settings: GameBacklogSettings): Promise<Game[]> {
        let games: Game[] = [];
        return games;
    }
}