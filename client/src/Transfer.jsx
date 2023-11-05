import { useState } from "react";
import server from "./server";
import { getRandomBytesSync } from "ethereum-cryptography/random";
import { utf8ToBytes } from "ethereum-cryptography/utils";
import { secp256k1 } from "ethereum-cryptography/secp256k1";
import { keccak256 } from "ethereum-cryptography/keccak";

function Transfer({ address, setBalance, privateKey }) {
  const [sendAmount, setSendAmount] = useState("20");
  const [recipient, setRecipient] = useState("b7b49cb3ef19504f8d5e0fd83ee5ec87e797362b");

  const setValue = (setter) => (evt) => setter(evt.target.value);

  async function transfer(evt) {
    evt.preventDefault();

    const message = {
      fromAddress: address,
      toAddress: recipient,
      amount: parseInt(sendAmount),
      timestamp: Date.now(),
      nonce: new DataView(getRandomBytesSync(4).buffer).getUint32()
    }

    const sig = secp256k1.sign(keccak256(utf8ToBytes(JSON.stringify(message))), privateKey);  

    try {
      const {
        data: { balance },
      } = await server.post(`send`,{
        message: message,
        sigHex: sig.toCompactHex(),
        recovery: sig.recovery
      });
      setBalance(balance);
    } catch (ex) {
      alert(ex.response.data.message);
    }
  }

  return (
    <form className="container transfer" onSubmit={transfer}>
      <h1>Send Transaction</h1>

      <label>
        Send Amount
        <input
          placeholder="1, 2, 3..."
          value={sendAmount}
          onChange={setValue(setSendAmount)}
        ></input>
      </label>

      <label>
        Recipient
        <input
          placeholder="Type an address, for example: 0x2"
          value={recipient}
          onChange={setValue(setRecipient)}
        ></input>
      </label>

      <input type="submit" className="button" value="Transfer" />
    </form>
  );
}

export default Transfer;
