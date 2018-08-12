import bs58 from 'bs58';

// followed https://github.com/saurfang/ipfs-multihash-on-solidity 

const HASH_FUNCTION = parseInt(12, 16);
const HASH_SIZE = parseInt(20, 16);

export const ipfsHashToBytes32 = (hash) => {
    const decoded = bs58.decode(hash);
    return `0x${decoded.slice(2).toString('hex')}`;
};

export const bytes32ToIpfsHash = (bytes32) => {
  const hashBytes = Buffer.from(bytes32.slice(2), 'hex');
  const multihashBytes = new (hashBytes.constructor)(2 + hashBytes.length);
  multihashBytes[0] = HASH_FUNCTION;
  multihashBytes[1] = HASH_SIZE;
  multihashBytes.set(hashBytes, 2);

  return bs58.encode(multihashBytes);
};


// /**
//  * @typedef {Object} Multihash
//  * @property {string} digest The digest output of hash function in hex with prepended '0x'
//  * @property {number} hashFunction The hash function code for the function used
//  * @property {number} size The length of digest
//  */

// /**
//  * Partition multihash string into object representing multihash
//  *
//  * @param {string} multihash A base58 encoded multihash string
//  * @returns {Multihash}
//  */
// export function getBytes32FromMultiash(multihash) {
//   const decoded = bs58.decode(multihash);

//   return {
//     digest: `0x${decoded.slice(2).toString('hex')}`,
//     hashFunction: decoded[0],
//     size: decoded[1],
//   };
// }

// /**
//  * Encode a multihash structure into base58 encoded multihash string
//  *
//  * @param {Multihash} multihash
//  * @returns {(string|null)} base58 encoded multihash string
//  */
// export function getMultihashFromBytes32(multihash) {
//   const { digest, hashFunction, size } = multihash;
//   if (size === 0) return null;

//   // cut off leading "0x"
//   const hashBytes = Buffer.from(digest.slice(2), 'hex');

//   // prepend hashFunction and digest size
//   const multihashBytes = new (hashBytes.constructor)(2 + hashBytes.length);
//   multihashBytes[0] = hashFunction;
//   multihashBytes[1] = size;
//   multihashBytes.set(hashBytes, 2);

//   return bs58.encode(multihashBytes);
// }

// /**
//  * Parse Solidity response in array to a Multihash object
//  *
//  * @param {array} response Response array from Solidity
//  * @returns {Multihash} multihash object
//  */
// export function parseContractResponse(response) {
//   const [digest, hashFunction, size] = response;
//   return {
//     digest,
//     hashFunction: hashFunction.toNumber(),
//     size: size.toNumber(),
//   };
// }

// /**
//  * Parse Solidity response in array to a base58 encoded multihash string
//  *
//  * @param {array} response Response array from Solidity
//  * @returns {string} base58 encoded multihash string
//  */
// export function getMultihashFromContractResponse(response) {
//   return getMultihashFromBytes32(parseContractResponse(response));
// }
