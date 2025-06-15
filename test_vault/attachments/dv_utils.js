function with_defaults(input, defaults) {
    input = input || {};
    Object.keys(defaults).forEach(key => {
        input[key] = input[key] == null ? defaults[key] : input[key];
    });
    return input;
}
exports.with_defaults = with_defaults;

function into_pages(dv, input) {
    input = with_defaults(input, {
        src: "inlinks",
        map_fn: (p) => p,
        filters: [],
        sort_fn: (p) => {
            let res = p.file.name;
            if (p.sort_name) {
                res = p.sort_name;
            } else if (p.aliases) {
                res = p.aliases[0];
            }

            console.log("INFO: ", p, "=>", res);
            return res;
        },
        sort_order: 'asc',
        display_map_fn: (p) => dv.fileLink(p.file.path, false, (p.aliases ? p.aliases[0] : p.file.name)),
    })

    // Source for list of notes
    let pages;
    if (input.src == "inlinks") {
        pages = dv.current().file.inlinks.map(
            link => dv.page(link.path));
    } else if (input.src.startsWith("pages")) {
        let src = input.src.replace("pages(", "")
            .replace(/\)$/, "");
        pages = dv.pages(src);
    } else {
        console.log("Unsupported source type: ", input.src);
        return;
    }

    return from_pages(pages, input);
}
exports.into_pages = into_pages;

function from_pages(pages, input) {
    // Apply mapping
    pages = pages.map(input.map_fn);

    // Applying filters
    input.filters.forEach(filter => {
        pages = pages.where(filter);
    })

    // Sorting the notes
    pages = pages.sort(input.sort_fn, input.sort_order);

    // Mapping for display
    pages = pages.map(input.display_map_fn);

    console.log("Number of entries in the query: ", pages.length);
    return pages;
}
exports.from_pages = from_pages;