import { AbstractInputSuggest, TAbstractFile, TFolder } from "obsidian";

export class FolderSuggest extends AbstractInputSuggest<TFolder> { 
    textInputEl: HTMLInputElement;

    getSuggestions(query: string): TFolder[] | Promise<TFolder[]> {
        const abstract_files = this.app.vault.getAllLoadedFiles();
        const folders: TFolder[] = [];
        const input = query.toLowerCase();

        abstract_files.forEach((file: TAbstractFile) => {
            if (file instanceof TFolder && file.path.toLowerCase().contains(input)) {
                folders.push(file);
            }
        });

        return folders;
    }

    renderSuggestion(folder: TFolder, el: HTMLElement): void {
        el.setText(folder.path);
    }

    selectSuggestion(folder: TFolder, evt: MouseEvent | KeyboardEvent): void {
        this.textInputEl.value = folder.path;
        this.textInputEl.trigger("input");
        this.close();
    }

}