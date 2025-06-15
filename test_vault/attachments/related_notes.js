var dv_utils = require(app.vault.adapter.basePath + "/attachments/dv_utils.js");

input = dv_utils.with_defaults(input, {
    src: "inlinks",
    filters: [
        (p) => !p.file.tags.includes("#game"),
        (p) => !p.file.path.includes("_templates"),
    ],
});

dv.view("attachments/list_of_notes", input);