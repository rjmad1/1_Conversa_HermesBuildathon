# Recursive Redaction Test Results

This document verifies the deep recursive log redaction utility and lists the test cases executed to ensure confidentiality.

## Redaction Capabilities

* **Nested Structures**: Scans sub-objects and properties recursively.
* **Arrays**: Iterates arrays and redacts elements, including objects inside arrays.
* **Circular References**: Identifies already visited structures using a `WeakSet` to prevent infinite recursion, resolving cycles with a `"[CIRCULAR]"` placeholder.
* **Max Depth**: Enforces a limit of 10 nested levels, replacing deep nodes with `"[MAX_DEPTH_REACHED]"` to protect against denial of service or stack overflows.
* **No Mutation**: Ensures the original logged metadata object is never mutated.

---

## Test Cases & Assertion Evidence

The following assertions are implemented in `tests/integration/adversarial.spec.ts` under `"recursive redaction handles nested structures..."` and run clean:

### Test Case 1: Deeply Nested Secret Key
* **Input Object**:
  ```json
  {
    "details": {
      "api_key": "some-secret",
      "normalField": "safe-text"
    }
  }
  ```
* **Assertion**: Output contains `details.api_key = "[REDACTED]"` and `details.normalField = "safe-text"`.

### Test Case 2: Array Elements Redaction
* **Input Object**:
  ```json
  {
    "details": {
      "nestedArray": [
        { "secret": "token-xyz", "benign": "data" }
      ]
    }
  }
  ```
* **Assertion**: Output contains `details.nestedArray[0].secret = "[REDACTED]"` and `details.nestedArray[0].benign = "data"`.

### Test Case 3: Circular Reference Protection
* **Input Object**: Object where property `self` references the object itself.
* **Assertion**: Output returns `self = "[CIRCULAR]"` without throwing stack overflow errors.

### Test Case 4: Deep Structure Protection
* **Input Object**: Object nested 15 levels deep.
* **Assertion**: Output cuts off nesting at level 11 and sets the child property to `"[MAX_DEPTH_REACHED]"`.

### Test Case 5: Immutability Verification
* **Assertion**: Validates that after calling `redact(payload)`, the original `payload` object retains its original sensitive properties in clear text (preventing side effects in the running use case).
