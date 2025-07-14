import GameBacklogPlugin from "main";
import { App, Modal, ToggleComponent } from "obsidian";
import { Setting, SettingsFactory } from "ui/settings_helper";

interface Named {
    name: string;
}
type SelectedCallback = (selected: Named[]) => void;

export class GamePickerModal extends Modal {
    plugin: GameBacklogPlugin;
    available: Named[];
    callback: SelectedCallback;
    selected: Set<string>; 
    footer_created: boolean;
    filter: string;
    
    constructor(app: App, plugin:GameBacklogPlugin, games: Named[], callback: SelectedCallback){
        super(app);
        this.plugin = plugin;
        this.available = games.sort(((a, b) => a.name.localeCompare(b.name)));
        this.callback = callback;
        this.selected = new Set();
        this.footer_created = false;
        this.filter = "";

        this.display();
    }

    public display(): void {
        this.setTitle("Game picker");
        this.contentEl.empty();
        this.contentEl.style.maxHeight = "70vh";
        this.contentEl.style.overflowY = "auto";
        let factory = new SettingsFactory(this.plugin, this.app, this);
        
        this.available.filter(named => named.name.toLowerCase().contains(this.filter)).forEach(named  => {
            let selected = this.selected.has(named.name);
            factory.add(this.contentEl)
                .setName(named.name)
                .add_raw_toggle(selected, value => {
                    if (value && !selected) {
                        this.selected.add(named.name);
                    } else if (!value && selected) {
                        this.selected.delete(named.name);
                    }

                    this.display();
                })
        })

        if (!this.footer_created) {
            let footer = this.modalEl.createDiv({ cls: "modal-footer" });
            factory.add(footer)
                .add_raw_text(
                    "Filter game title...",
                    "",
                    new_value => {
                        this.filter = new_value;
                        this.display();
                    }
                )
                .add_button(
                    "Import",
                    true,
                    () => {
                        this.close();
                        this.callback(this.available.filter(named => this.selected.has(named.name)));
                    })
                .add_button(
                    "Cancel",
                    false,
                    () => {
                        this.close();
                    }
                );
            this.footer_created = true;
        }
    }
}