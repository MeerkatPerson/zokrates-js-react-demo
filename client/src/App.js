import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./getWeb3";
import { initialize } from 'zokrates-js';

import "./App.css";

class App extends Component {
  state = { storageValue: 0, web3: null, accounts: null, contract: null, zokratesProvider: null, artifacts: null, keypair: null, result: null, hash: null};

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();

      // Set up Zokrates stuff
      const zokratesProvider = await initialize();

      // (1) This proof will simply fail if the assert fails; so nothing will be returned if a <= b, and 1 will be returned
      //    when a > b.
      const source1 = "def main(private field a, private field b) -> (field): assert(a > b) \n return 1";

       // (2) This proof will return 0 or 1 depending on the relationship of a and b; then, the returned value can be tested
       //     against a certain excepted value when computing the proof. It's just that I don't know how this could be accomplished
       //     in zokrates-js, so ¯\_(ツ)_/¯
      const source2 = "def main(private field a, field b) -> (field): \nfield y = if a < b then 0 else 1 fi \n return y";

     // (3) EXTREMELY HACKY strategy for computing a hash from two input values (I did this because I didn't know how to pass
     //    qarrays as input)
      const source3 = 'import "hashes/sha256/512bit" as sha256 \n' +
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

      /**
       * 'def pack256(field[256] bits) -> (field): \n' +
                      'field out = 0 \n' +
	                    'for field j in 0..256 do \n' +
		                  'field i = 256 - (j + 1) \n' +
		                  'out = out + bits[i] * (2 ** j) \n' +
	                    'endfor \n' +
                      'return out \n' +
       */

      const source4 = 'import "utils/pack/u32/nonStrictUnpack256" as unpack256u \n' +
                      'import "utils/pack/u32/pack256.zok" as pack256u \n' +
                      'import "hashes/sha256/512bit" as sha256 \n' +
                      'def main(private field nonce, private field bid) -> (field): \n' +
                      'u32[8] unpacked_nonce = unpack256u(nonce) \n' +
                      'u32[8] unpacked_bid = unpack256u(bid) \n' +
                      'u32[8] computed_hash = sha256(unpacked_bid,unpacked_nonce) \n' +
                      'field packed_hash = pack256u(computed_hash) \n' +
                      'return packed_hash';

      const source5 = 'import "hashes/sha256/512bitPacked.zok" as sha256 \n' +
                      'def main(field i, field j) -> (field[2]): \n' +
                      'field[4] hashMe = [0,0,i,j] \n' +
                      'return sha256(hashMe)'
      // (4) COMING UP: the actual function we need
      // Parameter: private: nonce, private: bid, public: bucket, public: hash
      // (1) Bid + nonce = hash (sha256)
      // (2) Bid in bucket
      /** 
      const source = 'import "hashes/sha256/1024bitPadded.zok" as sha256 \n' +
                        'def main(private field nonce, private field bid, field bucket, field hash) -> (field): \n' +
                          'assert(bid > bucket) \n' +
                          'field[256] computed_hash = sha256(bid,nonce) \n' +
                          'assert(computed_hash == hash)' +
                          'return 1';
      */
      // compilation
      const artifacts = zokratesProvider.compile(source4);
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
      //const { witness, output } = zokratesProvider.computeWitness(artifacts, ["13","4222"]);
      const { witness, output } = zokratesProvider.computeWitness(artifacts, ["13","31"]);
      const proof = zokratesProvider.generateProof(artifacts.program, witness, keypair.pk);
      const res = zokratesProvider.verify(keypair.vk, proof);

      console.log(res,keypair.vk,proof);

      this.setState({ result: res});
      this.setState({ hash: output})
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
        <div>Output is: {this.state.hash}</div>
      </div>
    );
  }
}

export default App;
