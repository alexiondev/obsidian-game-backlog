import { OwnedGameEntry, Steam } from "external/steam_api";
import GameBacklogPlugin from "main";
import { read_notes } from "notes/note";
import { App } from "obsidian";
import { GameBacklogSettings } from "settings";
import { SetupModal } from "ui/modals/setup";

export class Cmd {
    protected plugin: GameBacklogPlugin;
    protected id: string;
    protected name: string;
    protected abort_controller: AbortController;
    protected steam_api: Steam;

    protected constructor(plugin: GameBacklogPlugin, prefix: string, id: string, name: string) {
        this.plugin = plugin;
        this.id = [prefix, id].join("-");
        this.name = name;

        // External API wrappers
        this.steam_api = new Steam(this.plugin, () => this.should_abort());

        this.plugin.addCommand({
            id: this.id,
            name: this.name,
            checkCallback: (checking: boolean) => this.check(plugin.app, checking),
        });
    }

    public static with_prefix(plugin: GameBacklogPlugin, prefix: string): Cmd {
        throw new Error("Method <with_prefix> must be overriden.");
    }

    protected cleanup() {
        this.plugin.update_status();
    }

    public check(app: App, checking: boolean): boolean {
        if (!checking) {
            this.run(app);
        }

        return true;
    }

    public async run(app: App): Promise<void> {
        throw new Error("Method <run> must be overriden.");
    }

    public abort() {
        if (this.abort_controller) {
            this.abort_controller.abort();
        }
    }

    protected should_abort(): boolean {
        return this.abort_controller?.signal?.aborted;
    }

    protected run_setup(app: App): boolean {
        if (this.plugin.settings.run_setup) {
            let setup_menu = new SetupModal(app, this.plugin);
            setup_menu.open();
            return true;
        }
        return false;
    }

    protected update_status(status: string) {
        this.plugin.update_status(status, () => this.abort())
    }

    protected async get_steam_games_not_imported(app: App): Promise<OwnedGameEntry[]> {
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
}