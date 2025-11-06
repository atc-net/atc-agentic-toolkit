# Format Method Parameters

Apply consistent method parameter line break formatting across all C# projects in the monorepo.

## Scope: What to Format

**ONLY format parameter lists in DECLARATIONS:**
- ✅ Method declarations (public, private, protected, internal, static, async, virtual, override, abstract, etc.)
- ✅ Constructor declarations
- ✅ Local function declarations (functions defined inside methods)
- ✅ Delegate declarations

**DO NOT format parameter lists in INVOCATIONS or EXPRESSIONS:**
- ❌ Method calls/invocations (e.g., `.Replace(...)`, `.Substring(...)`)
- ❌ Constructor invocations (e.g., `new MyClass(...)`)
- ❌ Ternary operators (e.g., `condition ? value1 : value2`)
- ❌ Lambda expressions (e.g., `(x, y) => x + y`)
- ❌ LINQ query expressions
- ❌ Indexer property declarations (e.g., `this[int x, int y]`)

## Formatting Rules

### Rule 1: Multiple Parameters

Break down **all parameters** if a method has **more than 1 parameter**, with each parameter on its own line.

### Rule 2: Single Long Parameter

Break down a **single parameter** if the total line length (including indentation) exceeds **80 characters**.

## Examples: What TO Format

### Method Declarations

```csharp
// No parameters - no break
public void MyMethod1()

// Single short parameter - no break
public void MyMethod2(int parameter1)

// Single parameter, method name long but total < 80 chars - no break
public void MyLoooooooooooooooooooooooooooooooooooooooonMethod3(int parameter1)

// Single parameter, total length > 80 chars - break
public void MyLooooooooooooooooooooooooooooooooooooooooooonMethod4(
    int parameter1)

// 2 parameters - break all
public void MyMethod5(
    int parameter1,
    int parameter2)

// 3+ parameters - break all
public void MyMethod6(
    int parameter1,
    int parameter2,
    int parameter3)
```

### Constructor Declarations

```csharp
// Single parameter - no break
public MyClass(string name)

// Multiple parameters - break all
public MyClass(
    string name,
    int age,
    bool isActive)
```

### Local Function Declarations

```csharp
public void OuterMethod()
{
    // Local function with multiple parameters - break all
    void LocalFunction(
        int param1,
        string param2)
    {
        // implementation
    }
}
```

### Delegate Declarations

```csharp
// Multiple parameters - break all
public delegate void MyEventHandler(
    object sender,
    EventArgs e);

// Single parameter - no break
public delegate void SimpleHandler(string message);
```

## Examples: What NOT TO Format

**These should remain unchanged - do not modify invocations or expressions:**

```csharp
// ❌ Method invocations - DO NOT format these
var result = assembly.GetBeautifiedName().Replace("Api", "API", StringComparison.Ordinal);

var name = someObject.SomeMethod(arg1, arg2, arg3);

// ❌ Constructor invocations - DO NOT format these
var obj = new MyClass(param1, param2, param3);

// ❌ Ternary operators - DO NOT format these
return condition ? value1 : value2;

return removeLastVerb
    ? assemblyName.Substring(0, assemblyName.LastIndexOf(' '))
    : assemblyName;

// ❌ Lambda expressions - DO NOT format these
var filtered = items.Where((item, index) => item.IsActive && index > 0);

// ❌ LINQ expressions - DO NOT format these
var query = from item in items
            where item.IsActive
            select new { item.Name, item.Value };

// ❌ Indexer declarations - DO NOT format these
public string this[int row, int column]
{
    get => matrix[row, column];
}
```

## Execution Instructions

### 1. Scan for C# files
Find all `.cs` files in the repository

### 2. Identify DECLARATIONS (not invocations)

**Look for these patterns to identify declarations:**

**Method declarations:**
- Lines starting with access modifiers: `public`, `private`, `protected`, `internal`
- Lines with method modifiers: `static`, `virtual`, `override`, `abstract`, `async`, `sealed`
- Pattern: `[modifiers] [return-type] [method-name]([parameters])`
- Must have a return type (or `void`) before the method name
- Usually followed by `{`, `;`, or `=>`

**Constructor declarations:**
- Pattern: `[modifiers] [class-name]([parameters])`
- Class name matches the containing class
- No return type before the name

**Local function declarations:**
- Found inside method bodies
- Pattern: `[return-type] [function-name]([parameters])`
- Usually indented inside a method

**Delegate declarations:**
- Pattern: `[modifiers] delegate [return-type] [delegate-name]([parameters]);`
- Contains the `delegate` keyword

**Key distinction from invocations:**
- Declarations have modifiers (public, private, static, etc.) OR are preceded by a type
- Invocations follow a `.` (member access), are on the right side of `=`, or are arguments to other methods
- Invocations do NOT have return types or access modifiers

### 3. Apply formatting rules

**For each declaration found:**
- If 2+ parameters: break all parameters onto separate lines
- If 1 parameter: break only if total line length > 80 characters
- Ensure proper indentation (4 spaces per indentation level)
- Place opening parenthesis `(` on same line as method name
- Place each parameter on its own line with proper indentation
- Keep closing parenthesis `)` on same line as last parameter

### 4. Process in batches
Work on files in manageable batches (e.g., 10-20 files at a time)

### 5. Verify after each batch
Run `dotnet build` to ensure no syntax errors

### 6. Track progress
Use todo list to track which files have been processed

### 7. Final verification
Run full test suite after all changes complete

## Important Notes

- **Preserve all code logic and comments**
- **Maintain existing indentation style** (spaces vs tabs)
- **Handle edge cases**: attributes, generic types, default values, nullable types, ref/out/in parameters
- **Do not modify method bodies** - only parameter declarations
- **Do not modify method invocations** - only declarations
- **Leave ternary operators unchanged**
- **Leave lambda expressions unchanged**
- **Leave LINQ expressions unchanged**
- **If uncertain whether something is a declaration or invocation**, skip it and flag for manual review

## Pattern Recognition Examples

### ✅ These are DECLARATIONS (format these):

```csharp
public void MyMethod(int x, int y)                     // Method declaration
private async Task<string> GetDataAsync(string id)     // Async method declaration
protected virtual bool TryParse(string input, out int result)  // Virtual method with out param
internal static MyClass Create(string name, int age)   // Static method declaration
public MyClass(string name, int age)                   // Constructor declaration
delegate void EventHandler(object sender, EventArgs e) // Delegate declaration

void LocalFunc(int a, int b)                           // Local function (inside a method)
{
    // ...
}
```

### ❌ These are INVOCATIONS or EXPRESSIONS (do NOT format):

```csharp
var result = MyMethod(x, y);                           // Method invocation
var name = assembly.GetName().Replace("old", "new", StringComparison.Ordinal);  // Chained invocations
var obj = new MyClass(name, age);                      // Constructor invocation
return condition ? value1 : value2;                    // Ternary operator
var lambda = (int x, int y) => x + y;                  // Lambda expression
items.Where((item, index) => item.IsActive)            // Lambda in method call
var value = this[row, column];                         // Indexer usage
```
