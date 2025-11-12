export type FunctionIndex = {
  name: string;
  kind: string;
  lineStart: number;
  lineEnd: number;
};

export type SourceFunctionIndexes = {
  [source: string]: Array<FunctionIndex>;
};

export type ProtocolFunctionIndexes = {
  [protocol: string]: SourceFunctionIndexes;
};
