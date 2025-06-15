var dv_utils = require(app.vault.adapter.basePath + "/attachments/dv_utils.js");

let pages = dv_utils.into_pages(dv, input);

// Display
dv.list(pages);