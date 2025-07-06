import GameBacklogPlugin from "main";
import { Achievements, Game } from "notes/game";
import { read_all } from "notes/note";
import { App, Notice } from "obsidian";
import { GameBacklogSettings } from "settings";

const kDelimiter = " / ";
const kSymbolsToIgnore = /[:,!?'™®+/\.\[\]]/gi;

const kPlatformSteam = "[[steam]]";
const kPlatformSteamVr = "[[steamvr]]";
const kFeatureSinglePlayer = "[[single player]]";
const kFeatureMultiplayer = "[[multiplayer]]";
const kFeatureMmo = "[[mmo]]";
const kFeatureCoop = "[[co-op]]";
const kFeaturePvp = "[[pvp]]";
const kFeatureOnlinePvp = "[[online pvp]]";
const kFeatureOnlineCoop = "[[online co-op]]";
const kFeatureLocalCoop = "[[local co-op]]";
const kFeatureLocalPvp = "[[local pvp]]";
const kFeatureWorkshop = "[[steam workshop]]";
const kInputMkb = "[[mkb]]";
const kInputController = "[[controller]]";
const kInputControllerVr = "[[controller vr]]";

interface Param {
    key: string
    value: string
}

export class Steam {
    plugin: GameBacklogPlugin;
    key: string;
    user_id: string;

    public constructor(plugin: GameBacklogPlugin, key: string, user_id: string) {
        this.plugin = plugin;
        this.key = key;
        this.user_id = user_id;
    }

    private async get_owned_games(): Promise<null|any> {
        let base_url = "http://api.steampowered.com/IPlayerService/GetOwnedGames/v1/";
        let params: Param[]= [
           {key: "key", value: this.key},
           {key: "steamid", value: this.user_id},
           {key: "include_appinfo", value: "true"},
        ];

        if (this.plugin.settings.steam_include_free_to_play) {
            params.push({key: "include_played_free_games", value: "true"});
        }

        let url = `${base_url}?${params.map((p: Param) => `${p.key}=${p.value}`).join("&")}`;
        return (await this.plugin.query(url)).json.response.games;
    }

    private async get_game_info(steam_app_id: number): Promise<any> {
        const url = `https://store.steampowered.com/api/appdetails?key=${this.key}&appids=${steam_app_id}`;
        return (await this.plugin.query(url)).json[steam_app_id].data;
    }

    private async get_user_stats(steam_app_id: number): Promise<any> {
        const url = `https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/?key=${this.key}&steamid=${this.user_id}&appid=${steam_app_id}`;
        return (await this.plugin.query(url)).json;
    }
    
    private async get_wishlist(): Promise<any> {
        const url = `https://api.steampowered.com/IWishlistService/GetWishlist/v1?steamid=${this.user_id}`
        return (await this.plugin.query(url)).json.response.items;
    }

    private async get_current_achievements(steam_app_id: number): Promise<number | null> {
        try {
            let response = await this.get_user_stats(steam_app_id);

            let achievements = response.playerstats.achievements;
            if (achievements === undefined || achievements === null) {
                return 0;
            }

            return achievements.length;
        } catch (_) {
            return null;
        }
    }
    
    private async get_total_achievements(steam_app_id: number): Promise<number | null> {
        let game_info = await this.get_game_info(steam_app_id);
        let achievements = game_info.achievements;

        if (achievements === null || achievements === undefined) {
            return null;
        }

        return achievements.total;
    }

    private async get_achievements(steam_app_id: number): Promise<Achievements | null> {
        const current = await this.get_current_achievements(steam_app_id);
        const total = await this.get_total_achievements(steam_app_id);

        if (total === null) {
            return null;
        }

        if (current === null) {
            return new Achievements(0, total);
        }
        return new Achievements(current, total);
    }

    private async get_release_year(steam_app_id: number): Promise<number> {
        let game_info = await this.get_game_info(steam_app_id);
        let release_date: string = game_info.release_date.date;
        release_date = release_date.split("").reverse().slice(0,4).reverse().join("");

        return +release_date;
    }

    private async get_genres(steam_app_id: number): Promise<string> {
        let game_info = await this.get_game_info(steam_app_id);
        let genres = game_info.genres;
        if (genres == null) {
            return "";
        }
        return genres
            .map((x: any) => `[[${x.description.toLowerCase()}]]`)
            .join(" ");
    }

    private async parse_categories(game: Game, game_info: any): Promise<Game> {
        if (!game_info.categories) {
            return game;
        }

        let platform: string[] = [kPlatformSteam];
        let features: string[] = [];
        let preferred_input: string[] = [kInputMkb];

        let singleplayer = false;
        let multiplayer = false;
        let mmo = false;
        let coop = false;
        let local_coop = false;
        let online_coop = false;
        let pvp = false;
        let local_pvp = false
        let online_pvp = false;
        let workshop = false;
        for (let category of game_info.categories) {
            switch(category.id) {
                case 1: // Multi-player
                    multiplayer = true;
                    break;
                case 2: // Single-player
                    singleplayer = true;
                    break;
                case 9: // Co-op
                    coop = true;
                    break;
                case 20:
                    mmo = true;
                    break;
                case 28: // Full controller support
                    preferred_input.push(kInputController);
                    break;
                case 30: // Steam Workshop
                    workshop = true;
                    break;
                case 36: // Online PvP
                    online_pvp = true;
                    break;
                case 37: // Shared/Split Screen PvP
                    local_pvp = true;
                    break;
                case 38: // Online Co-op
                    online_coop = true;
                    break;
                case 39: // Shared/Split Screen Co-op
                    local_coop = true;
                    break;
                case 49: // PvP
                    pvp = true;
                    break;
                case 52: // Tracked Controller Support
                    preferred_input.push(kInputControllerVr);
                    break;
                case 31: // VR Support
                case 53: // VR Supported
                    platform.push(kPlatformSteamVr);
                    break;
                case 54: // VR Only
                    platform = [kPlatformSteamVr];
                    preferred_input = [kInputControllerVr];
                    break;
            }
        }

        multiplayer = multiplayer && !(coop || local_coop || online_coop || pvp || local_pvp || online_pvp || mmo);
        coop = coop && !(local_coop || online_coop);
        pvp = pvp && !(local_pvp || online_pvp);

        if (singleplayer) {
            features.push(kFeatureSinglePlayer);
        }

        if (multiplayer) {
            features.push(kFeatureMultiplayer);
        }

        if (mmo) {
            features.push(kFeatureMmo);
        }
        if (coop) {
            features.push(kFeatureCoop);
        }

        if (online_coop) {
            features.push(kFeatureOnlineCoop);
        }

        if (local_coop) {
            features.push(kFeatureLocalCoop);
        }

        if (pvp) {
            features.push(kFeaturePvp);
        }

        if (online_pvp) {
            features.push(kFeatureOnlinePvp);
        }

        if (local_pvp) {
            features.push(kFeatureLocalPvp);
        }

        if (workshop) {
            features.push(kFeatureWorkshop);
        }

        game.platform = platform.join(kDelimiter);
        game.features = features.join(kDelimiter);
        game.preferred_input = preferred_input.join(kDelimiter);

        return game;
    }

    private async get_game(settings: GameBacklogSettings, steam_app_id: number, name: string): Promise<Game> {
        let game_info = await this.get_game_info(steam_app_id);  

        let game = new Game(`${settings.notes_directory}/${normalize(name)}.md`);
        game.steam_app_id = steam_app_id;
        if (!game_info) {
            console.log(`WARNING: Unable to get game information for game (${steam_app_id}).`)
            return game;
        }

        game.name.display = name;
        game.other_aliases = [];
        game.achievements = await this.get_achievements(steam_app_id);
        game.release_year = await this.get_release_year(steam_app_id);
        game.last_updated = timestamp_now();
        game.genres = await this.get_genres(steam_app_id);

        game = await this.parse_categories(game, game_info);

        return game;
    }

    public async import_games(app: App, settings: GameBacklogSettings): Promise<Game[]> {
        const exists = new Set((await read_all(app, settings))
            .filter((game: Game) => game.steam_app_id !== null)
            .map((game: Game) => game.steam_app_id!));

        let games: Game[] = [];

        try {
            let new_games = (await this.get_owned_games())
                .filter((value: { appid: number; }) => !exists.has(value.appid));
            
            for (let owned of new_games) {
                console.log(`Importing ${owned.name}... (${games.length+1}/${new_games.length})`);

                let game = await this.get_game(settings, owned.appid, owned.name);
                games.push(game);
            }
        } catch (e) {
            console.log(e);
        }

        return games;
    }

    public async get_oudated_games(app: App, settings: GameBacklogSettings): Promise<Game[]> {
        let last_played_by_id: Map<number, number> = new Map();
        for (let owned of await this.get_owned_games()) {
            last_played_by_id.set(owned.appid, owned.rtime_last_played);
        }

        return (await read_all(app, settings))
            .filter((game: Game) => game.steam_app_id !== null)
            .filter((game: Game) => {
                let last_played = last_played_by_id.get(game.steam_app_id!);
                return last_played === undefined || last_played > game.last_updated!;
            })
            .filter((game: Game) => game.status !== "wishlist");
    }

    public async update_games(app: App, settings: GameBacklogSettings, games: Game[]): Promise<Game[]> {
        let updated: Game[] = [];

        try {
            for (let game of games) {
                let achievements = await this.get_achievements(game.steam_app_id!);

                game.achievements = achievements ? achievements : game.achievements;
                game.last_updated = timestamp_now();

                console.log(game);
                updated.push(game);
            }
        } catch (e) {
            console.log(e);
        }

        return updated;
    }

    public async get_wishlisted_games(app: App, settings: GameBacklogSettings): Promise<Game[]> {
        const exists = new Set((await read_all(app, settings))
            .filter((game: Game) => game.steam_app_id !== null && game.status === "wishlist")
            .map((game: Game) => game.steam_app_id!));

        let games: Game[] = [];
        try {
        let wishlisted = (await this.get_wishlist())
            .map((x: any) => x.appid)
            .filter((appid: number) => !(exists.has(appid)));


        for (let appid of wishlisted) {
            let game_info = (await this.get_game_info(appid));
            if (game_info.type !== "game") {
                console.log(`Skipping wishlist -- ID(${appid}), Name(${game_info.name})`)
                continue;
            }

            let game = await this.get_game(settings, appid, game_info.name);
            game.status = "wishlist";

            games.push(game);
        }
    } catch (e) {
        console.log(e);
    }
        
        return games;
    }
}

function timestamp_now(): number {
    return Math.round(Date.now() / 1000);
}

function normalize(str: string): string {
    return str.toLowerCase().replace(kSymbolsToIgnore, "");
}