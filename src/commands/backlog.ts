import GameBacklogPlugin from "main";
import { Cmd } from "./command";
import { GameBacklogSettings } from "settings";
import { App } from "obsidian";
import { SetupModal } from "ui/setup_modal";
import { Steam } from "external/steam_api";
import { read_notes, write_note } from "notes/note";
import { Game } from "notes/game";

const kDelimiter = " / ";
const kSymbolsToIgnore = /[:,!?'™®+/\.\[\]]/gi;

export class UpdateBacklogCmd extends Cmd {
    steam_api: Steam;

    public static override with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        return new UpdateBacklogCmd(plugin, prefix, "update_backlog", "Update game backlog");
    }

    protected constructor(plugin: GameBacklogPlugin, prefix: string, id: string, name: string) {
        super(plugin, prefix, id, name);

        this.steam_api = new Steam(this.plugin, () => this.should_abort());
    }

    public override async run(app: App, settings: GameBacklogSettings) {
        if (!settings.run_setup) {
            this.update_backlog(app);
            return;
        }

        let setup_menu = new SetupModal(app, this.plugin);
        setup_menu.open();
    }

    private async update_backlog(app: App) {
        this.abort_controller = new AbortController();

        let exists = await read_notes(this.plugin, app);
        
        let ignore_list = new Set<string>([
            ...this.plugin.settings.ignore_list.map(entry => entry[0]),
            ...exists.filter(game => game.steam_app_id).map(game => game.steam_app_id!.toString()),
        ]);

        await this.import_steam_games(ignore_list);

        this.cleanup();
    }

    private async import_steam_games(ignore: Set<string>) {
        this.update_status("Getting owned games...");
        let owned_games = (await this.steam_api.get_owned_games())?.response.games;

        if (!owned_games) {
            return [];
        }

        if (owned_games?.length === 0) {
            this.plugin.warn("Steam profile may be private!");
            return [];
        }

        this.update_status("Filtering new games...");
        let new_games = owned_games.filter(game => !ignore.has(game.appid.toString()));

        for (const [index, owned] of new_games.entries()) {
            if (this.should_abort()) {
                return;
            }

            this.update_status(`Importing ${owned.name}... (${index+1}/${new_games.length})`);
            let game = await this.import_steam_game(owned.appid, owned.name!);
            write_note(this.plugin, this.plugin.app, game);
        }
    }

    private async import_steam_game(app_id: number, name: string): Promise<Game> {
        let game = new Game(`${this.plugin.settings.notes_directory}/${normalize(name)}.md`);
        game.steam_app_id = app_id;
        game.name.display = name;
        
        if (this.should_abort()) {
            return game;
        }

        let game_info = await this.steam_api.get_game_info(app_id);
        if (!game_info) {
            this.plugin.warn(`Unable to get game information for ${name} (${app_id}).`);
            return game;
        }

        game.other_aliases = [];
        game.achievements = await this.steam_api.get_achievements(app_id);
        game.release_year = await this.steam_api.get_release_year(app_id);
        game.last_updated = timestamp_now();

        if (this.plugin.settings.steam_import_genres) {
            game.genres = await this.steam_api.get_genres(app_id);
        }

        const parsed_categories = await this.steam_api.get_parsed_categories(app_id);
        if (parsed_categories) {
            game.platform = parsed_categories.platform.join(kDelimiter);
            game.features = parsed_categories.features.join(kDelimiter);
            game.preferred_input = parsed_categories.input.join(kDelimiter);
        }

        return game;
    }

    private update_status(status: string) {
        this.plugin.update_status(status, () => { this.abort() });
    }

    private cleanup() {
        this.plugin.update_status();
    }
}

function timestamp_now(): number {
    return Math.round(Date.now() / 1000);
}

function normalize(str: string): string {
    return str.toLowerCase().replace(kSymbolsToIgnore, "");
}

