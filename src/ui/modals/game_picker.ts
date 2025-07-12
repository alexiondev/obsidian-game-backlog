import GameBacklogPlugin from "main";
import { App, Modal, ToggleComponent } from "obsidian";
import { SettingsFactory } from "ui/settings_helper";

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
    
    constructor(app: App, plugin:GameBacklogPlugin, games: Named[], callback: SelectedCallback){
        super(app);
        this.plugin = plugin;
        this.available = games.sort(((a, b) => a.name.localeCompare(b.name)));
        this.callback = callback;
        this.selected = new Set();
        this.footer_created = false;

        this.display();
    }

    public display(): void {
        this.setTitle("Game picker");
        this.contentEl.empty();
        this.contentEl.style.maxHeight = "70vh";
        this.contentEl.style.overflowY = "auto";
        let factory = new SettingsFactory(this.plugin, this.app, this);
        
        this.available.forEach(named  => {
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
                .add_button(
                    "Import",
                    true,
                    () => {
                        this.close();
                        this.callback(this.available.filter(named => this.selected.has(named.name)));
                    });
            this.footer_created = true;
        }
    }
}