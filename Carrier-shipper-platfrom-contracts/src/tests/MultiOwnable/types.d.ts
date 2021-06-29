export type CreateInstance = (owners: string[]) => Promisable<MultiOwnableInstance>;
export type GetAccounts = () => Promisable<string[]>;
