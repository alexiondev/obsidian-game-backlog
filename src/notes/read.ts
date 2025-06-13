import { App, CachedMetadata, TAbstractFile, TFile, TFolder } from "obsidian";
import { GameBacklogSettings } from "settings";
import { Achievements, Game, RelatedGames } from "./game";

export const kSteamAppId = "steam_app_id";
export const kAliases = "aliases";
export const kSortName = "sort_name";
export const kAchievements = "achievements";
export const kAchievementsCurrent = "current";
export const kAchievementsTotal = "total";
export const kReleaseYear = "release_year";
export const kLastUpdate = "last_updated";
export const kGenre = "genre";
export const kGenres = "genres";
export const kPlatform = "platform";
export const kFeatures = "features";
export const kPreferredInput = "preferred_input";
export const kSequel = "sequel";
export const kRemake = "remake";
export const kPrequel = "prequel";
export const kCompilation = "compilation";
export const kDualRelease = "dual_release";
export const kOriginalGame = "original_game";
export const kRomPath = "rom_path";
const kTagsToIgnore = new Set([
    "#innacurate/genres", 
    "#innacurate/features", 
    "#innacurate/year", 
    "#v3/0",
    "#v3/1",
    "#v3/2",
]);

export async function read_all(app: App, settings: GameBacklogSettings): Promise<Game[]> {
    let games: Game[] = [];

    const notes_folder: TFolder = app.vault.getFolderByPath(settings.notes_directory)!;

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
            console.log(`ERROR: File ${file.basename} does not contain any Obsidian metadata.`);
            continue;
        }

        if (metadata.frontmatter === undefined) {
            console.log(`ERROR: File ${file.basename} does not contain any frontmatter.`);
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
                    console.log(`WARNING: Game (${game.filepath}) does not have a name.`);
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
                console.log(`WARNING: Unknown frontmatter field: (${key}, ${frontmatter[key]})`);
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
                console.log(`Unknown Dataview inline field: (${key}, ${value.trim()})`);
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
