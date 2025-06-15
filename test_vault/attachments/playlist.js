var dv_utils = require(app.vault.adapter.basePath + "/attachments/dv_utils.js");

input = dv_utils.with_defaults(input, {
    src: "pages(#game)",
    filters: [],
    filter_by_achievements: null,
});

let display_fn = input.display_map_fn;

input.filters.push((p) => !p.file.path.includes("_templates"));
input.filters.push((p) => !p.file.etags.includes("#game/dropped"));
input.filters.push((p) => !p.file.etags.includes("#game/complete"));

if (input.filter_by_achievements) {
    input.filters.push((p) => p.achievements != null);
    input.filters.push((p) => p.achievements.current > 0);

    input.display_map_fn = (p) => p;
}

let pages = dv_utils.into_pages(dv, input);

if (input.filter_by_achievements) {
    let sum = 0;
    let count = 0;

    for (let page of pages) {
        sum += page.achievements.current / page.achievements.total;
        count += 1;
    }

    let avg = (sum / count);
    console.log("Average is ", avg);

    if (input.filter_by_achievements == "below") {
        input.filters.push((p) => p.achievements.current / p.achievements.total < avg);
    } else if (input.filter_by_achievements == "above") {
        input.filters.push((p) => p.achievements.current / p.achievements.total >= avg);
    } else {
        console.log("Unknown filter_by_achievements: ", input.filter_by_achievements);
    }
}

input.display_map_fn = display_fn;
console.log(input)
pages = dv_utils.into_pages(dv, input);
dv.list(pages);