type wl<T> = T extends (...args: [...infer R, Truffle.TransactionDetails]) => unknown ? R : never;

// Native truffle estimation does not work, that's why we need to use these fns

export async function deploy<T extends Truffle.ContractInstance, C extends Truffle.Contract<T> = Truffle.Contract<T>>(
  deployer: Deployer,
  typedContract: C,
  // ...args: Parameters<C["new"]>
  ...args: wl<C["new"]>
): Promise<ReturnType<Deployer['deploy']>> {
  const contract = typedContract as any;
  const web3 = contract.interfaceAdapter.web3;
  const txObj = {
    from: contract.class_defaults.from,
    data: contract._json.bytecode,
  }
  if (args.length) {
    const constructor = contract._json.abi.find((method: { type: string }) => method.type === 'constructor');
    if (!constructor) {
      throw new Error('Deploy: Constructor not found');
    }
    const encodedArgs: string = web3.eth.abi.encodeParameters(constructor.inputs, args);
    txObj.data += encodedArgs.replace('0x', '');
  }
  const gasLimit = await web3.eth.estimateGas(txObj);
  const constructorArgsWithMeta: any = [...args, { gas: gasLimit }];
  return deployer.deploy(typedContract, ...constructorArgsWithMeta);
}
