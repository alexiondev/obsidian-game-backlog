import GameBacklogPlugin from "main";
import { Modal, App, ButtonComponent, ExtraButtonComponent, Setting, TextComponent } from "obsidian";

class ModularSetting extends Setting {
    public add_button(text: string, cta: boolean = false, on_click: () => void): ModularSetting {
        this.addButton((component: ButtonComponent) => {
            component
                .setButtonText(text)
                .onClick(on_click);
            
            if (cta) {
                component.setCta();
            }
        })

        return this;
    }
}

export class SetupModal extends Modal {
    plugin: GameBacklogPlugin;
    close_cb: (cancelled: boolean) => void;
    cancelled: boolean = true;
    
    constructor(app: App, plugin: GameBacklogPlugin, close_cb: (cancelled: boolean) => void) {
        super(app);
        this.plugin = plugin;
        this.close_cb = close_cb;

        this.display();
    }

    override onClose(): void {
        this.close_cb(this.cancelled);
        super.onClose();
    }

    private display(): void {
        this.setTitle("Hello world!");
        this.contentEl.empty();

        // Save and Cancel buttons
        new ModularSetting(this.contentEl)
            .add_button("Save", /*cta=*/true, () => {
                this.cancelled = false;
                this.close();
            })
            .addButton((component: ButtonComponent) => {
                component
                    .setButtonText("Cancel")
                    .onClick(() => this.close())})
    }
}