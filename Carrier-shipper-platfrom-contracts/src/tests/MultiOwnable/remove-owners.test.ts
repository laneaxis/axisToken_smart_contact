import { testReject, UnPromisify } from "solowei";

import { MultiOwnableInstance } from "@contracts";

import { CreateInstance, GetAccounts } from "./types";

import { deepLowercaseEqual, randomAccount } from "../utils";

export function removeOwnersTest(
  createInstance: CreateInstance,
  getAccounts: GetAccounts,
):Mocha.Suite {
  return describe('Method: removeOwners', () => {
    let contract: MultiOwnableInstance;
    let accounts: string[];

    before(async () => {
      accounts = await getAccounts();
      contract = await createInstance([accounts[0]]);
    });

    describe('When caller is not owner', () => {
      let notOwner: string;
      before(async () => {
        notOwner = accounts[2];
        await contract.addOwners([accounts[1]]);
        await contract.removeOwners([notOwner])
      });
      testReject(() => contract.addOwners([randomAccount()], { from: accounts[2] }), 'Not owner');
    });

    describe('When removing all the owners', () => {
      let initialOwners: string[];
      before(async () => initialOwners = await contract.owners());
      testReject(() => contract.removeOwners(initialOwners), 'Must be at least one owner');
    });

    describe('When no owners provided', () => {
      let initialOwners: string[];
      let result: UnPromisify<ReturnType<MultiOwnableInstance["addOwners"]>> | undefined;

      before(async () => initialOwners = await contract.owners());

      it('should success', async () => {
        result = await contract.removeOwners([]);
      });

      it('should not emit events', function () {
        if (!result) throw this.skip();
        const logs = result.logs.filter(({ event }) => event === 'OwnerRemoved');
        assert.strictEqual(logs.length, 0);
      });

      it('owners should not be updated', async () => {
        const actualOwners = await contract.owners();
        assert.deepStrictEqual(actualOwners, initialOwners);
      });

    });

    describe('When provided addresses are owners and unique', () => {
      let owners: string[];
      let result: UnPromisify<ReturnType<MultiOwnableInstance["removeOwners"]>> | undefined;
      
      before(async () => {
        result = await contract.addOwners([randomAccount(), randomAccount()]);
        owners = await contract.owners();
      });

      it('should success', async () => {
        result = await contract.removeOwners(owners.slice(1));
      });

      it('should emit events', function () {
        if (!result) throw this.skip();
        const logs = result.logs.filter(({ event }) => event === 'OwnerRemoved');
        assert.strictEqual(logs.length, owners.length - 1);
      });

      it('new owners should be add to olds', async () => {
        const actualOwners = await contract.owners();
        deepLowercaseEqual(actualOwners, [owners[0]]);
      });
    });

    describe('When provided addresses are not unique', () => {
      let owners: string[];
      let result: UnPromisify<ReturnType<MultiOwnableInstance["removeOwners"]>> | undefined;
      
      before(async () => {
        await contract.addOwners([randomAccount()]);
        owners = await contract.owners();
      });

      it('should success', async () => {
        result = await contract.removeOwners([...owners.slice(1), owners[owners.length - 1]]);
      });

      it('should emit events', function () {
        if (!result) throw this.skip();
        const logs = result.logs.filter(({ event }) => event === 'OwnerRemoved');
        assert.strictEqual(logs.length, owners.length - 1);
      });

      it('new owners should be add to olds', async () => {
        const actualOwners = await contract.owners();
        deepLowercaseEqual(actualOwners, [owners[0]]);
      });
    });

  });
}
