import { ipfsHashToBytes32, bytes32ToIpfsHash } from '../ipfsHelpers';

describe('ipfs helpers', () => {
    it('should go from ipfs hash to bytes 32 and back', () => {
        const ipfsHash = "QmZCWx4mNWJ5a1p9rs4YsPibFt3NngGKjzWYXSzTj3snVq";
        const bytes32 = ipfsHashToBytes32(ipfsHash);
        expect(bytes32ToIpfsHash(bytes32)).toBe(ipfsHash);
    });
});
