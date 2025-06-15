var dv_utils = require(app.vault.adapter.basePath + "/attachments/dv_utils.js");

input = dv_utils.with_defaults(input, {
    target: dv.current(),
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
    recursive: true,
});

let direct_links = new Set();
let recursive_links = new Set();
let wishlist = new Set();

let current = input.target;
let queue = [current.file.path];

console.log(current.file.path);
while (queue.length > 0) {
    let next = dv.page(queue.pop());
    if (!next) continue;

    for  (let link of next.file.inlinks.array()) {
        if (direct_links.has(link.path) ||
            recursive_links.has(link.path) ||
            link.path.includes("_templates")) {
                continue;
        }

        const page = dv.page(link.path);
        if (page.file.tags.includes("#genre") || page.file.tags.includes("#platform")) {
            queue.push(page.file.path);
        } else if (page.file.tags.includes("#game")) {
            if (current.file.inlinks.includes(page.file.link)) {
                if (page.file.etags.includes("#game/wishlist")) {
                    wishlist.add(link.path);
                } else {
                    direct_links.add(link.path);
                }
            } else {
                if (page.file.etags.includes("#game/wishlist")) {
                    wishlist.add(link.path);
                } else {
                    recursive_links.add(link.path);
                }
            }
        }
    }
}

if (input.recursive) {
    dv.header(2, "Direct Links");
}
direct_links = dv.array(Array.from(direct_links)).map(p => dv.page(p));
direct_links = dv_utils.from_pages(direct_links, input);
dv.list(direct_links);

if (input.recursive) {
    dv.header(2, "Recursive Links");
    recursive_links = dv.array(Array.from(recursive_links)).map(p => dv.page(p));
    recursive_links = dv_utils.from_pages(recursive_links, input);
    dv.list(recursive_links);
}

if (wishlist.size > 0) {
    dv.header(2, "Wishlist");
    wishlist = dv.array(Array.from(wishlist)).map(p => dv.page(p));
    wishlist = dv_utils.from_pages(wishlist, input);
    dv.list(wishlist);
}