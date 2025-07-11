import GameBacklogPlugin from "main";
import { Achievements } from "notes/game";

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

export interface GetOwnedGamesResponse {
    response: {
        game_count: number;
        games: Array<OwnedGameEntry>;
    };
}

export interface OwnedGameEntry {
    appid: number;
    name?: string; // only present if include_appinfo=true
    playtime_forever: number;
    playtime_windows_forever?: number;
    playtime_mac_forever?: number;
    playtime_linux_forever?: number;
    img_icon_url?: string; // only present if include_appinfo=true
    img_logo_url?: string;
    has_community_visible_stats?: boolean;
    rtime_last_played?: number; // UNIX timestamp
}

export interface AppDetailsResponse {
    [app_id: string]: {
        success: boolean
        data?: AppData;
    }
}

export interface AppData {
  type: string;
  name: string;
  steam_appid: number;
  required_age: string;
  is_free: boolean;
  detailed_description: string;
  about_the_game: string;
  short_description: string;
  supported_languages: string;
  header_image: string;
  website: string;
  developers?: string[];
  publishers?: string[];
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
  };
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  metacritic?: {
    score: number;
    url: string;
  };
  categories: {
    id: number;
    description: string;
  }[];
  genres: {
    id: string;
    description: string;
  }[];
  screenshots: {
    id: number;
    path_thumbnail: string;
    path_full: string;
  }[];
  release_date: {
    coming_soon: boolean;
    date: string;
  };
  support_info: {
    url: string;
    email: string;
  };
  background: string;
  achievements?: {
    total: number;
  };
}

export interface UserStatsResponse {
  playerstats: PlayerStats;
}

export interface PlayerStats {
  steamID: string;
  gameName: string;
  achievements?: SteamAchievement[];
  stats?: SteamStat[];
}

export interface SteamAchievement {
  apiname: string;
  achieved: number;       // 1 = unlocked, 0 = locked
  unlocktime: number;     // Unix timestamp
}

export interface SteamStat {
  name: string;
  value: number;
}

export interface ParsedCategories {
    platform: string[];
    input: string[];
    features: string[];
}

function format_url(base_url: string, params: Param[]): string {
    return `${base_url}?${params.map(p => `${p.key}=${p.value}`).join("&")}`;
}

export class Steam {
    plugin: GameBacklogPlugin;
    should_abort: () => boolean;

    public constructor(plugin: GameBacklogPlugin, should_abort: () => boolean) {
        this.plugin = plugin;
        this.should_abort = should_abort;
    }

    private key(): string {
        return this.plugin.settings.steam_api_key;
    }

    private user_id(): string {
        return this.plugin.settings.steam_user_id;
    }

    public async get_owned_games(): Promise<GetOwnedGamesResponse|void> {
        if (this.should_abort()) {
            return;
        }

        const base_url = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/";
        let params: Param[]= [
           {key: "key", value: this.key()},
           {key: "steamid", value: this.user_id()},
           {key: "include_appinfo", value: "true"},
        ];

        if (this.plugin.settings.steam_include_free_to_play) {
            params.push({key: "include_played_free_games", value: "true"});
        }

        const resp = await this.plugin.query(format_url(base_url, params));
        return resp?.json;
    }

    public async get_game_info(app_id: number): Promise<AppData|void> {
        if (this.should_abort()) {
            return;
        }
        const base_url = "https://store.steampowered.com/api/appdetails";
        const params: Param[] = [
            {key: "key", value: this.key()},
            {key: "appids", value: app_id.toString()},
        ];

        const resp = await this.plugin.query(format_url(base_url, params));

        return resp?.json[app_id]?.data;
    }

    public async get_user_stats(app_id: number): Promise<UserStatsResponse|void> {
        if (this.should_abort()) {
            return;
        }

        const base_url = "https://api.steampowered.com/ISteamUserStats/GetUserStatsForGame/v2/"
        const params: Param[] = [
            {key: "key", value: this.key()},
            {key: "steamid", value: this.user_id()},
            {key: "appid", value: app_id.toString()},
        ];

        const resp = await this.plugin.query(format_url(base_url, params));
        return resp?.json;
    }

    public async get_current_achievements(app_id: number): Promise<number | null> {
        if (this.should_abort()) {
            return null;
        }

        const resp = await this.get_user_stats(app_id);
        const achievements = resp?.playerstats.achievements;
        if (!achievements) {
            return 0;
        }

        return achievements.length;
    }

    public async get_total_achievements(app_id: number): Promise<number | void | null> {
        if (this.should_abort()) {
            return null;
        }

        const game_info = await this.get_game_info(app_id);
        return game_info?.achievements?.total;
    }

    public async get_achievements(app_id: number): Promise<Achievements | null> {
        if (this.should_abort()) {
            return null;
        }

        const current = await this.get_current_achievements(app_id);
        const total = await this.get_total_achievements(app_id);

        if (!total) {
            return null;
        }

        if (!current) {
            return {
                current: 0,
                total,
            };
        }
        return {
            current,
            total
        };
    }

    public async get_release_year(app_id: number): Promise<string | null> {
        if (this.should_abort()) {
            return null;
        }

        const game_info = await this.get_game_info(app_id);
        if (!game_info) {
            return null;
        }

        const release_date = game_info.release_date.date;
        return release_date.split("").reverse().slice(0,4).reverse().join("");
    }

    public async get_genres(app_id: number): Promise<string> {
        if (this.should_abort()) {
            return "";
        }

        let game_info = await this.get_game_info(app_id);
        let genres = game_info?.genres;
        if (!genres) {
            return "";
        }

        return genres
            .map(x => `[[${x.description.toLowerCase()}]]`)
            .join(" ");
    }

    public async get_parsed_categories(app_id: number): Promise<ParsedCategories|void> {
        if (this.should_abort()) {
            return;
        }

        let game_info = await this.get_game_info(app_id);
        if (!game_info || !game_info.categories) {
            return
        }

        let parsed: ParsedCategories = {
            platform: [kPlatformSteam],
            input: [kInputMkb],
            features: [],
        };
        let singleplayer = false;
        let multiplayer = false;
        let mmo = false;
        let coop = false;
        let online_coop = false;
        let local_coop = false;
        let pvp = false;
        let online_pvp = false;
        let local_pvp = false;
        let workshop = false;
        
        for (let category of game_info.categories) {
            switch (category.id) {
                case 1: // Multi-player
                    multiplayer = true;
                    break;
                case 2: // Single-player
                    singleplayer = true;
                    break;
                case 9: // Co-op
                    coop = true;
                    break;
                case 20: // MMO
                    mmo = true;
                    break;
                case 28: // Full controller support
                    parsed.input.push(kInputController);
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
                    parsed.input.push(kInputControllerVr);
                case 32: // VR Support
                case 53: // VR Supported
                    parsed.platform.push(kPlatformSteamVr);
                    break;
                case 54: // VR Only
                    parsed.platform = [kPlatformSteamVr];
                    parsed.input = [kInputControllerVr];
                    break; 
            }
        }

        // Only want the more specific categories.
        multiplayer = multiplayer && !(
            coop ||
            local_coop ||
            online_coop ||
            pvp ||
            local_pvp ||
            online_pvp ||
            mmo
        );
        coop = coop && !(
            local_coop ||
            online_coop
        );
        pvp = pvp && !(
            local_pvp ||
            online_pvp
        );

        if (singleplayer) {
            parsed.features.push(kFeatureSinglePlayer);
        }

        if (multiplayer) {
            parsed.features.push(kFeatureMultiplayer);
        }

        if (mmo) {
            parsed.features.push(kFeatureMmo);
        }
        if (coop) {
            parsed.features.push(kFeatureCoop);
        }

        if (online_coop) {
            parsed.features.push(kFeatureOnlineCoop);
        }

        if (local_coop) {
            parsed.features.push(kFeatureLocalCoop);
        }

        if (pvp) {
            parsed.features.push(kFeaturePvp);
        }

        if (online_pvp) {
            parsed.features.push(kFeatureOnlinePvp);
        }

        if (local_pvp) {
            parsed.features.push(kFeatureLocalPvp);
        }

        if (workshop) {
            parsed.features.push(kFeatureWorkshop);
        }

        return parsed;
    }
}