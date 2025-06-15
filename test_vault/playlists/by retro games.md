#playlist/auto
```dataviewjs
let includes = (page, platform) => {
    if (!page.platform) {
        return false;
    }
    if (typeof(page.platform) == "string") {
        return page.platform.includes(("[[").concat(platform, "]]"))
    } else if (typeof(page.platform) == "object") {
    console.log(page)
        return page.platform.path.includes(("notes/games/platforms/").concat(platform, ".md"))
    } else {
        throw("INVALID TYPE OF PLATFORM", typeof(p.platform));
    }
}

dv.view("attachments/playlist", {
    filters: [
        (p) => !includes(p, "steam"),
        (p) => !includes(p, "nintendo wii u"),
        (p) => !includes(p, "nintendo switch"),
        (p) => !includes(p, "nintendo switch 2"),
        (p) => !includes(p, "nintendo 3ds"),
        (p) => !includes(p, "playstation 3"),
        (p) => !includes(p, "playstation 4"),
        (p) => !includes(p, "playstation 5"),
    ],
})
```