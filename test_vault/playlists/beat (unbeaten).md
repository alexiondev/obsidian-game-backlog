#playlist/auto
```dataviewjs
dv.view("attachments/playlist", {
    filters: [
        (p) => p.file.etags.includes("#game/unbeaten")
    ],
})