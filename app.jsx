import "./App.css";
import React, { useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";

export default function App() {
  return (
    <main>
      <SolanaTransactions />
    </main>
  );
}

const SolanaTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    if (!walletAddress) {
      alert("Please enter a Solana wallet address.");
      return;
    }

    setLoading(true);
    setTransactions([]); // Reset transactions before fetching

    const connection = new Connection("https://api.mainnet-beta.solana.com");

    try {
      const pubKey = new PublicKey(walletAddress);
      const signatures = await connection.getSignaturesForAddress(pubKey, {
        limit: 10,
      });

      const txs = await Promise.all(
        signatures.map(async (sig) => {
          const tx = await connection.getParsedTransaction(sig.signature, {
            commitment: "confirmed",
          });
          if (tx) {
            let amount = 0;
            tx.meta?.preTokenBalances?.forEach((balance, index) => {
              if (tx.meta.postTokenBalances) {
                amount +=
                  balance.uiTokenAmount.uiAmount -
                    tx.meta.postTokenBalances[index]?.uiTokenAmount.uiAmount ||
                  0;
              }
            });
            return { signature: sig.signature, amount };
          }
          return null;
        }),
      );

      setTransactions(txs.filter((tx) => tx !== null));
    } catch (error) {
      console.error("Error fetching transactions:", error);
      alert("Invalid wallet address or error fetching transactions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Enter Solana wallet address"
        value={walletAddress}
        onChange={(e) => setWalletAddress(e.target.value)}
      />
      <button onClick={fetchTransactions} disabled={loading}>
        {loading ? "Fetching..." : "Fetch Transactions"}
      </button>
      <h2>Latest Transactions</h2>
      {loading ? (
        <p>Loading transactions...</p>
      ) : transactions.length > 0 ? (
        <ul>
          {transactions.map((tx, index) => (
            <li key={index}>
              <strong>Transaction {index + 1}:</strong>{" "}
              <a
                href={`https://solscan.io/tx/${tx.signature}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {tx.signature}
              </a>{" "}
              - Amount: {tx.amount.toFixed(6)} SOL
            </li>
          ))}
        </ul>
      ) : walletAddress ? (
        <p>No transactions found for this wallet.</p>
      ) : null}
    </div>
  );
};
