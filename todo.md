# TODO

- temv-lens
  - Features
    - inheritance. Function inheritance order.
    - precompiles
    - Detect fallback/receive? ast -> sourcemap -> pc
    - Decode arguments for function entry handler
    - Decode result for function exit handler
  - Refactor
    - break decoding function call: function call, fallback handlers
    - break decoding result: error, result
  - Nice to have
    - logger
    - convert anemic to rich domain model
- tevm-lens-ui
    - txTrace -> components
- analysis
    - Add dependency on protocols
    - while using analysis: fix tevm-lens when needed


# Thoughts
- Runtime trace metadata class
- Trace result class
- Make the system more error-resilient
  - currently it expects function entries and returns to be detected and in a specific order
  - Detect and take action (eg skip current execution context), empty vs wrong:
    - what if you expect a function1 call, but you get a function2 call?
    - what if you expect a function1 result, but you get a function2 result?

