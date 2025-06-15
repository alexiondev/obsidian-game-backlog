let dv_utils = require(app.vault.adapter.basePath + "/attachments/dv_utils.js");

let outlinks = dv.current().file.outlinks;

input = dv_utils.with_defaults(input, {
    src: "inlinks",
    filters: [
        (p) => !p.file.path.includes("templates"),
        (p) => !outlinks.includes(p.file.link),
    ],
});

dv.view("attachments/list_of_notes", input);