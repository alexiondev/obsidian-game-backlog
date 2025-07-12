import GameBacklogPlugin from "main";
import { Cmd } from "./command";
import { App } from "obsidian";
import { SetupModal } from "ui/modals/setup";
import { OwnedGameEntry, Steam } from "external/steam_api";
import { read_notes, write_note } from "notes/note";
import { Game, new_game } from "notes/game";
import { GamePickerModal } from "ui/modals/game_picker";

const kDelimiter = " / ";
const kSymbolsToIgnore = /[:,!?'™®+/\.\[\]]/gi;

class BacklogCmd extends Cmd {
    protected steam_api: Steam;

    protected constructor(plugin: GameBacklogPlugin, prefix: string, id: string, name: string) {
        super(plugin, prefix, id, name);

        this.steam_api = new Steam(this.plugin, () => this.should_abort());
    }
    
    protected cleanup() {
        this.plugin.update_status();
    }

    protected run_setup(app: App): boolean {
        if (this.plugin.settings.run_setup) {
            let setup_menu = new SetupModal(app, this.plugin);
            setup_menu.open();
            return true; // Should abort
        }
        return false; // Continue
    }
    
    protected update_status(status: string) {
        this.plugin.update_status(status, () => { this.abort() });
    }

    protected async get_new_steam_games(app: App): Promise<OwnedGameEntry[]> {
        let exists = await read_notes(this.plugin, app);
        let ignore_list = new Set<string>([
            ...this.plugin.settings.ignore_list.map(entry => entry[0]),
            ...exists.filter(game => game.steam_app_id).map(game => game.steam_app_id!.toString()),
        ]);

        this.update_status("Getting owned games...");
        let owned_games = (await this.steam_api.get_owned_games())?.response.games;

        if (!owned_games) {
            return [];
        }

        if (owned_games.length == 0) {
            this.plugin.warn("Steam profile may be private!");
            return [];
        }

        this.update_status("Filtering owned games...");
        return owned_games.filter(game => !ignore_list.has(game.appid.toString()));
    }

    protected new_game_note(name: string, properties: Partial<Game>) {
        let game = new_game(`${this.plugin.settings.notes_directory}/${normalize(name)}.md`);
        game.name.display = name;
        Object.assign(game, properties);
        return game;
    }

    protected async import_steam_games(games: OwnedGameEntry[]): Promise<void> { 
        for (const [index, owned] of games.entries()) {
            if (this.should_abort()) {
                return;
            }

            this.update_status(`Importing ${owned.name}... (${index+1}/${games.length})`);
            let game = await this.update_steam_game(
                this.new_game_note(owned.name!, {steam_app_id: owned.appid}));
            
            // Don't want to write the note if it's in the middle of an abort.
            if (this.should_abort()) {
                return;
            }
            write_note(this.plugin, this.plugin.app, game);
        }
    }

    protected async update_steam_game(game: Game): Promise<Game> {
        if (this.should_abort()) {
            return game;
        }

        if (!game.steam_app_id) {
            return game;
        }

        let game_info = await this.steam_api.get_game_info(game.steam_app_id);
        if (!game_info) {
            this.plugin.warn(`Unable to get game information for ${game.name.display} (${game.steam_app_id}).`);
            return game;
        }

        if (!game.achievements) {
            let achievements = await this.steam_api.get_achievements(game.steam_app_id);
            if (achievements) {
                game.achievements = achievements;
            }
        }

        if (!game.release_year) {
            let release_year = await this.steam_api.get_release_year(game.steam_app_id);
            if (release_year) {
                game.release_year = release_year;
            }
        }
        game.last_updated = timestamp_now();

        if (this.plugin.settings.steam_import_genres && !game.genres) {
            game.genres = await this.steam_api.get_genres(game.steam_app_id);
        }

        const parsed_categories = await this.steam_api.get_parsed_categories(game.steam_app_id);
        if (parsed_categories) {
            game.platform = game.platform || parsed_categories.platform.join(kDelimiter);
            game.features = game.features || parsed_categories.features.join(kDelimiter);
            game.preferred_input = game.preferred_input || parsed_categories.input.join(kDelimiter);
        }

        return game;
    }

    
}

export class UpdateBacklogCmd extends BacklogCmd{
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        return new UpdateBacklogCmd(plugin, prefix, "update_backlog", "Update game backlog");
    }

    public override async run(app: App) {
        if (this.run_setup(app)) {
            return;
        }

        this.update_backlog(app);
    }

    private async update_backlog(app: App) {
        this.abort_controller = new AbortController();

        let new_games = await this.get_new_steam_games(app);

        if (!this.plugin.settings.update_only) {
            await this.import_steam_games(new_games);
        }

        this.cleanup();
    }

    
}

export class ImportGameCmd extends BacklogCmd {
    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        return new ImportGameCmd(plugin, prefix, "import_steam_game", "Select what game(s) to import");
    }

    public override async run(app: App) {
        if (this.run_setup(app)) {
            return;
        }

        let new_games = await this.get_new_steam_games(app);
        this.update_status("Manual selection of games");
        new GamePickerModal(app, this.plugin, new_games, async (selected: OwnedGameEntry[]) => {
            await this.import_steam_games(selected);
            this.cleanup();
        }).open();
    }
}

function timestamp_now(): number {
    return Math.round(Date.now() / 1000);
}

function normalize(str: string): string {
    return str.toLowerCase().replace(kSymbolsToIgnore, "");
}

