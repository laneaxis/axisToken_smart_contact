import { testReject, UnPromisify } from "solowei";

import { MultiOwnableInstance } from "@contracts";

import { CreateInstance, GetAccounts } from "./types";

import { deepLowercaseEqual, randomAccount } from "../utils";

export function addOwnersTest(
  createInstance: CreateInstance,
  getAccounts: GetAccounts,
):Mocha.Suite {
  return describe('Method: addOwners', () => {
    let contract: MultiOwnableInstance;
    let accounts: string[];

    before(async () => {
      accounts = await getAccounts();
      contract = await createInstance([accounts[0]]);
    })

    describe('When caller is not owner', () => {
      let notOwner: string;
      before(async () => {
        notOwner = accounts[2];
        await contract.addOwners([accounts[1]]);
        await contract.removeOwners([notOwner])
      });
      testReject(() => contract.addOwners([randomAccount()], { from: accounts[2] }), 'Not owner');
    });

    describe('When no owners provided', () => {
      let initialOwners: string[];
      let result: UnPromisify<ReturnType<MultiOwnableInstance["addOwners"]>> | undefined;

      before(async () => initialOwners = await contract.owners());

      it('should success', async () => {
        result = await contract.addOwners([]);
      });

      it('should not emit events', function () {
        if (!result) throw this.skip();
        const logs = result.logs.filter(({ event }) => event === 'OwnerAdded');
        assert.strictEqual(logs.length, 0);
      });

      it('owners should not be updated', async () => {
        const actualOwners = await contract.owners();
        assert.deepStrictEqual(actualOwners, initialOwners);
      });

    });

    describe('When owners are unique', () => {
      const newUniqueOwners: string[] = [randomAccount(), randomAccount()];
      let initialOwners: string[];
      let result: UnPromisify<ReturnType<MultiOwnableInstance["addOwners"]>> | undefined;
      
      before(async () => initialOwners = await contract.owners());

      it('should success', async () => {
        result = await contract.addOwners(newUniqueOwners);
      });

      it('should emit events', function () {
        if (!result) throw this.skip();
        const logs = result.logs.filter(({ event }) => event === 'OwnerAdded');
        assert.strictEqual(logs.length, newUniqueOwners.length);
      });

      it('new owners should be add to olds', async () => {
        const actualOwners = await contract.owners();
        deepLowercaseEqual(actualOwners, [...initialOwners, ...newUniqueOwners]);
      });
    });

    describe('When owners are not unique', () => {
      const newOwners: string[] = Array.from({ length: 2 }, randomAccount);
      const newUniqueOwners = [...new Set(newOwners)];
      let expectedOwners: string[];
      let result: UnPromisify<ReturnType<MultiOwnableInstance["addOwners"]>> | undefined;
      
      before(async () => expectedOwners = [...await contract.owners(), ...newUniqueOwners]);

      it('should success', async () => {
        result = await contract.addOwners(newOwners);
      });

      it('should emit events', function () {
        if (!result) throw this.skip();
        const logs = result.logs.filter(({ event }) => event === 'OwnerAdded');
        assert.strictEqual(logs.length, newUniqueOwners.length);
      });

      it('new owners should be add to olds', async () => {
        const actualOwners = await contract.owners();
        deepLowercaseEqual(actualOwners, expectedOwners);
      });
    });

  });
}
