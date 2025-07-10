import { App, CachedMetadata, TAbstractFile, TFile, TFolder } from "obsidian";
import { GameBacklogSettings } from "settings";
import { Achievements, Game, RelatedGames } from "./game";

const kSteamAppId = "steam_app_id";
const kAliases = "aliases";
const kSortName = "sort_name";
const kAchievements = "achievements";
const kAchievementsCurrent = "current";
const kAchievementsTotal = "total";
const kReleaseYear = "release_year";
const kLastUpdate = "last_updated";
const kGenre = "genre";
const kGenres = "genres";
const kPlatform = "platform";
const kFeatures = "features";
const kPreferredInput = "preferred_input";
const kSequel = "sequel";
const kRemake = "remake";
const kPrequel = "prequel";
const kCompilation = "compilation";
const kDualRelease = "dual_release";
const kOriginalGame = "original_game";
const kRomPath = "rom_path";
const kTagInnacurateGenres = "#innacurate/genres";
const kTagInnacurateFeatures = "#innacurate/features";
const kTagInnacurateYear = "#innacurate/year";
const kTagsToIgnore = new Set([
    kTagInnacurateGenres,
    kTagInnacurateFeatures,
    kTagInnacurateYear,
    "#v3/0",
    "#v3/1",
    "#v3/2",
]);


export async function read_all(app: App, settings: GameBacklogSettings): Promise<Game[]> {
    let games: Game[] = [];

    for (let file of app.vault.getAllLoadedFiles()) {
        // Ignore folders
        if (!(file instanceof TFile)) {
            continue;
        }

        // Ignore subdirectories
        if (!is_in_directory(file.path, settings.notes_directory)) {
            continue;
        }

        let metadata = app.metadataCache.getFileCache(file);
        if (metadata === null) {
            continue;
        }

        if (metadata.frontmatter === undefined) {
            continue;
        }

        games.push(read(
            file.path,
            (await app.vault.read(file)).split("\n"),
            metadata
        ));
    }

    return games;
}

function read(filepath: string, contents: string[], metadata: CachedMetadata): Game {
    let game = new Game(filepath);

    const frontmatter = metadata.frontmatter!;
    const tags = metadata.tags!.map(tag => tag.tag);

    for (const key in frontmatter) {
        switch (key) {
            case kAliases:
                let aliases = frontmatter[key];
                if (aliases.size === 0) {
                    console.warn(`WARNING: Game (${game.filepath}) does not have a name.`);
                    break;
                }

                game.name.display = aliases[0];
                game.other_aliases = aliases.slice(1);
                break;
            case kSortName:
                game.name.sort = frontmatter[key];
                break;
            case kAchievements:
                const achievements = frontmatter[kAchievements];
                game[kAchievements] = new Achievements(
                    achievements[kAchievementsCurrent],
                    achievements[kAchievementsTotal]
                );
                break;
            case kSteamAppId:
            case kReleaseYear:
            case kRomPath:
            case kLastUpdate:
                game[key] = frontmatter[key];
                break;
            default:
                console.warn(`WARNING: Unknown frontmatter field: (${key}, ${frontmatter[key]})`);
                break;
        }
    }

    for (let line of contents) {
        // Skip lines that aren't inline fields.
        if (!line.contains("::")) {
            continue;
        }

        line = line.trim();
        const [key, value] = line.split("::");

        switch (key) {
            case kGenres:
            case kPlatform:
            case kFeatures:
            case kPreferredInput:
                game[key] = value.trim();
                break;
            // Map Genre -> Genres
            case kGenre:
                game[kGenres] = value.trim();
                break;
            case kSequel:
            case kRemake:
            case kPrequel:
            case kCompilation:
            case kDualRelease:
            case kOriginalGame:
                if (!game.related_games) {
                    game.related_games = new RelatedGames();
                }

                game.related_games[key] = value.trim();
                break;
            default:
                console.warn(`Unknown Dataview inline field: (${key}, ${value.trim()})`);
                break;
        }
    }

    game.other_tags = [];
    for (let tag of tags) {
        if (kTagsToIgnore.has(tag)) {
            continue;
        }

        if (tag.match(/#game\/.+/)) {
            game.status = tag.split("/")[1];
        } else {
            game.other_tags.push(tag);
        }
    }

    return game;
}

function is_in_directory(filepath: string, directory: string) {
    if (!filepath.contains(directory)) {
        return false;
    }

    return !filepath.replace(`${directory}/`, "").contains("/");
}

class Note {
    data: string[] = [];

    get_data(): string {
        return this.data.join("\n");
    }

    push(value: string): Note {
        this.data.push(value);
        return this;
    }

    push_if(exists: any, value: string): Note {
        if (!(exists === null || exists === undefined)) {
            this.data.push(value);
        }

        return this;
    }

    push_iff(condition: boolean, value: string): Note {
        if (condition) {
            this.data.push(value);
        }

        return this;
    }

    push_if_not(exists: any, value: string): Note {
        if (exists === null || exists === undefined || (typeof exists === "string" && exists === "")) {
            this.data.push(value);
        }

        return this;
    }

}

export async function write(app: App, settings: GameBacklogSettings, games: Game[]): Promise<void> {
    let index = 0;

    for (let game of games) {
        index++;
        console.log(`Writing ${game.filepath}... (${index}/${games.length})`);

        write_note(app, settings, game);
    }
}

function write_note(app: App, settings: GameBacklogSettings, game: Game): void {
    // Apply dynamic default values
    if (game.preferred_input.length === 0) {
        if (game.platform.contains("vr")) {
            game.preferred_input = "[[controller vr]]";
        } else if (game.platform.contains("steam")) {
            game.preferred_input = "[[mkb]]";
        } else {
            game.preferred_input = "[[controller]]";
        }
    }

    if (game.status === "unplayed" || game.status === "") {
        if (game.achievements && game.achievements?.current > 0) {
            game.status = "unbeaten";
        }
    }

    let aliases = [game.name.display, ...game.other_aliases]
        .map((value: string) => `"${value}"`)
        .join(", ");

    let note = new Note()
        .push("---")
        .push(`${kAliases}: [${aliases}]`)
        .push_if(game.name.sort, `${kSortName}: "${game.name.sort}"`)
        .push_if(game.achievements, `${kAchievements}:`)
        .push_if(game.achievements, ` ${kAchievementsCurrent}: ${game.achievements?.current}`)
        .push_if(game.achievements, ` ${kAchievementsTotal}: ${game.achievements?.total}`)
        .push(`${kReleaseYear}: ${game.release_year}`)
        .push_if(game.steam_app_id, "")
        .push_if(game.steam_app_id, `${kSteamAppId}: ${game.steam_app_id}`)
        .push_if(game.rom_path, `${kRomPath}: ${game.rom_path}`)
        .push_if(game.last_updated, `${kLastUpdate}: ${game.last_updated}`)
        .push("---")
        .push("%%")
        .push(`${kGenres}:: ${game.genres}`)
        .push(`${kPlatform}:: ${game.platform}`)
        .push(`${kFeatures}:: ${game.features}`)
        .push(`${kPreferredInput}:: ${game.preferred_input}`)
        .push_if(game.related_games, "")
        .push_if(game.related_games?.sequel, `${kSequel}:: ${game.related_games?.sequel}`)
        .push_if(game.related_games?.remake, `${kRemake}:: ${game.related_games?.remake}`)
        .push_if(game.related_games?.prequel, `${kPrequel}:: ${game.related_games?.prequel}`)
        .push_if(game.related_games?.compilation, `${kCompilation}:: ${game.related_games?.compilation}`)
        .push_if(game.related_games?.dual_release, `${kDualRelease}:: ${game.related_games?.dual_release}`)
        .push_if(game.related_games?.original_game, `${kOriginalGame}:: ${game.related_games?.original_game}`)
        .push("%%")
        .push(`#game/${game.status}`)
        .push_if_not(game.genres, kTagInnacurateGenres)
        .push_if_not(game.features, kTagInnacurateFeatures)
        .push_if_not(game.release_year, kTagInnacurateYear)
        .push("#v3/2");

    for (let tag of game.other_tags) {
        note.push(tag);
    }

    note = note
        .push("")
        .push("# `=this.aliases[0]`")
        .push("## Related Notes")
        .push("`$=dv.view(\"attachments/related_notes\")`")
    
    let file = app.vault.getFileByPath(game.filepath);
    if (file === null) {
        app.vault.create(game.filepath, note.get_data());
    } else {
        app.vault.modify(file, note.get_data());
    }
}