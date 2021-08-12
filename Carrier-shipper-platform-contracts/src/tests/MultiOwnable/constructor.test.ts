import { testReject } from "solowei";

import { MultiOwnableInstance } from "@contracts";

import { CreateInstance, GetAccounts } from "./types";

export function constructorTest(
  createInstance: CreateInstance,
  getAccounts: GetAccounts,
): Mocha.Suite {
  return describe('Method: constructor', () => {
    let accounts: string[];

    before(async () => accounts = await getAccounts());
  
    // check events?

    describe('When no owners provided', async () => {
      testReject(async () => await createInstance([]), 'Owners array is empty');
    });

    describe('When one owner provided', async () => {
      let contract: MultiOwnableInstance;
      let owners: string[];

      before(() => owners = [accounts[0]])

      it('should success', async () => {
        contract = await createInstance(owners);
      });

      it('owners length should equal to 1', async () => {
        const ownersCount = await contract.ownersCount();
        assert.strictEqual(ownersCount.toString(), owners.length.toString());
      });

      it('owners should equal to the sent', async () => {
        const actualOwners = await contract.owners();
        assert.deepStrictEqual(actualOwners, owners);
      });
    }); 

    describe('When two unique owners provided', async () => {
      let contract: MultiOwnableInstance;
      let owners: string[];

      before(() => owners = [accounts[0], accounts[1]])

      it('should success', async () => {
        contract = await createInstance(owners);
      });

      it('owners length should equal to 2', async () => {
        const ownersCount = await contract.ownersCount();
        assert.strictEqual(ownersCount.toString(), owners.length.toString());
      });

      it('owners should equal to the sent', async () => {
        const actualOwners = await contract.owners();
        assert.deepStrictEqual(actualOwners, owners);
      });
    }); 

    describe('When two not unique owners provided', async () => {
      let contract: MultiOwnableInstance;
      let owners: string[];
      let uniqueOwners: string[];
      before(() => {
        owners = [accounts[1], accounts[1]]
        uniqueOwners = [...new Set(owners)];
      });

      it('should success', async () => {
        contract = await createInstance(owners);
      });

      it('owners length should equal to 2', async () => {
        const ownersCount = await contract.ownersCount();
        assert.strictEqual(ownersCount.toString(), uniqueOwners.length.toString());
      });

      it('owners should equal to the sent', async () => {
        const actualOwners = await contract.owners();
        assert.deepStrictEqual(actualOwners, uniqueOwners);
      });
    }); 

  });
}

