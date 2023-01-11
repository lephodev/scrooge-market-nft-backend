import {ThirdwebSDK} from '@thirdweb-dev/sdk';

const sdk = new ThirdwebSDK("https://bsc-dataseed3.binance.org/");
const contract = await sdk.getContract("0x729FDb31f1Cd2633aE26F0A87EfD0CC55a336F9f");
/*const bal = await contract.erc1155.balanceOf("0x77eA7d7428178f676a16E620E705e8fAF63402B6", 4);
console.log('Wallet NFT Balance: ',bal.toString());*/

export default sdk;