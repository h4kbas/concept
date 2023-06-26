How to keep data

Concepts

1 Human
3 Duck
5 Eye
7 Beak

Relations
Human: [*Eye,*Not Duck]
Duck: [*Beak,*Eye]
Flattened

Human: [*Not Duck[*Not Eye, *Not Beak] , *Eye ]

3:[7, 5]
4:[8, 6]
1:[5, 4]
2:[6, 3]

Duck: [true, true]
Human: [true, *Not Duck ]

3,7 Duck +Beak
3,5 Duck +Eye

|| 1,5 Human +Eye ||
|| 1, 6 Human -Eye ||
|| 1, 8 Human -Beak ||
|| 1,4 Human -Duck ||
=====================
