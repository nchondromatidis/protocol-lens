export type StorageElement = {
  contract: string;
  label: string;
  offset: number;
  slot: string;
  type: string;
};

export type StorageType = {
  encoding: 'inplace' | 'mapping' | 'dynamic_array' | 'bytes';
  label: string;
  numberOfBytes: string;
  // `base` is present on array types and represents the type of each array element
  base?: string;
  // `members` is present on struct types and is a list of component types
  members?: StorageElement[];
};

export type StorageTypes = {
  [name: string]: StorageType;
} | null;

export type StorageLayout = {
  storage: StorageElement[];
  types: StorageTypes;
};
