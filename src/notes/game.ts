export class Game {
    public filepath: string;
    public name: Name;
    public other_aliases: string[];
    public achievements: Achievements | null;
    public release_year: string | null;
    public steam_app_id: number | null;
    public rom_path: string | null;
    public last_updated: number | null;

    public genres: string;
    public platform: string;
    public features: string;
    public preferred_input: string;
    public related_games: RelatedGames | null;

    public status: string;
    public other_tags: string[];

    constructor(filepath: string) {
        this.filepath = filepath;
        this.name = new Name();
        this.other_aliases = [];
        this.achievements = null;
        this.release_year = null;
        this.steam_app_id = null;
        this.last_updated = null;
        this.genres = "";
        this.platform = "";
        this.features = "";
        this.preferred_input = "";
        this.related_games = null;
        this.status = "unplayed";
        this.other_tags = [];
    }
}

export class Name {
    public display: string;
    public sort: string | null;
}

export class Achievements {
    public current: number;
    public total: number;

    constructor(current: number, total: number) {
        this.current = current;
        this.total = total;
    }
}

export class RelatedGames {
    public sequel: string | null;
    public remake: string | null;
    public prequel: string | null;
    public compilation: string | null;
    public dual_release: string | null;
    public original_game: string | null;
}