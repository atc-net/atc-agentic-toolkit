# Layout Panels Reference

Custom layout panels in `Atc.Wpf` for advanced layout scenarios.

---

## GridEx

Enhanced Grid with simplified row/column definitions using string syntax.

```xml
<layouts:GridEx Rows="Auto,*,Auto" Columns="200,*">
    <TextBlock Grid.Row="0" Grid.Column="0" Text="Sidebar Header" />
    <TreeView Grid.Row="1" Grid.Column="0" />
    <ContentControl Grid.Row="0" Grid.RowSpan="3" Grid.Column="1"
                    Content="{Binding CurrentView}" />
    <StatusBar Grid.Row="2" Grid.ColumnSpan="2" />
</layouts:GridEx>
```

| Property | Type | Description |
|---|---|---|
| `Rows` | string | Comma-separated row definitions (`Auto`, `*`, `2*`, `100`) |
| `Columns` | string | Comma-separated column definitions |

Eliminates verbose `<Grid.RowDefinitions>` blocks.

---

## AutoGrid

Automatically arranges children in a grid without explicit row/column assignments.

```xml
<layouts:AutoGrid ChildWidth="200" ChildHeight="150" Orientation="Horizontal">
    <Button Content="One" />
    <Button Content="Two" />
    <Button Content="Three" />
    <Button Content="Four" />
</layouts:AutoGrid>
```

| Property | Type | Description |
|---|---|---|
| `ChildWidth` | double | Width for each child |
| `ChildHeight` | double | Height for each child |
| `Orientation` | Orientation | Fill direction |
| `ColumnCount` | int | Fixed column count (overrides auto) |
| `RowCount` | int | Fixed row count |

---

## FlexPanel

CSS Flexbox-inspired layout panel.

```xml
<layouts:FlexPanel
    Direction="Row"
    Wrap="Wrap"
    JustifyContent="SpaceBetween"
    AlignItems="Center"
    Gap="8">
    <Button Content="Item 1" />
    <Button Content="Item 2" />
    <Button Content="Item 3" />
</layouts:FlexPanel>
```

| Property | Type | Values |
|---|---|---|
| `Direction` | FlexDirection | `Row`, `RowReverse`, `Column`, `ColumnReverse` |
| `Wrap` | FlexWrap | `NoWrap`, `Wrap`, `WrapReverse` |
| `JustifyContent` | JustifyContent | `FlexStart`, `FlexEnd`, `Center`, `SpaceBetween`, `SpaceAround`, `SpaceEvenly` |
| `AlignItems` | AlignItems | `FlexStart`, `FlexEnd`, `Center`, `Stretch`, `Baseline` |
| `AlignContent` | AlignContent | `FlexStart`, `FlexEnd`, `Center`, `Stretch`, `SpaceBetween`, `SpaceAround` |
| `Gap` | double | Spacing between items |

### Attached Properties

```xml
<Button layouts:FlexPanel.Order="2"
        layouts:FlexPanel.Grow="1"
        layouts:FlexPanel.Shrink="0"
        layouts:FlexPanel.Basis="100"
        layouts:FlexPanel.AlignSelf="Center"
        Content="Flexible Item" />
```

---

## StaggeredPanel

Masonry/Pinterest-style layout for variable-height items.

```xml
<layouts:StaggeredPanel
    ColumnSpacing="8"
    RowSpacing="8"
    DesiredColumnWidth="250">
    <Border Height="100" Background="Red" />
    <Border Height="150" Background="Blue" />
    <Border Height="80" Background="Green" />
    <Border Height="200" Background="Yellow" />
</layouts:StaggeredPanel>
```

| Property | Type | Description |
|---|---|---|
| `DesiredColumnWidth` | double | Target column width (auto-calculates columns) |
| `ColumnSpacing` | double | Horizontal gap between columns |
| `RowSpacing` | double | Vertical gap between items |

---

## UniformSpacingPanel

StackPanel-like but with uniform spacing between all children.

```xml
<layouts:UniformSpacingPanel
    Orientation="Horizontal"
    Spacing="12">
    <Button Content="Save" />
    <Button Content="Cancel" />
    <Button Content="Help" />
</layouts:UniformSpacingPanel>
```

| Property | Type | Description |
|---|---|---|
| `Orientation` | Orientation | `Horizontal` or `Vertical` |
| `Spacing` | double | Space between children |

---

## ResponsivePanel

Adapts layout based on available width, similar to CSS media queries.

```xml
<layouts:ResponsivePanel
    SmallBreakpoint="600"
    MediumBreakpoint="900"
    SmallColumns="1"
    MediumColumns="2"
    LargeColumns="3"
    Spacing="16">
    <Card />
    <Card />
    <Card />
</layouts:ResponsivePanel>
```

| Property | Type | Description |
|---|---|---|
| `SmallBreakpoint` | double | Width threshold for small layout |
| `MediumBreakpoint` | double | Width threshold for medium layout |
| `SmallColumns` | int | Columns in small layout |
| `MediumColumns` | int | Columns in medium layout |
| `LargeColumns` | int | Columns in large layout |
| `Spacing` | double | Gap between items |

---

## DockPanelPro

Enhanced DockPanel with additional docking features.

```xml
<layouts:DockPanelPro LastChildFill="True">
    <Menu DockPanel.Dock="Top" />
    <StatusBar DockPanel.Dock="Bottom" />
    <TreeView DockPanel.Dock="Left" Width="200" />
    <ContentControl /> <!-- Fills remaining space -->
</layouts:DockPanelPro>
```

---

## Choosing a Layout Panel

| Scenario | Panel |
|---|---|
| Standard grid with simplified syntax | `GridEx` |
| Equal-sized items in a grid | `AutoGrid` |
| Flexible wrapping layout (like CSS Flexbox) | `FlexPanel` |
| Variable-height items (Pinterest/masonry) | `StaggeredPanel` |
| Simple spacing between items | `UniformSpacingPanel` |
| Width-adaptive columns | `ResponsivePanel` |
| Dock-based layout | `DockPanelPro` |
