#playlist/auto
```dataview
LIST WITHOUT ID link(file.path, file.aliases[0])
FROM #genre AND -#genre/feature AND -"_templates"
SORT file.aliases[0] ASC
```