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
