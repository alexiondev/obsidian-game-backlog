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
    protected new_game_note(name: string, properties: Partial<Game>) {
        let game = new_game(`${this.plugin.settings.notes_directory}/${normalize(name)}.md`);
        game.name.display = name;
        Object.assign(game, properties);
        return game;
    }

    protected write_note(game: Game) {
        // Don't want to write the note if it's in the middle of an abort.
        if (this.should_abort()) {
            return;
        }
        write_note(this.plugin, this.plugin.app, game);
    }

    protected async import_steam_games(games: OwnedGameEntry[]): Promise<void> { 
        for (const [index, owned] of games.entries()) {
            if (this.should_abort()) {
                return;
            }

            this.update_status(`Importing ${owned.name}... (${index+1}/${games.length})`);
            let game = await this.update_steam_game(
                this.new_game_note(owned.name!, {steam_app_id: owned.appid}));
            
            this.write_note(game); 
        }
    }

    protected async update_steam_games(games: Game[]): Promise<void> {
        for (const [index, game] of games.entries()) {
            if (this.should_abort()) {
                return;
            }

            this.update_status(`Updating ${game.name.display}... (${index+1}/${games.length})`);
            const updated = await this.update_steam_game(game);

            this.write_note(updated);
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

    protected async get_outdated_games(): Promise<Game[]> {
        let owned_games = await this.steam_api.get_owned_games();
        if (!owned_games) {
            return [];
        }

        let last_played_by_id: Map<number, number|undefined> = new Map();
        owned_games.response.games.forEach(owned => {
            last_played_by_id.set(owned.appid, owned.rtime_last_played);
        });

        return (await read_notes(this.plugin, this.plugin.app))
            .filter(game => game.steam_app_id)
            .filter(game => {
                let last_played = last_played_by_id.get(game.steam_app_id!);
                return last_played === undefined || last_played > game.last_updated!;
            });
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

        let owned_games = await this.get_steam_games_not_imported(app);

        if (!this.plugin.settings.update_only) {
            await this.import_steam_games(owned_games);
        }

        this.update_steam_games(await this.get_outdated_games());

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

        let owned_games = await this.get_steam_games_not_imported(app);
        this.update_status("Manual selection of games");
        new GamePickerModal(
            app,
            this.plugin, 
            owned_games, 
            "Import games",
            "Import",
            async (selected: OwnedGameEntry[]) => {
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

