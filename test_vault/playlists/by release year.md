#playlist/auto
# Release Years
```dataview
LIST WITHOUT ID release_year
FROM #game AND -"_templates" AND -#game/complete
SORT release_year ASC
```

# Games By Release Year
```dataviewjs
dv.view("attachments/playlist", {
    filters: [
        (p) => p.release_year == 2013,
    ],
})
```