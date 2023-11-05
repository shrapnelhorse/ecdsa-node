const { secp256k1 } = require("ethereum-cryptography/secp256k1");
const { keccak256 } = require("ethereum-cryptography/keccak");
const { toHex, utf8ToBytes } = require("ethereum-cryptography/utils");
const express = require("express");
const app = express();
const cors = require("cors");
const port = 3042;

app.use(cors());
app.use(express.json());

// Wallet 1
// private key:  cb25fac299832999c458a9d1b5fef449426f499c2a25536ebc2d2bb6a4568d7d   
// public key:  023af65aa6763311a77cfcb3e7fa1e0ccf9362cfd55b1c956465bd6f9421b20122  
// address:  b1f997692639c401261897170461bd7cfbe6f21d

// Wallet 2
// private key:  125b7f130659796cf46fffbe9c3f24014a59fe6a69cd4bfdd2fe771274c725a1
// public key:  02e278f8603ce31e1d65e395de3726e1de06438f4111117469c9c845c93fbbd1bd
// address:  b7b49cb3ef19504f8d5e0fd83ee5ec87e797362b

const balances = {
  "b1f997692639c401261897170461bd7cfbe6f21d": 100,
  "b7b49cb3ef19504f8d5e0fd83ee5ec87e797362b": 50
};

app.get("/balance/:address", (req, res) => {
  const { address } = req.params;
  const balance = balances[address] || 0;
  res.send({ balance });
});

app.post("/send", (req, res) => {

  //get values
  const { message, sigHex, recovery } = req.body;
  const { fromAddress, toAddress, amount, timestamp, nonce } = message;

  //ensure toAddress is not the same as fromAddress
  if(toAddress === fromAddress){
    res.status(500).send({ message: "You can't send money to yourself" });
    return;
  }

  //retrieve signature address
  let sig = secp256k1.Signature.fromCompact(sigHex)
  sig = sig.addRecoveryBit(recovery);
  const publicKey = sig.recoverPublicKey(keccak256(utf8ToBytes(JSON.stringify(message)))).toRawBytes();
  const sigAddress = toHex(keccak256(publicKey.slice(1)).slice(-20));

  //ensure signature address matches the from address
  if(sigAddress !== fromAddress){
    res.status(500).send({ message: "You did not sign this message" });
    return;
  }

  setInitialBalance(fromAddress);
  setInitialBalance(toAddress);

  if (balances[fromAddress] < amount) {
    res.status(500).send({ message: "Not enough funds!" });
    return;
  } else {
    balances[fromAddress] -= amount;
    balances[toAddress] += amount;
    res.send({ balance: balances[fromAddress] });
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}!`);
});

function setInitialBalance(address) {
  if (!balances[address]) {
    balances[address] = 0;
  }
}