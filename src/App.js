import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import localforage from 'localforage';
import {
  Container,
  TextField,
  Button,
  FormControl,
  FormLabel,
  Select,
  MenuItem,
  Typography,
  Grid,
  Paper,
  RadioGroup,
  FormControlLabel,
  Radio,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
} from '@mui/material';
import { FaSync, FaTrashAlt } from 'react-icons/fa';

const GASFEE_OPTIONS = {
  low: 5000,
  medium: 10000,
  fast: 20000,
};

function App() {
  const [seed, setSeed] = useState('');
  const [secureWallet, setSecureWallet] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [network, setNetwork] = useState('devnet');
  const [tokenMintOption, setTokenMintOption] = useState('sol');
  const [tokenMintAddress, setTokenMintAddress] = useState('');
  const [gasFee, setGasFee] = useState(GASFEE_OPTIONS.medium);
  const [transactions, setTransactions] = useState([]);
  const [label, setLabel] = useState('');
  const [activeWallets, setActiveWallets] = useState([]);

  useEffect(() => {
    localforage.getItem('state').then((savedState) => {
      if (savedState) {
        setSeed(savedState.seed);
        setSecureWallet(savedState.secureWallet);
        setNetwork(savedState.network);
        setTokenMintOption(savedState.tokenMintOption);
        setTokenMintAddress(savedState.tokenMintAddress);
        setGasFee(savedState.gasFee);
        setLabel(savedState.label);
        setActiveWallets(savedState.activeWallets || []);
      }
    });
  }, []);

  const fetchPublicKey = useCallback(async () => {
    try {
      const response = await axios.post('https://solana-monitoring-app.onrender.com/generate-public-key', { seed: seed.split(' ') });
      setPublicKey(response.data.publicKey);
    } catch (error) {
      console.error('Error generating public key:', error);
    }
  }, [seed]);

  useEffect(() => {
    if (seed) {
      fetchPublicKey();
    }
  }, [seed, fetchPublicKey]);

  useEffect(() => {
    localforage.setItem('state', {
      seed,
      secureWallet,
      network,
      tokenMintOption,
      tokenMintAddress,
      gasFee,
      label,
      activeWallets,
    });
  }, [seed, secureWallet, network, tokenMintOption, tokenMintAddress, gasFee, label, activeWallets]);

  const startMonitoring = async () => {
    try {
      const response = await axios.post('https://solana-monitoring-app.onrender.com/start-monitoring', {
        seed: seed.split(' '),
        secureWalletPublicKey: secureWallet,
        network,
        tokenMintAddress: tokenMintOption === 'sol' ? '' : tokenMintAddress,
        gasFee,
        label,
      });

      setActiveWallets((prevActiveWallets) => [
        ...prevActiveWallets,
        {
          publicKey: response.data.publicKey,
          label,
          network,
          tokenMintOption,
          tokenMintAddress,
          gasFee,
        },
      ]);
    } catch (error) {
      console.error('Error starting monitoring:', error);
    }
  };

  const stopMonitoring = async (publicKey) => {
    try {
      await axios.post('https://sol-transfer-backend.vercel.app/stop-monitoring', { publicKey });
      setActiveWallets((prevActiveWallets) => prevActiveWallets.filter((wallet) => wallet.publicKey !== publicKey));
    } catch (error) {
      console.error('Error stopping monitoring:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await axios.get('https://solana-monitoring-app.onrender.com/transactions');
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  useEffect(() => {
    const interval = setInterval(fetchTransactions, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container>
      <Paper style={{ padding: 16 }}>
        <Typography variant="h4" gutterBottom>
          Solana Auto Transfer Tool
        </Typography>
        <TextField
          label="Seed Phrase"
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          fullWidth
          margin="normal"
        />
        {publicKey && (
        <Paper style={{ marginBottom: 16 }}>
          
          <Typography>public Key: {publicKey}</Typography>
        </Paper>
      )}
        <TextField
          label="Secure Wallet Public Key"
          value={secureWallet}
          onChange={(e) => setSecureWallet(e.target.value)}
          fullWidth
          margin="normal"
        />
        <FormControl fullWidth margin="normal">
          <FormLabel>Network</FormLabel>
          <Select value={network} onChange={(e) => setNetwork(e.target.value)}>
            <MenuItem value="devnet">Devnet</MenuItem>
            <MenuItem value="testnet">Testnet</MenuItem>
            <MenuItem value="mainnet-beta">Mainnet</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <FormLabel>Token Mint Address</FormLabel>
          <RadioGroup value={tokenMintOption} onChange={(e) => setTokenMintOption(e.target.value)}>
            <FormControlLabel value="sol" control={<Radio />} label="SOL (default)" />
            <FormControlLabel value="custom" control={<Radio />} label="Custom" />
          </RadioGroup>
          {tokenMintOption === 'custom' && (
            <TextField
              label="Token Mint Address"
              value={tokenMintAddress}
              onChange={(e) => setTokenMintAddress(e.target.value)}
              fullWidth
              margin="normal"
            />
          )}
        </FormControl>
        <FormControl fullWidth margin="normal">
          <FormLabel>Gas Fee</FormLabel>
          <Select value={gasFee} onChange={(e) => setGasFee(e.target.value)}>
            <MenuItem value={GASFEE_OPTIONS.low}>Low</MenuItem>
            <MenuItem value={GASFEE_OPTIONS.medium}>Medium</MenuItem>
            <MenuItem value={GASFEE_OPTIONS.fast}>Fast</MenuItem>
          </Select>
        </FormControl>
        <TextField
          label="Label"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Grid container spacing={2} justifyContent="center" alignItems="center">
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              onClick={startMonitoring}
              startIcon={<FaSync />}
            >
              Start Monitoring
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Paper style={{ padding: 16, marginTop: 16 }}>
        <Typography variant="h6" gutterBottom>
          Active Monitored Wallets
        </Typography>
        <List>
          {activeWallets.map((wallet) => (
            <ListItem key={wallet.publicKey}>
              <ListItemText
                primary={`Public Key: ${wallet.publicKey}`}
                secondary={`seed: ${seed}, token: ${tokenMintAddress}, Network: ${wallet.network}`}
              />
              
              <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="stop" onClick={() => stopMonitoring(wallet.publicKey)}>
                  <FaTrashAlt />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>
      <Paper style={{ padding: 16, marginTop: 16 }}>
        <Typography variant="h6" gutterBottom>
          Transactions Log
        </Typography>
        {transactions.length === 0 ? (
          <Typography>No transactions logged yet.</Typography>
        ) : (
          transactions.map((tx, index) => (
            <Paper key={index} style={{ padding: 8, marginBottom: 8 }}>
              <Typography>Transaction Signature: {tx.signature}</Typography>
              <Typography>From: {tx.from}</Typography>
              <Typography>To: {tx.to}</Typography>
              <Typography>Amount: {tx.amount} {tx.token}</Typography>
              <Typography>Status: {tx.status}</Typography>
            </Paper>
          ))
        )}
      </Paper>
    </Container>
  );
}

export default App;
