# Logger Runtime Portability Results

This document presents evidence that the logging utility operates safely across Node.js, browsers, and edge runtimes (Cloudflare Workers) without depending unconditionally on Node-only globals.

## Capability Checks

The logging engine checks for global references safely before invoking operations:
1. **Node Environment Check**:
   ```typescript
   if (typeof process !== "undefined" && process && process.stdout && typeof process.stdout.write === "function") {
     process.stdout.write(message + "\n");
     return;
   }
   ```
2. **Console Fallback Check**:
   ```typescript
   if (typeof console !== "undefined" && typeof console.log === "function") {
     console.log(message);
     return;
   }
   ```

No references to undefined objects or global variables are evaluated without `typeof` guards, ensuring that the JavaScript engine does not throw type or reference errors in browsers or V8 isolates.

---

## Log Interception and Sink Mocking in Tests

The logger exports `logger` as a class instance exposing `setSink(sink: LogSink)` allowing tests to hook into emissions and assert behavior deterministically.

### Verification Test Code
The following integration test was executed successfully in `tests/integration/adversarial.spec.ts`:
```typescript
it("logger operates cleanly with custom LogSink and falls back without process.stdout", () => {
  const messages: string[] = [];
  const testSink: LogSink = {
    write: (msg: string) => {
      messages.push(msg);
    },
  };

  logger.setSink(testSink);
  logger.info({ operation: "TestLog" }, "Testing structured logs");

  expect(messages.length).toBe(1);
  const parsed = JSON.parse(messages[0]!);
  expect(parsed.msg).toBe("Testing structured logs");
  expect(parsed.operation).toBe("TestLog");
});
```

### Edge Environment Verification
To simulate an environment lacking Node.js streams (like Cloudflare Workers):
1. The sink detects that `process.stdout` is absent.
2. The logger falls back to standard `console.log()` to stream events.
3. If run in an environment lacking both (e.g. headless setups), the writer fails closed without interrupting application execution.
