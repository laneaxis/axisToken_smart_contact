const ethers = require('ethers')
const { Watcher } = require('@eth-optimism/watcher')
const { getContractFactory } = require('@eth-optimism/contracts')
const CONFIG = require('config');

const PRIVATE_KEY = CONFIG.PRIVATE_KEY;
const L1_AXIS = '0xf0c5831ec3da15f3696b4dad8b21c7ce2f007f28';
const L1_RPC = 'https://kovan.infura.io/v3/57c91012b5d848d183b60d1db4e44374';
const L2_RPC = 'https://kovan.optimism.io';
const GAS_PRICE = 15000000;

// Set up some contract factories. You can ignore this stuff.
const factory = (name, ovm = false) => {
  const artifact = require(`./artifacts${ovm ? '-ovm' : ''}/contracts/${name}.sol/${name}.json`)
  return new ethers.ContractFactory(artifact.abi, artifact.bytecode)
}
const factory__L1_ERC20 = factory('LineAxis')
const factory__L2_ERC20 = factory('L2DepositedERC20', true)
const factory__L1_ERC20Gateway = getContractFactory('OVM_L1ERC20Gateway')
// const factory__L1_ERC20Gateway = factory('OVM_L1ERC20Gateway')

async function main() {
  // Set up our RPC provider connections.
  const l1RpcProvider = new ethers.providers.JsonRpcProvider(L1_RPC || 'http://localhost:9545')
  const l2RpcProvider = new ethers.providers.JsonRpcProvider(L2_RPC || 'http://localhost:8545')

  // Set up our wallets (using a default private key with 10k ETH allocated to it).
  // Need two wallets objects, one for interacting with L1 and one for interacting with L2.
  // Both will use the same private key.
  const key = PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  const l1Wallet = new ethers.Wallet(key, l1RpcProvider)
  const l2Wallet = new ethers.Wallet(key, l2RpcProvider)

  // L1 messenger address depends on the deployment, this is default for our local deployment.
  const l1MessengerAddress = '0x4200000000000000000000000000000000000001'
  // L2 messenger address is always the same.
  const l2MessengerAddress = '0x4200000000000000000000000000000000000007'

  // Tool that helps watches and waits for messages to be relayed between L1 and L2.
  const watcher = new Watcher({
    l1: {
      provider: l1RpcProvider,
      messengerAddress: l1MessengerAddress
    },
    l2: {
      provider: l2RpcProvider,
      messengerAddress: l2MessengerAddress
    }
  })

  // TODO: only if development
  // Deploy an ERC20 token on L1.
  console.log('Deploying L1 ERC20...')
  const DATA = {
    NAME: 'AXIS Token',
    SYMBOL: 'AXIS',
    DECIMALS: 8,
    TOTAL: 1e6 * 1e8,
    FROZEN: false,
  }
  const L1_ERC20 = await factory__L1_ERC20.connect(l1Wallet).deploy(
    DATA.NAME, DATA.SYMBOL, DATA.DECIMALS, DATA.TOTAL, DATA.FROZEN,
  );
  await L1_ERC20.deployTransaction.wait()
  console.log(L1_ERC20.address)

  // Deploy the paired ERC20 token to L2.
  console.log('Deploying L2 ERC20...')
  const L2_ERC20 = await factory__L2_ERC20.connect(l2Wallet).deploy(
    l2MessengerAddress,
    DATA.NAME, DATA.SYMBOL, DATA.DECIMALS, DATA.FROZEN,
    {
      gasPrice: GAS_PRICE,
      gasLimit: 214940000, // TODO: estimate gas
    }
  )
  await L2_ERC20.deployTransaction.wait()
  console.log(L2_ERC20.address)

  // Create a gateway that connects the two contracts.
  console.log('Deploying L1 ERC20 Gateway...')
  const L1_ERC20Gateway = await factory__L1_ERC20Gateway.connect(l1Wallet).deploy(
    L1_ERC20.address,
    L2_ERC20.address,
    l1MessengerAddress
  )
  await L1_ERC20Gateway.deployTransaction.wait()
  console.log(L1_ERC20Gateway.address)

  // Make the L2 ERC20 aware of the gateway contract.
  console.log('Initializing L2 ERC20...')
  const tx0 = await L2_ERC20.init(
    L1_ERC20Gateway.address,
    {
      gasPrice: GAS_PRICE
    }
  )
  await tx0.wait()

  // Initial balances.
  console.log(`Balance on L1: ${await L1_ERC20.balanceOf(l1Wallet.address)}`) // 1234
  console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l1Wallet.address)}`) // 0

  // Allow the gateway to lock up some of our tokens.
  console.log('Approving tokens for ERC20 gateway...')
  const tx1 = await L1_ERC20.approve(L1_ERC20Gateway.address, 1234)
  await tx1.wait()

  // Lock the tokens up inside the gateway and ask the L2 contract to mint new ones.
  console.log('Depositing tokens into L2 ERC20...')
  const tx2 = await L1_ERC20Gateway.deposit(1234, {
    gasLimit: 9500000,
    gasPrice: GAS_PRICE,
  })
  await tx2.wait()

  // Wait for the message to be relayed to L2.
  console.log('Waiting for deposit to be relayed to L2...')
  const [ msgHash1 ] = await watcher.getMessageHashesFromL1Tx(tx2.hash)
  await watcher.getL2TransactionReceipt(msgHash1)

  // Log some balances to see that it worked!
  console.log(`Balance on L1: ${await L1_ERC20.balanceOf(l1Wallet.address)}`) // 0
  console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l1Wallet.address)}`) // 1234

  // Burn the tokens on L2 and ask the L1 contract to unlock on our behalf.
  console.log(`Withdrawing tokens back to L1 ERC20...`)
  const tx3 = await L2_ERC20.withdraw(
    1234,
    {
      gasPrice: GAS_PRICE
    }
  )
  await tx3.wait()

  // Wait for the message to be relayed to L1.
  console.log(`Waiting for withdrawal to be relayed to L1...`)
  const [ msgHash2 ] = await watcher.getMessageHashesFromL2Tx(tx3.hash)
  await watcher.getL1TransactionReceipt(msgHash2)

  // Log balances again!
  console.log(`Balance on L1: ${await L1_ERC20.balanceOf(l1Wallet.address)}`) // 1234
  console.log(`Balance on L2: ${await L2_ERC20.balanceOf(l1Wallet.address)}`) // 0
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error)
    process.exit(1)
  })
