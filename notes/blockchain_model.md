How to keep data 2: Block and Mining Inference

true false
t f

BLOCK 1
1: a 1:b 1:c 1:d 1:e
Block Concepts: [Human, Duck, Eye, Beak, Intelligent]

    		1: 0                   1:1           1: 2                1:3            1:4                1:5

Block Pairs: [ [1:a, 1:c], [1:a, 1:b], [1:b, 1:c], [1:b, 1:d] , [1:a, 1:e], [1:b, 1:e] ]

Chain:[
[1:0, t],
[1:1, f]
[1:2, t],
[1:3, t],
[1:4, f],
]

Miner Node: Block 1
1: a 1:b 1:c 1:d 1:e
Block Concepts: [Human, Duck, Eye, Beak, Intelligent]

1: 0 1:1 1: 2 1:3 1:4 1:5 1:6 1:7
Block Pairs: [ [1:a, 1:c], [1:a, 1:b], [1:b, 1:c], [1:b, 1:d] , [1:a, 1:e], [1:b, 1:e] , [1:a, 1:c] X, [1:a, 1:d] ✓ ]

Chain:[
[1:0, t],
[1:1, f]
[1:2, t],
[1:3, t],
[1:4, f],
[1:6, f] // REMOVED because explicit definition of [1:a, 1:c] done before as [1:0, t] X
[1:7, f] // STAYS because not explicit definition of [1:a, 1:d] done before as [x:x, t/f] ✓
]

BLOCK 2
2:a
Block Concepts: [Car]
2:0
Block Pairs: [ [2:a, 1:c] ]

Chain:[
[2:0, f],
[1:4, t],
[1:5, f],
]

CURRENT STATE: SUMMARY of BLOCK 1 and BLOCK 2 (ARCHIVE NODE)

1: a 1:b 1:c 1:d 1:e 2:a
Block Concepts: [Human, Duck, Eye, Beak, Intelligent, Car]

1: 0 1:1 1: 2 1:3 1:4 1:5 1:7 2:0
Block Pairs: [ [1:a, 1:c], [1:a, 1:b], [1:b, 1:c], [1:b, 1:d] , [1:a, 1:e], [1:b, 1:e] , [1:a, 1:d], [2:a, 1:c]]

Chain:[
[1:0, t],
[1:1, f]
[1:2, t],
[1:3, t],
[1:4, f],
[1:7, f],
[2:0, f],
[1:4, t],
[1:5, f],
]
