import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./getWeb3";
import { initialize } from 'zokrates-js';

import "./App.css";

class App extends Component {
  state = { storageValue: 0, web3: null, accounts: null, contract: null, zokratesProvider: null, artifacts: null, keypair: null, result: null};

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Set up Zokrates stuff
      const zokratesProvider = await initialize();
      //const source = "def main(private field a, private field b) -> (field): return a * b";
      //const source = "def main(private field a, field b) -> (field): \nfield y = if a < b then 0 else 1 fi \n return y";
      /** 
      const source = 'import "hashes/sha256/1024bitPadded.zok" as sha256 \n' +
                        'def main(private field nonce, private field bid, field bucket, field hash) -> (field): \n' +
                          'assert(bid > bucket) \n' +
                          'field[256] computed_hash = sha256(bid,nonce) \n' +
                          'assert(computed_hash == hash)' +
                          'return 1';
      */
      const source = 'import "hashes/sha256/512bit" as sha256 \n' +
                      'from "EMBED" import unpack \n' + 
                      'import "utils/casts/u32_from_bits" as from_bits \n' +
                          'def main(private field nonce, private field bid) -> (u32[8]): \n' +
                            'bool[32] nonce_bits = unpack(nonce) \n' +
                            'bool[32] bid_bits = unpack(bid) \n' +
                            'u32 formatted_nonce = from_bits(nonce_bits) \n' +
                            'u32 formatted_bid = from_bits(bid_bits) \n' +
                            'u32[8] nonce_arr = [0,0,0,0,0,0,0,formatted_nonce] \n' +
                            'u32[8] bid_arr = [0,0,0,0,0,0,0,formatted_bid] \n' +
                            'u32[8] computed_hash = sha256(bid_arr,nonce_arr) \n' +
                            'return computed_hash';
      // Parameter: private: nonce, private: bid, public: bucket, public: hash
      // (1) Bid + nonce = hash (sha256)
      // (2) Bid in bucket
      //const source = "def main(private field a, field b) -> (bool): \n return a > b";
      // compilation
      const artifacts = zokratesProvider.compile(source);
      // run setup
      const keypair = zokratesProvider.setup(artifacts.program);
      // export solidity verifier
      //const verifier = zokratesProvider.exportSolidityVerifier(keypair.vk, "v1");

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();

      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SimpleStorageContract.networks[networkId];
      const instance = new web3.eth.Contract(
        SimpleStorageContract.abi,
        deployedNetwork && deployedNetwork.address,
      );

      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance, zokratesProvider: zokratesProvider, artifacts: artifacts, keypair: keypair}, this.runExample);
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };

  runExample = async () => {
    const { accounts, contract, zokratesProvider, artifacts, keypair} = this.state;

    // computation
    try {
      const { witness, output } = zokratesProvider.computeWitness(artifacts, ["13","4222"]);
      const proof = zokratesProvider.generateProof(artifacts.program, witness, keypair.pk);
      const res = zokratesProvider.verify(keypair.vk, proof);

      console.log(res,keypair.vk,proof);

      this.setState({ result: res});
    } catch (error) {
      console.log(error);
      this.setState({ result: false});
    }

    // generate proof
    

  };

  render() {
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
      <div className="App">
        <h1>Zokrates React Tiny Example !</h1>
        <div>Computation result is: {this.state.result? "Proof is correct" : "Proof failed"}</div>
      </div>
    );
  }
}

export default App;
