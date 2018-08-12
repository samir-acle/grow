import IPFS from 'ipfs-api';

// const ipfs = new IPFS({ host: ‘ipfs.infura.io’, port: 5001, protocol: ‘https’ });
const ipfs = IPFS('/ip4/127.0.0.1/tcp/5001');

export default ipfs;
