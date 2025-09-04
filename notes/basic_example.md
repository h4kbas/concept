# Basic Example

## Network Architecture

### MAIN NET WALLET

```
DATA...
Human
+Head
-Beak
```

### COMPANY A WALLET

```
DATA ...
Human: ( Human of MAIN NET WALLET )
+Eye
+Leg

Duck
+Leg
+Beak
```

### COMPANY B WALLET

```
DATA ...
Human : ( Human of MAIN NET WALLET )
+Eye
+Arm
```

## Mining Process

### MINER

**COMPANY A WALLET, COMPANY B WALLET**

```
SAME DATA...
Human
+Eye
| |
| | INFERRENCE / MERGING
| |
```

### Result: MAIN NET WALLET

```
Human
+Head
+Eye
-Beak
```

## Explanation

This example demonstrates how the concept language system works across a distributed network:

1. **Main Net Wallet** defines the base concept of "Human" with basic properties
2. **Company Wallets** extend the Human concept with additional properties
3. **Miner** processes the data and performs inference/merging
4. **Result** shows the consolidated Human concept with all inferred properties

The system automatically infers that since Human is not a Duck, and Duck has a Beak, Human does not have a Beak.
