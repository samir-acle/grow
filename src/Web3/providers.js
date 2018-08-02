import Web3 from 'web3';

const web3ForEvents = new Web3();
const eventProvider = new Web3.providers.WebsocketProvider('ws://localhost:8545');
web3.setProvider(eventProvider);

export {
    web3ForEvents, 
} 
