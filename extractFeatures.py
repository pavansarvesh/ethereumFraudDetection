
from pathlib import Path
import pickle
import networkx as nx
import pandas as pd
import random

# -----------------------------
# LOAD GRAPH
# -----------------------------

def load_pickle(fname):
    with open(fname, 'rb') as f:
        return pickle.load(f)


pickle_path = Path(
    "./dataset/ethereum-phishing-transaction-network/"
    "Ethereum Phishing Transaction Network/"
    "MulDiGraph.pkl"
)

print("Exists:", pickle_path.exists())
print("Absolute path:", pickle_path.resolve())

print("\nLoading graph...")
G = load_pickle(pickle_path)

print(
    f"Loaded graph with "
    f"{G.number_of_nodes()} nodes and "
    f"{G.number_of_edges()} edges"
)

# -----------------------------
# RANDOM SAMPLING
# -----------------------------

MAX_WALLETS = 100000

print("\nPreparing random wallet sample...")

all_nodes = list(G.nodes())

random.seed(42)

sampled_nodes = random.sample(
    all_nodes,
    min(MAX_WALLETS, len(all_nodes))
)

print(f"Sampled {len(sampled_nodes)} wallets")

# -----------------------------
# FEATURE EXTRACTION
# -----------------------------

wallet_data = []

print("\nExtracting features...")

for idx, node in enumerate(sampled_nodes):

    # -----------------------------
    # BASIC GRAPH FEATURES
    # -----------------------------

    in_degree = G.in_degree(node)
    out_degree = G.out_degree(node)

    total_sent = 0
    total_received = 0

    sent_count = 0
    recv_count = 0

    neighbors = set()

    max_sent = 0
    max_received = 0

    # -----------------------------
    # OUTGOING TRANSACTIONS
    # -----------------------------

    for _, target, key, data in G.out_edges(
        node,
        keys=True,
        data=True
    ):

        amount = data.get('amount', 0)

        total_sent += amount
        sent_count += 1

        if amount > max_sent:
            max_sent = amount

        neighbors.add(target)

    # -----------------------------
    # INCOMING TRANSACTIONS
    # -----------------------------

    for source, _, key, data in G.in_edges(
        node,
        keys=True,
        data=True
    ):

        amount = data.get('amount', 0)

        total_received += amount
        recv_count += 1

        if amount > max_received:
            max_received = amount

        neighbors.add(source)

    # -----------------------------
    # SAFE AVERAGES
    # -----------------------------

    avg_sent = (
        total_sent / sent_count
        if sent_count > 0 else 0
    )

    avg_received = (
        total_received / recv_count
        if recv_count > 0 else 0
    )

    # -----------------------------
    # TOTAL TRANSACTIONS
    # -----------------------------

    tx_count = sent_count + recv_count

    # -----------------------------
    # LABEL
    # -----------------------------

    label = G.nodes[node].get('isp', 0)

    # -----------------------------
    # STORE FEATURES
    # -----------------------------

    wallet_data.append({

        'wallet': str(node),

        'in_degree': in_degree,
        'out_degree': out_degree,

        'total_sent': total_sent,
        'total_received': total_received,

        'avg_sent': avg_sent,
        'avg_received': avg_received,

        'max_sent': max_sent,
        'max_received': max_received,

        'tx_count': tx_count,

        'unique_neighbors': len(neighbors),

        'label': label
    })

    # -----------------------------
    # PROGRESS LOGGING
    # -----------------------------

    if idx % 1000 == 0:
        print(f"Processed {idx} wallets")

# -----------------------------
# CONVERT TO DATAFRAME
# -----------------------------

print("\nCreating dataframe...")

df = pd.DataFrame(wallet_data)

# -----------------------------
# SAVE CSV
# -----------------------------

output_path = "wallet_features.csv"

df.to_csv(output_path, index=False)

# -----------------------------
# SUMMARY
# -----------------------------

print(f"\nSaved features to {output_path}")

print("\nDataframe shape:")
print(df.shape)

print("\nLabel distribution:")
print(df['label'].value_counts())

print("\nPreview:")
print(df.head())
