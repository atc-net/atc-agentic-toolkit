# Behaviors & Value Converters Reference

All behaviors and converters work across WPF, WinUI 3, and Avalonia (from Atc.XamlToolkit platform packages).

---

## Behaviors

### EventToCommandBehavior

Execute commands in response to any UI event, maintaining clean MVVM separation.

```xml
<Button Content="Click Me">
    <i:Interaction.Behaviors>
        <behaviors:EventToCommandBehavior
            EventName="MouseDoubleClick"
            Command="{Binding DoubleClickCommand}"
            CommandParameter="{Binding SelectedItem}"
            PassEventArgsToCommand="False" />
    </i:Interaction.Behaviors>
</Button>
```

| Property | Type | Description |
|---|---|---|
| `EventName` | string | The event to listen for |
| `Command` | ICommand | Command to execute |
| `CommandParameter` | object | Optional parameter |
| `PassEventArgsToCommand` | bool | Pass EventArgs as parameter |

### AnimationBehavior

Declarative animations triggered by events or auto-started.

```xml
<Border>
    <i:Interaction.Behaviors>
        <behaviors:AnimationBehavior
            AnimationType="FadeIn"
            Duration="0:0:0.5"
            AutoStart="True" />
    </i:Interaction.Behaviors>
</Border>
```

**Animation Types:**

| Type | Description |
|---|---|
| `FadeIn` | Opacity 0 → 1 |
| `FadeOut` | Opacity 1 → 0 |
| `SlideInFromLeft` | Slide from left edge |
| `SlideInFromRight` | Slide from right edge |
| `SlideInFromTop` | Slide from top edge |
| `SlideInFromBottom` | Slide from bottom edge |
| `ScaleIn` | Scale from 0 → 1 |
| `ScaleOut` | Scale from 1 → 0 |

All animations are GPU-accelerated for smooth performance.

### FocusBehavior

```xml
<!-- Set initial focus -->
<TextBox behaviors:FocusBehavior.HasInitialFocus="True" />

<!-- Two-way bindable focus -->
<TextBox behaviors:FocusBehavior.IsFocused="{Binding IsNameFocused}" />

<!-- Select all text on focus -->
<TextBox behaviors:FocusBehavior.SelectAllOnFocus="True" />

<!-- Trigger focus from ViewModel -->
<TextBox behaviors:FocusBehavior.FocusTrigger="{Binding FocusTriggerCount}" />
```

| Property | Type | Description |
|---|---|---|
| `HasInitialFocus` | bool | Focus when element loads |
| `IsFocused` | bool | Two-way bindable focus state |
| `SelectAllOnFocus` | bool | Select text content on focus |
| `FocusTrigger` | int | Increment to trigger focus from ViewModel |

### KeyboardNavigationBehavior

```xml
<ListBox>
    <i:Interaction.Behaviors>
        <behaviors:KeyboardNavigationBehavior
            IsEnabled="True" />
    </i:Interaction.Behaviors>
</ListBox>
```

Handles: Arrow keys (Up, Down, Left, Right), Enter, Escape, Tab.

---

## Value Converters

### Bool Converters

| Converter | Input | Output |
|---|---|---|
| `BoolToInverseBoolValueConverter` | `bool` | `!bool` |
| `BoolToVisibilityCollapsedValueConverter` | `bool` | `true` → Visible, `false` → Collapsed |
| `BoolToVisibilityVisibleValueConverter` | `bool` | `true` → Collapsed, `false` → Visible (inverse) |
| `BoolToWidthValueConverter` | `bool` | `true` → Width, `false` → 0 |

### Multi-Bool Converters

| Converter | Logic | Output |
|---|---|---|
| `MultiBoolToBoolValueConverter` | AND | All true → true |
| `MultiBoolToVisibilityVisibleValueConverter` | AND | All true → Visible |

### String Converters

| Converter | Input | Output |
|---|---|---|
| `StringNullOrEmptyToBoolValueConverter` | `string` | NullOrEmpty → false |
| `StringNullOrEmptyToInverseBoolValueConverter` | `string` | NullOrEmpty → true |
| `StringNullOrEmptyToVisibilityVisibleValueConverter` | `string` | NullOrEmpty → Collapsed |
| `StringNullOrEmptyToVisibilityCollapsedValueConverter` | `string` | NullOrEmpty → Visible |
| `ToLowerValueConverter` | `string` | Lowercase |
| `ToUpperValueConverter` | `string` | Uppercase |

### Null Converters

| Converter | Input | Output |
|---|---|---|
| `NullToVisibilityCollapsedValueConverter` | `object` | null → Collapsed |
| `NullToVisibilityVisibleValueConverter` | `object` | null → Visible |

### Usage in XAML

```xml
<Window.Resources>
    <converters:BoolToVisibilityCollapsedValueConverter x:Key="BoolToVisibility" />
    <converters:StringNullOrEmptyToBoolValueConverter x:Key="StringToBool" />
</Window.Resources>

<StackPanel Visibility="{Binding IsLoggedIn, Converter={StaticResource BoolToVisibility}}">
    <TextBlock Text="Welcome!" />
</StackPanel>

<Button IsEnabled="{Binding SearchText, Converter={StaticResource StringToBool}}"
        Content="Search" />
```

### Multi-Value Converter Usage

```xml
<Button.Visibility>
    <MultiBinding Converter="{StaticResource MultiBoolToVisibility}">
        <Binding Path="IsLoggedIn" />
        <Binding Path="HasPermission" />
    </MultiBinding>
</Button.Visibility>
```

---

## Base Converter Classes

For creating custom converters:

### ValueConverterBase

```csharp
public class MyConverter : ValueConverterBase
{
    protected override object? Convert(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        // Convert logic
    }

    protected override object? ConvertBack(object? value, Type targetType, object? parameter, CultureInfo culture)
    {
        // ConvertBack logic (optional)
    }
}
```

### MultiValueConverterBase

```csharp
public class MyMultiConverter : MultiValueConverterBase
{
    protected override object? Convert(object?[] values, Type targetType, object? parameter, CultureInfo culture)
    {
        // Convert logic
    }
}
```

---

## Animation Extensions (Atc.Wpf)

Programmatic animation helpers:

```csharp
// Fade in
await element.FadeInAsync(duration: TimeSpan.FromMilliseconds(300));

// Fade out
await element.FadeOutAsync(duration: TimeSpan.FromMilliseconds(300));

// Slide
await element.SlideInFromLeftAsync(distance: 100, duration: TimeSpan.FromMilliseconds(400));
```
