Inference Example

MAIN NET WALLET
DATA...
Human
+Head
Duck
+Beak

COMPANY A WALLET
DATA ...
Human isnt Duck

COMPANY B WALLET
DATA ...
Human isnt Duck

MINER

COMPANY A WALLET, COMPANY B WALLET
SAME DATA...
Human isnt Duck
| |
| | INFERRENCE / MERGING process
| |
MAIN NET WALLET
Duck
+Beak
Human
+Head
+Eye
-Duck (Duck of MAIN NET WALLET){
//Inferring that because Duck has a Beak and Human isnt a Duck, Human isnt Beak
-Beak
}
