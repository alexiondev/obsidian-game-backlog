export interface Game {
    filepath: string;
    name: Name;
    other_aliases: string[];
    achievements?: Achievements;
    release_year?: string;
    steam_app_id?: number;
    rom_path?: string;
    last_updated?: number;

    genres: string;
    platform: string;
    features: string;
    preferred_input: string;
    related_games?: RelatedGames;

    status: string;
    other_tags: string[];
}

export interface Name {
    display: string;
    sort?: string;
}

export interface Achievements {
    current: number;
    total: number;
}

export interface RelatedGames {
    sequel?: string;
    remake?: string;
    prequel?: string;
    compilation?: string;
    dual_release?: string;
    original_game?: string;
}

export function new_game(filepath: string): Game {
    return {
        filepath: filepath,
        name: {display: ""},
        other_aliases: [],
        genres: "",
        platform: "",
        features: "",
        preferred_input: "",
        status: "unplayed",
        other_tags: [],
    };
}